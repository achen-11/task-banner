# API 开发规范 (v2)

## 1. 环境配置

- **语言:** JavaScript/TypeScript (Kooboo 自定义运行时)
- **核心模块:** `k.api`, `k.DB.sqlite`, `k.request`, `k.response`, `k.logger`, `k.file`
- **数据库:** SQLite

---

## 2. API 路由定义

### 2.1 基础路由结构

每个 API 文件包含一个顶级 API 处理器:

```javascript
// 文件: /api/users/list
k.api.get(() => {
  // 使用 k.request 获取查询参数
  const query = k.request.queryString
  const page = parseInt(query?.page) || 1;
  const size = parseInt(query?.size) || 20;
  const keyword = query.keyword || '';

  // 列表逻辑
});

// 文件: /api/users/create
k.api.post(() => {
  // 使用 k.request 获取 body 数据
  const body = JSON.parse(k.request.body);

  // 创建逻辑
});
```

### 2.2 RESTful 路径参数

对于带有动态路径段的 RESTful API（如 `/api/user/{id}`），使用 `k.request.get()` 获取路径参数:

```javascript
// 文件: /api/user/{id}
k.api.get(() => {
  // 使用 k.request.get() 获取路径参数
  const userId = k.request.get('id');

  const user = k.DB.sqlite.get(
    'SELECT * FROM users WHERE id = @id LIMIT 1',
    { id: userId }
  );

  return { success: true, data: user };
});

// 文件: /api/user/{id}/activate
k.api.put(() => {
  // 获取路径参数
  const userId = k.request.get('id');

  k.DB.sqlite.execute(
    'UPDATE users SET status = @status WHERE id = @id',
    { id: userId, status: 'active' }
  );

  return { success: true, message: '用户已激活' };
});
```

---

## 3. 参数处理

### 3.1 参数获取方法

| 参数来源         | 获取方法                         | 示例                                                   | 使用场景               |
| ---------------- | -------------------------------- | ------------------------------------------------------ | ---------------------- |
| Query 参数       | `k.request.queryString.get(key)` | `const page = k.request.queryString.get('page')`       | GET 请求               |
| Query 参数(全部) | `k.request.queryString`          | `const query = k.request.queryString`                  | 获取所有查询参数       |
| Body (JSON)      | `JSON.parse(k.request.body)`     | `const body = JSON.parse(k.request.body)`              | POST/PUT 请求          |
| 表单数据         | `k.request.form.get(key)`        | `const name = k.request.form.get('name')`              | 表单提交               |
| 路径参数         | `k.request.get(key)`             | `const id = k.request.get('id')`                       | RESTful 路径如 `/{id}` |
| 请求头           | `k.request.headers.get(key)`     | `const token = k.request.headers.get('Authorization')` | 认证令牌、元数据       |

### 3.2 参数类型转换

始终将查询参数转换为适当的类型:

```javascript
k.api.get(() => {
  // 从 k.request 获取参数
  const query = k.request.queryString;
  const page = parseInt(query?.page) || 1;
  const size = parseInt(query?.size) || 20;
  const keyword = query?.keyword || '';

  // 去除字符串空格
  const trimmedKeyword = keyword.trim();

  // ...
});
```

### 3.3 参数验证

```javascript
k.api.post(() => {
  // 获取 body 数据
  const body = JSON.parse(k.request.body);

  // 必填字段验证
  if (!body.username || !body.email) {
    k.response.json({
      success: false,
      error: '缺少必填字段',
      required: ['username', 'email']
    });
    return k.api.httpCode(400);
  }

  // 类型验证
  if (typeof body.age !== 'number' || body.age < 0) {
    k.response.json({
      success: false,
      error: '年龄值无效'
    });
    return k.api.httpCode(400);
  }

  // ...
});
```

### 3.4 布尔类型字段处理

⚠️ **重要：** 对于"状态"类型的字段（如 `enabled`、`active`、`isPublished` 等），在实现 API 之前，必须先确认前端传递的数据类型。

#### 3.4.1 确认字段类型

**实现步骤：**
1. **阅读页面代码**（如果有），查看前端传递的值类型
2. **检查字段值**：确认是字符串（如 `'active'`, `'disabled'`）还是布尔类型（`true`, `false`）

#### 3.4.2 字符串类型处理

如果前端传递的是**字符串类型**（如 `'active'`, `'inactive'`）：

```javascript
k.api.post(() => {
  const body = JSON.parse(k.request.body);

  // 直接使用字符串值
  k.DB.sqlite.execute(`
    INSERT INTO users (username, status)
    VALUES (@username, @status)
  `, {
    username: body.username,
    status: body.status  // 'active' 或 'inactive'
  });

  return { success: true };
});
```

#### 3.4.3 布尔类型处理

如果前端传递的是**布尔类型**（`true`, `false`）：

**⚠️ SQLite 存储特性：** SQLite 会将布尔值自动转换为整数（`true` → `1`, `false` → `0`）

**正确做法 - 在 SQL 执行前进行类型转换：**

```javascript
// ✅ 存入数据库：布尔 → 整数
k.api.post(() => {
  const body = JSON.parse(k.request.body);

  // 将布尔值转为整数 0 或 1
  const enabled = body.enabled ? 1 : 0;

  k.DB.sqlite.execute(`
    INSERT INTO users (username, enabled)
    VALUES (@username, @enabled)
  `, {
    username: body.username,
    enabled: enabled  // 存入 0 或 1
  });

  return { success: true };
});

// ✅ 从数据库读取：整数 → 布尔
k.api.get(() => {
  const userId = k.request.get('id');

  const user = k.DB.sqlite.get(
    'SELECT id, username, enabled FROM users WHERE id = @id',
    { id: userId }
  );

  if (user) {
    // 将整数 0/1 转换为布尔值
    user.enabled = user.enabled === 1;
  }

  return { success: true, data: user };
});

// ✅ 列表查询：整数 → 布尔
k.api.get(() => {
  const items = k.DB.sqlite.query(
    'SELECT id, username, enabled FROM users ORDER BY id DESC'
  );

  // 批量转换：将所有 enabled 字段从整数转为布尔
  items.forEach(item => {
    item.enabled = item.enabled === 1;
  });

  return { success: true, items };
});
```

**错误做法 - 不要直接传布尔值：**

```javascript
// ❌ 错误 - 直接传布尔值，可能导致不一致
k.DB.sqlite.execute(`
  INSERT INTO users (username, enabled)
  VALUES (@username, @enabled)
`, {
  username: body.username,
  enabled: body.enabled  // 不要这样做！
});
```

#### 3.4.4 更新操作的布尔处理

```javascript
// ✅ 更新时也要做类型转换
k.api.put(() => {
  const userId = k.request.get('id');
  const body = JSON.parse(k.request.body);

  // 布尔 → 整数
  const enabled = body.enabled ? 1 : 0;

  k.DB.sqlite.execute(`
    UPDATE users
    SET enabled = @enabled, updated_at = @updatedAt
    WHERE id = @id
  `, {
    id: userId,
    enabled: enabled,  // 存入 0 或 1
    updatedAt: Date.now()
  });

  return { success: true };
});
```

---

## 4. 数据库操作

### 4.1 核心 SQL 方法

| 操作           | 方法                               | 说明               |
| -------------- | ---------------------------------- | ------------------ |
| 查询列表       | `k.DB.sqlite.query(sql, params)`   | 返回对象数组       |
| 查询单条       | `k.DB.sqlite.get(sql, params)`     | 返回单条记录       |
| 执行操作       | `k.DB.sqlite.execute(sql, params)` | 执行 INSERT/UPDATE/DELETE |
| 获取单个值     | `k.DB.sqlite.value(sql, params)`   | 返回单个标量值     |

### 4.2 SQL 安全 - 命名参数

**始终使用命名参数 (@param) 防止 SQL 注入:**

```javascript
// ❌ 危险 - SQL 注入风险
const userId = k.request.queryString.get('id');
const sql = `SELECT * FROM users WHERE id = ${userId}`;  // 永远不要这样做
const sql2 = `SELECT * FROM users WHERE id = '${userId}'`;  // 永远不要这样做

// ✅ 安全 - 使用命名参数
const userId = k.request.queryString.get('id');
const sql = `SELECT * FROM users WHERE id = @userId`;
const result = k.DB.sqlite.query(sql, { userId: userId });
```

### 4.3 常见查询模式

**查询列表:**
```javascript
const users = k.DB.sqlite.query(`
  SELECT * FROM users
  WHERE enabled = 1
  ORDER BY created_at DESC
`, params);
```

**查询单条记录:**
```javascript
const user = k.DB.sqlite.get(
  'SELECT * FROM users WHERE id = @id',
  { id: userId }
);
```

**获取统计值:**
```javascript
const total = k.DB.sqlite.value(
  'SELECT COUNT(*) FROM users WHERE status = @status',
  { status: 'active' }
);
```

**插入数据:**
```javascript
k.DB.sqlite.execute(`
  INSERT INTO users (username, email, created_at)
  VALUES (@username, @email, @createdAt)
`, {
  username: body.username,
  email: body.email,
  createdAt: Date.now()
});
```

**更新数据:**
```javascript
k.DB.sqlite.execute(`
  UPDATE users
  SET status = @status, updated_at = @updatedAt
  WHERE id = @id
`, {
  id: userId,
  status: 'active',
  updatedAt: Date.now()
});
```

**删除数据:**
```javascript
k.DB.sqlite.execute(
  'DELETE FROM users WHERE id = @id',
  { id: userId }
);
```

---

## 5. 响应处理

### 5.1 统一响应格式

**成功响应:**
```javascript
// 单条数据
return {
  success: true,
  data: { id: 1, name: 'John' }
};

// 列表响应
return {
  success: true,
  items: [...],
  total: 100,
  page: 1,
  size: 20
};
```

**错误响应:**
```javascript
return {
  success: false,
  error: '错误信息',
  code: 'ERROR_CODE'  // 可选的错误码
};
```

### 5.2 HTTP 状态码

**使用 k.api.httpCode() 返回错误状态:**

```javascript
// 错误请求
k.response.json({
  success: false,
  error: '参数无效'
});
return k.api.httpCode(400);

// 未找到
k.response.json({
  success: false,
  error: '资源不存在'
});
return k.api.httpCode(404);

// 服务器错误
k.response.json({
  success: false,
  error: '内部服务器错误'
});
return k.api.httpCode(500);
```

### 5.3 错误处理模式

```javascript
k.api.post(() => {
  try {
    // 获取 body 数据
    const body = JSON.parse(k.request.body);

    // 验证
    if (!body.username) {
      k.response.json({
        success: false,
        error: '用户名为必填项'
      });
      return k.api.httpCode(400);
    }

    // 业务逻辑
    const result = k.DB.sqlite.query(/* ... */);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    // 记录错误日志
    // k.logger.error(category: string, message: string)
    // 第一个参数是分类，第二个参数必须是字符串，需要使用 error.toString() 或 JSON.stringify()
    k.logger.error('API操作', error.toString());

    k.response.json({
      success: false,
      error: '操作失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

---

## 6. 分页与过滤

### 6.1 标准分页模式

所有列表端点必须支持分页:

```javascript
k.api.get(() => {
  // 获取并解析查询参数
  const query = k.request.queryString;
  const page = parseInt(query?.page) || 1;
  const size = parseInt(query?.size) || 20;
  const keyword = query?.keyword || '';

  // 构建查询
  let whereClause = '';
  let params = {
    limit: size,
    offset: (page - 1) * size
  };

  if (keyword) {
    whereClause = 'WHERE name LIKE @keyword OR description LIKE @keyword';
    params.keyword = `%${keyword}%`;
  }

  // 计算总数
  const total = k.DB.sqlite.value(
    `SELECT COUNT(*) FROM products ${whereClause}`,
    params
  ) || 0;

  // 获取分页数据
  const items = k.DB.sqlite.query(`
    SELECT * FROM products
    ${whereClause}
    ORDER BY id DESC
    LIMIT @limit OFFSET @offset
  `, params);

  return {
    success: true,
    items,
    total,
    page,
    size
  };
});
```

### 6.2 多字段搜索

```javascript
if (keyword) {
  whereClause = `
    WHERE username LIKE @keyword
       OR email LIKE @keyword
       OR phone LIKE @keyword
  `;
  params.keyword = `%${keyword}%`;
}
```

---

## 7. **最佳实践检查清单**

### ⚠️ 最重要规则（必须严格遵守）

- [ ] **🔴 数据字段对齐（最关键）：前端和数据库字段可以不同，但必须了解清楚字段映射关系，在 SQL SELECT 中使用 `as` 做好字段转换，确保 API 返回的字段名与前端期望完全一致。这是前后端和数据库能否正确连接的关键！**
- [ ] **🔴 布尔类型字段处理：对于"状态"类型字段（如 enabled、active 等），必须先阅读页面代码确认前端传递的数据类型。如果是布尔类型，在 SQL 执行前必须转换为整数（`true` → `1`, `false` → `0`），从数据库读取后也要转换回布尔类型。**

### 其他重要规则

- [ ] 始终在 SQL 查询中使用命名参数 (`@param`)
- [ ] 根据场景使用正确的 SQL 方法：`query`(列表)、`get`(单条)、`execute`(执行)、`value`(单值)
- [ ] 将查询参数转换为适当类型 (parseInt, trim 等)
- [ ] 在处理前验证所有必填字段
- [ ] 返回统一响应格式 (`success`, `data`/`items`, `error`)
- [ ] 使用 `k.api.httpCode()` 设置适当的 HTTP 状态码
- [ ] 为所有列表端点实现分页
- [ ] 用 try-catch 包裹操作
- [ ] 在 catch 块中使用 `k.logger.error()` 记录异常日志
- [ ] 创建前检查重复记录
- [ ] 更新/删除前验证资源是否存在
- [ ] 使用 `k.request.get('param')` 获取 RESTful 路径参数 (如 `/{id}`)
- [ ] 文件上传使用 `k.request.files`
- [ ] 文件上传前验证文件是否存在，避免空文件上传
