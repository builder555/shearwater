import { createWebHistory, createRouter } from 'vue-router';

import HomeView from './views/HomeView.vue';
import BluetoothDisabledView from './views/BluetoothDisabledView.vue';

import { checkBluetoothEnabled } from './device/ble';

const routes = [
  { path: '/', component: HomeView },
  { path: '/bluetooth-disabled', component: BluetoothDisabledView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) =>{
    const isBtEnabled = await checkBluetoothEnabled();
    if (to.path === '/' && !isBtEnabled) {
      return next('/bluetooth-disabled');
    }
    if (to.path === '/bluetooth-disabled' && isBtEnabled) {
      return next('/');
    }
    next();
});


export {router};
