参照现有的 kb-task
1. frontend (其实应该是在 back-end 中的)
   1. 是前端项目, 包含前端项目, tailwindcss3
   2. vite 需要配置打包目录, 然后配合脚本, build 时移动到指定的 js 和 page 和 css 目录
2. backend(其实就是标准的 kooboo-cli 项目)
   1. 另外, 必须包含 k_sqlite 模块
3. .claude-notify.sh 用于发送通知
4. docs 用于存放一些文档 
   1. 核心文档: 
      1. docs/k-script-server-development-guide.md
      2. docs/K_SQLITE_ORM_文档.md
--- 假设新建一个订餐系统为例:
那么应该有
order-food 文件夹
包含(1.frontend 2.kooboo-cli 创建的其他文件....)