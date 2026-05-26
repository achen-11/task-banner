# CLI 工作流

Kooboo CLI 完整命令是 `kooboo-cli`，日常通常使用缩写 `kb`。

## 常用命令

```bash
kb --help
kb config
kb pull
kb pull type
kb pull src/api/v1/apps/auth.ts
kb pull mcp-tools
kb pull mcp-tools/weather.ts
kb push
kb push src/api/v1/apps/auth.ts
kb push mcp-tools/weather.ts
kb push --git
kb push --git --staged
kb sync
```

常见项目脚本：

```bash
pnpm install
pnpm dev
```

`pnpm dev` 往往等价于运行 `kb sync`，它会监听本地文件变化并同步到配置的远端站点。把它当成会修改远端资源的命令，而不是普通本地 dev server。

## 凭据与配置

CLI 优先读取当前项目 `.env`，再读取全局配置。常用必需值：

```env
KOOBOO_SITE_URL=https://example.com
KOOBOO_USERNAME=...
KOOBOO_PASSWORD=...
```

需要时用 `kb config` 查看或设置配置。不要在最终回复里输出凭据。

## 拉取

只需要刷新 `kooboo.d.ts` 时，使用：

```bash
kb pull type
```

优先使用路径目标：

```bash
kb pull src/api
kb pull src/code/services
kb pull images/gallery
kb pull mcp-tools
kb pull mcp-tools/weather.ts
```

也存在旧式资源模式：

```bash
kb pull api
kb pull codeblock
kb pull page
```

## 推送

聚焦改动优先窄范围推送：

```bash
kb push src/api/v1/apps/auth.ts
kb push src/css/app.main.css
kb push src/view/app/common/header.html
kb push mcp-tools/weather.ts
kb push mcp-tools
```

只有用户要求或流程确实需要时，才使用 Git 变更推送：

```bash
kb push --git
kb push --git --staged
kb push --git --commit abc123
```

`push` 和 `sync` 都会登录远端站点并修改远端资源。如果用户只是要求本地编辑或解释，执行前要确认是否真的需要同步。

## MCP Tools

站点 MCP 工具位于项目根目录 `mcp-tools/*.ts`，由 `kb sync` 监听。格式、meta 约定与常见错误见 `mcp-tools.md`。
