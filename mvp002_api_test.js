#!/usr/bin/env node

const axios = require('axios');

// 测试配置
const API_BASE = 'http://localhost:3000/api/v1';
const TEST_USER_ID = '888777666'; // 使用新的测试用户ID

async function testMVP002APIs() {
  console.log('🧪 开始MVP-002 API功能测试...\n');
  
  const results = [];
  
  // 首先注册一个测试用户
  console.log('📝 准备工作: 注册测试用户');
  try {
    await axios.post(`${API_BASE}/users/register`, {
      telegram_id: TEST_USER_ID,
      username: 'mvp002_test',
      first_name: '签到测试',
      last_name: '用户'
    });
    console.log('✅ 测试用户注册成功');
  } catch (error) {
    if (error.response && error.response.status === 201) {
      console.log('✅ 测试用户已存在或注册成功');
    } else {
      console.log('⚠️ 用户注册失败，继续测试:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试1: 签到API
  console.log('📝 测试1: 签到API (POST /api/v1/check-in)');
  try {
    const response = await axios.post(`${API_BASE}/check-in`, {}, {
      headers: {
        'x-telegram-id': TEST_USER_ID
      },
      timeout: 10000
    });
    
    console.log('✅ 签到成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '签到API',
      status: 'PASS',
      details: `获得点数: ${response.data.rewards?.totalPoints || 'N/A'}`
    });
    
  } catch (error) {
    console.log('❌ 签到失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '签到API',
      status: 'FAIL',
      error: error.message,
      details: error.response?.data
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试2: 签到历史API
  console.log('📝 测试2: 签到历史API (GET /api/v1/check-in/history)');
  try {
    const response = await axios.get(`${API_BASE}/check-in/history?limit=10&page=1`, {
      headers: {
        'x-telegram-id': TEST_USER_ID
      },
      timeout: 10000
    });
    
    console.log('✅ 签到历史获取成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '签到历史API',
      status: 'PASS',
      details: `历史记录数: ${response.data.total || 0}`
    });
    
  } catch (error) {
    console.log('❌ 签到历史获取失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '签到历史API',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试3: 签到状态API
  console.log('📝 测试3: 签到状态API (GET /api/v1/check-in/status)');
  try {
    const response = await axios.get(`${API_BASE}/check-in/status`, {
      headers: {
        'x-telegram-id': TEST_USER_ID
      },
      timeout: 10000
    });
    
    console.log('✅ 签到状态获取成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '签到状态API',
      status: 'PASS',
      details: `连续签到: ${response.data.consecutiveDays || 0}天`
    });
    
  } catch (error) {
    console.log('❌ 签到状态获取失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '签到状态API',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试4: 签到统计API
  console.log('📝 测试4: 签到统计API (GET /api/v1/check-in/stats)');
  try {
    const response = await axios.get(`${API_BASE}/check-in/stats`, {
      headers: {
        'x-telegram-id': TEST_USER_ID
      },
      timeout: 10000
    });
    
    console.log('✅ 签到统计获取成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '签到统计API',
      status: 'PASS',
      details: `总签到天数: ${response.data.totalDays || 0}`
    });
    
  } catch (error) {
    console.log('❌ 签到统计获取失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '签到统计API',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试5: 声望历史API
  console.log('📝 测试5: 声望历史API (GET /api/v1/reputation/history)');
  try {
    const response = await axios.get(`${API_BASE}/reputation/history?limit=10&page=1`, {
      headers: {
        'x-telegram-id': TEST_USER_ID
      },
      timeout: 10000
    });
    
    console.log('✅ 声望历史获取成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '声望历史API',
      status: 'PASS',
      details: `历史记录数: ${response.data.total || 0}`
    });
    
  } catch (error) {
    console.log('❌ 声望历史获取失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '声望历史API',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试6: 声望统计API
  console.log('📝 测试6: 声望统计API (GET /api/v1/reputation/stats)');
  try {
    const response = await axios.get(`${API_BASE}/reputation/stats`, {
      headers: {
        'x-telegram-id': TEST_USER_ID
      },
      timeout: 10000
    });
    
    console.log('✅ 声望统计获取成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '声望统计API',
      status: 'PASS',
      details: `当前声望: ${response.data.currentPoints || 0}点`
    });
    
  } catch (error) {
    console.log('❌ 声望统计获取失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '声望统计API',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试7: 重复签到测试
  console.log('📝 测试7: 重复签到测试');
  try {
    const response = await axios.post(`${API_BASE}/check-in`, {}, {
      headers: {
        'x-telegram-id': TEST_USER_ID
      },
      timeout: 10000
    });
    
    console.log('❌ 重复签到应该失败但成功了');
    results.push({
      test: '重复签到防护',
      status: 'FAIL',
      details: '重复签到没有被正确阻止'
    });
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ 重复签到被正确阻止');
      console.log('错误信息:', error.response.data);
      
      results.push({
        test: '重复签到防护',
        status: 'PASS',
        details: '重复签到被正确阻止'
      });
    } else {
      console.log('❌ 重复签到测试异常');
      console.log('错误信息:', error.message);
      
      results.push({
        test: '重复签到防护',
        status: 'FAIL',
        error: error.message
      });
    }
  }
  
  // 生成测试报告
  console.log('\n📊 MVP-002 API测试报告:');
  console.log('='.repeat(60));
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const totalCount = results.length;
  
  console.log(`总测试项: ${totalCount}`);
  console.log(`通过项: ${passCount}`);
  console.log(`失败项: ${totalCount - passCount}`);
  console.log(`成功率: ${Math.round((passCount / totalCount) * 100)}%`);
  
  console.log('\n详细结果:');
  results.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    if (result.details) {
      console.log(`   详情: ${result.details}`);
    }
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  return { results, successRate: Math.round((passCount / totalCount) * 100) };
}

// 运行测试
testMVP002APIs().then(result => {
  console.log('\n🎉 MVP-002 API测试完成！');
  if (result.successRate >= 75) {
    console.log('🟢 MVP-002 API功能基本正常');
    process.exit(0);
  } else {
    console.log('🟡 MVP-002 API存在问题，需要修复');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ MVP-002 API测试失败:', error.message);
  process.exit(1);
});
