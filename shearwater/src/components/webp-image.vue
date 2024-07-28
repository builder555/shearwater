<script setup>
import { ref, onMounted } from 'vue';
const props = defineProps({ webpUrl: String, altUrl: String });

function checkWebPSupport(callback) {
  var webP = new Image();
  webP.onload = webP.onerror = function () {
    callback(webP.height === 2);
  };
  webP.src =
    'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
}
const image = ref('');
import webpImage from '@/assets/perdix2.webp';
import altImage from '@/assets/perdix2.png';

onMounted(() => {
  checkWebPSupport(function (isSupported) {
    if (isSupported) {
      image.value = webpImage;
    } else {
      image.value = altImage;
    }
  });
});
</script>
<template>
  <img :src="image" />
</template>
<style scoped>
img {
  width: 40%;
  opacity: 0.8;
}
@media screen and (max-width: 600px) {
  img {
    width: 80%;
  }
}
</style>
