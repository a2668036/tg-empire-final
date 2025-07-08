#!/usr/bin/env node

/**
 * API功能完整性测试脚本
 * 验证所有后端API接口是否正常工作
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_TELEGRAM_ID = '999888777'; // 测试用户ID

// 创建API客户端
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-telegram-id': TEST_TELEGRAM_ID
  }
});

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// 测试辅助函数
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

// 主测试函数
async function runAPITests() {
  console.log('🚀 开始API功能完整性测试...\n');
  
  try {
    // 1. 测试健康检查
    console.log('📋 测试基础API...');
    await testHealthCheck();
    
    // 2. 测试用户API
    console.log('\n👤 测试用户API...');
    await testUserAPIs();
    
    // 3. 测试签到API
    console.log('\n📅 测试签到API...');
    await testCheckInAPIs();
    
    // 4. 测试声望API
    console.log('\n⭐ 测试声望API...');
    await testReputationAPIs();
    
    // 5. 生成测试报告
    console.log('\n📊 生成测试报告...');
    generateReport();
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 健康检查测试
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL.replace('/api/v1', '')}/health`);
    addTestResult('健康检查API', response.status === 200, `状态码: ${response.status}`);
  } catch (error) {
    addTestResult('健康检查API', false, `错误: ${error.message}`);
  }
}

// 用户API测试
async function testUserAPIs() {
  // 测试用户注册
  try {
    const registerData = {
      telegram_id: parseInt(TEST_TELEGRAM_ID),
      username: 'test_user_api',
      first_name: 'Test',
      last_name: 'User'
    };

    const response = await api.post('/users/register', registerData);
    addTestResult('用户注册API', response.status === 200 || response.status === 201 || response.status === 409,
      `状态码: ${response.status}`);
  } catch (error) {
    if (error.response && (error.response.status === 409 || error.response.status === 201)) {
      addTestResult('用户注册API', true, `状态码: ${error.response.status} (正常)`);
    } else {
      addTestResult('用户注册API', false, `错误: ${error.message}`);
    }
  }
  
  // 测试获取用户信息
  try {
    const response = await api.get('/users/me');
    addTestResult('获取用户信息API', response.status === 200, 
      `用户名: ${response.data.username || 'N/A'}`);
  } catch (error) {
    addTestResult('获取用户信息API', false, `错误: ${error.message}`);
  }
  
  // 测试更新用户信息
  try {
    const updateData = { profile_bio: '测试用户简介' };
    const response = await api.put('/users/me', updateData);
    addTestResult('更新用户信息API', response.status === 200, 
      `更新成功: ${response.data.profile_bio}`);
  } catch (error) {
    addTestResult('更新用户信息API', false, `错误: ${error.message}`);
  }
}

// 签到API测试
async function testCheckInAPIs() {
  // 测试用户签到
  try {
    const response = await api.post('/users/check-in');
    addTestResult('用户签到API', response.status === 200,
      `状态码: ${response.status}, 消息: ${response.data.message || 'N/A'}`);
  } catch (error) {
    // 400状态码表示今日已签到，这是正常行为
    if (error.response && error.response.status === 400 &&
        error.response.data.error === '今日已完成签到') {
      addTestResult('用户签到API', true, '今日已签到（正常行为）');
    } else {
      addTestResult('用户签到API', false, `错误: ${error.message}`);
    }
  }
  
  // 测试签到历史
  try {
    const response = await api.get('/check-in/history?limit=10&page=1');
    addTestResult('签到历史API', response.status === 200, 
      `记录数: ${response.data.records ? response.data.records.length : 0}`);
  } catch (error) {
    addTestResult('签到历史API', false, `错误: ${error.message}`);
  }
  
  // 测试签到状态
  try {
    const response = await api.get('/check-in/status');
    addTestResult('签到状态API', response.status === 200, 
      `连续签到: ${response.data.consecutive_days || 0}天`);
  } catch (error) {
    addTestResult('签到状态API', false, `错误: ${error.message}`);
  }
  
  // 测试签到统计
  try {
    const response = await api.get('/check-in/stats');
    addTestResult('签到统计API', response.status === 200, 
      `总签到: ${response.data.total_check_ins || 0}次`);
  } catch (error) {
    addTestResult('签到统计API', false, `错误: ${error.message}`);
  }
}

// 声望API测试
async function testReputationAPIs() {
  // 测试声望历史
  try {
    const response = await api.get('/reputation/history?limit=10&page=1');
    addTestResult('声望历史API', response.status === 200, 
      `记录数: ${response.data.records ? response.data.records.length : 0}`);
  } catch (error) {
    addTestResult('声望历史API', false, `错误: ${error.message}`);
  }
  
  // 测试声望统计
  try {
    const response = await api.get('/reputation/stats');
    addTestResult('声望统计API', response.status === 200, 
      `当前声望: ${response.data.current_points || 0}点`);
  } catch (error) {
    addTestResult('声望统计API', false, `错误: ${error.message}`);
  }
}

// 生成测试报告
function generateReport() {
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 API功能完整性测试报告');
  console.log('='.repeat(50));
  console.log(`总测试数: ${total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`成功率: ${successRate}%`);
  console.log('='.repeat(50));
  
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
  
  require('fs').writeFileSync('api_test_report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 详细报告已保存到: api_test_report.json');
  
  // 返回测试结果
  return testResults.failed === 0;
}

// 运行测试
if (require.main === module) {
  runAPITests()
    .then(() => {
      process.exit(testResults.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('测试运行失败:', error);
      process.exit(1);
    });
}

module.exports = { runAPITests };
