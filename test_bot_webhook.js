#!/usr/bin/env node

const axios = require('axios');

// 测试Webhook的函数
async function testBotWebhook() {
  const webhookUrl = 'https://338a537.r3.cpolar.cn/webhook';
  
  // 模拟 /start 命令
  const startCommand = {
    update_id: 123456789,
    message: {
      message_id: 1,
      from: {
        id: 88888888,
        is_bot: false,
        first_name: '测试用户',
        username: 'test_user',
        language_code: 'zh-hans'
      },
      chat: {
        id: 88888888,
        first_name: '测试用户',
        username: 'test_user',
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

  // 模拟 /profile 命令
  const profileCommand = {
    update_id: 123456790,
    message: {
      message_id: 2,
      from: {
        id: 88888888,
        is_bot: false,
        first_name: '测试用户',
        username: 'test_user',
        language_code: 'zh-hans'
      },
      chat: {
        id: 88888888,
        first_name: '测试用户',
        username: 'test_user',
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

  try {
    console.log('🚀 开始测试机器人Webhook...\n');

    // 测试 /start 命令
    console.log('📝 测试 /start 命令...');
    const startResponse = await axios.post(webhookUrl, startCommand, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log('✅ /start 命令响应:', startResponse.status, startResponse.data);

    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试 /profile 命令
    console.log('\n📝 测试 /profile 命令...');
    const profileResponse = await axios.post(webhookUrl, profileCommand, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log('✅ /profile 命令响应:', profileResponse.status, profileResponse.data);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testBotWebhook();
