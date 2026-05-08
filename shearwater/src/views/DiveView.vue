<script setup>
import { ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMainStore } from '@/store';
import { makeChart } from '@/chartformatter';
import DiveDetailsGeneral from '@/components/dive-details-general.vue';
import PressureGauge from '@/components/pressure-gauge.vue';
import TransmitterDetails from '@/components/transmitter-detailes.vue';
import ComputerInfo from '@/components/computer-info.vue';

const store = useMainStore();
const { getDiveDetails, toggleSeriesVisibility } = store;
const diveId = useRoute().params.id;
const chartElement = ref(null);
const chartWrapper = ref(null);
const chart = ref(null);
const tooltip = ref(null);
const dive = ref(null);

const isMobile = window.innerWidth < 768;
const MAX_VISIBLE = 3;
const visibleQueue = ref([]);

function mkChart() {
  chart.value = makeChart({
      x: dive.value.times,
      series: dive.value.series,
      title: '',
    }, chartElement.value, tooltip.value);
}

getDiveDetails(diveId, isMobile).then((d) => {
  dive.value = d;
  if (isMobile) {
    visibleQueue.value = d.series.filter(s => s.isVisible).map(s => s.name);
  }
  mkChart();
});

function toggleVisibile(dataSeries) {
  if (isMobile) {
    const willBeVisible = !dataSeries.isVisible;
    if (willBeVisible) {
      if (visibleQueue.value.length >= MAX_VISIBLE) {
        const evictIdx = visibleQueue.value.findIndex(n => n !== 'Depth');
        if (evictIdx !== -1) {
          const [evictedName] = visibleQueue.value.splice(evictIdx, 1);
          const evicted = dive.value.series.find(s => s.name === evictedName);
          if (evicted) toggleSeriesVisibility(evicted);
        }
      }
      visibleQueue.value.push(dataSeries.name);
    } else {
      visibleQueue.value = visibleQueue.value.filter(n => n !== dataSeries.name);
    }
  }
  toggleSeriesVisibility(dataSeries);
  chart.value.destroy();
  mkChart();
}

async function enterFullscreen() {
  try {
    await chartWrapper.value.requestFullscreen();
    await screen.orientation.lock('landscape');
  } catch(e) {}
}

function onFullscreenChange() {
  if (chart.value) { chart.value.destroy(); mkChart(); }
}
document.addEventListener('fullscreenchange', onFullscreenChange);
onUnmounted(() => document.removeEventListener('fullscreenchange', onFullscreenChange));
</script>
<template>
  <div class="background">
    <div class="chart-wrapper" ref="chartWrapper">
      <div class="dive-hero" v-if="dive">
        <div class="dive-title">DIVE #{{ dive.openingData.dive_number }}</div>
      </div>
      <div class="chart-holder">
        <div ref="chartElement"></div>
        <div ref="tooltip" class="tooltip"></div>
        <button class="fullscreen-btn" @click="enterFullscreen" aria-label="Full screen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>
      </div>
      <div v-if="dive?.series" class="button-group">
        <button
          v-for="dataSeries in dive.series"
          :key="dataSeries.name"
          :class="{ active: dataSeries.isVisible }"
          :style="dataSeries.isVisible ? { '--btn-color': dataSeries.color } : {}"
          @click="toggleVisibile(dataSeries)"
        >{{ dataSeries.name }}</button>
      </div>
    </div>
    <div class="page-stripes"></div>
    <div class="dive-data">
      <ComputerInfo
        v-if="dive"
        :dive="{...dive?.openingData, ...dive?.closingData}"
      />
      <DiveDetailsGeneral
        v-if="dive"
        :dive="{...dive?.openingData, ...dive?.closingData}"
      />
      <TransmitterDetails
        v-if="dive?.openingData?.ai_t1_on"
        :dive="{...dive?.openingData, ...dive?.closingData}"
        transmitter="1"
      />
      <TransmitterDetails
        v-if="dive?.openingData?.ai_t2_on"
        :dive="{...dive?.openingData, ...dive?.closingData}"
        transmitter="2"
      />
      <TransmitterDetails
        v-if="dive?.openingData?.ai_t3_on"
        :dive="{...dive?.openingData, ...dive?.closingData}"
        transmitter="3"
      />
      <TransmitterDetails
        v-if="dive?.openingData?.ai_t4_on"
        :dive="{...dive?.openingData, ...dive?.closingData}"
        transmitter="4"
      />
      <PressureGauge
        v-if="dive"
        :dive="{...dive?.openingData, ...dive?.closingData}"
      />
    </div>
  </div>
</template>
<style scoped lang="scss">
.background {
  background-color: var(--v-teal);
  background-image:
    radial-gradient(rgba(240,230,204,0.04) 1px, transparent 1px);
  background-size: 14px 14px;
  color: var(--v-cream);
  min-height: 100vh;
}

.chart-wrapper {
  background-color: #071e1e;
  background-image:
    linear-gradient(rgba(240,230,204,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(240,230,204,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.dive-hero {
  padding: 18px 24px 4px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.dive-hero::before,
.dive-hero::after {
  content: '';
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(240,230,204,0.35));
}
.dive-hero::before {
  display: none;
}
.dive-hero::after {
  background: linear-gradient(to right, rgba(240,230,204,0.35), transparent);
}

.dive-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: 0.1em;
  color: var(--v-cream);
  line-height: 1;
  text-shadow:
    0 2px 8px rgba(0,0,0,0.6),
    0 0 30px rgba(240,230,204,0.1);
}

.chart-holder {
  width: 100%;
  height: 55vh;
  min-height: 350px;
  position: relative;
}

.fullscreen-btn {
  display: none;
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(7,30,30,0.75);
  border: 1px solid rgba(240,230,204,0.35);
  border-radius: 4px;
  color: rgba(240,230,204,0.7);
  padding: 6px;
  cursor: pointer;
  line-height: 0;
  &:hover { border-color: rgba(240,230,204,0.7); color: var(--v-cream); }
}

@media (max-width: 767px) {
  .fullscreen-btn { display: block; }
}

.chart-wrapper:fullscreen {
  display: flex;
  flex-direction: column;
  background-color: #071e1e;
  .chart-holder {
    flex: 1;
    height: auto;
    min-height: 0;
  }
  .fullscreen-btn { display: block; }
}

.tooltip {
  position: fixed;
  background: #071e1e;
  border: 1px solid rgba(240,230,204,0.6);
  border-radius: 4px;
  padding: 10px 14px;
  color: var(--v-cream);
  width: 200px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.05em;
  letter-spacing: 0.06em;
  pointer-events: none;
  display: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.6);
}

.button-group {
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;

  button {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1em;
    letter-spacing: 0.1em;
    padding: 5px 16px;
    border: 2px solid rgba(240,230,204,0.3);
    border-radius: 3px;
    background: #0a2e2e;
    color: rgba(240,230,204,0.4);
    cursor: pointer;
    margin: 0;
    /* raised look when inactive */
    box-shadow:
      0 3px 0 rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(240,230,204,0.08);
    text-shadow: none;
    transition: all 0.08s ease;

    &.active {
      background: var(--btn-color, var(--v-orange));
      border-color: rgba(240,230,204,0.7);
      color: #071e1e;
      text-shadow: 0 1px 0 rgba(255,255,255,0.3);
      /* pressed look when active */
      box-shadow:
        inset 0 2px 5px rgba(0,0,0,0.4),
        0 1px 0 rgba(240,230,204,0.2);
      transform: translateY(2px);
    }

    &:hover:not(.active) {
      border-color: rgba(240,230,204,0.6);
      color: rgba(240,230,204,0.8);
    }
  }
}

.page-stripes {
  height: 12px;
  background: repeating-linear-gradient(
    90deg,
    #7a1a00 0px,   #c04000 12%,
    #e06010 24%,   #f5a020 36%,
    #f5c840 50%,
    #f5a020 64%,   #e06010 76%,
    #c04000 88%,   #7a1a00 100%
  );
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.dive-data {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  justify-content: center;

  > * {
    flex: 1 1 260px;
    max-width: 340px;
  }
}
</style>
<style>
.u-title { display: none; }
.uplot { margin-top: 16px; }
.u-select { background: rgba(240,230,204,0.07); }
</style>
