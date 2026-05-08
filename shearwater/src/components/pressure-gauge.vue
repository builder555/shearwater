<script setup>
import { computed } from 'vue';
import VintageGauge from './VintageGauge.vue';
const props = defineProps(['dive']);
const pressureBar = computed(() => props.dive.surface_pressure_mbars / 1000);
</script>
<template>
  <div class="vintage-card pressure-card">
    <div class="card-stripe"></div>
    <div class="card-title">Surface Pressure</div>
    <VintageGauge
      :value="pressureBar"
      :min="0.8"
      :max="1.3"
      unit="BAR"
      label="SURFACE"
      :ticks="[0.9, 1.0, 1.1, 1.2]"
      :size="160"
    />
  </div>
</template>
<style scoped>
.pressure-card {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}
</style>
