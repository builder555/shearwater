import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { checkBluetoothEnabled } from '@/device/ble';
import { loadManifest, saveManifest, saveDiveLog, fetchDiveLog } from '@/db';
import { BLEShearwater } from '@/device/ble';
import { LogDownloader, LogDecoder, formatLogs } from '@/device/divelogs';
import { DiveManifestReader } from '@/device/divemanifest';
import { mapRawOpeningToReadable, mapRawClosingToReadable } from './device/logformat';

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
  const seriesVisibility = {};

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

  function formatDivePoints(diveData) {
    const sampleRate = diveData.openingData.log_sample_rate_ms / 1000;
    const numPoints = Math.max(...Object.values(diveData.dive).map((i) => i.length));
    return {
      depth: diveData.dive.depth.map((d) => d / 10),
      sac: diveData.dive.sac.map((s) => (s < 0xfff0 ? s / 100 : null)),
      avg_ppo2: diveData.dive.avg_ppo2.map((a) => a / 100),
      ai_t1_data: diveData.dive.ai_t1_data.map((a) => (a < 0xfff0 ? (a & 0xfff) * 2 : null)),
      ai_t2_data: diveData.dive.ai_t2_data.map((a) => (a < 0xfff0 ? (a & 0xfff) * 2 : null)),
      water_temp: diveData.dive.water_temp,
      deco_ceiling: diveData.dive.deco_ceiling,
      gf99: diveData.dive.gf99.map((g) => (g < 0xff ? g : null)),
      next_stop_or_ndl_time: diveData.dive.next_stop_or_ndl_time,
      next_stop_depth: diveData.dive.next_stop_depth,
      times: Array.from({ length: numPoints }, (_, i) => i * sampleRate),
    };
  }
  function setVisibilities(data, visibility) {
    data.forEach((series) => {
      if (visibility[series.name] !== undefined) {
        series.isVisible = visibility[series.name];
      }
    });
    
  }
  async function getDiveDetails(id) {
    isBusy.value = true;
    const diveData = await fetchDiveLog(id);
    const {
      depth,
      sac,
      avg_ppo2,
      ai_t1_data,
      ai_t2_data,
      water_temp,
      deco_ceiling,
      gf99,
      next_stop_or_ndl_time,
      next_stop_depth,
      times,
    } = formatDivePoints(diveData);
    isBusy.value = false;
    const result = {
      times,
      openingData: mapRawOpeningToReadable(diveData.openingData),
      closingData: mapRawClosingToReadable(diveData.closingData),
    };
    const hasDataPoints = (points) => points.some(Boolean);
    const depthUnits = result.openingData.depth_units;
    const tempUnits = result.openingData.temp_units;
    const nextStopTitle = hasDataPoints(next_stop_depth) ? 'Next Stop' : 'NDL';

    result.series = [
      { isVisible: true, name: 'Depth', title: `Depth (${depthUnits})`, data: depth, color: '#f0f0f0' },
      { isVisible: false, name: 'SAC', title: 'SAC Rate (PSI/min)', data: sac, color: '#3faa24' },
      {
        isVisible: false,
        name: 'Water Temp.',
        title: `Water Temperature (${tempUnits})`,
        data: water_temp,
        color: '#ef7b00',
      },
      { isVisible: false, name: 'Avg. ppO2', title: 'Avg. PPO2 (ATA)', data: avg_ppo2, color: '#992cf8' },
      { isVisible: true, name: 'AI T1', title: 'AI T1 (PSI)', data: ai_t1_data, color: '#3877eb' },
      { isVisible: false, name: 'AI T2', title: 'AI T2 (PSI)', data: ai_t2_data, color: '#00c8ff' },
      {
        isVisible: false,
        name: 'Deco Ceil.',
        title: `Deco Ceiling (${depthUnits})`,
        data: deco_ceiling,
        color: '#e9967a',
      },
      { isVisible: false, name: 'GF99', title: 'GF99 (%)', data: gf99, color: '#f4c300' },
      {
        isVisible: false,
        name: nextStopTitle,
        title: `${nextStopTitle} (min)`,
        data: next_stop_or_ndl_time,
        color: '#ce0707',
      },
      {
        isVisible: false,
        name: 'Next Stop',
        title: `Next Stop Depth (${depthUnits})`,
        data: next_stop_depth,
        color: '#4682b4',
      },
    ].filter((d) => hasDataPoints(d.data));
    setVisibilities(result.series, seriesVisibility);
    return result;
  }

  function toggleSeriesVisibility(dataSeries) {
    dataSeries.isVisible = !dataSeries.isVisible;
    seriesVisibility[dataSeries.name] = dataSeries.isVisible;
  }
  async function downloadDives() {
    isBusy.value = true;
    const downloader = new LogDownloader(ble);
    const decoder = new LogDecoder();
    progress.value = 1;
    const totalItems = selectedIds.value.length;
    let logs = [];
    let numSavedLogs = 0;
    let totalNumLogs = 0;
    let duration = 0;

    downloader.subscribe((data) => {
      const decoded = decoder.decode(data);
      if (typeof decoded === 'object') {
        logs.push(decoded);
        if (decoded.log_type == 0x01) numSavedLogs++;
        if (decoded.log_sample_rate_ms && duration && !totalNumLogs) {
          totalNumLogs = (duration * 1000) / decoded.log_sample_rate_ms;
        }
        if (totalNumLogs && numSavedLogs < totalNumLogs) {
          const logDownloadProgress = numSavedLogs / totalNumLogs;
          progress.value = ((totalItems - selectedIds.value.length + logDownloadProgress) / totalItems) * 100;
        }
      }
    });

    while (selectedIds.value.length > 0) {
      const diveId = selectedIds.value[0];
      const dive = dives.value[diveId];
      logs = [];
      numSavedLogs = 0;
      totalNumLogs = 0;
      duration = dive.diveDuration;
      await downloader.download(dive.recordAddressStart);
      const formatted = formatLogs(logs);
      formatted.id = diveId;
      dive.isDownloaded = true;
      dive.isSelected = false;
      saveDiveLog(formatted);
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
    toggleSeriesVisibility,
  };
});
