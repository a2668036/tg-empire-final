#!/usr/bin/env node

const axios = require('axios');

// 测试配置
const API_BASE = 'http://localhost:3000/api/v1';
const TEST_USER = {
  telegram_id: '999888777',
  username: 'test_mvp001',
  first_name: 'MVP测试',
  last_name: 'Tester'
};

async function testMVP001APIs() {
  console.log('🧪 开始MVP-001 API功能测试...\n');
  
  const results = [];
  
  // 测试1: 用户注册API
  console.log('📝 测试1: 用户注册API (POST /api/v1/users/register)');
  try {
    const registerData = {
      telegram_id: TEST_USER.telegram_id,
      username: TEST_USER.username,
      first_name: TEST_USER.first_name,
      last_name: TEST_USER.last_name
    };
    
    console.log('请求数据:', JSON.stringify(registerData, null, 2));
    
    const response = await axios.post(`${API_BASE}/users/register`, registerData, {
      timeout: 10000
    });
    
    console.log('✅ 用户注册成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '用户注册API',
      status: 'PASS',
      details: `用户ID: ${response.data.data?.id}, Telegram ID: ${response.data.data?.telegram_id}`
    });
    
  } catch (error) {
    console.log('❌ 用户注册失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '用户注册API',
      status: 'FAIL',
      error: error.message,
      details: error.response?.data
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试2: 用户信息获取API
  console.log('📝 测试2: 用户信息获取API (GET /api/v1/users/me)');
  try {
    const response = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        'x-telegram-id': TEST_USER.telegram_id
      },
      timeout: 10000
    });
    
    console.log('✅ 用户信息获取成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '用户信息获取API',
      status: 'PASS',
      details: `用户名: ${response.data.data?.username}, 声望: ${response.data.data?.reputation_points}`
    });
    
  } catch (error) {
    console.log('❌ 用户信息获取失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '用户信息获取API',
      status: 'FAIL',
      error: error.message,
      details: error.response?.data
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试3: 用户信息更新API
  console.log('📝 测试3: 用户信息更新API (PUT /api/v1/users/me)');
  try {
    const updateData = {
      first_name: 'MVP测试更新',
      profile_bio: '这是MVP-001测试用户的个人简介'
    };
    
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(`${API_BASE}/users/me`, updateData, {
      headers: {
        'x-telegram-id': TEST_USER.telegram_id,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ 用户信息更新成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    results.push({
      test: '用户信息更新API',
      status: 'PASS',
      details: `更新后姓名: ${response.data.data?.first_name}, 简介: ${response.data.data?.profile_bio}`
    });
    
  } catch (error) {
    console.log('❌ 用户信息更新失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      test: '用户信息更新API',
      status: 'FAIL',
      error: error.message,
      details: error.response?.data
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试4: 验证更新后的用户信息
  console.log('📝 测试4: 验证更新后的用户信息');
  try {
    const response = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        'x-telegram-id': TEST_USER.telegram_id
      },
      timeout: 10000
    });
    
    const userData = response.data.data;
    console.log('✅ 用户信息验证成功');
    console.log('当前用户数据:', JSON.stringify(userData, null, 2));
    
    // 验证更新是否生效
    const isUpdated = userData.first_name === 'MVP测试更新' &&
                     userData.profile_bio === '这是MVP-001测试用户的个人简介';
    
    if (isUpdated) {
      console.log('✅ 数据更新验证通过');
      results.push({
        test: '数据更新验证',
        status: 'PASS',
        details: '用户信息更新已正确保存到数据库'
      });
    } else {
      console.log('❌ 数据更新验证失败');
      results.push({
        test: '数据更新验证',
        status: 'FAIL',
        details: '用户信息更新未正确保存到数据库'
      });
    }
    
  } catch (error) {
    console.log('❌ 用户信息验证失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: '数据更新验证',
      status: 'FAIL',
      error: error.message
    });
  }
  
  // 生成测试报告
  console.log('\n📊 MVP-001 API测试报告:');
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
testMVP001APIs().then(result => {
  console.log('\n🎉 MVP-001 API测试完成！');
  if (result.successRate >= 75) {
    console.log('🟢 MVP-001 API功能基本正常');
    process.exit(0);
  } else {
    console.log('🟡 MVP-001 API存在问题，需要修复');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ MVP-001 API测试失败:', error.message);
  process.exit(1);
});
