#!/usr/bin/env node

/**
 * 测试 MCP Server 是否能正常启动
 */

const { spawn } = require('child_process');
const path = require('path');

const mcpServer = spawn('node', [
  path.join(__dirname, 'dist/index.js')
], {
  env: {
    ...process.env,
    KB_TASK_API_URL: 'https://ai_task_manage.redev.cn',
    KB_TASK_API_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImEyMzRkYTZhLTgzZGEtNjkyNC1lZjE1LTNkMWY5NGFhODRmMyIsImtpbmQiOiJwYXNzd29yZCIsIm9yZyI6ImJjYWNmN2UzLTUwNWUtM2E5OS0zMGY4LTdmZDhlMDQxMjA5NCIsImV4cCI6MTc2MzkxMzMxMn0.IVXIWJr_Lvbyp7TBo5zx06yQQyaa8aHIsbQJAvzMQQs'
  }
});

// 监听 stderr（MCP Server 的日志输出）
mcpServer.stderr.on('data', (data) => {
  console.log('MCP Server 输出:', data.toString());
});

// 监听启动错误
mcpServer.on('error', (error) => {
  console.error('❌ MCP Server 启动失败:', error);
  process.exit(1);
});

// 等待 2 秒后测试是否成功启动
setTimeout(() => {
  console.log('\n✅ MCP Server 成功启动！');
  console.log('如果你看到上面有 "kb-task MCP Server 已启动" 的消息，说明配置正确。');
  console.log('\n现在关闭测试...');
  mcpServer.kill();
  process.exit(0);
}, 2000);

// 监听进程退出
mcpServer.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ MCP Server 异常退出，退出码: ${code}`);
    process.exit(1);
  }
});
