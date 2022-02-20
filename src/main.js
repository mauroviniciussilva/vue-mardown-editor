import { createApp } from 'vue';
import App from './App.vue';
import VueMarkdownPlugin from './plugin';
import '@mdi/font/css/materialdesignicons.css';

const app = createApp(App);
app.use(VueMarkdownPlugin);

app.mount('#app');
