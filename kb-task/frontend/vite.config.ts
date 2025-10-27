import { fileURLToPath, URL } from 'node:url'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 自定义插件：在 index.html 添加 @k-url 注释和服务端脚本，并处理 JS 文件中的路径
function addKoobooUrlPlugin(): Plugin {
  return {
    name: 'add-kooboo-url',
    apply: 'build',
    closeBundle() {
      const htmlPath = path.resolve(__dirname, '../src/index.html')
      const jsDir = path.resolve(__dirname, '../src/js')

      // 1. 处理 HTML 文件
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf-8')

        // 1.1 在 HTML 顶部添加 @k-url 注释
        if (!html.includes('@k-url')) {
          html = '<!-- @k-url / -->\n' + html
          console.log('✅ Added @k-url meta to index.html')
        }

        // 1.2 在 <title> 标签后添加服务端脚本
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

        // 1.3 移除 HTML 中 script 和 link 标签的 /js/ 和 /css/ 路径前缀
        html = html.replace(/src="\/js\//g, 'src="/')
        html = html.replace(/src='\/js\//g, "src='/")
        html = html.replace(/href="\/css\//g, 'href="/')
        html = html.replace(/href='\/css\//g, "href='/")

        fs.writeFileSync(htmlPath, html, 'utf-8')
        console.log('✅ Modified HTML paths to remove /js/ and /css/ prefix')
      }

      // 2. 处理所有 JS 文件中的动态导入路径
      if (fs.existsSync(jsDir)) {
        const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'))

        jsFiles.forEach(file => {
          const filePath = path.join(jsDir, file)
          let content = fs.readFileSync(filePath, 'utf-8')

          // 替换 JS 代码中的 "js/ 和 "css/ 路径
          const originalContent = content
          content = content.replace(/"js\//g, '"')
          content = content.replace(/'js\//g, "'")
          content = content.replace(/"css\//g, '"')
          content = content.replace(/'css\//g, "'")

          // 只有内容发生变化时才写回文件
          if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf-8')
          }
        })

        console.log(`✅ Modified ${jsFiles.length} JS files to remove js/ and css/ path prefixes`)
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
        // JS 文件输出到 js 目录
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        // 将 CSS 文件输出到 css 目录
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
