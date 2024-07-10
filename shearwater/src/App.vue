<script setup>
import { onMounted, ref } from 'vue';
import DiveCard from './components/dive-card.vue';
import { DiveManifest } from './device/divemanifest';
import { BLEShearwater } from './device/ble';
import { LogDownloader, LogDecoder } from './device/divelogs';

const dives = ref([]);

const picked = ref([]);
const progress = ref(0);

function toggleDivePicked(dive) {
  if (picked.value.includes(dive.diveNo)) {
    picked.value = picked.value.filter((d) => d !== dive.diveNo);
  } else {
    picked.value.push(dive.diveNo);
  }
}
function toggleAllDives(event) {
  if (event.target.checked) {
    picked.value = dives.value.map((dive) => dive.diveNo);
  } else {
    picked.value = [];
  }
}
const isBTEnabled = ref(false);
const isConnected = ref(false);

const dev = new BLEShearwater();

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
    console.log('downloading', dive);
    const logs = [];
    downloader.subscribe((data) => {
      const decoded = decoder.decode(data);
      if (typeof decoded === 'object') {
        logs.push(decoded);
      }
    });
    await downloader.download(dive.recordAddressStart);
    console.log(logs);
  }
}
onMounted(() => {
  isBTEnabled.value = dev.isBluetoothEnabled();
});
</script>

<template>
  <header :style="{ 'background': `linear-gradient(to right, #76c7c0 ${progress}%, #00aeef ${progress}%)`}">
    <div v-if="isConnected">
      Connected to <strong>{{ dev.name }}</strong>
      displaying {{ dives.length }} dives.
    </div>
    <div v-else-if="isBTEnabled">
      <button id="connect" @click="connect">Connect Dive Computer</button>
    </div>
    <div v-else>
      <p>Bluetooth not enabled</p>
    </div>
  </header>

  <main>
    <div v-if="dives.length > 0">
      <input
        type="checkbox"
        :checked="dives.length === picked.length"
        @change="toggleAllDives"
        id="pick-all"
      >
      <label for="pick-all">
        Download all
      </label>
      <button @click="download">Download</button>
    </div>
    <div class="dives">
      <DiveCard 
        v-for="dive in dives"
        :key="dive.diveNo"
        :dive="dive"
        :picked="picked.includes(dive.diveNo)"
        @click="toggleDivePicked(dive)"
      />
    </div>
  </main>
</template>

<style scoped>
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
