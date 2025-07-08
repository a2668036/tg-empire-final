#!/usr/bin/env node

const axios = require('axios');

async function testBotFunctionality() {
  console.log('🤖 开始测试Telegram Bot功能...\n');
  
  const results = [];
  
  // 测试1: 检查Bot配置
  console.log('📝 测试1: 检查Bot配置和环境变量');
  try {
    // 检查环境变量
    const envCheck = await axios.get('http://localhost:3000/health');
    console.log('✅ 后端服务运行正常');
    
    // 模拟webhook请求测试Bot处理
    const webhookUrl = 'http://localhost:3000/webhook';
    
    // 模拟 /start 命令
    const startUpdate = {
      update_id: 123456789,
      message: {
        message_id: 1,
        from: {
          id: 777666555,
          is_bot: false,
          first_name: 'Bot测试用户',
          last_name: 'Test',
          username: 'bot_test_user',
          language_code: 'zh-hans'
        },
        chat: {
          id: 777666555,
          first_name: 'Bot测试用户',
          username: 'bot_test_user',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
        entities: [
          {
            offset: 0,
            length: 6,
            type: 'bot_command'
          }
        ]
      }
    };
    
    console.log('发送模拟/start命令到webhook...');
    const startResponse = await axios.post(webhookUrl, startUpdate, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Webhook处理/start命令成功');
    console.log('响应状态:', startResponse.status);
    
    results.push({
      test: 'Bot Webhook处理',
      status: 'PASS',
      details: '/start命令处理成功'
    });
    
  } catch (error) {
    console.log('❌ Bot配置测试失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'Bot Webhook处理',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试2: 验证用户注册是否成功
  console.log('📝 测试2: 验证Bot触发的用户注册');
  try {
    // 检查用户是否被成功注册
    const userResponse = await axios.get('http://localhost:3000/api/v1/users/me', {
      headers: {
        'x-telegram-id': '777666555'
      },
      timeout: 10000
    });
    
    console.log('✅ 用户注册验证成功');
    console.log('用户数据:', JSON.stringify(userResponse.data.data, null, 2));
    
    const userData = userResponse.data.data;
    if (userData.telegram_id === '777666555') {
      console.log('✅ Telegram ID匹配');
      results.push({
        test: 'Bot用户注册',
        status: 'PASS',
        details: `用户ID: ${userData.id}, Telegram ID: ${userData.telegram_id}`
      });
    } else {
      console.log('❌ Telegram ID不匹配');
      results.push({
        test: 'Bot用户注册',
        status: 'FAIL',
        details: 'Telegram ID不匹配'
      });
    }
    
  } catch (error) {
    console.log('❌ 用户注册验证失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'Bot用户注册',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试3: 测试前端URL配置
  console.log('📝 测试3: 测试前端URL配置');
  try {
    // 检查前端页面是否可访问
    const frontendUrl = 'http://localhost:5173/src/apps/ProfileApp/index.html';
    const frontendResponse = await axios.get(frontendUrl, { timeout: 10000 });
    
    console.log('✅ 前端页面可访问');
    console.log('页面大小:', frontendResponse.data.length, '字符');
    
    // 检查页面内容
    const hasVueApp = frontendResponse.data.includes('<div id="app">');
    const hasTelegramSDK = frontendResponse.data.includes('telegram-web-app.js');
    
    if (hasVueApp && hasTelegramSDK) {
      console.log('✅ 前端页面配置正确');
      results.push({
        test: '前端页面配置',
        status: 'PASS',
        details: 'Vue应用和Telegram SDK配置正确'
      });
    } else {
      console.log('❌ 前端页面配置不完整');
      results.push({
        test: '前端页面配置',
        status: 'FAIL',
        details: `Vue应用: ${hasVueApp}, Telegram SDK: ${hasTelegramSDK}`
      });
    }
    
  } catch (error) {
    console.log('❌ 前端页面测试失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: '前端页面配置',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试4: 模拟 /profile 命令
  console.log('📝 测试4: 模拟 /profile 命令');
  try {
    const profileUpdate = {
      update_id: 123456790,
      message: {
        message_id: 2,
        from: {
          id: 777666555,
          is_bot: false,
          first_name: 'Bot测试用户',
          username: 'bot_test_user',
          language_code: 'zh-hans'
        },
        chat: {
          id: 777666555,
          first_name: 'Bot测试用户',
          username: 'bot_test_user',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/profile',
        entities: [
          {
            offset: 0,
            length: 8,
            type: 'bot_command'
          }
        ]
      }
    };
    
    const webhookUrl = 'http://localhost:3000/webhook';
    const profileResponse = await axios.post(webhookUrl, profileUpdate, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ /profile命令处理成功');
    console.log('响应状态:', profileResponse.status);
    
    results.push({
      test: 'Profile命令处理',
      status: 'PASS',
      details: '/profile命令处理成功'
    });
    
  } catch (error) {
    console.log('❌ /profile命令测试失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'Profile命令处理',
      status: 'FAIL',
      error: error.message
    });
  }
  
  // 生成测试报告
  console.log('\n📊 Bot功能测试报告:');
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
  
  console.log('\n📱 手动测试建议:');
  console.log('1. 在Telegram中找到您的Bot');
  console.log('2. 发送 /start 命令测试用户注册');
  console.log('3. 发送 /profile 命令测试Mini App启动');
  console.log('4. 点击"🏛️ 我的主页"按钮测试持久键盘');
  
  return { results, successRate: Math.round((passCount / totalCount) * 100) };
}

// 运行测试
testBotFunctionality().then(result => {
  console.log('\n🎉 Bot功能测试完成！');
  if (result.successRate >= 75) {
    console.log('🟢 Bot功能基本正常，可以进行手动测试');
    process.exit(0);
  } else {
    console.log('🟡 Bot功能存在问题，需要检查配置');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Bot功能测试失败:', error.message);
  process.exit(1);
});
