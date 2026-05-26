import { fileURLToPath, URL } from 'node:url'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 自定义插件：在 index.html 添加 @k-url 注释和服务端脚本
function addKoobooUrlPlugin(): Plugin {
  return {
    name: 'add-kooboo-url',
    apply: 'build',
    closeBundle() {
      const htmlPath = path.resolve(__dirname, 'dist/index.html')

      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf-8')

        // 1. 在 HTML 顶部添加 @k-url 注释
        if (!html.includes('@k-url')) {
          html = '<!-- @k-url / -->\n' + html
          console.log('✅ Added @k-url meta to index.html')
        }

        // 2. 在 <title> 标签后添加服务端脚本
        if (!html.includes('env="server"')) {
          const serverScript = `

    <!-- 服务端脚本：JWT / Kooboo 登录态注入用户信息 -->
    <script env="server" type="module">
      import { getCurrentAuthUser } from './Services.auth'

      const userInfo = getCurrentAuthUser()
      if (userInfo) {
        k.utils.clientJS.setVariable('__USER_INFO__', userInfo)
      }
    </script>`

          html = html.replace('</title>', '</title>' + serverScript)
          console.log('✅ Added server-side authentication script')
        }

        fs.writeFileSync(htmlPath, html, 'utf-8')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    addKoobooUrlPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 开发服务器配置
  server: {
    port: 5173,
    proxy: {
      // 代理所有 /api 开头的请求（包括 WebSocket）
      '/api': {
        target: 'https://ai_task_v2.redev.cn',
        changeOrigin: true,
        secure: false,
        ws: true, // 启用 WebSocket 代理
        // 不重写路径，保持 /api 前缀
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/_api/v2': {
        target: 'https://ai_task_v2.redev.cn',
        changeOrigin: true,
        secure: false,
        ws: true, // 启用 WebSocket 代理
        // 不重写路径，保持 /api 前缀
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      // 代理所有 /__kb/kfile 开头的请求到远程服务器
      '/__kb/kfile': {
        target: 'https://ai_task_v2.redev.cn',
        changeOrigin: true,
        secure: false,
      },
      '/__logout__': {
        target: 'https://ai_task_v2.redev.cn',
        changeOrigin: true,
        secure: false,
      },
      '/__kbAuthCallback': {
        target: 'https://ai_task_v2.redev.cn',
        changeOrigin: true,
        secure: false,
      },
      '/__kbAuthResult': {
        target: 'https://ai_task_v2.redev.cn',
        changeOrigin: true,
        secure: false,
      },
      '/_Admin': {
        target: 'https://ai_task_v2.redev.cn',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.names?.[0] || assetInfo.name || ''
          if (info.endsWith('.css')) {
            return '[name].css'
          }
          return '[name][extname]'
        }
      }
    }
  }
})
