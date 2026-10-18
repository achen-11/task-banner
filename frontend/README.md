# Task Banner 前端

Vue 3 + Vite SPA，使用 Hash 路由、Pinia、Element Plus 和 Tailwind CSS。项目说明见[根 README](../README.md)，详细约定见[前端规范](../.kooboo-ai/specs/frontend.md)。

在本目录执行：

```bash
pnpm install
pnpm dev         # 启动 Vite；/api 等请求代理到 Kooboo
pnpm build-only  # 仅构建到 dist/，不运行全量类型检查
```

根目录 `pnpm build` 会执行前端类型检查与构建，再将产物复制到 Kooboo 资源目录。只有显式推送或运行中的 `kb sync` 才会同步远端。

API 基址当前为 `/`，见 `src/utils/request.ts`；开发代理目标在 `vite.config.ts` 配置。请求使用 `X-Task-Banner-Token`，token 由认证工具从内存、localStorage 或 Cookie 获取。
