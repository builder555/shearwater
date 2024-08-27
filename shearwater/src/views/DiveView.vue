<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMainStore } from '@/store';
import { makeChart } from '@/chartformatter';
import DiveDetailsGeneral from '@/components/dive-details-general.vue';

const store = useMainStore();
const { getDiveDetails, toggleSeriesVisibility } = store;
const diveId = useRoute().params.id;
const chartElement = ref(null);
const chart = ref(null);
const tooltip = ref(null);
const dive = ref(null);

function mkChart() {
  const diveNo = dive.value.openingData.dive_number;
  chart.value = makeChart({ 
      x: dive.value.times,
      series: dive.value.series,
      title: `Dive #${diveNo}`,
    }, chartElement.value, tooltip.value);
}

getDiveDetails(diveId).then((d) => {
  dive.value = d;
  mkChart();
});

function toggleVisibile(dataSeries) {
  toggleSeriesVisibility(dataSeries);
  chart.value.destroy();
  mkChart();
}
</script>
<template>
  <div class="background">
    <div class="chart-holder">
      <div ref="chartElement"></div>
      <div ref="tooltip" class="tooltip"></div>
      <div v-if="dive?.series" class="button-group">
        <button
          v-for="dataSeries in dive.series"
          :key="dataSeries.name"
          class="outline"
          :style="{
            'background-color': dataSeries.isVisible ? dataSeries.color : '#222',
            'color': dataSeries.isVisible ? '#000' : dataSeries.color,
          }"
          @click="toggleVisibile(dataSeries)"
        >{{ dataSeries.name }}</button>
      </div>
    </div>
    <div class="dive-data"> 
      <div class="general">
        <div class="number">Dive #{{ dive?.openingData.dive_number }}</div>
        <div class="time">Surface time: {{dive?.openingData.surface_time}}</div>
        <div class="start">Dive start: {{dive?.openingData.dive_start}}</div>
        <div class="end">Dive end: {{dive?.closingData.dive_end}}</div>
        <div class="length">Dive length: {{dive?.closingData.dive_length}}</div>
        <div class="depth">Max depth: {{dive?.closingData.max_depth}}{{ dive?.openingData.depth_units }}</div>
        <div class="pressure">Surface pressure: {{dive?.openingData.surface_pressure}}</div>
      </div> 
    </div>
  </div>

</template>
<style scoped lang="scss">
.background {
  background: #141619;
  color: #c7d0d9;  
}
.dive-data {
  margin-top: 106px;
  .general {
    color: #333;
    border-radius: 10px;
    border: 2px solid #000;
    background-color: #fff;
    padding: 5px;
    max-width: 600px;
    width: 95%;
    text-align: left;
    margin-bottom: 10px;
    width: 250px;
    .number {
      font-weight: bold;
    }
  }
}
.chart-holder {
  width: 100%;
  height: 55vh;
  min-height: 350px;
}
.tooltip {
  position: fixed;
  background: #444;
  padding: 10px;
  color: #fff;
  width: 200px;
  pointer-events: none;
  display: none;
}
.button-group {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  button {
    margin-left: 0;
    margin-right: 0;
    &:first-child {
      border-bottom-right-radius: 0;
      border-top-right-radius: 0;
    }
    &:last-child {
      border-bottom-left-radius: 0;
      border-top-left-radius: 0;
      border-left: 1px solid #777;
    }
    &:not(:first-child):not(:last-child) {
      border-left: 1px solid #777;
      border-radius: 0;
    }
  }
}

button.outline:hover {
  color: #ccc !important;
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
