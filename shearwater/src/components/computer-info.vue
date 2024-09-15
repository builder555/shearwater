<script setup>
import { onMounted } from 'vue';
const props = defineProps(['dive']);
onMounted(() =>{
  document.documentElement.style.setProperty('--battery-bar-width', props.dive?.battery_percentage);
  document.documentElement.style.setProperty('--battery-color', props.dive?.battery_percent_remaining);
});
</script>
<template>
  <div class="computer-info">
    <div class="flex">
      <div style="width: 110px; margin: 3px;">
        <img src="@/assets/perdix2-sm.png" style="width: 100%; align-self: center;">
      </div>
      <div class="striped-rows">
        <div>Computer: {{dive.product}}</div>
        <div>S/N: {{dive.serial_number}}</div>
        <div>Firmware: {{dive.firmware_version}}</div>
      </div>
     </div>
     <div class="flex">
       <div ref="battery" class="battery" style="width: 100px; margin-right: 10px; align-self: center;"></div>
       <div class="striped-rows inverted">
         <div>Voltage: {{dive.battery_voltage}} ({{dive.battery_percentage}})</div>
         <div>{{dive.battery_type}}</div>
         <div>Warn: {{dive.battery_warning_level}} Critical: {{dive.battery_critical_level}}</div>
       </div>
     </div>
  </div>
</template>
<style>
:root {
  --battery-bar-width: 90%;
  --battery-color: 0;
}
</style>
<style scoped lang="scss">
.striped-rows {
  width: 100%;
}
.computer-info {
  width: 300px;
  background: #fff;
  border-radius: 10px;
  color: #333;
  overflow: hidden;
}
$size: 37px;
$margin: 0.07 * $size;
$border: 0.05 * $size;
$batteryColor: hsl(var(--battery-color), 100%, 30%);
.battery {
  margin: 3px;
  position: relative;
  width: 2 * $size;
  border: $border solid $batteryColor;
  height: $size;
  border-radius: 0.2 * $size;
  box-sizing: border-box;
  &:before {
    content: "";
    display:inline-block;
    padding: 0;
    margin: $margin;
    height: calc(100% - 2 * $margin);
    background-color: $batteryColor;
    border-radius: 0.12 * $size;
    width: calc(var(--battery-bar-width) - 2 * $margin);
  }
  &:after {
    content: "";
    position: absolute;
    right: - 3 * $margin;
    top: ($size - 7 * $margin) / 2 - $border;
    width: 2 * $margin;
    height: $size - 7 * $margin;
    background-color: $batteryColor;
    border-bottom-right-radius: 0.08 * $size;
    border-top-right-radius: 0.08 * $size;
  }
}
</style>
