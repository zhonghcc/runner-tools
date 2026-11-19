import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'
import { refreshMe } from './stores/auth'

createApp(App).use(router).mount('#app')
// 后台确认一次登录状态，不阻塞页面
refreshMe()
