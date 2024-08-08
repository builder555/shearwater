<script setup>
import DiveCard from '@/components/dive-card.vue';
import WebpImage from '@/components/webp-image.vue';
import { useMainStore } from '@/store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const store = useMainStore();
const { diveCardClicked } = store;
const { dives, isConnected } = storeToRefs(store);
function compareDates(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (date1 > date2) {
    return -1;
  }
  if (date1 < date2) {
    return 1;
  }
  return 0;
}
const sortedDives = computed(() =>  Object.values(dives.value).sort((a, b) => compareDates(a.diveStart, b.diveStart)));
</script>
<template>
    <div
      v-if="Object.values(dives).length < 1 && !isConnected"
      class="center centered"
    >
      <WebpImage/>
    </div>
    <div class="dives">
      <span
        v-for="dive in sortedDives"
        :key="dive.id"
      >
        <RouterLink
          v-if="dive.isDownloaded"
          :to="`/dive/${dive.id}`"
        >
          <DiveCard :dive="dive" />
        </RouterLink>
        <DiveCard
          v-else
          :dive="dive"
          @click="diveCardClicked(dive)"
        />
      </span>
    </div>
</template>

<style scoped>
  a {
    text-decoration: none;
  }
  .dives {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
</style>