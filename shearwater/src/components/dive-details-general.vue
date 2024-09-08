<script setup>
defineProps(['dive']);
</script>
<template>
  <div class="general">
    <div class="flex space-between">
      <div class="col-left striped-rows font-1_1">
        <div class="date" style="font-size: 1.5em; text-align: center;">{{dive.dive_start_date}}</div>
        <div class="dive-time flex space-between">
          <div>Duration:</div>
          <div class="text-right">{{dive.dive_length_fmt}}</div></div>
        <div class="times flex space-between">
          <div>Time In/Out:</div> 
          <div class="text-right">{{ dive.dive_start_time }} - {{ dive.dive_end_time }}</div>
        </div>
        <div class="times flex space-between">
          <div>Surface Time:</div> 
          <div class="text-right">{{dive.surface_time}}</div>
        </div>
      </div>
      <div class="col-right text-center">
        <span style="font-size: 1.8em">Depth</span>
        <div class="depth">{{dive.max_depth}}{{ dive.depth_units }}</div>
        <hr>
        <div style="font-size: 1.2em; text-transform: uppercase;">{{dive.water_type}}</div>
        <span style="font-size: 1.1em">water</span>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.flex {
  display: flex;
  flex-direction: row;
  &.column {
    flex-direction: column;
  }
}
.striped-rows {
  &>div {
    padding: 3px;
  }
  &>div:nth-child(even) {
    background: #555;
    color: #fff
  }
}
.flex-end {
  justify-content: flex-end;
}
.font-1_1 {
  font-size: 1.1em;
}
.space-between {
  justify-content: space-between;
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.general {
  color: #333;
  border-radius: 10px;
  border: 2px solid #000;
  background-color: #fff;
  width: 95%;
  text-align: left;
  margin-bottom: 10px;
  width: 300px;
  overflow: hidden;
  .col-left {
    flex-grow:2;
    border-right: 1px solid #ccc;
  }
  .col-right {
    padding-left: 3px;
  }
  .depth {
    font-weight: bold;
    font-size: 1.8em;
  }
}
</style>