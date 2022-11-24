import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar, Notify } from 'quasar';
import iconSet from 'quasar/icon-set/mdi-v6';
import '@quasar/extras/mdi-v6/mdi-v6.css';
import App from './App.vue';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import minMax from 'dayjs/plugin/minMax';

dayjs.extend(relativeTime);
dayjs.extend(minMax);

import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

import router from './router';
import VNetworkGraph from 'v-network-graph';

import crosscutting from '@/crosscutting';

import './styles.scss';

const app = createApp(App);

app.use(createPinia());

app.use(router);
app.use(Quasar, {
  plugins: {
    Notify,
  }, // import Quasar plugins and add here
  config: {
    notify: {
      position: 'top-right',
    },
  },
  iconSet: iconSet,
});
app.use(VNetworkGraph);
app.use(crosscutting);

app.mount('#app');
