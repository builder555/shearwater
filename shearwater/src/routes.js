import { createRouter, createWebHashHistory } from 'vue-router';

import HomeView from './views/HomeView.vue';
import BluetoothDisabledView from './views/BluetoothDisabledView.vue';
import DiveView from './views/DiveView.vue';

import { checkBluetoothEnabled } from './device/ble';

const routes = [
  { path: '/', component: HomeView },
  { path: '/bluetooth-disabled', component: BluetoothDisabledView },
  { path: '/dive/:id', component: DiveView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const isBtEnabled = await checkBluetoothEnabled();
  if (to.path === '/' && !isBtEnabled) {
    return next('/bluetooth-disabled');
  } else if (to.path === '/bluetooth-disabled' && isBtEnabled) {
    return next('/');
  }
  next();
});

export { router };
