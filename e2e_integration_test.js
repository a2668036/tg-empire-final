#!/usr/bin/env node

const axios = require('axios');

// 测试配置
const API_BASE = 'http://localhost:3000/api/v1';
const FRONTEND_BASE = 'http://localhost:5173';
const TEST_USER_ID = '555444333'; // 新的端到端测试用户

// 服务健康检查函数
async function checkServicesHealth() {
  console.log('🔍 检查服务健康状态...');

  // 检查后端服务
  try {
    const backendHealth = await axios.get('http://localhost:3000/health', { timeout: 5000 });
    console.log('✅ 后端服务健康');
  } catch (error) {
    throw new Error(`后端服务不可用: ${error.message}`);
  }

  // 检查前端服务
  try {
    const frontendHealth = await axios.get('http://localhost:5173/src/apps/ProfileApp/index.html', { timeout: 5000 });
    console.log('✅ 前端服务健康');
  } catch (error) {
    throw new Error(`前端服务不可用: ${error.message}`);
  }

  console.log('✅ 所有服务健康检查通过\n');
}

async function runE2ETest() {
  console.log('🚀 开始端到端集成测试...\n');

  // 首先进行服务健康检查
  await checkServicesHealth();

  const results = [];
  let testUser = null;
  
  // 步骤1: 直接测试用户注册API（跳过Bot webhook以避免Telegram API调用）
  console.log('📝 步骤1: 测试用户注册流程');
  try {
    // 直接调用用户注册API
    console.log('调用用户注册API...');
    const registerResponse = await axios.post(`${API_BASE}/users/register`, {
      telegram_id: TEST_USER_ID,
      username: 'e2e_test_user',
      first_name: '端到端测试',
      last_name: '用户'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('✅ 用户注册API调用成功');
    console.log('响应状态:', registerResponse.status);
    console.log('注册结果:', JSON.stringify(registerResponse.data, null, 2));
    
    // 验证用户注册结果
    const userResponse = await axios.get(`${API_BASE}/users/me`, {
      headers: { 'x-telegram-id': TEST_USER_ID },
      timeout: 10000
    });
    
    testUser = userResponse.data.data;
    console.log('✅ 用户自动注册成功');
    console.log('用户信息:', JSON.stringify(testUser, null, 2));
    
    results.push({
      step: '用户注册流程',
      status: 'PASS',
      details: `用户ID: ${testUser.id}, Telegram ID: ${testUser.telegram_id}`
    });
    
  } catch (error) {
    console.log('❌ 用户注册失败');
    console.log('错误信息:', error.message);

    results.push({
      step: '用户注册流程',
      status: 'FAIL',
      error: error.message
    });
    return results; // 如果注册失败，后续测试无法进行
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 步骤2: 测试前端页面访问
  console.log('📝 步骤2: 测试前端页面访问');
  try {
    const frontendUrl = `${FRONTEND_BASE}/src/apps/ProfileApp/index.html`;
    const pageResponse = await axios.get(frontendUrl, { timeout: 10000 });
    
    console.log('✅ 前端页面可访问');
    console.log('页面大小:', pageResponse.data.length, '字符');
    
    // 检查页面内容
    const hasVueApp = pageResponse.data.includes('<div id="app">');
    const hasTelegramSDK = pageResponse.data.includes('telegram-web-app.js');
    
    if (hasVueApp && hasTelegramSDK) {
      results.push({
        step: '前端页面访问',
        status: 'PASS',
        details: 'Vue应用和Telegram SDK配置正确'
      });
    } else {
      results.push({
        step: '前端页面访问',
        status: 'FAIL',
        details: '页面配置不完整'
      });
    }
    
  } catch (error) {
    console.log('❌ 前端页面访问失败');
    console.log('错误信息:', error.message);
    
    results.push({
      step: '前端页面访问',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 步骤3: 测试用户信息更新流程
  console.log('📝 步骤3: 测试用户信息更新流程');
  try {
    const updateData = {
      first_name: '端到端测试更新',
      profile_bio: '这是端到端测试用户的个人简介'
    };
    
    const updateResponse = await axios.put(`${API_BASE}/users/me`, updateData, {
      headers: {
        'x-telegram-id': TEST_USER_ID,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ 用户信息更新成功');
    console.log('更新后数据:', JSON.stringify(updateResponse.data.data, null, 2));
    
    results.push({
      step: '用户信息更新',
      status: 'PASS',
      details: `姓名更新为: ${updateResponse.data.data.first_name}`
    });
    
  } catch (error) {
    console.log('❌ 用户信息更新失败');
    console.log('错误信息:', error.message);
    
    results.push({
      step: '用户信息更新',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 步骤4: 测试完整签到流程
  console.log('📝 步骤4: 测试完整签到流程');
  try {
    // 4.1 检查签到前状态
    const beforeStatus = await axios.get(`${API_BASE}/check-in/status`, {
      headers: { 'x-telegram-id': TEST_USER_ID },
      timeout: 10000
    });
    
    console.log('签到前状态:', JSON.stringify(beforeStatus.data, null, 2));
    
    // 4.2 执行签到
    const checkInResponse = await axios.post(`${API_BASE}/check-in`, {}, {
      headers: {
        'x-telegram-id': TEST_USER_ID,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ 签到成功');
    console.log('签到结果:', JSON.stringify(checkInResponse.data, null, 2));
    
    // 4.3 检查签到后状态
    const afterStatus = await axios.get(`${API_BASE}/check-in/status`, {
      headers: { 'x-telegram-id': TEST_USER_ID },
      timeout: 10000
    });
    
    console.log('签到后状态:', JSON.stringify(afterStatus.data, null, 2));
    
    // 4.4 验证签到历史
    const history = await axios.get(`${API_BASE}/check-in/history?limit=5`, {
      headers: { 'x-telegram-id': TEST_USER_ID },
      timeout: 10000
    });
    
    console.log('签到历史:', JSON.stringify(history.data, null, 2));
    
    results.push({
      step: '完整签到流程',
      status: 'PASS',
      details: `获得${checkInResponse.data.rewards?.totalPoints || 'N/A'}点声望`
    });
    
  } catch (error) {
    console.log('❌ 签到流程失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    results.push({
      step: '完整签到流程',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 步骤5: 测试声望系统集成
  console.log('📝 步骤5: 测试声望系统集成');
  try {
    // 5.1 获取声望历史
    const reputationHistory = await axios.get(`${API_BASE}/reputation/history?limit=5`, {
      headers: { 'x-telegram-id': TEST_USER_ID },
      timeout: 10000
    });
    
    console.log('✅ 声望历史获取成功');
    console.log('声望历史:', JSON.stringify(reputationHistory.data, null, 2));
    
    // 5.2 获取声望统计
    const reputationStats = await axios.get(`${API_BASE}/reputation/stats`, {
      headers: { 'x-telegram-id': TEST_USER_ID },
      timeout: 10000
    });
    
    console.log('✅ 声望统计获取成功');
    console.log('声望统计:', JSON.stringify(reputationStats.data, null, 2));
    
    results.push({
      step: '声望系统集成',
      status: 'PASS',
      details: `当前声望: ${reputationStats.data.currentPoints || 'N/A'}点`
    });
    
  } catch (error) {
    console.log('❌ 声望系统测试失败');
    console.log('错误信息:', error.message);
    
    results.push({
      step: '声望系统集成',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 步骤6: 测试重复签到防护
  console.log('📝 步骤6: 测试重复签到防护');
  try {
    const duplicateCheckIn = await axios.post(`${API_BASE}/check-in`, {}, {
      headers: {
        'x-telegram-id': TEST_USER_ID,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('❌ 重复签到应该被阻止但成功了');
    results.push({
      step: '重复签到防护',
      status: 'FAIL',
      details: '重复签到没有被正确阻止'
    });
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ 重复签到被正确阻止');
      console.log('错误信息:', error.response.data);
      
      results.push({
        step: '重复签到防护',
        status: 'PASS',
        details: '重复签到被正确阻止'
      });
    } else {
      console.log('❌ 重复签到测试异常');
      console.log('错误信息:', error.message);
      
      results.push({
        step: '重复签到防护',
        status: 'FAIL',
        error: error.message
      });
    }
  }
  
  // 生成测试报告
  console.log('\n📊 端到端集成测试报告:');
  console.log('='.repeat(60));
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const totalCount = results.length;
  
  console.log(`总测试步骤: ${totalCount}`);
  console.log(`通过步骤: ${passCount}`);
  console.log(`失败步骤: ${totalCount - passCount}`);
  console.log(`成功率: ${Math.round((passCount / totalCount) * 100)}%`);
  
  console.log('\n详细结果:');
  results.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.step}`);
    if (result.details) {
      console.log(`   详情: ${result.details}`);
    }
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  console.log('\n🎯 测试总结:');
  if (passCount === totalCount) {
    console.log('🟢 所有端到端流程测试通过！系统集成完整且功能正常。');
  } else if (passCount >= totalCount * 0.8) {
    console.log('🟡 大部分端到端流程测试通过，存在少量问题需要修复。');
  } else {
    console.log('🔴 端到端流程测试存在较多问题，需要重点修复。');
  }
  
  return { results, successRate: Math.round((passCount / totalCount) * 100) };
}

// 运行测试
runE2ETest().then(result => {
  console.log('\n🎉 端到端集成测试完成！');
  if (result.successRate >= 80) {
    console.log('🟢 系统集成测试通过，可以进行生产部署');
    process.exit(0);
  } else {
    console.log('🟡 系统集成存在问题，建议修复后再部署');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ 端到端集成测试失败:', error.message);
  process.exit(1);
});
