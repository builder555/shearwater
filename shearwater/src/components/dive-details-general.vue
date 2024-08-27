<script setup>
defineProps(['dive']);
</script>
<template>
  <div class="general">
    <div class="date">{{dive.dive_start_date}}</div>
    <div class="dive-time">{{dive.dive_length}}</div>
    <div class="times">Dive times: {{ dive.dive_start_time }} - {{ dive.dive_end_time }}</div>
    <div class="depth">Max depth: {{dive.max_depth}}{{ dive.depth_units }}</div>
    <div class="pressure">Surface pressure: {{dive.surface_pressure}}</div>
    <div class="surface-time">Surface time: {{dive.surface_time}}</div>
  </div> 
</template>
<style lang="scss" scoped>
.general {
  color: #333;
  border-radius: 10px;
  border: 2px solid #000;
  background-color: #fff;
  padding: 5px;
  width: 95%;
  text-align: left;
  margin-bottom: 10px;
  width: 300px;
  .number {
    font-weight: bold;
  }
  .date, .dive-time {
    font-weight: bold;
    background: #333;
    color: #fff;
    border-radius: 10px;
    padding: 5px;
    width: auto;
    background: linear-gradient(to bottom, #444 0%, #222 100%);
    display:inline-block;
  }
}
</style>