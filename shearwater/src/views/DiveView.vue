<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMainStore } from '@/store';
import { makeChart } from '@/chartformatter';

const store = useMainStore();
const { getDiveDetails } = store;
const diveId = useRoute().params.id;
const chart = ref(null);

getDiveDetails(diveId).then((dive) => {
  makeChart({
    x: dive.times,
    series: dive.data,
  }, chart.value);
});

</script>
<template>
  <div>
    <div ref="chart"></div>
  </div>
</template>
<style scoped>
button.outline:hover {
  color: #ccc;
}

div {
  margin: 0;
  background: #141619;
  color: #c7d0d9;
}
</style>
