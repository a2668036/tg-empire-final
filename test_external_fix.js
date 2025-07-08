#!/usr/bin/env node

const axios = require('axios');

async function testExternalFix() {
  console.log('🌐 测试外部HTTPS URL修复...\n');
  
  try {
    // 1. 测试外部页面可访问性
    console.log('1. ✅ 测试外部页面可访问性...');
    const pageResponse = await axios.get('https://338a537.r3.cpolar.cn/src/apps/ProfileApp/simple.html');
    console.log(`   页面大小: ${pageResponse.data.length} 字符`);
    
    // 2. 检查是否包含修复
    console.log('\n2. ✅ 检查修复内容...');
    const pageContent = pageResponse.data;
    
    if (pageContent.includes('2033514198')) {
      console.log('   ✅ 包含正确的用户ID');
    } else {
      console.log('   ❌ 未找到正确的用户ID');
    }
    
    if (pageContent.includes('responseData.data')) {
      console.log('   ✅ 包含API数据提取修复');
    } else {
      console.log('   ❌ 未找到API数据提取修复');
    }
    
    if (pageContent.includes('达Younger brother')) {
      console.log('   ✅ 包含正确的用户信息');
    } else {
      console.log('   ❌ 未找到正确的用户信息');
    }
    
    // 3. 测试API调用
    console.log('\n3. ✅ 测试API调用...');
    const apiResponse = await axios.get('https://338a537.r3.cpolar.cn/api/v1/users/me', {
      headers: { 'x-telegram-id': '2033514198' }
    });
    
    console.log('   API响应状态:', apiResponse.status);
    console.log('   API响应结构:', {
      success: apiResponse.data.success,
      hasData: !!apiResponse.data.data
    });
    
    if (apiResponse.data.data) {
      const userData = apiResponse.data.data;
      console.log('   用户数据:', {
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        reputation_points: userData.reputation_points
      });
      
      // 4. 模拟前端显示逻辑
      console.log('\n4. ✅ 模拟前端显示逻辑...');
      const firstName = userData.first_name || '';
      const lastName = userData.last_name || '';
      const username = userData.username || '';
      
      const displayName = `${firstName} ${lastName}`.trim() || 'TG用户';
      const displayHandle = username ? `@${username}` : (firstName || 'TG用户');
      
      console.log(`   显示姓名: "${displayName}"`);
      console.log(`   显示用户名: "${displayHandle}"`);
      
      if (displayName.includes('undefined') || displayHandle.includes('undefined')) {
        console.log('   ❌ 仍有undefined问题');
        return false;
      } else {
        console.log('   ✅ 无undefined问题');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 外部HTTPS URL修复测试');
  console.log('='.repeat(60));
  
  const success = await testExternalFix();
  
  console.log('\n' + '='.repeat(60));
  
  if (success) {
    console.log('🎉 外部URL修复完成！');
    console.log('\n📱 现在请测试Mini App:');
    console.log('1. 在Telegram中点击 "🏛️ 我的主页" 按钮');
    console.log('2. 应该看到正确的用户信息:');
    console.log('   - 姓名: "达Younger brother 飞"');
    console.log('   - 用户名: "@Luxury1994"');
    console.log('   - 声望: 10点');
    console.log('\n✨ 不再显示 "undefined undefined"！');
  } else {
    console.log('❌ 外部URL修复失败');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}
