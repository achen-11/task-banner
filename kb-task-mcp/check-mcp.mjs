#!/usr/bin/env node

/**
 * MCP 配置检查脚本
 * 检查编译文件和基本配置
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 检查 MCP Server 配置...\n');

// 检查编译后的文件是否存在
const distPath = join(__dirname, 'dist', 'index.js');
if (!existsSync(distPath)) {
  console.error('❌ 编译文件不存在！');
  console.log('   请先运行: npm run build\n');
  process.exit(1);
}
console.log('✅ 编译文件存在:', distPath);

// 检查配置文件位置
console.log('\n📋 配置文件检查:');
const configPaths = [
  join(__dirname, '.cursor', 'mcp.json'),  // 项目配置
  join(homedir(), '.cursor', 'mcp.json')   // 全局配置
];

let configFound = false;
for (const configPath of configPaths) {
  if (existsSync(configPath)) {
    console.log(`   ✅ 找到配置文件: ${configPath}`);
    configFound = true;
  }
}

if (!configFound) {
  console.log('   ⚠️  未找到配置文件');
  console.log('   请创建以下文件之一:');
  console.log(`      - ${configPaths[0]} (项目配置)`);
  console.log(`      - ${configPaths[1]} (全局配置)`);
  console.log('   参考: mcp_config.example.json');
}

console.log('\n💡 重新加载 MCP 配置的方法:');
console.log('   1. 重启 Cursor（最可靠）');
console.log('   2. 使用命令面板: Cmd+Shift+P → "Developer: Reload Window"');
console.log('   3. 检查 MCP 状态: Cmd+Shift+J → Features → Model Context Protocol');
console.log('   4. 查看日志: Cmd+Shift+U → 选择 "MCP Logs"');

console.log('\n✅ 检查完成！');
