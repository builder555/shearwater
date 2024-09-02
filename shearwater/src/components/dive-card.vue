<script setup>
import { computed } from 'vue';
import DiveClock from '@/components/dive-clock.vue';
const props = defineProps(['dive']);
const isDiveAvailable = computed(() => props.dive.isDownloaded || props.dive.canDownload);

function getFontSize(text) {
  if (text.length >= 5) {
      return '1.75em';
  }
  if (text.length >= 4) {
      return '2.2em';
  }
  return '2.5em';
}

</script>
<template>
  <div
    class="dive"
    :class="{'unavailable': !isDiveAvailable}"
  >
    <div class="bookmark" v-if="dive.isSelected"></div>
    <div class="checkmark" v-if="dive.isDownloaded"></div>
    <div class="row center">
      <h1>Dive </h1>&nbsp;
      <h1 :style="{'font-size': getFontSize(dive.diveNo.toString())}" class="text-right">{{dive.diveNo}}</h1>
    </div>
    <hr/>
    <div class="row">
      <div class="col">
      </div>
      <div class="col align-right">
        <h2>{{dive.startDateFmt}}</h2> 
        <h3>at {{dive.startTimeFmt}}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col">
      </div>
      <div class="col align-right">
        <h3>Depth: {{dive.maxDepth}}{{dive.depthUnits[0]}}</h3>
        <p>{{dive.computerMode}}</p>
      </div>  
    </div>
    <div class="row"
      style="margin-bottom: 0; 
        margin-top: auto; 
        background: rgba(0,0,0,0.2); 
        display: flex; 
        justify-content: space-between;"
    >
      <dive-clock :minutes="dive.diveDuration/60"></dive-clock>
      <div style="color: rgb(237, 237, 157); display: inline-block;">
        Bottom Time<br>{{dive.diveDurationFmt}}
      </div>
    </div>
  </div>
</template>
<style scoped>
  .dive {
    position: relative;
    display: flex;
    flex-direction: column;
    margin: 10px;
    width: 200px;
    height: 300px;
    border-radius: 20px;
    border: 5px #222 solid;
    padding: 10px;
    box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.5);
    background: #fff;
    background-image: url("@/assets/bg-card-small.png");
    background-size: contain;
    background-repeat: no-repeat;
    background-position-y: bottom;
    cursor: pointer;
  }
  .dive, .dive * {
    color: #000;
  }
  .dive h1 {
    margin-top: 0;
    margin-bottom: 0;
    font-size: 2.5em;
    font-weight: bold;
    padding-bottom: 0;
    display:flex; 
    direction:column; 
    align-items:flex-end;
    line-height: 1;
  }
  .dive h2 {
    margin: 0;
  }
  .dive h3 {
    margin: 0;
  }
  hr {
    border: 0;
    height: 0;
    border-bottom: 1.5px solid rgba(0, 0, 0, 0.5);
    width: 100%;
    margin-bottom: 5px;
  }
  .bookmark {
    position: absolute;
    height: 60px;
    width: 0;
    padding: 0px;
    top: 0;
    left: 10px;
    border-left: 14px solid rgba(150, 0, 0, 0.8); 
    border-right: 14px solid rgba(150, 0, 0, 0.8); 
    border-bottom: 10px solid transparent; 
    box-sizing: border-box;
  }
  .checkmark {
    position: absolute;
    top: -5px;
    left: 10px;
    height: 40px; 
    width: 20px; 
    border-bottom: 10px solid green; 
    border-right: 10px solid green; 
    transform: rotate(45deg); 
    box-shadow: 5px 2px 5px rgba(0, 0, 0, 0.5);
  }

  .unavailable {
    opacity: 0.5;
    cursor: default;
  }
</style>