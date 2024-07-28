<script setup>
// todo:
// - show legend as tooltip
// - remember which series are visible

import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMainStore } from '@/store';
import { makeChart } from '@/chartformatter';

const store = useMainStore();
const { getDiveDetails } = store;
const diveId = useRoute().params.id;
const chartElement = ref(null);
const chart = ref(null);
const tooltip = ref(null);
const dive = ref(null);

function mkChart() {
  const diveNo = dive.value.openingData.dive_number;
  chart.value = makeChart({ 
      x: dive.value.times,
      series: dive.value.data,
      title: `Dive #${diveNo}`,
    }, chartElement.value, tooltip.value);
}

getDiveDetails(diveId).then((d) => {
  dive.value = d;
  mkChart();
});

function toggleLogVisibility(log) {
  log.isVisible = !log.isVisible;
  chart.value.destroy();
  mkChart();
}
</script>
<template>
  <div class="chart-holder">
    <div ref="chartElement"></div>
    <div v-if="dive?.data" class="button-group">
      <button
        v-for="log in dive.data"
        :key="log.name"
        class="outline"
        :style="{
          'background-color': log.isVisible ? log.color : '#222',
          'color': log.isVisible ? '#000' : log.color,
        }" 
        @click="toggleLogVisibility(log)"
      >{{ log.name }}</button>
    </div>
    <div ref="tooltip" class="tooltip"></div>
  </div>
</template>
<style scoped>
.chart-holder {
  width: 100%;
  height: 50vh;
  min-height: 300px;
}
.tooltip {
  position: fixed;
  background: #ccc;
  padding: 10px;
  color: #000;
  width: 200px;
  pointer-events: none;
  display: none;
}
.button-group {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.button-group button:first-child {
  margin-right: 0;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
}

.button-group button:last-child {
  margin-left: 0;
  border-bottom-left-radius: 0;
  border-top-left-radius: 0;
  border-left: 1px solid #777;
}

.button-group button:not(:first-child):not(:last-child) {
  margin-left: 0;
  margin-right: 0;
  border-left: 1px solid #777;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

button.outline:hover {
  color: #ccc !important;
}

div {
  margin: 0;
  background: #141619;
  color: #c7d0d9;
}
</style>
<style>
.uplot {
  margin-top: 30px;
}

.u-select {
  background: rgba(255, 255, 255, 0.07);
}
</style>
