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
      const htmlPath = path.resolve(__dirname, '../src/index.html')

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

    <!-- 服务端脚本：检查登录状态并注入用户信息 -->
    <script env="server" type="module">
      import { getUserInfo } from './Services.user'

      // 1. 检查登录状态
      if (!k.account.isLogin) {
        k.response.redirect('/_Admin/login?permission=u&returnurl=/')
        return
      }

      // 2. 获取当前登录用户
      const username = k.account.user.current.userName
      const userInfo = getUserInfo(username)

      // 3. 注入用户信息到客户端
      k.utils.clientJS.setVariable('__USER_INFO__', userInfo)
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
      // 代理所有 /api 开头的请求
      '/api': {
        target: 'https://ai_task_manage.redev.cn',
        changeOrigin: true,
        secure: false,
        // 不重写路径，保持 /api 前缀
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: '../src',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // 所有文件输出到根目录（不使用子目录）
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return '[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
