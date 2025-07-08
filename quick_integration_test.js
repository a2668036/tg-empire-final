#!/usr/bin/env node

const axios = require('axios');

async function quickIntegrationTest() {
  console.log('⚡ 快速集成测试...\n');
  
  const results = [];
  const TEST_USER_ID = '111222333';
  
  try {
    // 1. 健康检查
    console.log('1. 后端健康检查...');
    const health = await axios.get('http://localhost:3000/health');
    console.log('✅ 后端服务正常');
    results.push('✅ 后端服务');
    
    // 2. 用户注册
    console.log('2. 用户注册测试...');
    try {
      await axios.post('http://localhost:3000/api/v1/users/register', {
        telegram_id: TEST_USER_ID,
        username: 'quick_test',
        first_name: '快速测试',
        last_name: '用户'
      });
      console.log('✅ 用户注册成功');
      results.push('✅ 用户注册');
    } catch (error) {
      if (error.response && error.response.status === 201) {
        console.log('✅ 用户已存在');
        results.push('✅ 用户注册');
      } else {
        throw error;
      }
    }
    
    // 3. 用户信息获取
    console.log('3. 用户信息获取...');
    const userInfo = await axios.get('http://localhost:3000/api/v1/users/me', {
      headers: { 'x-telegram-id': TEST_USER_ID }
    });
    console.log('✅ 用户信息获取成功');
    results.push('✅ 用户信息获取');
    
    // 4. 签到功能
    console.log('4. 签到功能测试...');
    try {
      const checkIn = await axios.post('http://localhost:3000/api/v1/check-in', {}, {
        headers: { 'x-telegram-id': TEST_USER_ID }
      });
      console.log('✅ 签到成功');
      results.push('✅ 签到功能');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 重复签到防护正常');
        results.push('✅ 签到功能');
      } else {
        throw error;
      }
    }
    
    // 5. 签到历史
    console.log('5. 签到历史查询...');
    const history = await axios.get('http://localhost:3000/api/v1/check-in/history', {
      headers: { 'x-telegram-id': TEST_USER_ID }
    });
    console.log('✅ 签到历史查询成功');
    results.push('✅ 签到历史');
    
    // 6. 声望系统
    console.log('6. 声望系统测试...');
    const reputation = await axios.get('http://localhost:3000/api/v1/reputation/history', {
      headers: { 'x-telegram-id': TEST_USER_ID }
    });
    console.log('✅ 声望系统正常');
    results.push('✅ 声望系统');
    
    // 7. 前端页面
    console.log('7. 前端页面检查...');
    const frontend = await axios.get('http://localhost:5173/src/apps/ProfileApp/index.html');
    console.log('✅ 前端页面可访问');
    results.push('✅ 前端页面');
    
    // 8. Bot webhook
    console.log('8. Bot webhook测试...');
    const webhook = await axios.post('http://localhost:3000/webhook', {
      update_id: 123,
      message: {
        message_id: 1,
        from: { id: 999, first_name: 'Test' },
        chat: { id: 999 },
        date: Math.floor(Date.now() / 1000),
        text: '/start'
      }
    });
    console.log('✅ Bot webhook正常');
    results.push('✅ Bot webhook');
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    results.push('❌ 测试失败');
  }
  
  console.log('\n📊 快速集成测试结果:');
  console.log('='.repeat(40));
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result}`);
  });
  
  const passCount = results.filter(r => r.includes('✅')).length;
  console.log(`\n成功率: ${passCount}/${results.length} (${Math.round(passCount/results.length*100)}%)`);
  
  if (passCount === results.length) {
    console.log('🎉 所有集成测试通过！');
    return true;
  } else {
    console.log('⚠️ 部分测试失败');
    return false;
  }
}

quickIntegrationTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试异常:', error.message);
  process.exit(1);
});
