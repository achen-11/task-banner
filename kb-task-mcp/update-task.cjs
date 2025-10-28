#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const KB_TASK_API_URL = 'https://ai_task_manage.redev.cn';
const KB_TASK_API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImEyMzRkYTZhLTgzZGEtNjkyNC1lZjE1LTNkMWY5NGFhODRmMyIsImtpbmQiOiJwYXNzd29yZCIsIm9yZyI6ImJjYWNmN2UzLTUwNWUtM2E5OS0zMGY4LTdmZDhlMDQxMjA5NCIsImV4cCI6MTc2MzkxMzMxMn0.IVXIWJr_Lvbyp7TBo5zx06yQQyaa8aHIsbQJAvzMQQs';

async function callMcpTool(toolName, args) {
  return new Promise((resolve, reject) => {
    // Start MCP server
    const mcpServer = spawn('node', [
      path.join(__dirname, 'dist/index.js')
    ], {
      env: {
        ...process.env,
        KB_TASK_API_URL,
        KB_TASK_API_TOKEN
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    // Collect stdout
    mcpServer.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Collect stderr
    mcpServer.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Handle errors
    mcpServer.on('error', (error) => {
      reject(new Error(`MCP Server error: ${error.message}`));
    });

    // Handle server close
    mcpServer.on('close', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`MCP Server exited with code: ${code}`));
        return;
      }

      try {
        const response = JSON.parse(output);
        resolve(response);
      } catch (e) {
        reject(new Error(`Failed to parse MCP response: ${e.message}. Output: ${output}`));
      }
    });

    // Send MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    mcpServer.stdin.write(JSON.stringify(request) + '\n');
    mcpServer.stdin.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      mcpServer.kill();
      reject(new Error('MCP Server timeout'));
    }, 10000);
  });
}

async function main() {
  try {
    console.log('🔍 尝试获取任务 #1022 的详细信息...');

    // First try to get the task details using full UUID
    const getResult = await callMcpTool('kb_task_get', { taskId: '57021f1e-75d2-4a15-9d00-4bf53c9fc3f2' });
    console.log('获取任务结果:', JSON.stringify(getResult, null, 2));

    if (getResult.isError) {
      console.log('❌ 无法获取任务，尝试更新任务状态...');
    } else {
      console.log('✅ 成功获取任务信息');
    }

    // Now try to update the task status to completed
    console.log('🔄 正在更新任务 #1022 状态为已完成...');

    const updateResult = await callMcpTool('kb_task_update', {
      taskId: '57021f1e-75d2-4a15-9d00-4bf53c9fc3f2',
      status: 'completed',
      summary: '将所有快捷键提示从原生 title 属性升级为 ElementPlus tooltip 组件，提供更好的悬浮提示体验'
    });

    console.log('更新任务结果:', JSON.stringify(updateResult, null, 2));

    if (!updateResult.isError) {
      console.log('✅ 任务 #1022 状态更新成功！');

      // Add a comment with implementation details
      console.log('📝 正在添加实现细节评论...');

      const commentResult = await callMcpTool('kb_task_comment', {
        taskId: '57021f1e-75d2-4a15-9d00-4bf53c9fc3f2',
        content: `## 实现细节

本次更新将系统中的所有快捷键提示从原生的 HTML title 属性升级为 ElementPlus 的 el-tooltip 组件，主要改进包括：

### 更新的组件
- **KeyboardShortcutsPanel.vue**: 将快捷键提示从 title 属性改为 el-tooltip 组件
- **MarkdownEditor.vue**: 升级编辑器工具栏的提示系统

### 技术改进
1. **更好的视觉效果**: ElementPlus tooltip 提供更现代的悬浮样式
2. **可定制性**: 支持不同的主题、位置和动画效果
3. **一致性**: 与整个应用的 UI 风格保持一致
4. **可访问性**: 更好的屏幕阅读器支持

### 用户体验提升
- 更清晰的提示信息显示
- 更平滑的动画过渡
- 更好的移动端适配

任务已在本地完成并测试通过，确保远程任务状态同步。`
      });

      console.log('评论添加结果:', JSON.stringify(commentResult, null, 2));

      if (!commentResult.isError) {
        console.log('✅ 评论添加成功！');
      } else {
        console.log('⚠️ 评论添加失败，但任务状态已更新');
      }
    } else {
      console.log('❌ 任务状态更新失败');
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  }
}

main();