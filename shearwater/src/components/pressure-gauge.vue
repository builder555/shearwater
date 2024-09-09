<script setup>
import { onMounted } from 'vue';
import {RadialGauge} from 'canvas-gauges';
const props = defineProps(['dive']);
onMounted(() => {
  new RadialGauge({
    renderTo: 'gauge',
    value: props.dive.surface_pressure_mbars / 1000,
    units: 'Bar',
    title: 'Surface Pressure',
    majorTicks: [0.8, 0.9, 1, 1.1, 1.2, 1.3],
    minValue: 0.8,
    maxValue: 1.3,
    highlights: [],
    width: 250,
    borders: false,
  }).draw();
});

</script>
<template>
  <canvas id="gauge"></canvas>
</template>
