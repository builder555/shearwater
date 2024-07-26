import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { checkBluetoothEnabled } from '@/device/ble';
import { loadManifest, saveManifest, saveDiveLog, fetchDiveLog } from '@/db';
import { BLEShearwater } from '@/device/ble';
import { LogDownloader, LogDecoder, formatLogs } from '@/device/divelogs';
import { DiveManifestReader } from '@/device/divemanifest';
import { mapRawOpeningToReadable } from './device/logformat';

export const useMainStore = defineStore('main', () => {
  const dives = ref({});
  const isBluetoothEnabled = ref(false);
  const isConnected = ref(false);
  const progress = ref(0);
  const isBusy = ref(false);
  const ble = new BLEShearwater();
  const computerName = computed(() => ble.name);
  const selectedIds = computed(() => Object.keys(dives.value).filter((id) => dives.value[id].isSelected));
  const downloadedIds = computed(() => Object.keys(dives.value).filter((id) => dives.value[id].isDownloaded));
  const areAllDivesPicked = computed(
    () => selectedIds.value.length == Object.keys(dives.value).length - downloadedIds.value.length,
  );

  let diveDetails = {
    data: {},
  };

  checkBluetoothEnabled().then((isEnabled) => {
    isBluetoothEnabled.value = isEnabled;
  });

  loadManifest().then((manifest) => {
    dives.value = manifest;
  });

  function diveCardClicked(dive) {
    if (dive.canDownload) {
      dive.isSelected = !dive.isSelected;
    }
  }
  function toggleAllDiveCards() {
    const shouldSelect = !areAllDivesPicked.value;
    for (const dive of Object.values(dives.value)) {
      dive.isSelected = !dive.isDownloaded && shouldSelect;
    }
    console.log(areAllDivesPicked.value);
    console.log(selectedIds.value.length, downloadedIds.value.length, Object.keys(dives.value).length);
  }

  ble.onDisconnect(() => {
    for (const id in dives.value) {
      if (!dives.value[id].isDownloaded) {
        dives.value[id].canDownload = false;
      }
    }
    isConnected.value = false;
  });

  async function connect() {
    isBusy.value = true;
    await ble.connect();
    isConnected.value = true;
    const manifestReader = new DiveManifestReader(ble);
    manifestReader.onProgress((p) => {
      progress.value = p * 100;
    });
    const manifest = await manifestReader.read();
    for (const dive of manifest) {
      if (dive.id in dives.value && dives.value[dive.id].isDownloaded) {
        continue;
      }
      dives.value[dive.id] = dive;
    }
    saveManifest(dives.value);
    progress.value = 0;
    isBusy.value = false;
  }

  async function getDiveDetails(id) {
    isBusy.value = true;
    const diveData = await fetchDiveLog(id);
    const sampleRate = diveData.openingData.log_sample_rate_ms / 1000;
    const { depth, sac, avg_ppo2, ai_t1_data, ai_t2_data, water_temp } = diveData.dive;
    const times = [];
    for (let i = 0; i < depth.length; i++) {
      depth[i] = depth[i] / 10;
      sac[i] = sac[i] > 0xfff0 ? null : sac[i] / 100;
      avg_ppo2[i] = avg_ppo2[i] / 100;
      ai_t1_data[i] = ai_t1_data[i] > 0xfff0 ? null : (ai_t1_data[i] & 0xfff) * 2;
      ai_t2_data[i] = ai_t2_data[i] > 0xfff0 ? null : (ai_t2_data[i] & 0xfff) * 2;
      times.push(i * sampleRate);
    }
    isBusy.value = false;
    const result = {
      times,
      openingData: mapRawOpeningToReadable(diveData.openingData),
      closingData: diveData.closingData,
    };
    result['data'] = [
      { name: 'depth', title: `Depth (${result.openingData.depth_units})`, data: depth, color: '#ce0707' },
      { name: 'sac', title: 'SAC Rate (PSI/min)', data: sac, color: '#3faa24' },
      {
        name: 'water_temp',
        title: `Water Temperature (${result.openingData.temp_units})`,
        data: water_temp,
        color: '#ef7b00',
      },
      { name: 'avg_ppo2', title: 'Avg. PPO2 (ATA)', data: avg_ppo2, color: '#992cf8' },
      { name: 'ai_t1_data', title: 'AI T1 (PSI)', data: ai_t1_data, color: '#3877eb' },
      { name: 'ai_t2_data', title: 'AI T2 (PSI)', data: ai_t2_data, color: '#00c8ff' },
    ];
    return result;
  }

  async function downloadDives() {
    isBusy.value = true;
    const downloader = new LogDownloader(ble);
    const decoder = new LogDecoder();
    progress.value = 1;
    const totalItems = selectedIds.value.length;
    while (selectedIds.value.length > 0) {
      const diveId = selectedIds.value[0];
      const dive = dives.value[diveId];
      const logs = [];
      downloader.subscribe((data) => {
        const decoded = decoder.decode(data);
        if (typeof decoded === 'object') {
          logs.push(decoded);
        }
      });
      await downloader.download(dive.recordAddressStart);
      const formatted = formatLogs(logs);
      formatted.id = diveId;
      dive.isDownloaded = true;
      dive.isSelected = false;
      saveDiveLog(formatted);
      progress.value = Math.max(1, ((totalItems - selectedIds.value.length) / totalItems) * 100);
    }
    setTimeout(() => {
      progress.value = 0;
    }, 500);
    isBusy.value = false;
  }

  return {
    areAllDivesPicked,
    computerName,
    diveCardClicked,
    diveDetails,
    dives,
    downloadDives,
    isBluetoothEnabled,
    isBusy,
    isConnected,
    progress,
    selectedIds,
    connect,
    getDiveDetails,
    toggleAllDiveCards,
  };
});
