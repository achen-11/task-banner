# 故障分诊

scope: cli-only

当构建失败、同步失败、页面 5xx、或用户明确表示「不对 / 坏了」时，在下结论或大范围改代码前先分诊。

## 分诊清单

1. **确认错误范围** — 是本地编译、kb push、还是远端运行时报错？
2. **读准确错误信息** — CLI 输出、浏览器控制台、网络响应
3. **对照最近改动** — 本轮修改了哪些 `src/` 文件？
4. **跑 Preflight** — `node scripts/preflight-scan.js --root .` 扫描本轮 artifacts
5. **对照本地模式** — `rg` 搜索项目中类似功能的已有实现

## 常见红线

- 臆造 `k.req.services`、`k.request.services` 等不存在 API
- API 文件缺少 `// @k-url`
- Page 缺少 `<!-- @k-url -->`
- 用 Express/Koa 习惯写 Kooboo API handler
- view id 使用点路径而非斜杠路径（本地写法）
- 未经确认执行 `kb sync` 覆盖远端

## CLI 特有检查

```bash
# 类型定义是否过期
kb pull type

# 聚焦查看改动文件
git diff -- src/

# 窄范围重推
kb push src/path/to/changed/file
```

## 与官方 debug.md 的关系

官方 `kooboo-coding/references/debug.md` 面向 Kooboo AI Chat 运行时，可参考其分诊思路，但排错动作改为本地文件 + CLI 命令。

## 仍无法解决时

向用户报告：已观察到的现象、已排除的原因、最可能的阻塞点、建议的下一步（如需用户提供远端日志或具体路由）。
