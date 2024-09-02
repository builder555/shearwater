<script setup>
import { onMounted, ref } from 'vue';
const props = defineProps(['minutes']);
const clockCanvas = ref('clock');

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
  const hourPos = Math.PI * 2 * Math.min(120, minutes) / 120;
  drawBackgroundArc(ctx, Math.PI * 1.5, hourPos - Math.PI / 2, radius);
}

function drawDiveClock(minutes) {
  const canvas = clockCanvas.value;
  const ctx = canvas.getContext('2d');
  const radius = canvas.height / 2;
  ctx.translate(radius, radius);
  drawClock(ctx, radius, minutes);
}
onMounted(() => {
  drawDiveClock(props.minutes);
});
</script>
<template>
  <canvas ref="clockCanvas" width="50" height="50"></canvas>
</template>

<style scoped>
canvas {
  background: linear-gradient(rgb(102, 115, 119), rgba(52, 60, 62, 1));
  border-radius: 50%;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
}
</style>
