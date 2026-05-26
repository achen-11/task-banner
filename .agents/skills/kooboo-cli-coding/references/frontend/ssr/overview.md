# SSR 前端概览

scope: cli-only

SSR 路线在 Page / Layout / View 中使用 Kooboo 模板语法和服务端脚本，由 Kooboo 服务端渲染 HTML。适用于需要 SEO 的公开内容页。

## 文件位置

| 资源 | 路径 |
| --- | --- |
| Layout | `src/layout/**/*.html` |
| Page | `src/page/**/*.html` |
| View | `src/view/**/*.html` |
| 页面级脚本 | `src/pagescript/**/*.ts` |
| 前端 JS | `src/js/**/*.js` |
| 前端 CSS | `src/css/**/*.css` |

## Page 基本结构

```html
<!-- @k-url /about -->
<layout id="main">
  <placeholder id="main">
    <view id="site/header"></view>
    <main>...</main>
    <view id="site/footer"></view>
  </placeholder>
</layout>
```

## View 引用

本地使用斜杠路径 id，CLI 同步时转换为点路径：

```html
<view id="site/common/header"></view>
```

对应文件：`src/view/site/common/header.html`

## 服务端取数

**默认不用 `<k-data>`。** 使用 `<script env="server">` 在模板中执行 KScript 取数：

```html
<script env="server">
  var items = k.DB.sqlite.query("select * from products limit 10");
</script>
<ul k-for="item in items">
  <li>{{ item.name }}</li>
</ul>
```

`k.xxx` API 用法见 `references/backend/`；从官方 kooboo-coding 移植模板语法文档时，须移除 k-data 相关段落。

## 模板语法

模板绑定（`k-if`、`k-for`、`{{ }}`、`env="server"` 等）详细规范待从官方 `template-binding-syntax.md` 移植并 CLI 化。移植前请先对照项目已有 Page / View 写法。

可参考官方路径：

`kooboo-coding/references/Frontend/template-binding-syntax.md`

## Script 与 Style 公开 URL

```js
// @k-url /app.js
```

```css
/* @k-url /app.css */
```

## 同步

编辑本地文件后：

```bash
kb push src/page/about.html
kb push src/view/site/common/header.html
```

## CLI 差异（相对官方 kooboo-coding）

- 不使用 `<k-data>` 作为默认 SSR 取数方式
- 创建/更新对象 = 编辑 `src/` 下文件 + `kb push`
- 不调用 `read_object_text` / `create_view` 等 AI Chat API
