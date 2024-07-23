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
      <WebpImage
        webpUrl="@/assets/perdix2.webp"
        altUrl="@/assets/perdix2.png"
      />
    </div>
    <div class="dives">
      <DiveCard 
        v-for="(dive, id) in dives"
        :key="id"
        :dive="dive"
        @click="diveCardClicked(dive)"
      />
    </div>
</template>

<style scoped>
  .dives {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
</style>