import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initAuth } from './utils/auth'

// 初始化认证状态（开发模式自动登录）
initAuth()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
