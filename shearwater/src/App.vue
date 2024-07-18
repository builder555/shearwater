<script setup>
import { onMounted, ref, watch } from 'vue';
import DiveCard from './components/dive-card.vue';
import DiveDetails from './components/dive-details.vue';
import { DiveManifest } from './device/divemanifest';
import { BLEShearwater } from './device/ble';
import { LogDownloader, LogDecoder, bytesToHex } from './device/divelogs';
import WebpImage from './components/webp-image.vue';
const dives = ref([]);

const picked = ref([]);
const downloaded = ref([]);
const progress = ref(0);
const isBTEnabled = ref(false);
const isConnected = ref(false);
const dev = new BLEShearwater();
const selectedDive = ref(null);

function toggleDivePicked(dive) {
  if (picked.value.includes(dive.diveNo)) {
    picked.value = picked.value.filter((d) => d !== dive.diveNo);
  } else {
    picked.value.push(dive.diveNo);
  }
}

function clickedManifestCard(dive) {
  if (downloaded.value.includes(dive.id)) selectedDive.value = loadFromLocalStorage(`dive-${dive.id}`);
  else toggleDivePicked(dive);
}

function toggleAllDives(select) {
  if (select) {
    picked.value = dives.value.map((dive) => dive.diveNo);
  } else {
    picked.value = [];
  }
}
function formatLogs(logs){
  let openingData = {};
  let closingData = {};
  const dive = {
    depth: [],
    next_stop_depth: [],
    tts: [],
    avg_ppo2: [],
    o2_percent: [],
    he_percent: [],
    next_stop_or_ndl_time: [],
    battery_percent_remaining: [],
    statuses: [],
    o2_sensor_1_mv: [],
    water_temp: [],
    o2_sensor_2_mv: [],
    o2_sensor_3_mv: [],
    battery_voltage_x100: [],
    ppo2_setpoint: [],
    ai_t2_data: [],
    gtr: [],
    cns: [],
    deco_ceiling: [],
    gf99: [],
    at_plus_5: [],
    ai_t1_data: [],
    sac: [],
  };
  const openingTypes = [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17];
  const closingTypes = [0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0xFF];
  for(const log of logs) {
    if (openingTypes.includes(log.log_type)) {
      openingData = {...openingData, ...log};
    } else if (closingTypes.includes(log.log_type)) {
      closingData = {...closingData, ...log};
    } else {
      for(const header of Object.keys(dive)) {
        if (log[header]) dive[header].push(log[header]);
      }
    }
  }
  delete openingData.log_type;
  delete closingData.log_type;
  return {
    openingData,
    dive,
    closingData
  }
}

function saveToLocalStorage(id, data) {
  localStorage.setItem(id, JSON.stringify(data));
}

function loadFromLocalStorage(id) {
  return JSON.parse(localStorage.getItem(id));
}

function isDiveDownloaded(id) {
  return !!localStorage.getItem(`dive-${id}`);
}

async function connect() {
  await dev.connect();
  isConnected.value = true;
  const manifest = new DiveManifest(dev);
  manifest.onProgress(p => {
    progress.value = p * 100;
  });
  dives.value = await manifest.read();
  progress.value = 0;
}

async function download() {
  const downloader = new LogDownloader(dev);
  const decoder = new LogDecoder();
  const divesToDownload = dives.value.filter((d) => picked.value.includes(d.diveNo));
  for(const dive of divesToDownload) {
    const logs = [];
    downloader.subscribe((data) => {
      const decoded = decoder.decode(data);
      if (typeof decoded === 'object') {
        logs.push(decoded);
      }
    });
    await downloader.download(dive.recordAddressStart);
    const formatted = formatLogs(logs);
    formatted.id = bytesToHex(dive.recordAddressStart);
    saveToLocalStorage(`dive-${formatted.id}`, formatted);
  }
}

onMounted(() => {
  isBTEnabled.value = dev.isBluetoothEnabled();
  dives.value = loadFromLocalStorage('dive-manifest') || [];
});
watch(dives, () => {
  saveToLocalStorage('dive-manifest', dives.value);
  dives.value.map((dive) => {
    let diveId = '';
    const address = dive.recordAddressStart;
    for (const byte in address) {
      diveId += address[byte].toString(16).padStart(2, '0');
    }
    
    dive.id = diveId;
    if (isDiveDownloaded(dive.id)) {
      downloaded.value.push(dive.id);
    }
  })
});
</script>

<template>
  <header
    :style="{
      'background': `linear-gradient(to right, #76c7c0 ${progress}%, #00aeef ${progress}%)`
    }"
  >
    <div v-if="isConnected">
      Connected to <strong>{{ dev.name }}</strong>
      <button
        class="outline"
        :class="{ 'selected': picked.length === dives.length }"
        style="margin-left: 10px;"
        @click="toggleAllDives(picked.length !== dives.length)"
      >Select All</button>
      <button @click="download">Download</button>
    </div>
    <div v-else-if="isBTEnabled">
      <button id="connect" @click="connect">Connect Dive Computer</button>
    </div>
    <div v-else>
      <p>Bluetooth not enabled</p>
    </div>
  </header>
  <main>
    <div
      v-if="dives.length < 1 && !isConnected"
      style="display:flex; justify-content: center"
    >
      <WebpImage
        webpUrl="@/assets/perdix2.webp"
        altUrl="@/assets/perdix2.png"
        style="max-width: 600px"
      />
    </div>
    <div v-if="selectedDive" class="dive-details">
      <DiveDetails :dive="selectedDive" />
    </div>
    <div class="dives">
      <DiveCard 
        v-for="dive in dives"
        :key="dive.diveNo"
        :dive="dive"
        :picked="picked.includes(dive.diveNo)"
        :downloaded="downloaded.includes(dive.id)"
        @click="clickedManifestCard(dive)"
      />
    </div>
  </main>
</template>

<style scoped>
  .dive-details {
    /* position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%; */
    background: #fff;
    /* z-index: 1000; */
  }
  .dives {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  header {
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 50px;
    height: 50px;
    background: #00ef9b;
    width: 100%;
  }
</style>
