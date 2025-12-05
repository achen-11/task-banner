#!/usr/bin/env node

/**
 * Schema 转换测试脚本
 * 直接测试 Zod schema 到 JSON Schema 的转换
 */

import { z } from 'zod';

// 复制 index.ts 中的 zodToMcpSchema 函数
function zodToMcpSchema(zodSchema) {
  try {
    const shapeDef = zodSchema._def?.shape;
    const shape = typeof shapeDef === 'function' ? shapeDef() : shapeDef;
    
    if (!shape) {
      return { type: 'object', properties: {} };
    }
    
    const properties = {};
    const required = [];
    
    for (const [key, zodField] of Object.entries(shape)) {
      const field = zodField;
      const zodDef = field._def;
      const fieldSchema = {};
      
      let isOptional = false;
      let actualType = zodDef;
      let description;
      
      // 递归解包 Optional、Default 等包装类型
      while (actualType && (actualType.typeName || actualType.type)) {
        const typeName = actualType.typeName || (actualType.type === 'optional' ? 'ZodOptional' : 
                                                 actualType.type === 'default' ? 'ZodDefault' : null);
        
        if (typeName === 'ZodOptional' || actualType.type === 'optional') {
          isOptional = true;
          actualType = actualType.innerType?._def || actualType.innerType;
        } else if (typeName === 'ZodDefault' || actualType.type === 'default') {
          // 处理默认值
          if (actualType.defaultValue) {
            try {
              fieldSchema.default = typeof actualType.defaultValue === 'function' 
                ? actualType.defaultValue() 
                : actualType.defaultValue;
            } catch (e) {}
          }
          actualType = actualType.innerType?._def || actualType.innerType;
        } else {
          // 遇到基础类型，停止解包
          break;
        }
      }
      
      // 提取描述信息
      if (actualType?.description) {
        description = actualType.description;
      } else if (zodDef?.description) {
        description = zodDef.description;
      }
      
      // 设置类型和属性
      // 新版本 Zod: 使用 _def.type，旧版本: 使用 _def.typeName
      const typeName = actualType?.typeName;
      const typeValue = actualType?.type;
      
      if (typeName === 'ZodString' || typeValue === 'string') {
        fieldSchema.type = 'string';
        if (actualType.checks) {
          for (const check of actualType.checks) {
            if (check.kind === 'min') fieldSchema.minLength = check.value;
            if (check.kind === 'max') fieldSchema.maxLength = check.value;
          }
        }
      } else if (typeName === 'ZodNumber' || typeValue === 'number') {
        fieldSchema.type = 'number';
        if (actualType.checks) {
          for (const check of actualType.checks) {
            if (check.kind === 'min') fieldSchema.minimum = check.value;
            if (check.kind === 'max') fieldSchema.maximum = check.value;
          }
        }
      } else if (typeName === 'ZodBoolean' || typeValue === 'boolean') {
        fieldSchema.type = 'boolean';
      } else if (typeName === 'ZodArray' || typeValue === 'array') {
        fieldSchema.type = 'array';
        const itemType = actualType.type?._def || actualType.type;
        const itemTypeName = itemType?.typeName;
        const itemTypeValue = itemType?.type;
        if (itemTypeName === 'ZodString' || itemTypeValue === 'string') {
          fieldSchema.items = { type: 'string' };
        } else {
          fieldSchema.items = {};
        }
      } else if (typeName === 'ZodEnum' || typeValue === 'enum') {
        fieldSchema.type = 'string';
        // 新版本 Zod 使用 entries，旧版本使用 values
        if (actualType.entries) {
          fieldSchema.enum = Object.keys(actualType.entries);
        } else if (actualType.values) {
          fieldSchema.enum = actualType.values;
        }
      } else if (typeName === 'ZodRecord' || typeValue === 'record') {
        fieldSchema.type = 'object';
        fieldSchema.additionalProperties = true;
      }
      
      if (description) {
        fieldSchema.description = description;
      }
      
      properties[key] = fieldSchema;
      if (!isOptional) {
        required.push(key);
      }
    }
    
    const result = { type: 'object', properties };
    if (required.length > 0) {
      result.required = required;
    }
    
    return result;
  } catch (error) {
    console.error('转换错误:', error);
    return { type: 'object', properties: {} };
  }
}

console.log('🧪 测试 Schema 转换\n');
console.log('='.repeat(60));

// 测试 1: taskUpdateTool 的 schema
console.log('\n1️⃣ 测试 taskUpdateTool schema:');
const taskUpdateSchema = z.object({
  taskId: z.string().describe('任务 ID（_id）'),
  title: z.string().optional().describe('任务标题'),
  content: z.string().optional().describe('任务描述（支持 Markdown）'),
  status: z.enum(['todo', 'in_progress', 'completed', 'review']).optional().describe('任务状态'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('优先级'),
  assigneeId: z.string().optional().describe('指派人用户 ID（设为空字符串可取消指派）'),
  moduleIds: z.array(z.string()).optional().describe('模块 ID 列表（会完全替换现有模块）'),
  tagIds: z.array(z.string()).optional().describe('标签 ID 列表（会完全替换现有标签）'),
  dueDate: z.number().optional().describe('截止日期（Unix 时间戳，毫秒，设为 0 可清除）'),
  progress: z.number().min(0).max(100).optional().describe('进度百分比（0-100）'),
  summary: z.string().max(200).optional().describe('任务摘要（20-50字）')
});

const updateSchema = zodToMcpSchema(taskUpdateSchema);
console.log(JSON.stringify(updateSchema, null, 2));

// 检查 taskId
console.log('\n2️⃣ 检查 taskId 字段:');
const taskIdField = updateSchema.properties?.taskId;
if (taskIdField) {
  console.log('✅ taskId 字段存在');
  console.log(`   类型: ${taskIdField.type}`);
  console.log(`   描述: ${taskIdField.description || '无'}`);
  console.log(`   必需: ${updateSchema.required?.includes('taskId') ? '是' : '否'}`);
  
  if (taskIdField.type === 'string') {
    console.log('✅ taskId 类型正确（string）');
  } else {
    console.log(`❌ taskId 类型错误！期望 'string'，实际 '${taskIdField.type}'`);
    process.exit(1);
  }
} else {
  console.log('❌ taskId 字段不存在！');
  process.exit(1);
}

// 测试 2: taskGetTool 的 schema
console.log('\n3️⃣ 测试 taskGetTool schema:');
const taskGetSchema = z.object({
  taskId: z.string().describe('任务 ID（_id）或显示 ID（displayId，如 "1001"）')
});

const getSchema = zodToMcpSchema(taskGetSchema);
const getTaskIdField = getSchema.properties?.taskId;
if (getTaskIdField?.type === 'string') {
  console.log('✅ taskGetTool.taskId 类型正确');
} else {
  console.log(`❌ taskGetTool.taskId 类型错误: ${getTaskIdField?.type || '未找到'}`);
  process.exit(1);
}

// 测试 3: 验证枚举值
console.log('\n4️⃣ 验证枚举值:');
const statusField = updateSchema.properties?.status;
if (statusField) {
  console.log('   status 字段:');
  console.log(`   类型: ${statusField.type}`);
  console.log(`   枚举值: ${JSON.stringify(statusField.enum)}`);
  if (statusField.enum && statusField.enum.includes('completed')) {
    console.log('✅ status 枚举值正确，包含 "completed"');
  } else {
    console.log('❌ status 枚举值不正确，缺少 "completed"');
    process.exit(1);
  }
  if (!statusField.enum || !statusField.enum.includes('done')) {
    console.log('✅ status 枚举值不包含 "done"（正确）');
  } else {
    console.log('❌ status 枚举值包含 "done"（错误）');
    process.exit(1);
  }
} else {
  console.log('❌ status 字段不存在');
  process.exit(1);
}

// 测试 4: taskCommentTool 的 schema
console.log('\n5️⃣ 测试 taskCommentTool schema:');
const taskCommentSchema = z.object({
  taskId: z.string().describe('任务 ID（_id）'),
  content: z.string().min(1).describe('评论内容（支持 Markdown）'),
  summary: z.string().optional().describe('评论摘要（用于快速预览）'),
  type: z.enum(['user', 'ai_completion', 'ai_revision', 'system']).default('user').describe('评论类型'),
  mentionedUsers: z.array(z.string()).optional().describe('@ 提及的用户 ID 列表'),
  metadata: z.record(z.string(), z.any()).optional().describe('元数据（用于存储额外信息）')
});

const commentSchema = zodToMcpSchema(taskCommentSchema);
const commentTaskIdField = commentSchema.properties?.taskId;
if (commentTaskIdField?.type === 'string') {
  console.log('✅ taskCommentTool.taskId 类型正确');
} else {
  console.log(`❌ taskCommentTool.taskId 类型错误: ${commentTaskIdField?.type || '未找到'}`);
  process.exit(1);
}

// 测试 5: 验证完整的 UUID 字符串
console.log('\n6️⃣ 验证 UUID 字符串:');
const testTaskId = '9cb78616-0ca0-4a61-b95a-310d4195a0fd';
console.log(`   测试值: "${testTaskId}"`);
console.log(`   长度: ${testTaskId.length} 字符`);
console.log(`   Schema 类型: ${taskIdField.type}`);

if (taskIdField.type === 'string') {
  console.log('✅ Schema 应该能接受完整的 UUID 字符串');
  console.log('✅ 修复成功！taskId 现在可以接收完整的 UUID 了');
} else {
  console.log('❌ Schema 类型不正确，无法接收完整的 UUID');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ 所有测试通过！');
console.log('\n💡 提示: 运行 "npm run build" 后重启 MCP 服务器即可生效');
