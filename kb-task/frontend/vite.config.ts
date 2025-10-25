import { fileURLToPath, URL } from 'node:url'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 自定义插件：在 index.html 添加 @k-url 注释、服务端脚本，并修改 JS 引用路径
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

        // 3. 移除 script 和 link 标签中的 /js/ 和 /css/ 路径前缀
        html = html.replace(/src="\/js\//g, 'src="/')
        html = html.replace(/src='\/js\//g, "src='/")
        html = html.replace(/href="\/css\//g, 'href="/')
        html = html.replace(/href='\/css\//g, "href='/")

        fs.writeFileSync(htmlPath, html, 'utf-8')
        console.log('✅ Modified script paths to remove /js/ prefix')
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
