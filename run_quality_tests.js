#!/usr/bin/env node

/**
 * 代码质量测试运行器
 * 运行所有质量相关的测试和检查
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// 添加测试结果
function addTestResult(name, success, details = '') {
  testResults.tests.push({
    name,
    success,
    details,
    timestamp: new Date().toISOString()
  });
  
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// 运行命令
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'pipe',
      shell: true 
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 检查文件是否存在
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// 运行单元测试
async function runUnitTests() {
  console.log('\n📋 运行单元测试...');
  
  try {
    const result = await runCommand('npm', ['test'], './backend');
    
    if (result.code === 0) {
      addTestResult('单元测试', true, '所有测试通过');
    } else {
      addTestResult('单元测试', false, `测试失败: ${result.stderr}`);
    }
  } catch (error) {
    addTestResult('单元测试', false, `运行失败: ${error.message}`);
  }
}

// 检查代码覆盖率
async function checkCodeCoverage() {
  console.log('\n📊 检查代码覆盖率...');
  
  try {
    const result = await runCommand('npm', ['run', 'test:coverage'], './backend');
    
    // 解析覆盖率报告
    const coverageMatch = result.stdout.match(/All files\s+\|\s+(\d+\.?\d*)/);
    if (coverageMatch) {
      const coverage = parseFloat(coverageMatch[1]);
      if (coverage >= 80) {
        addTestResult('代码覆盖率', true, `覆盖率: ${coverage}%`);
      } else {
        addTestResult('代码覆盖率', false, `覆盖率不足: ${coverage}% (要求: ≥80%)`);
      }
    } else {
      addTestResult('代码覆盖率', false, '无法解析覆盖率报告');
    }
  } catch (error) {
    addTestResult('代码覆盖率', false, `检查失败: ${error.message}`);
  }
}

// 检查硬编码配置
async function checkHardcodedConfig() {
  console.log('\n🔍 检查硬编码配置...');
  
  const hardcodedPatterns = [
    { pattern: /localhost:\d+/, file: 'backend/src/**/*.js', description: 'localhost地址' },
    { pattern: /postgresql:\/\/.*@.*\//, file: 'backend/src/**/*.js', description: '数据库连接字符串' },
    { pattern: /bot\d+:[A-Za-z0-9_-]+/, file: 'backend/src/**/*.js', description: 'Bot Token' },
    { pattern: /\d{10}:\w{35}/, file: 'backend/src/**/*.js', description: 'API密钥' }
  ];
  
  let hardcodedFound = false;
  
  for (const { pattern, description } of hardcodedPatterns) {
    try {
      const result = await runCommand('grep', ['-r', pattern.source, 'backend/src/']);
      if (result.stdout.trim()) {
        addTestResult(`硬编码检查: ${description}`, false, '发现硬编码配置');
        hardcodedFound = true;
      }
    } catch (error) {
      // grep返回1表示没有找到匹配，这是好的
      if (error.code !== 1) {
        console.log(`检查${description}时出错:`, error.message);
      }
    }
  }
  
  if (!hardcodedFound) {
    addTestResult('硬编码配置检查', true, '未发现硬编码配置');
  }
}

// 检查错误处理
async function checkErrorHandling() {
  console.log('\n🛡️ 检查错误处理...');
  
  const requiredFiles = [
    'backend/src/middleware/errorHandler.js',
    'backend/src/utils/logger.js',
    'backend/src/utils/validator.js'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fileExists(file)) {
      addTestResult(`错误处理文件: ${path.basename(file)}`, true, '文件存在');
    } else {
      addTestResult(`错误处理文件: ${path.basename(file)}`, false, '文件不存在');
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    addTestResult('错误处理系统', true, '所有必需文件存在');
  }
}

// 检查安全性
async function checkSecurity() {
  console.log('\n🔒 检查安全性...');
  
  try {
    // 检查是否有安全漏洞
    const result = await runCommand('npm', ['audit', '--audit-level', 'moderate'], './backend');
    
    if (result.code === 0) {
      addTestResult('安全漏洞扫描', true, '未发现安全漏洞');
    } else {
      addTestResult('安全漏洞扫描', false, '发现安全漏洞');
    }
  } catch (error) {
    addTestResult('安全漏洞扫描', false, `扫描失败: ${error.message}`);
  }
}

// 生成测试报告
function generateReport() {
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 代码质量测试报告');
  console.log('='.repeat(60));
  console.log(`总测试数: ${total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`成功率: ${successRate}%`);
  console.log('='.repeat(60));
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.tests
      .filter(test => !test.success)
      .forEach(test => {
        console.log(`- ${test.name}: ${test.details}`);
      });
  }
  
  // 保存详细报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: parseFloat(successRate)
    },
    tests: testResults.tests
  };
  
  fs.writeFileSync('quality_test_report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 详细报告已保存到: quality_test_report.json');
  
  // 返回测试结果
  return testResults.failed === 0;
}

// 主函数
async function runQualityTests() {
  console.log('🚀 开始代码质量测试...\n');
  
  try {
    await runUnitTests();
    await checkCodeCoverage();
    await checkHardcodedConfig();
    await checkErrorHandling();
    await checkSecurity();
    
    const success = generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runQualityTests();
}

module.exports = { runQualityTests };
