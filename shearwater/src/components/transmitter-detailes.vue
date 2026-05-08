<script setup>
import { ref } from 'vue';
import VintageGauge from './VintageGauge.vue';
const props = defineProps(['dive', 'transmitter']);
const transmitter = ref({
  name: props.dive[`ai_t${props.transmitter}_name`],
  serial: props.dive[`ai_t${props.transmitter}_serial`],
  max_psi: props.dive[`ai_t${props.transmitter}_max_psi`],
  reserve_psi: props.dive[`ai_t${props.transmitter}_reserve_psi`],
});
</script>
<template>
  <div class="vintage-card air-transmitter">
    <div class="card-stripe"></div>
    <div class="card-title" style="display:flex; align-items: center; justify-content: space-between;">
      <span>Air Transmitter · {{ transmitter.name }}</span>
      <!-- push to the right -->
      <span>S/N: {{ transmitter.serial }}</span>
    </div>
    <VintageGauge
    :value="transmitter.reserve_psi"
    :min="0"
      :max="transmitter.max_psi"
      :threshold="transmitter.reserve_psi"
      :center-text="transmitter.max_psi.toLocaleString()"
      unit="PSI"
      label="TANK CAPACITY"
      :size="160"
    />
  </div>
</template>
<style scoped>
.air-transmitter {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}
</style>
