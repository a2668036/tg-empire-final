import { createApp } from 'vue';
import ProfileApp from './ProfileApp.vue';
import { initWebAppSdk } from '../../utils/webAppSdk';

// 初始化Telegram WebApp SDK
initWebAppSdk();

// 创建并挂载Vue应用
const app = createApp(ProfileApp);
app.mount('#app'); 