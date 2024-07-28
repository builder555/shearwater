<script setup>
import DiveCard from '@/components/dive-card.vue';
import WebpImage from '@/components/webp-image.vue';
import { useMainStore } from '@/store';
import { storeToRefs } from 'pinia';

const store = useMainStore();
const { diveCardClicked } = store;
const { dives, isConnected } = storeToRefs(store);

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
        v-for="(dive, id) in dives"
        :key="id"
      >
        <RouterLink
          v-if="dive.isDownloaded"
          :to="`/dive/${id}`"
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