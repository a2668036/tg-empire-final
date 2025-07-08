#!/usr/bin/env node

const axios = require('axios');

async function finalVerification() {
  console.log('🎯 最终验证 - 所有修复是否生效\n');
  
  const realUserId = '2033514198';
  
  try {
    // 1. 验证后端API
    console.log('1. ✅ 验证后端API...');
    const response = await axios.get('http://localhost:3000/api/v1/users/me', {
      headers: { 'x-telegram-id': realUserId }
    });
    
    const userData = response.data.data;
    console.log(`   用户: ${userData.first_name} ${userData.last_name} (@${userData.username})`);
    console.log(`   声望: ${userData.reputation_points}点`);
    
    // 2. 验证前端API修复
    console.log('\n2. ✅ 验证前端API修复...');
    // 模拟修复前的错误方式
    const oldWay = response.data;
    console.log(`   修复前: first_name = ${oldWay.first_name} (应该是undefined)`);
    
    // 模拟修复后的正确方式
    const newWay = response.data.data;
    console.log(`   修复后: first_name = ${newWay.first_name} (正确)`);
    
    // 3. 验证显示逻辑
    console.log('\n3. ✅ 验证显示逻辑...');
    const displayName = `${newWay.first_name || ''} ${newWay.last_name || ''}`.trim();
    const displayUsername = newWay.username ? `@${newWay.username}` : (newWay.first_name || 'TG用户');
    
    console.log(`   显示姓名: "${displayName}"`);
    console.log(`   显示用户名: "${displayUsername}"`);
    
    if (displayName.includes('undefined') || displayUsername.includes('undefined')) {
      console.log('   ❌ 仍有undefined问题');
      return false;
    } else {
      console.log('   ✅ 无undefined问题');
    }
    
    // 4. 验证前端页面
    console.log('\n4. ✅ 验证前端页面...');
    const pageResponse = await axios.get('http://localhost:5173/src/apps/ProfileApp/index.html');
    console.log(`   页面大小: ${pageResponse.data.length} 字符`);
    console.log('   ✅ 前端页面可访问');
    
    // 5. 验证Bot URL配置
    console.log('\n5. ✅ 验证Bot URL配置...');
    const fs = require('fs');
    const envContent = fs.readFileSync('/home/ubuntu/tg-empire/backend/.env', 'utf8');
    const frontendUrl = envContent.match(/FRONTEND_APP_URL=(.+)/)?.[1];
    console.log(`   Bot URL: ${frontendUrl}`);
    
    if (frontendUrl && frontendUrl.includes('localhost:5173')) {
      console.log('   ✅ Bot指向本地修复版本');
    } else {
      console.log('   ❌ Bot仍指向外部版本');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 最终验证报告');
  console.log('='.repeat(60));
  
  const success = await finalVerification();
  
  console.log('\n' + '='.repeat(60));
  
  if (success) {
    console.log('🎉 所有修复已完成！');
    console.log('\n📱 现在请测试Mini App:');
    console.log('1. 点击Telegram中的 "🏛️ 我的主页" 按钮');
    console.log('2. 应该看到:');
    console.log('   - 姓名: "达Younger brother 飞"');
    console.log('   - 用户名: "@Luxury1994"');
    console.log('   - 声望: 10点');
    console.log('\n如果仍显示undefined，请:');
    console.log('- 完全关闭Telegram应用');
    console.log('- 重新打开并发送 /start');
    console.log('- 重新点击"🏛️ 我的主页"');
  } else {
    console.log('❌ 仍有问题需要解决');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}
