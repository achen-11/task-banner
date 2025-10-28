#!/usr/bin/env node

/**
 * 测试 kb_task_get 工具获取任务 #1022
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP 请求格式
const getRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

const callRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'kb_task_get',
    arguments: {
      taskId: '1022'
      // 不提供 projectId，测试自动获取第一个项目
    }
  }
};

const mcpServer = spawn('node', [
  path.join(__dirname, 'dist/index.js')
], {
  env: {
    ...process.env,
    KB_TASK_API_URL: 'https://ai_task_manage.redev.cn',
    KB_TASK_API_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImEyMzRkYTZhLTgzZGEtNjkyNC1lZjE1LTNkMWY5NGFhODRmMyIsImtpbmQiOiJwYXNzd29yZCIsIm9yZyI6ImJjYWNmN2UzLTUwNWUtM2E5OS0zMGY4LTdmZDhlMDQxMjA5NCIsImV4cCI6MTc2MzkxMzMxMn0.IVXIWJr_Lvbyp7TBo5zx06yQQyaa8aHIsbQJAvzMQQs'
  }
});

let responseData = '';
let hasStarted = false;

// 监听 stderr（MCP Server 的日志输出）
mcpServer.stderr.on('data', (data) => {
  console.log('MCP Server 日志:', data.toString());
  if (data.toString().includes('kb-task MCP Server 已启动')) {
    hasStarted = true;
    // 发送 tools/list 请求
    mcpServer.stdin.write(JSON.stringify(getRequest) + '\n');

    // 延迟发送 tools/call 请求
    setTimeout(() => {
      console.log('🔍 发送获取任务 #1022 请求...');
      mcpServer.stdin.write(JSON.stringify(callRequest) + '\n');
    }, 500);
  }
});

// 监听 stdout（MCP 响应）
mcpServer.stdout.on('data', (data) => {
  const responses = data.toString().trim().split('\n');

  responses.forEach(response => {
    if (response.trim()) {
      try {
        const parsed = JSON.parse(response);

        if (parsed.id === 1) {
          console.log('\n✅ 工具列表获取成功:');
          console.log('可用工具:', parsed.result.tools.map(t => t.name).join(', '));
        } else if (parsed.id === 2) {
          console.log('\n🎯 任务 #1022 获取结果:');

          if (parsed.result) {
            console.log('成功获取任务详情:');
            console.log('--- 任务内容 ---');
            console.log(parsed.result.content[0].text);
            console.log('--- 结束 ---');
          } else if (parsed.error) {
            console.log('❌ 获取任务失败:', parsed.error.message);
          }

          // 测试完成，关闭服务器
          setTimeout(() => {
            console.log('\n🎉 测试完成，关闭服务器...');
            mcpServer.kill();
            process.exit(0);
          }, 1000);
        }
      } catch (error) {
        console.log('原始响应:', response);
      }
    }
  });
});

// 监听启动错误
mcpServer.on('error', (error) => {
  console.error('❌ MCP Server 启动失败:', error);
  process.exit(1);
});

// 超时处理
setTimeout(() => {
  if (!hasStarted) {
    console.error('❌ MCP Server 启动超时');
    mcpServer.kill();
    process.exit(1);
  }
}, 5000);

// 监听进程退出
mcpServer.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ MCP Server 异常退出，退出码: ${code}`);
    process.exit(1);
  }
});