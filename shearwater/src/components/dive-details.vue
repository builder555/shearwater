<script setup>
import apexchart from 'vue3-apexcharts';
import { computed, ref, watch } from 'vue';

const props = defineProps(['dive']);

function getDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().replace('T', ' ').slice(0, 19);
}

function getHhMmSs(s) {
    const date = new Date(s * 1000);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hours}h ${minutes}m ${seconds}s`;
}

function mapRawOpeningToReadable(dive) {
  function getWaterType(density){
    if (density < 1005) return 'fresh';
    if (density < 1025) return 'EN13319';
    if (density < 1045) return 'salt';
  }
  const depth_units = ['m', 'ft'][dive.depth_units];
  const deco_model = ['GF', 'VPM-B', 'VPMB-B/GFS', 'DCIEM'][dive.deco_model];
  const battery_type = ['', '1.5V Alkaline', '1.5V Lithium', '1.2VV NiMH', '3.6V Saft', '3.7V Li-Ion'][dive.battery_type];
  const temp_units_configured = {2: 'C', 3: 'F'}[dive.temp_units];
  // shearwater returns temperature in C for metric depth units and in F for imperial
  const temp_units = ['C', 'F'][dive.depth_units];

  const mapped = {
    ...dive,
    dive_number: dive.dive_number,
    gf_low: dive.gf_low,
    gf_high: dive.gf_high,
    surface_time: dive.surface_time,
    depth_units: depth_units,
    cns: `${dive.cns}%`,
    dive_start: getDate(dive.dive_start),
    o2_status: {
      1: dive.o2_status & 0b001 ? 'yes' : 'no',
      2: dive.o2_status & 0b010 ? 'yes' : 'no',
      3: dive.o2_status & 0b100 ? 'yes' : 'no',
    },
    ppo2_low: `${dive.ppo2_low_x100/100} ATA`,
    ppo2_high: `${dive.ppo2_high_x100/100} ATA`,
    firmware_version: dive.firmware_version,
    gas_0_oc_o2: `${dive.gas_0_oc_o2}%`,
    gas_0_cc_o2: `${dive.gas_0_cc_o2}%`,
    gas_1_oc_o2: `${dive.gas_1_oc_o2}%`,
    gas_1_cc_o2: `${dive.gas_1_cc_o2}%`,
    gas_2_oc_o2: `${dive.gas_2_oc_o2}%`,
    gas_2_cc_o2: `${dive.gas_2_cc_o2}%`,
    gas_3_oc_o2: `${dive.gas_3_oc_o2}%`,
    gas_3_cc_o2: `${dive.gas_3_cc_o2}%`,
    gas_4_oc_o2: `${dive.gas_4_oc_o2}%`,
    gas_4_cc_o2: `${dive.gas_4_cc_o2}%`,
    gas_0_oc_he: `${dive.gas_0_oc_he}%`,
    gas_0_cc_he: `${dive.gas_0_cc_he}%`,
    gas_1_oc_he: `${dive.gas_1_oc_he}%`,
    gas_1_cc_he: `${dive.gas_1_cc_he}%`,
    gas_2_oc_he: `${dive.gas_2_oc_he}%`,
    gas_2_cc_he: `${dive.gas_2_cc_he}%`,
    gas_3_oc_he: `${dive.gas_3_oc_he}%`,
    gas_3_cc_he: `${dive.gas_3_cc_he}%`,
    gas_4_oc_he: `${dive.gas_4_oc_he}%`,
    gas_4_cc_he: `${dive.gas_4_cc_he}%`,
    ccr_auto_sp_switch_up_lo_hi: dive.ccr_auto_sp_switch_up_lo_hi ? 'auto' : 'manual',
    ccr_auto_sp_switch_up_hi_lo: dive.ccr_auto_sp_switch_up_hi_lo ? 'auto' : 'manual',
    ccr_auto_sp_switch_up_depth: `${dive.ccr_auto_sp_switch_up_depth}${depth_units}`,
    ccr_auto_sp_switch_down_depth: `${dive.ccr_auto_sp_switch_down_depth}${depth_units}`,
    is_single_ppo2_sensor: dive.is_single_ppo2_sensor ? 'yes' : 'no',
    surface_pressure: `${dive.surface_pressure/1000} bar`,
    serial_number: dive.serial_number,
    deco_model,
    vpm_b_conservatism: dive.vpm_b_conservatism,
    water_type: getWaterType(dive.salinity),
    battery_type,
    temp_units,
    temp_units_configured,
  }
  return mapped;
}

const diveInfo = computed(() => mapRawOpeningToReadable(props.dive.openingData));

const chart = ref(null);

const seriesData = computed(() => [
  {
    name: 'Depth',
    data: props.dive.dive.depth.map((d) => d/10),
  },
  {
    name: 'SAC Rate',
    data: props.dive.dive.sac.map((s) => s > 0xFFF0 ? 0 : s / 100),
  },
  {
    name: 'Water Temperature',
    data: props.dive.dive.water_temp,
  },
  {
    name: 'PPO2',
    data: props.dive.dive.avg_ppo2.map((d) => d/100),
  },
  {
    name: 'AI T1',
    data: props.dive.dive.ai_t1_data.map((d) => d < 0xFFF0 ? (d & 0xFFF) * 2 : 0),
  },
  {
    name: 'AI T2',
    data: props.dive.dive.ai_t2_data.map((d) => d < 0xFFF0 ? (d & 0xFFF) * 2 : 0),
  },
]);

const yaxisData = computed(() => [
    {
      reversed: true,
      title : {
        text: `Depth (${diveInfo.value.depth_units})`,
      },
      seriesName: 'Depth',
    },
    {
      seriesName: 'SAC Rate',
      title : {
        text: 'SAC Rate (psi/min)',
      },
      opposite: true,
    },
    {
      seriesName: 'Water Temperature',
      title : {
        text: `Water Temperature (${diveInfo.value.temp_units})`,
      },
      opposite: true,
    },
    {
      seriesName: 'PPO2',
      title : {
        text: 'PPO2 (ATA)',
      },
      opposite: true,
    },
    {
      seriesName: 'AI T1',
      title : {
        text: 'AI T1 (psi)',
      },
      opposite: true,
    },
    {
      seriesName: 'AI T2',
      title : {
        text: 'AI T2 (psi)',
      },
      opposite: true,
    },
]);

const series = computed(() => visibleSeries.value.map((name) => seriesData.value.find((s) => s.name === name)));
const colorMap = {
  'Depth': '#ce0707',
  'SAC Rate': '#3faa24',
  'Water Temperature': '#ef7b00',
  'PPO2': '#992cf8',
  'AI T1': '#3877eb',
  'AI T2': '#00c8ff',
};

const options = computed(() =>({
  chart: {
    id: 'vuechart-example',
    animations: {
      enabled: false,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'smooth',
    width: 1.5,
  },
  legend: {
    show: true,
    position: "top",
    onItemClick: {
      toggleDataSeries: false,
    }
  },
  colors: [({ seriesIndex }) => colorMap[visibleSeries.value[seriesIndex]]],
  yaxis: visibleSeries.value.map((name) => yaxisData.value.find((s) => s.seriesName === name)),
  xaxis: {
    type: 'numeric',
    labels: {
      formatter: (value) => {
        const sampleRate = props.dive.openingData.log_sample_rate_ms / 1000;
        return getHhMmSs(value * sampleRate);
      },
    },
  },
}));

const visibleSeries = ref(['Depth']);

watch(props.dive, () => {
  chart.value.updateOptions(options.value);
  chart.value.updateSeries(series.value);
});

function toggleSeries(name) {
  if (visibleSeries.value.includes(name)) {
    visibleSeries.value = visibleSeries.value.filter((s) => s !== name);
  } else {
    visibleSeries.value.push(name);
  }
  chart.value.updateOptions(options.value);
  chart.value.updateSeries(series.value);
}
</script>
<template>
  <apexchart
    ref="chart"
    width="800"
    type="line"
    :options="options"
    :series="series"
  />
  <button
    v-for="s in seriesData"
    :key="s.name"
    class="outline"
    :class="{'selected' : visibleSeries.includes(s.name)}"
    :style="{ 
        'border-color': colorMap[s.name],
        'background-color': visibleSeries.includes(s.name) ? colorMap[s.name] : 'transparent'
      }"
    @click="toggleSeries(s.name)"
  >{{s.name}}</button>
</template>
<style scoped>
  button.outline:hover {
    color: #ccc;
  }
</style>
