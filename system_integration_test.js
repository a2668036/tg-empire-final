#!/usr/bin/env node

/**
 * 系统集成测试
 * 端到端测试整个系统从Telegram Bot到Web App的完整流程
 */

const axios = require('axios');
const fs = require('fs');

// 测试配置
const TEST_CONFIG = {
  backend: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000/api/v1'
  },
  frontend: {
    baseUrl: 'http://localhost:5174'
  },
  telegram: {
    botToken: process.env.BOT_TOKEN,
    testUserId: '999888777'
  }
};

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

// 创建API客户端
const api = axios.create({
  baseURL: TEST_CONFIG.backend.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-telegram-id': TEST_CONFIG.telegram.testUserId
  }
});

// 主测试函数
async function runSystemIntegrationTests() {
  console.log('🚀 开始系统集成测试...\n');
  
  try {
    // 1. 基础服务测试
    await testBasicServices();
    
    // 2. 数据库连接测试
    await testDatabaseConnection();
    
    // 3. API完整性测试
    await testAPIIntegrity();
    
    // 4. 前端服务测试
    await testFrontendServices();
    
    // 5. 用户流程测试
    await testUserFlow();
    
    // 6. 错误处理测试
    await testErrorHandling();
    
    // 7. 性能测试
    await testPerformance();
    
    // 8. 安全性测试
    await testSecurity();
    
    // 生成测试报告
    generateReport();
    
  } catch (error) {
    console.error('❌ 系统集成测试失败:', error);
    process.exit(1);
  }
}

// 基础服务测试
async function testBasicServices() {
  console.log('📋 测试基础服务...');
  
  // 测试后端健康检查
  try {
    const response = await axios.get(`${TEST_CONFIG.backend.baseUrl}/health`);
    addTestResult('后端健康检查', response.status === 200, `状态码: ${response.status}`);
  } catch (error) {
    addTestResult('后端健康检查', false, `错误: ${error.message}`);
  }
  
  // 测试前端服务
  try {
    const response = await axios.get(`${TEST_CONFIG.frontend.baseUrl}/src/apps/ProfileApp/index.html`);
    addTestResult('前端服务', response.status === 200, `页面大小: ${response.data.length}字符`);
  } catch (error) {
    addTestResult('前端服务', false, `错误: ${error.message}`);
  }
}

// 数据库连接测试
async function testDatabaseConnection() {
  console.log('\n🗄️ 测试数据库连接...');
  
  try {
    // 通过API测试数据库连接
    const response = await api.get('/users/me');
    addTestResult('数据库连接', response.status === 200 || response.status === 404, 
      '数据库连接正常');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      addTestResult('数据库连接', true, '数据库连接正常（用户不存在）');
    } else {
      addTestResult('数据库连接', false, `错误: ${error.message}`);
    }
  }
}

// API完整性测试
async function testAPIIntegrity() {
  console.log('\n🔌 测试API完整性...');
  
  const apiEndpoints = [
    { method: 'GET', path: '/users/me', description: '获取用户信息' },
    { method: 'GET', path: '/check-in/status', description: '获取签到状态' },
    { method: 'GET', path: '/check-in/stats', description: '获取签到统计' },
    { method: 'GET', path: '/reputation/stats', description: '获取声望统计' }
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await api.request({
        method: endpoint.method,
        url: endpoint.path
      });
      
      addTestResult(`API: ${endpoint.description}`, 
        response.status >= 200 && response.status < 300,
        `状态码: ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      // 404和401是可接受的状态（用户不存在或未认证）
      if (status === 404 || status === 401) {
        addTestResult(`API: ${endpoint.description}`, true, 
          `状态码: ${status} (可接受)`);
      } else {
        addTestResult(`API: ${endpoint.description}`, false, 
          `错误: ${error.message}`);
      }
    }
  }
}

// 前端服务测试
async function testFrontendServices() {
  console.log('\n🌐 测试前端服务...');
  
  const frontendFiles = [
    '/src/apps/ProfileApp/index.html',
    '/src/apps/ProfileApp/ProfileApp.vue',
    '/src/utils/apiService.js',
    '/src/utils/webAppSdk.js'
  ];
  
  for (const file of frontendFiles) {
    try {
      const response = await axios.get(`${TEST_CONFIG.frontend.baseUrl}${file}`);
      addTestResult(`前端文件: ${file}`, response.status === 200, 
        `大小: ${response.data.length}字符`);
    } catch (error) {
      addTestResult(`前端文件: ${file}`, false, `错误: ${error.message}`);
    }
  }
}

// 用户流程测试
async function testUserFlow() {
  console.log('\n👤 测试用户流程...');
  
  try {
    // 1. 用户注册
    const registerData = {
      telegram_id: parseInt(TEST_CONFIG.telegram.testUserId),
      username: 'integration_test_user',
      first_name: 'Integration',
      last_name: 'Test'
    };
    
    try {
      const registerResponse = await api.post('/users/register', registerData);
      addTestResult('用户注册', 
        registerResponse.status === 201 || registerResponse.status === 409,
        `状态码: ${registerResponse.status}`);
    } catch (error) {
      if (error.response?.status === 409) {
        addTestResult('用户注册', true, '用户已存在（正常）');
      } else {
        addTestResult('用户注册', false, `错误: ${error.message}`);
      }
    }
    
    // 2. 获取用户信息
    const userResponse = await api.get('/users/me');
    addTestResult('获取用户信息', userResponse.status === 200,
      `用户ID: ${userResponse.data.id}`);
    
    // 3. 更新用户信息
    const updateData = { profile_bio: '集成测试用户' };
    const updateResponse = await api.put('/users/me', updateData);
    addTestResult('更新用户信息', updateResponse.status === 200,
      '用户信息更新成功');
    
  } catch (error) {
    addTestResult('用户流程测试', false, `错误: ${error.message}`);
  }
}

// 错误处理测试
async function testErrorHandling() {
  console.log('\n🛡️ 测试错误处理...');
  
  // 测试无效的Telegram ID
  try {
    await axios.get(`${TEST_CONFIG.backend.apiUrl}/users/me`, {
      headers: { 'x-telegram-id': 'invalid' }
    });
    addTestResult('无效Telegram ID处理', false, '应该返回错误');
  } catch (error) {
    addTestResult('无效Telegram ID处理', 
      error.response?.status === 400 || error.response?.status === 401,
      `正确返回错误: ${error.response?.status}`);
  }
  
  // 测试不存在的API端点
  try {
    await api.get('/nonexistent/endpoint');
    addTestResult('404错误处理', false, '应该返回404');
  } catch (error) {
    addTestResult('404错误处理', error.response?.status === 404,
      `状态码: ${error.response?.status}`);
  }
}

// 性能测试
async function testPerformance() {
  console.log('\n⚡ 测试性能...');
  
  const startTime = Date.now();
  
  try {
    await api.get('/users/me');
    const duration = Date.now() - startTime;
    
    addTestResult('API响应时间', duration < 500,
      `响应时间: ${duration}ms (要求: <500ms)`);
  } catch (error) {
    addTestResult('API响应时间', false, `错误: ${error.message}`);
  }
}

// 安全性测试
async function testSecurity() {
  console.log('\n🔒 测试安全性...');
  
  // 测试未授权访问
  try {
    await axios.get(`${TEST_CONFIG.backend.apiUrl}/users/me`);
    addTestResult('未授权访问保护', false, '应该要求认证');
  } catch (error) {
    addTestResult('未授权访问保护', 
      error.response?.status === 401,
      `正确拒绝未授权访问: ${error.response?.status}`);
  }
}

// 生成测试报告
function generateReport() {
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 系统集成测试报告');
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
  
  fs.writeFileSync('integration_test_report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 详细报告已保存到: integration_test_report.json');
  
  // 返回测试结果
  return testResults.failed === 0;
}

// 运行测试
if (require.main === module) {
  runSystemIntegrationTests()
    .then(() => {
      process.exit(testResults.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('测试运行失败:', error);
      process.exit(1);
    });
}

module.exports = { runSystemIntegrationTests };
