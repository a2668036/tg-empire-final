#!/usr/bin/env node

/**
 * 动画效果测试脚本
 * 测试签到动画和数值变化动效
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_TELEGRAM_ID = '888999777'; // 新的测试用户

// 创建API客户端
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-telegram-id': TEST_TELEGRAM_ID
  }
});

async function testAnimations() {
  console.log('🎬 开始测试动画效果...\n');
  
  try {
    // 1. 获取用户信息
    console.log('📋 获取用户信息...');
    const userResponse = await api.get('/users/me');
    console.log('✅ 用户信息:', {
      id: userResponse.data.id,
      telegram_id: userResponse.data.telegram_id,
      username: userResponse.data.username,
      reputation_points: userResponse.data.reputation_points,
      last_check_in_date: userResponse.data.last_check_in_date
    });
    
    // 2. 测试签到功能（应该触发动画）
    console.log('\n🎯 测试签到功能...');
    try {
      const checkInResponse = await api.post('/users/check-in');
      console.log('✅ 签到成功:', {
        message: checkInResponse.data.message,
        rewards: checkInResponse.data.rewards,
        newReputationPoints: checkInResponse.data.user.reputation_points
      });
      
      console.log('\n🎨 动画效果应该包括:');
      console.log('  - 签到按钮显示加载状态');
      console.log('  - 声望点数数值变化动画');
      console.log('  - 签到成功弹窗动画');
      console.log(`  - 获得 ${checkInResponse.data.rewards.totalPoints} 点声望`);
      
    } catch (checkInError) {
      if (checkInError.response?.status === 400) {
        console.log('⚠️ 用户今日已签到，这是正常行为');
        console.log('   可以明天再测试签到动画效果');
      } else {
        console.log('❌ 签到失败:', checkInError.message);
      }
    }
    
    // 3. 验证前端页面可访问性
    console.log('\n🌐 验证前端页面...');
    try {
      const frontendResponse = await axios.get('http://localhost:5174/src/apps/ProfileApp/index.html');
      console.log('✅ 前端页面可访问');
      console.log('   页面大小:', frontendResponse.data.length, '字符');
    } catch (frontendError) {
      console.log('❌ 前端页面访问失败:', frontendError.message);
    }
    
    // 4. 提供测试建议
    console.log('\n📱 手动测试建议:');
    console.log('1. 在浏览器中打开: http://localhost:5174/src/apps/ProfileApp/index.html');
    console.log('2. 在开发者工具中模拟Telegram WebApp环境');
    console.log('3. 点击签到按钮观察动画效果');
    console.log('4. 检查声望点数是否有数值变化动画');
    console.log('5. 观察签到成功弹窗动画');
    
    console.log('\n🎯 Telegram Bot测试:');
    console.log('1. 在Telegram中发送 /start 给机器人');
    console.log('2. 点击"🏛️ 我的主页"按钮');
    console.log('3. 在Mini App中点击签到按钮');
    console.log('4. 观察完整的动画效果');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testAnimations().catch(console.error);
