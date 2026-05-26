# 项目检查

scope: cli-only

打开一个陌生的 Kooboo CLI 站点时，先识别本地实际存在什么，不要直接套模板。

## 快速检查

优先使用聚焦命令：

```bash
pwd
cat package.json
sed -n '1,220p' README.md
cat tsconfig.json
find src -maxdepth 3 -type d | sort
rg --files src | sed -n '1,220p'
```

检查 `.env` 时只确认必要 key 是否存在，不要在回复里打印账号、密码、token 等敏感值。

常见项目标记：

- `package.json` 里有类似 `dev: kb sync` 的脚本。
- `.env` / `.env.example` 里有 `KOOBOO_SITE_URL`、`KOOBOO_USERNAME`、`KOOBOO_PASSWORD`。
- `kooboo.d.ts` 提供全局 `k` 对象类型。
- `tsconfig.json` 里有 `code/*`、`api/*`、`module/*` 等本地 alias。
- 存在 `src` 资源目录。
- 可选：项目根目录 `mcp-tools/` 存放站点 MCP 工具。
- 可选：`.kooboo-ai/README.md` 描述本项目 spec。

## 先读本地模式

实现前，先搜索相近写法：

```bash
rg -n "@k-url|k\\.api|successResponse|failResponse|from ['\\\"]code/|from ['\\\"]module/" src
rg -n "export const meta|k\\.request\\.body|k\\.response" mcp-tools 2>/dev/null || true
ls mcp-tools 2>/dev/null || true
rg -n "<view|<layout|@k-url|new Vue|createApp|axios|fetch" src/page src/layout src/view src/js
```

沿用当前项目的命名、大小写、helper、响应格式和前端风格。旧模板文档可能提到 `Api`、`CodeBlock` 这类大写目录；当前 CLI 项目以小写资源目录为准。

## 工作边界

- 不要假设项目是新模板。实际站点可能已有自定义路由、模块、helper 和外部集成。
- 不要引入 k-data，除非用户或 `.kooboo-ai/specs/` 明确要求。
- 不要用 Express/Koa 习惯臆造 Kooboo API；先对照本地例子或 `kooboo.d.ts`。
- 调试用户报告的问题时，优先复现用户给出的准确路由和 payload。
