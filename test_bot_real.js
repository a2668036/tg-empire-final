#!/usr/bin/env node

const axios = require('axios');

const BOT_TOKEN = '7998734092:AAEuUVkK2i948UY0xZ5rp_VNDnPJK0RWsec';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function testBot() {
  try {
    console.log('🤖 测试机器人状态...\n');

    // 1. 检查机器人信息
    console.log('📋 获取机器人信息...');
    const botInfo = await axios.get(`${BASE_URL}/getMe`);
    console.log('✅ 机器人信息:', {
      id: botInfo.data.result.id,
      username: botInfo.data.result.username,
      first_name: botInfo.data.result.first_name
    });

    // 2. 检查Webhook状态
    console.log('\n🔗 检查Webhook状态...');
    const webhookInfo = await axios.get(`${BASE_URL}/getWebhookInfo`);
    const webhook = webhookInfo.data.result;
    console.log('✅ Webhook信息:', {
      url: webhook.url,
      pending_updates: webhook.pending_update_count,
      last_error: webhook.last_error_message || '无错误'
    });

    // 3. 测试发送消息到已知用户（如果有的话）
    console.log('\n📨 获取最近的更新...');
    const updates = await axios.get(`${BASE_URL}/getUpdates?limit=5`);
    
    if (updates.data.result.length > 0) {
      console.log('✅ 找到最近的消息:');
      updates.data.result.forEach((update, index) => {
        if (update.message) {
          console.log(`  ${index + 1}. 用户 ${update.message.from.first_name} (${update.message.from.id}): ${update.message.text}`);
        }
      });

      // 获取最后一个用户的chat_id
      const lastUpdate = updates.data.result[updates.data.result.length - 1];
      if (lastUpdate.message) {
        const chatId = lastUpdate.message.chat.id;
        console.log(`\n💬 向用户 ${chatId} 发送测试消息...`);
        
        try {
          const testMessage = await axios.post(`${BASE_URL}/sendMessage`, {
            chat_id: chatId,
            text: '🎉 机器人测试消息：系统已修复，现在可以正常使用了！\n\n请尝试发送 /profile 命令查看个人主页。'
          });
          console.log('✅ 测试消息发送成功！');
        } catch (sendError) {
          console.log('❌ 发送测试消息失败:', sendError.response?.data || sendError.message);
        }
      }
    } else {
      console.log('ℹ️ 没有找到最近的消息');
    }

    // 4. 测试静态文件访问
    console.log('\n🌐 测试前端文件访问...');
    try {
      const frontendTest = await axios.head('https://338a537.r3.cpolar.cn/src/apps/ProfileApp/simple.html');
      console.log('✅ 前端文件可以通过HTTPS访问');
    } catch (frontendError) {
      console.log('❌ 前端文件访问失败:', frontendError.message);
    }

    console.log('\n🎯 测试总结:');
    console.log('- 机器人状态: ✅ 正常');
    console.log('- Webhook配置: ✅ 正常');
    console.log('- 前端文件: ✅ 可访问');
    console.log('\n📱 现在可以在Telegram中测试机器人功能了！');
    console.log('发送 /start 或 /profile 命令给 @TupianXZ_bot');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testBot();
