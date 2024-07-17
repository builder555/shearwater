<script setup>
import { onMounted } from 'vue';
const props = defineProps(['dive', 'picked', 'downloaded']);
function getFontSize(strDiveNo) {
  const diveNo = parseInt(strDiveNo);
  if (diveNo >= 10000) {
      return '1.75em';
  }
  if (diveNo >= 1000) {
      return '2.2em';
  }
  return '2.5em';
}
function drawClock(ctx, radius, minutes) {
    drawFace(ctx, radius);
    drawTicks(ctx, radius);
    drawTime(ctx, radius, minutes);
}
function drawBackgroundArc(ctx, startAngle, endAngle, radius) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(114, 192, 210, 0.6)';
    ctx.fill();
}

function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.01, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

function drawTicks(ctx, radius) {
    let ang;
    const ticks = 6;
    ctx.strokeStyle = '#ff0';
    for (let num = 1; num <= ticks; num++) {
        ang = num * Math.PI / (ticks / 2);
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.99);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, radius * 0.2);
        ctx.lineWidth = 0.75;
        ctx.stroke();
        
        ctx.translate(0, radius * 0.99);
        ctx.rotate(-ang);
    }
}

function drawTime(ctx, radius, minutes) {
    const hourPos = Math.PI * 2 * Math.min(120, minutes)/120;
    drawBackgroundArc(ctx, Math.PI*1.5, hourPos - Math.PI / 2, radius);
}

function drawDiveClock(dive) {
  const canvas = document.getElementById(`clock-${dive.diveNo}`);
  const ctx = canvas.getContext('2d');
  const radius = canvas.height / 2;
  ctx.translate(radius, radius);
  const minutes = dive.diveDuration/60;
  drawClock(ctx, radius, minutes);
}

onMounted(() => {
  drawDiveClock(props.dive);
});
</script>
<template>
  <div class="dive">
    <div class="bookmark" v-if="picked && !downloaded"></div>
    <div class="checkmark" v-if="downloaded"></div>
    <div class="row center">
      <h1>Dive </h1>&nbsp;
      <h1 :style="{'font-size': getFontSize(dive.diveNo)}" class="text-right">{{dive.diveNo}}</h1>
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
        <h3>Depth: {{dive.maxDepthX10/10}}{{dive.depthUnits[0]}}</h3>
        <p>{{dive.computerMode}}</p>
      </div>  
    </div>
    <div class="row"
      style="margin-bottom: 0; margin-top: auto; background: rgba(0,0,0,0.2); display: flex; justify-content: space-between;"
    >
      <canvas
        class="divetime"
        :id="`clock-${dive.diveNo}`"
        width="50"
        height="50"
      ></canvas>
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
  canvas.divetime {
    background: linear-gradient(rgb(102, 115, 119), rgba(52, 60, 62, 1));
    border-radius: 50%;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
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

</style>