<script setup>
import { computed } from 'vue';

const gid = Math.random().toString(36).slice(2, 7);

const props = defineProps({
  value:      { type: Number, required: true },
  min:        { type: Number, default: 0 },
  max:        { type: Number, required: true },
  threshold:  { type: Number, default: null },
  unit:       { type: String, default: '' },
  label:      { type: String, default: '' },
  centerText: { type: String, default: null },
  size:       { type: Number, default: 170 },
  ticks:      { type: Array, default: () => [] },
});

// ── coordinate system: 200×200, center 100,100 ──────
const VB = 200;
const CX = 100, CY = 100;

const BEZ_R     = 88;   // outer bezel radius
const KNURL_IN  = 72;   // inner edge of knurl band
const ARC_R     = 53;   // arc track center radius
const ARC_SW    = 11;   // arc track stroke width
const LABEL_R   = 63;   // scale labels radius

const START_DEG = 225;
const SWEEP     = 270;

function rad(deg) { return (deg - 90) * Math.PI / 180; }
function toXY(deg, r) {
  return {
    x: +(CX + r * Math.cos(rad(deg))).toFixed(3),
    y: +(CY + r * Math.sin(rad(deg))).toFixed(3),
  };
}
function arc(from, to, r) {
  const diff = to - from;
  if (Math.abs(diff) < 0.01) return '';
  const s = toXY(from, r);
  const e = toXY(to, r);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${diff > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
}
function valToDeg(v) {
  const pct = (Math.max(props.min, Math.min(props.max, v)) - props.min) / (props.max - props.min);
  return START_DEG + pct * SWEEP;
}
function fmt(v) {
  if (typeof v !== 'number') return String(v);
  return v % 1 !== 0 ? v.toFixed(1) : String(v);
}

// ── knurl ticks — full 360° ──────────────────────────
const KNURL_COUNT = 96;
const knurlTicks = Array.from({ length: KNURL_COUNT }, (_, i) => {
  const deg = i * (360 / KNURL_COUNT);
  const major = i % 8 === 0;
  return {
    outer: toXY(deg, 87),
    inner: toXY(deg, major ? 75 : 78),
    major,
  };
});

// ── scale ticks — along the 270° arc ────────────────
const scaleTicks = computed(() => {
  const provided = props.ticks.length > 0 ? props.ticks : (() => {
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => props.min + (props.max - props.min) * i / steps);
  })();
  const all = Array.from(new Set([props.min, ...provided, props.max])).sort((a, b) => a - b);
  return all.map(t => {
    const deg = valToDeg(t);
    return {
      deg,
      outer:  toXY(deg, KNURL_IN),
      inner:  toXY(deg, ARC_R + ARC_SW / 2 + 2),
      labelP: toXY(deg, LABEL_R),
      value:  fmt(t),
    };
  });
});

const minorScaleTicks = computed(() => {
  const st = scaleTicks.value;
  if (st.length < 2) return [];
  const result = [];
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i].deg, b = st[i + 1].deg;
    for (let j = 1; j < 5; j++) {
      const deg = a + (b - a) * j / 5;
      result.push({ outer: toXY(deg, KNURL_IN - 1), inner: toXY(deg, ARC_R + ARC_SW / 2 + 3) });
    }
  }
  return result;
});

// ── arc paths ────────────────────────────────────────
const trackPath   = computed(() => arc(START_DEG, START_DEG + SWEEP, ARC_R));
const valueDeg    = computed(() => valToDeg(props.value));
const fillPath    = computed(() => arc(START_DEG, valueDeg.value, ARC_R));
const threshDeg   = computed(() => props.threshold !== null ? valToDeg(props.threshold) : null);
const reservePath = computed(() => threshDeg.value ? arc(START_DEG, threshDeg.value, ARC_R) : '');
const usablePath  = computed(() => threshDeg.value ? arc(threshDeg.value, START_DEG + SWEEP, ARC_R) : '');

// threshold cross-tick
const threshTick  = computed(() => threshDeg.value ? {
  outer: toXY(threshDeg.value, KNURL_IN + 2),
  inner: toXY(threshDeg.value, ARC_R - ARC_SW / 2 - 4),
} : null);

// ── needle ────────────────────────────────────────────
// tapered polygon: wide at pivot, narrow at tip
function needlePolygon(deg, tipR, tailR, halfW) {
  const perpDeg = deg + 90;
  const tip  = toXY(deg, tipR);
  const tail = toXY(deg + 180, tailR);
  // base offset perpendicular at pivot
  function offset(d, r) {
    return {
      x: +(CX + r * Math.cos(rad(d))).toFixed(3),
      y: +(CY + r * Math.sin(rad(d))).toFixed(3),
    };
  }
  const bl = { x: +(CX + halfW * Math.cos(rad(perpDeg))).toFixed(3), y: +(CY + halfW * Math.sin(rad(perpDeg))).toFixed(3) };
  const br = { x: +(CX - halfW * Math.cos(rad(perpDeg))).toFixed(3), y: +(CY - halfW * Math.sin(rad(perpDeg))).toFixed(3) };
  // tail lobe (counterweight)
  const tl = toXY(deg + 180, tailR * 0.6);
  const tlL = { x: +(tl.x + (halfW * 1.4) * Math.cos(rad(perpDeg))).toFixed(3), y: +(tl.y + (halfW * 1.4) * Math.sin(rad(perpDeg))).toFixed(3) };
  const tlR = { x: +(tl.x - (halfW * 1.4) * Math.cos(rad(perpDeg))).toFixed(3), y: +(tl.y - (halfW * 1.4) * Math.sin(rad(perpDeg))).toFixed(3) };
  return [
    `${tip.x},${tip.y}`,
    `${bl.x},${bl.y}`,
    `${tlL.x},${tlL.y}`,
    `${tail.x},${tail.y}`,
    `${tlR.x},${tlR.y}`,
    `${br.x},${br.y}`,
  ].join(' ');
}

const needlePoints = computed(() => needlePolygon(valueDeg.value, ARC_R - 2, 16, 2.5));

const displayValue = computed(() => {
  if (props.centerText) return props.centerText;
  return typeof props.value === 'number' && props.value % 1 !== 0
    ? props.value.toFixed(2) : String(props.value);
});
</script>

<template>
  <div class="gauge-wrap">
    <svg :width="size" :height="size" :viewBox="`0 0 ${VB} ${VB}`">
      <defs>
        <!-- dial face: very dark, slight teal tint -->
        <radialGradient :id="`vg-${gid}-face`" cx="38%" cy="32%" r="70%">
          <stop offset="0%"   stop-color="#152828"/>
          <stop offset="60%"  stop-color="#0a1818"/>
          <stop offset="100%" stop-color="#040c0c"/>
        </radialGradient>
        <!-- bezel fill: warm dark metal -->
        <radialGradient :id="`vg-${gid}-bezel`" cx="30%" cy="25%" r="80%">
          <stop offset="0%"   stop-color="#3a3020"/>
          <stop offset="50%"  stop-color="#1c1610"/>
          <stop offset="100%" stop-color="#0e0c08"/>
        </radialGradient>
        <!-- needle: slightly warm ivory -->
        <linearGradient :id="`vg-${gid}-needle`" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#c8c0a0"/>
          <stop offset="50%"  stop-color="#e8dfc8"/>
          <stop offset="100%" stop-color="#b0a888"/>
        </linearGradient>
        <!-- center boss -->
        <radialGradient :id="`vg-${gid}-boss`" cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stop-color="#d07020"/>
          <stop offset="60%"  stop-color="#903010"/>
          <stop offset="100%" stop-color="#5a1808"/>
        </radialGradient>
        <!-- hatch for danger zone -->
        <pattern :id="`vg-${gid}-hatch`" x="0" y="0" width="5" height="5"
                 patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(140,20,0,0.65)" stroke-width="2.5"/>
        </pattern>
      </defs>

      <!-- ── bezel body ── -->
      <circle :cx="CX" :cy="CY" :r="BEZ_R" :fill="`url(#vg-${gid}-bezel)`"/>
      <!-- outer rim edge -->
      <circle :cx="CX" :cy="CY" :r="BEZ_R" fill="none" stroke="#0a0806" stroke-width="3"/>
      <circle :cx="CX" :cy="CY" :r="BEZ_R - 1.5" fill="none" stroke="rgba(200,180,130,0.18)" stroke-width="1"/>

      <!-- ── knurl ticks ── -->
      <line v-for="(t, i) in knurlTicks" :key="'k' + i"
        :x1="t.inner.x" :y1="t.inner.y"
        :x2="t.outer.x" :y2="t.outer.y"
        :stroke="t.major ? 'rgba(200,180,130,0.45)' : 'rgba(160,140,100,0.25)'"
        :stroke-width="t.major ? 1.5 : 0.8"/>

      <!-- bezel light reflections (top-left shimmer) -->
      <path :d="arc(250, 290, BEZ_R - 2)" fill="none" stroke="rgba(220,200,150,0.22)" stroke-width="5" stroke-linecap="round"/>
      <path :d="arc(255, 275, BEZ_R - 2)" fill="none" stroke="rgba(240,220,170,0.15)" stroke-width="2" stroke-linecap="round"/>

      <!-- ── dial face ── -->
      <circle :cx="CX" :cy="CY" :r="KNURL_IN" :fill="`url(#vg-${gid}-face)`"/>
      <!-- inner bezel edge -->
      <circle :cx="CX" :cy="CY" :r="KNURL_IN" fill="none" stroke="rgba(180,160,110,0.3)" stroke-width="1.5"/>

      <!-- ── arc track ── -->
      <path :d="trackPath" fill="none" stroke="rgba(255,255,255,0.06)" :stroke-width="ARC_SW" stroke-linecap="butt"/>

      <!-- ── arcs: two-zone (threshold) ── -->
      <template v-if="threshold !== null">
        <path :d="reservePath" fill="none" :stroke="`url(#vg-${gid}-hatch)`" :stroke-width="ARC_SW" stroke-linecap="butt"/>
        <path :d="reservePath" fill="none" stroke="rgba(140,20,0,0.6)"    :stroke-width="ARC_SW" stroke-linecap="butt"/>
        <path :d="usablePath"  fill="none" stroke="rgba(160,110,10,0.85)" :stroke-width="ARC_SW" stroke-linecap="butt"/>
        <line v-if="threshTick"
          :x1="threshTick.inner.x" :y1="threshTick.inner.y"
          :x2="threshTick.outer.x" :y2="threshTick.outer.y"
          stroke="rgba(220,200,150,0.9)" stroke-width="2.5"/>
      </template>

      <!-- ── arcs: fill mode ── -->
      <path v-else :d="fillPath" fill="none" stroke="rgba(160,110,10,0.9)" :stroke-width="ARC_SW" stroke-linecap="butt"/>

      <!-- ── minor scale ticks ── -->
      <line v-for="(t, i) in minorScaleTicks" :key="'ms' + i"
        :x1="t.inner.x" :y1="t.inner.y"
        :x2="t.outer.x" :y2="t.outer.y"
        stroke="rgba(200,180,130,0.4)" stroke-width="0.8"/>

      <!-- ── major scale ticks + labels ── -->
      <g v-for="t in scaleTicks" :key="'sc' + t.deg">
        <line
          :x1="t.inner.x" :y1="t.inner.y"
          :x2="t.outer.x" :y2="t.outer.y"
          stroke="rgba(210,195,150,0.85)" stroke-width="2"/>
        <text
          :x="t.labelP.x" :y="t.labelP.y"
          text-anchor="middle" dominant-baseline="middle"
          font-size="8.5" font-family="'Bebas Neue',sans-serif"
          fill="rgba(210,195,150,0.8)" letter-spacing="0.5">{{ t.value }}</text>
      </g>

      <!-- ── needle shadow ── -->
      <polygon :points="needlePoints"
        fill="rgba(0,0,0,0.5)"
        transform="translate(1.5,2)"/>

      <!-- ── needle ── -->
      <polygon :points="needlePoints" :fill="`url(#vg-${gid}-needle)`"/>

      <!-- ── center boss ── -->
      <circle :cx="CX" :cy="CY" r="10" :fill="`url(#vg-${gid}-boss)`"/>
      <circle :cx="CX" :cy="CY" r="10" fill="none" stroke="rgba(200,180,130,0.6)" stroke-width="1.5"/>
      <circle :cx="CX" :cy="CY" r="3.5" fill="rgba(220,205,165,0.5)"/>

      <!-- ── readout: value + unit ── -->
      <text :x="CX" :y="CY + 28"
            text-anchor="middle" dominant-baseline="middle"
            font-size="14" font-family="'Bebas Neue',sans-serif"
            fill="rgba(210,195,150,0.9)" letter-spacing="1">{{ displayValue }}</text>
      <text :x="CX" :y="CY + 41"
            text-anchor="middle" dominant-baseline="middle"
            font-size="8" font-family="'Bebas Neue',sans-serif"
            fill="rgba(180,165,120,0.6)" letter-spacing="2.5">{{ unit }}</text>

      <!-- reserve label -->
      <text v-if="threshold !== null"
            :x="CX" :y="CY + 53"
            text-anchor="middle" dominant-baseline="middle"
            font-size="8" font-family="'Bebas Neue',sans-serif"
            fill="rgba(180,80,40,0.85)" letter-spacing="1">RES {{ threshold }}</text>

      <!-- gauge label (inside top of dial) -->
      <text v-if="label"
            :x="CX" :y="CY - 34"
            text-anchor="middle" dominant-baseline="middle"
            font-size="7.5" font-family="'Bebas Neue',sans-serif"
            fill="rgba(180,165,120,0.45)" letter-spacing="3">{{ label }}</text>
    </svg>
  </div>
</template>

<style scoped>
.gauge-wrap { flex: 1; display: flex; justify-content: center; align-items: center; padding: 8px 0; }
</style>
