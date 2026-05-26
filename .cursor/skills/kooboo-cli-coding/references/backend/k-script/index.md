# KScript 模块索引

scope: shared（待从官方 kooboo-coding 移植）

KScript 是 Kooboo 服务端脚本运行时。CLI 项目中 API、CodeBlock、PageScript 均使用 KScript 语法。

## 使用原则

1. **`k.xxx` 必先查文档** — 禁止臆造方法名
2. **先读项目 `kooboo.d.ts`** — 获取当前站点可用类型
3. **与官方文档一致的部分** — `k.request`、`k.response`、`k.DB` 等核心 API 与 Kooboo 后台环境相同

## 模块索引（待扩充）

| 模块 | 说明 | 状态 |
| --- | --- | --- |
| core/request | 请求对象 | 待移植 |
| core/response | 响应与跳转 | 待移植 |
| core/api | API 辅助 | 待移植 |
| DB/sqlite | SQLite 查询 | 待移植 |
| commerce/* | 电商 | 按需移植 |
| content/* | 内容管理 | 按需移植 |

官方参考路径：`kooboo-coding/references/K-Script/`

## CLI 差异

- 代码位于 `src/api/`、`src/code/`、`src/pagescript/`，非 Kooboo 后台对象
- 编辑文件后需 `kb push` 同步
- 不使用 Kooboo AI Chat 的 `read_object_text`

## 贡献

从官方移植单个模块文档时，请遵循 `CONTRIBUTING.md` 中的 checklist。
