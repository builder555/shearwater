<script setup>
import { ref } from 'vue';
const props = defineProps(['dive', 'transmitter']);
const transmitter = ref({
  name: props.dive[`ai_t${props.transmitter}_name`],
  serial: props.dive[`ai_t${props.transmitter}_serial`],
  max_psi: props.dive[`ai_t${props.transmitter}_max_psi`],
  reserve_psi: props.dive[`ai_t${props.transmitter}_reserve_psi`],
});
</script>
<template>
  <div class="air-transmitter flex">
    <div><img src="@/assets/transmitter.png"></div>
    <div class="striped-rows" style="flex-grow:2">
      <div>Air Transmitter: {{ transmitter.name }}</div>
      <div>Serial: {{ transmitter.serial }}</div>
      <div>Max PSI: {{ transmitter.max_psi }}</div>
      <div>Reserve PSI: {{ transmitter.reserve_psi }}</div>
    </div>
  </div>
</template>
<style scoped>
  .air-transmitter {
    background-color: #fff;
    width: 300px;
    color: #333;
    border-radius: 10px;
    overflow: hidden;
  }
</style>
