# API 示例 (v2)

## 1. 文件上传处理

### 1.1 基础文件上传

**k.request.files 可以获取 FormData 中所有上传的文件**，无论前端使用什么 key 名称（如 `file`、`files`、`avatar` 等）。

```javascript
// 文件: /api/upload
k.api.post(() => {
  try {
    // 获取上传的文件
    const files = k.request.files;

    if (!files || files.length === 0) {
      k.response.json({
        success: false,
        error: '请选择要上传的文件'
      });
      return k.api.httpCode(400);
    }

    const file = files[0];
    const fileName = file.fileName;

    // 写入文件
    const fileInfo = k.file.writeBinary(fileName, file.bytes);

    return {
      success: true,
      data: {
        url: fileInfo.relativeUrl,
        name: fileInfo.fullName,
        size: fileInfo.size,
        stringSize: fileInfo.stringSize
      }
    };

  } catch (error) {
    k.logger.error('文件上传', error.toString());
    k.response.json({
      success: false,
      error: '文件上传失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

### 1.2 文件上传优化（避免重名）

```javascript
// 文件: /api/upload/safe
function getUniqueFilePath(dir, fileName) {
  if (!k.file.exists(`${dir}/${fileName}`)) {
    return `${dir}/${fileName}`;
  }

  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const name = parts.join('.');

  let counter = 1;
  let newFileName = ext ? `${name}(${counter}).${ext}` : `${name}(${counter})`;

  while (k.file.exists(`${dir}/${newFileName}`)) {
    counter++;
    newFileName = ext ? `${name}(${counter}).${ext}` : `${name}(${counter})`;
  }

  return `${dir}/${newFileName}`;
}

k.api.post(() => {
  try {
    const files = k.request.files;

    if (!files || files.length === 0) {
      k.response.json({
        success: false,
        error: '请选择要上传的文件'
      });
      return k.api.httpCode(400);
    }

    const file = files[0];
    const uploadDir = 'uploads'; // 上传目录

    // 获取唯一文件路径（避免重名）
    const uniquePath = getUniqueFilePath(uploadDir, file.fileName);

    // 写入文件
    const fileInfo = k.file.writeBinary(uniquePath, file.bytes);

    return {
      success: true,
      data: {
        url: fileInfo.relativeUrl,
        name: fileInfo.fullName,
        size: fileInfo.size,
        stringSize: fileInfo.stringSize
      }
    };

  } catch (error) {
    k.logger.error('安全文件上传', error.toString());
    k.response.json({
      success: false,
      error: '文件上传失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

### 1.3 前端上传示例

```javascript
// k.request.files
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/upload', {
  method: 'POST',
  body: formData
}).then(res => res.json());

// 多文件上传
const formData2 = new FormData();
for (let i = 0; i < fileInput.files.length; i++) {
  formData2.append('files', fileInput.files[i]);
}

fetch('/api/upload', {
  method: 'POST',
  body: formData2
}).then(res => res.json());
```

---

## 2. 完整 API 示例

### 2.1 列表 API

```javascript
// 文件: /api/users/list
k.api.get(() => {
  // 获取查询参数
  const query = k.request.queryString;
  const page = parseInt(query?.page) || 1;
  const size = parseInt(query?.size) || 20;
  const keyword = query?.keyword || '';
  const status = query?.status || '';

  let whereClause = 'WHERE 1=1';
  let params = { limit: size, offset: (page - 1) * size };

  if (keyword) {
    whereClause += ' AND (username LIKE @keyword OR email LIKE @keyword)';
    params.keyword = `%${keyword}%`;
  }

  if (status) {
    whereClause += ' AND status = @status';
    params.status = status;
  }

  const total = k.DB.sqlite.value(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  ) || 0;

  const items = k.DB.sqlite.query(`
    SELECT
      id,
      username,
      email,
      status,
      created_at as createdAt
    FROM users
    ${whereClause}
    ORDER BY id DESC
    LIMIT @limit OFFSET @offset
  `, params);

  return { success: true, items, total, page, size };
});
```

### 2.2 创建 API

```javascript
// 文件: /api/users/create
k.api.post(() => {
  try {
    // 获取 body 数据
    const body = JSON.parse(k.request.body);

    // 验证
    if (!body.username || !body.email) {
      k.response.json({
        success: false,
        error: '缺少必填字段',
        required: ['username', 'email']
      });
      return k.api.httpCode(400);
    }

    // 检查重复
    const existing = k.DB.sqlite.get(
      'SELECT id FROM users WHERE username = @username',
      { username: body.username }
    );

    if (existing) {
      k.response.json({
        success: false,
        error: '用户名已存在'
      });
      return k.api.httpCode(400);
    }

    // 插入
    k.DB.sqlite.execute(`
      INSERT INTO users (username, email, status, created_at)
      VALUES (@username, @email, @status, @createdAt)
    `, {
      username: body.username,
      email: body.email,
      status: body.status || 'active',
      createdAt: Date.now()
    });

    // 返回创建的用户
    const newUser = k.DB.sqlite.get(
      'SELECT * FROM users WHERE username = @username',
      { username: body.username }
    );

    return { success: true, data: newUser };

  } catch (error) {
    k.logger.error('创建用户', error.toString());
    k.response.json({
      success: false,
      error: '创建用户失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

### 2.3 更新 API (RESTful 路径参数)

```javascript
// 文件: /api/users/{id}
k.api.put(() => {
  try {
    // 获取路径参数
    const userId = k.request.get('id');

    // 获取 body 数据
    const body = JSON.parse(k.request.body);

    // 验证
    if (!userId) {
      k.response.json({
        success: false,
        error: '用户 ID 为必填项'
      });
      return k.api.httpCode(400);
    }

    // 检查是否存在
    const user = k.DB.sqlite.get(
      'SELECT id FROM users WHERE id = @id',
      { id: userId }
    );

    if (!user) {
      k.response.json({
        success: false,
        error: '用户不存在'
      });
      return k.api.httpCode(404);
    }

    // 更新
    k.DB.sqlite.execute(`
      UPDATE users
      SET
        username = @username,
        email = @email,
        status = @status,
        updated_at = @updatedAt
      WHERE id = @id
    `, {
      id: userId,
      username: body.username,
      email: body.email,
      status: body.status,
      updatedAt: Date.now()
    });

    // 返回更新后的用户
    const updated = k.DB.sqlite.get(
      'SELECT * FROM users WHERE id = @id',
      { id: userId }
    );

    return { success: true, data: updated };

  } catch (error) {
    k.logger.error('更新用户', error.toString());
    k.response.json({
      success: false,
      error: '更新用户失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

### 2.4 删除 API (RESTful 路径参数)

```javascript
// 文件: /api/users/{id}
k.api.delete(() => {
  try {
    // 获取路径参数
    const userId = k.request.get('id');

    if (!userId) {
      k.response.json({
        success: false,
        error: '用户 ID 为必填项'
      });
      return k.api.httpCode(400);
    }

    // 检查是否存在
    const user = k.DB.sqlite.get(
      'SELECT id FROM users WHERE id = @id',
      { id: userId }
    );

    if (!user) {
      k.response.json({
        success: false,
        error: '用户不存在'
      });
      return k.api.httpCode(404);
    }

    // 删除
    k.DB.sqlite.execute(
      'DELETE FROM users WHERE id = @id',
      { id: userId }
    );

    return { success: true, message: '用户删除成功' };

  } catch (error) {
    k.logger.error('删除用户', error.toString());
    k.response.json({
      success: false,
      error: '删除用户失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

---

## 3. 布尔类型字段处理示例

### 3.1 创建 - 布尔字段转整数

```javascript
// 文件: /api/products/create
k.api.post(() => {
  try {
    const body = JSON.parse(k.request.body);

    // 验证必填字段
    if (!body.name || !body.price) {
      k.response.json({
        success: false,
        error: '缺少必填字段',
        required: ['name', 'price']
      });
      return k.api.httpCode(400);
    }

    // ✅ 布尔类型转换为整数 0 或 1
    const isPublished = body.isPublished ? 1 : 0;
    const isFeatured = body.isFeatured ? 1 : 0;

    // 插入数据
    k.DB.sqlite.execute(`
      INSERT INTO products (name, price, is_published, is_featured, created_at)
      VALUES (@name, @price, @isPublished, @isFeatured, @createdAt)
    `, {
      name: body.name,
      price: body.price,
      isPublished: isPublished,     // 存入 0 或 1
      isFeatured: isFeatured,       // 存入 0 或 1
      createdAt: Date.now()
    });

    // 返回创建的产品
    const newProduct = k.DB.sqlite.get(
      'SELECT * FROM products WHERE name = @name ORDER BY id DESC LIMIT 1',
      { name: body.name }
    );

    // ✅ 读取时转换回布尔类型
    if (newProduct) {
      newProduct.isPublished = newProduct.is_published === 1;
      newProduct.isFeatured = newProduct.is_featured === 1;
    }

    return { success: true, data: newProduct };

  } catch (error) {
    k.logger.error('创建产品', error.toString());
    k.response.json({
      success: false,
      error: '创建产品失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

### 3.2 查询列表 - 整数转布尔

```javascript
// 文件: /api/products/list
k.api.get(() => {
  const query = k.request.queryString;
  const page = parseInt(query?.page) || 1;
  const size = parseInt(query?.size) || 20;

  const total = k.DB.sqlite.value(
    'SELECT COUNT(*) FROM products'
  ) || 0;

  const items = k.DB.sqlite.query(`
    SELECT
      id,
      name,
      price,
      is_published as isPublished,
      is_featured as isFeatured,
      created_at as createdAt
    FROM products
    ORDER BY id DESC
    LIMIT @limit OFFSET @offset
  `, {
    limit: size,
    offset: (page - 1) * size
  });

  // ✅ 批量转换：将所有布尔字段从整数转为布尔
  items.forEach(item => {
    item.isPublished = item.isPublished === 1;
    item.isFeatured = item.isFeatured === 1;
  });

  return { success: true, items, total, page, size };
});
```

### 3.3 更新 - 布尔字段转整数

```javascript
// 文件: /api/products/{id}
k.api.put(() => {
  try {
    const productId = k.request.get('id');
    const body = JSON.parse(k.request.body);

    if (!productId) {
      k.response.json({
        success: false,
        error: '产品 ID 为必填项'
      });
      return k.api.httpCode(400);
    }

    // 检查产品是否存在
    const product = k.DB.sqlite.get(
      'SELECT id FROM products WHERE id = @id',
      { id: productId }
    );

    if (!product) {
      k.response.json({
        success: false,
        error: '产品不存在'
      });
      return k.api.httpCode(404);
    }

    // ✅ 布尔类型转换为整数 0 或 1
    const isPublished = body.isPublished ? 1 : 0;
    const isFeatured = body.isFeatured ? 1 : 0;

    // 更新数据
    k.DB.sqlite.execute(`
      UPDATE products
      SET
        name = @name,
        price = @price,
        is_published = @isPublished,
        is_featured = @isFeatured,
        updated_at = @updatedAt
      WHERE id = @id
    `, {
      id: productId,
      name: body.name,
      price: body.price,
      isPublished: isPublished,     // 存入 0 或 1
      isFeatured: isFeatured,       // 存入 0 或 1
      updatedAt: Date.now()
    });

    // 返回更新后的产品
    const updated = k.DB.sqlite.get(
      'SELECT * FROM products WHERE id = @id',
      { id: productId }
    );

    // ✅ 读取时转换回布尔类型
    if (updated) {
      updated.isPublished = updated.is_published === 1;
      updated.isFeatured = updated.is_featured === 1;
    }

    return { success: true, data: updated };

  } catch (error) {
    k.logger.error('更新产品', error.toString());
    k.response.json({
      success: false,
      error: '更新产品失败',
      message: error.toString()
    });
    return k.api.httpCode(500);
  }
});
```

### 3.4 条件查询 - 布尔过滤

```javascript
// 文件: /api/products/published
k.api.get(() => {
  const query = k.request.queryString;

  // 从查询参数获取布尔值
  const onlyPublished = query?.published === 'true';
  const onlyFeatured = query?.featured === 'true';

  let whereClause = 'WHERE 1=1';
  let params = {};

  if (onlyPublished) {
    whereClause += ' AND is_published = 1';
  }

  if (onlyFeatured) {
    whereClause += ' AND is_featured = 1';
  }

  const items = k.DB.sqlite.query(`
    SELECT
      id,
      name,
      price,
      is_published as isPublished,
      is_featured as isFeatured
    FROM products
    ${whereClause}
    ORDER BY id DESC
  `, params);

  // ✅ 转换布尔字段
  items.forEach(item => {
    item.isPublished = item.isPublished === 1;
    item.isFeatured = item.isFeatured === 1;
  });

  return { success: true, items };
});
```
