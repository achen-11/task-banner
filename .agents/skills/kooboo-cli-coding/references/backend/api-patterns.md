# API 与 CodeBlock 模式

scope: cli-only

优先参考本项目已有例子。Kooboo API 和 CodeBlock 是由 Kooboo CLI 编译的 KScript 风格 TypeScript。

## API 文件

每个 API 文件顶部都需要 URL 注释：

```ts
// @k-url /api/v1/apps/auth/{action}
```

常见结构：

```ts
import { successResponse, failResponse } from "code/utils/utils";
import { login } from "code/services/auth";

k.api.post("login", (body: { email: string; password: string }) => {
  try {
    return successResponse(login(body));
  } catch (error: any) {
    return failResponse(error?.message || "服务器错误");
  }
});
```

常用 `k.api.get("action", (...args) => {})` 和 `k.api.post("action", (body) => {})`。不要套 Express/Koa 的 `ctx`、`req`、`res`、`params` 写法；除非本项目已有可靠例子，也不要随意引入 `await`。

## 请求数据

常见访问方式：

- Query string：`k.request.queryString.id`，或使用本地 API 例子里的回调参数。
- Body：`k.api.post` 回调里的 `body` 参数。
- Form 字段：`k.request.form.get(key)`，或项目已有 form helper。
- 文件：`k.request.files`。

## 响应格式

如果项目已有 helper，优先使用：

```ts
successResponse(data, msg)
failResponse(msg, code, data)
```

如果项目已经有统一响应封装，不要手写另一套返回结构。

## CodeBlock 导入

本地导入通常使用 `tsconfig.json` 里的 alias：

```ts
import { appAccount } from "code/models/accounts/appAccount";
import { define, DataTypes } from "module/k_sqlite";
```

`src/code` 里的相对路径也可能被编译成 Kooboo 点路径，但优先沿用项目现有 alias 风格。

## 数据与 SQLite

如果项目使用 `module/k_sqlite`，新增字段或查询前先看已有 model 和 service。Kooboo 表通常已有 `_id`；除非本地 model 这么做，不要额外发明主键。

写原生 SQLite 时，优先使用命名参数：

```ts
k.DB.sqlite.query("select * from products where id = @id", { id });
```

避免使用数组形式的 `?` 参数，除非当前项目已经稳定使用这种写法。

## 同步

```bash
kb push src/api/v1/apps/auth.ts
kb push src/code/services/auth.ts
```
