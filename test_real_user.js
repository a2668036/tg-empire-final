#!/usr/bin/env node

const axios = require('axios');

async function testRealUser() {
  console.log('🧪 测试真实用户数据获取...\n');
  
  const realUserId = '2033514198'; // 您的真实Telegram ID
  
  try {
    // 1. 测试后端API
    console.log('1. 测试后端API响应:');
    const response = await axios.get('http://localhost:3000/api/v1/users/me', {
      headers: { 'x-telegram-id': realUserId }
    });
    
    console.log('API响应结构:', {
      success: response.data.success,
      hasData: !!response.data.data
    });
    
    const userData = response.data.data;
    console.log('用户数据:', {
      id: userData.id,
      telegram_id: userData.telegram_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      reputation_points: userData.reputation_points
    });
    
    // 2. 模拟前端显示逻辑
    console.log('\n2. 模拟前端显示逻辑:');
    
    // 模拟修复后的前端获取数据
    const frontendUserData = response.data.data; // 这是修复后的方式
    
    // Vue模板显示逻辑
    const displayName = `${frontendUserData.first_name || ''} ${frontendUserData.last_name || ''}`.trim();
    const displayUsername = frontendUserData.username 
      ? `@${frontendUserData.username}` 
      : (frontendUserData.first_name || 'TG用户');
    
    console.log('前端应该显示:');
    console.log(`  姓名: "${displayName}"`);
    console.log(`  用户名: "${displayUsername}"`);
    console.log(`  声望: ${frontendUserData.reputation_points}`);
    
    // 3. 检查是否还有undefined问题
    console.log('\n3. 检查undefined问题:');
    if (displayName.includes('undefined') || displayUsername.includes('undefined')) {
      console.log('❌ 仍然存在undefined问题');
      console.log('原始数据检查:');
      console.log('  first_name:', typeof frontendUserData.first_name, frontendUserData.first_name);
      console.log('  last_name:', typeof frontendUserData.last_name, frontendUserData.last_name);
      console.log('  username:', typeof frontendUserData.username, frontendUserData.username);
    } else {
      console.log('✅ 显示逻辑正确，无undefined问题');
    }
    
    // 4. 测试前端页面
    console.log('\n4. 测试前端页面可访问性:');
    try {
      const pageResponse = await axios.get('http://localhost:5173/src/apps/ProfileApp/index.html');
      console.log('✅ 前端页面可访问');
      
      // 检查页面是否包含Vue应用
      if (pageResponse.data.includes('ProfileApp.vue') || pageResponse.data.includes('vue')) {
        console.log('✅ Vue应用正确加载');
      } else {
        console.log('⚠️ 可能的Vue应用加载问题');
      }
    } catch (error) {
      console.log('❌ 前端页面访问失败:', error.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

async function main() {
  console.log('🔍 真实用户数据测试');
  console.log('='.repeat(50));
  
  const success = await testRealUser();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ 测试完成 - 数据应该正确显示');
    console.log('\n📱 请现在重新打开Mini App测试:');
    console.log('1. 在Telegram中发送 /start');
    console.log('2. 点击 "🏛️ 我的主页" 按钮');
    console.log('3. 应该看到正确的用户信息');
  } else {
    console.log('❌ 测试失败 - 需要进一步调试');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}
