<script setup>
import {watch, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMainStore } from '@/store';

const store = useMainStore();
const { connect, downloadDives, toggleAllDiveCards } = store;
const { progress, isConnected, isBluetoothEnabled, computerName, areAllDivesPicked } = storeToRefs(store);

const header = ref('header');
watch(() => progress.value, () => {
  if (progress.value === 0) {
    header.value.style.transition = 'none';
  }
  else {
    header.value.style.transition = 'background-size 0.5s ease';
  }
});
</script>

<template>
  <header
    ref="header"
    :style="{
      'background-size': `${progress}% 100%`,
    }"
  >
    <div v-if="isConnected">
      Connected to <strong>{{ computerName }}</strong>
      <button
        style="margin-left: 10px;"
        class="outline"
        :class="{'selected' : areAllDivesPicked}"
        @click="toggleAllDiveCards"
      >Select All</button>
      <button @click="downloadDives">Download</button>
    </div>
    <div v-else-if="isBluetoothEnabled">
      <button @click="connect">Connect Dive Computer</button>
    </div>
    <div v-else>
      <p>Web Bluetooth is disabled</p>
    </div>
  </header>
  <main>
    <RouterView/>
  </main>
</template>

<style scoped>
  header {
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 50px;
    height: 50px;
    width: 100%;
    background: linear-gradient(to right, #00aeef 0%, #76c7c0 0%);
    background-size: 0 100%;
    background-repeat: no-repeat;
    transition: background-size 0.4s ease;
    background-color: #00aeef;
  }
  main {
    flex-grow: 1;
    width: 100%;
    display: flex;
  }
</style>
