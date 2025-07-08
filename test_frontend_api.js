#!/usr/bin/env node

const axios = require('axios');

// 测试前端API调用
async function testFrontendAPI() {
  console.log('🧪 测试前端API数据获取...\n');
  
  const testUserId = '2033514198';
  
  try {
    // 1. 直接测试后端API
    console.log('1. 测试后端API直接调用:');
    const backendResponse = await axios.get('http://localhost:3000/api/v1/users/me', {
      headers: { 'x-telegram-id': testUserId }
    });
    
    console.log('后端响应结构:', {
      success: backendResponse.data.success,
      hasData: !!backendResponse.data.data,
      dataKeys: Object.keys(backendResponse.data.data || {})
    });
    
    console.log('用户数据:', {
      id: backendResponse.data.data.id,
      telegram_id: backendResponse.data.data.telegram_id,
      first_name: backendResponse.data.data.first_name,
      last_name: backendResponse.data.data.last_name,
      username: backendResponse.data.data.username,
      reputation_points: backendResponse.data.data.reputation_points
    });
    
    // 2. 模拟前端API调用（修复前）
    console.log('\n2. 模拟前端API调用（修复前 - response.data）:');
    const frontendOldWay = backendResponse.data;
    console.log('前端获取到的数据（错误方式）:', {
      type: typeof frontendOldWay,
      keys: Object.keys(frontendOldWay),
      first_name: frontendOldWay.first_name, // 应该是undefined
      username: frontendOldWay.username // 应该是undefined
    });
    
    // 3. 模拟前端API调用（修复后）
    console.log('\n3. 模拟前端API调用（修复后 - response.data.data）:');
    const frontendNewWay = backendResponse.data.data;
    console.log('前端获取到的数据（正确方式）:', {
      type: typeof frontendNewWay,
      keys: Object.keys(frontendNewWay),
      first_name: frontendNewWay.first_name,
      last_name: frontendNewWay.last_name,
      username: frontendNewWay.username,
      reputation_points: frontendNewWay.reputation_points
    });
    
    // 4. 测试前端页面是否可访问
    console.log('\n4. 测试前端页面可访问性:');
    try {
      const frontendPageResponse = await axios.get('http://localhost:5173/src/apps/ProfileApp/index.html');
      console.log('✅ 前端页面可访问，大小:', frontendPageResponse.data.length, '字符');
    } catch (error) {
      console.log('❌ 前端页面不可访问:', error.message);
    }
    
    // 5. 验证显示逻辑
    console.log('\n5. 验证显示逻辑:');
    const user = frontendNewWay;
    
    // 模拟Vue模板逻辑
    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const displayUsername = user.username ? `@${user.username}` : (user.first_name || 'TG用户');
    
    console.log('显示效果:');
    console.log(`  姓名: "${displayName}"`);
    console.log(`  用户名: "${displayUsername}"`);
    console.log(`  声望: ${user.reputation_points}`);
    
    if (displayName === 'undefined undefined' || displayUsername === '@undefined') {
      console.log('❌ 仍然存在undefined显示问题');
    } else {
      console.log('✅ 显示逻辑正确');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 测试用户注册流程
async function testUserRegistration() {
  console.log('\n🔧 测试用户注册流程...\n');
  
  const testUser = {
    telegram_id: 9999999999,
    username: 'test_frontend_user',
    first_name: '前端测试',
    last_name: '用户'
  };
  
  try {
    // 1. 注册用户
    console.log('1. 注册测试用户...');
    const registerResponse = await axios.post('http://localhost:3000/api/v1/users/register', testUser);
    
    console.log('注册响应结构:', {
      success: registerResponse.data.success,
      hasData: !!registerResponse.data.data,
      message: registerResponse.data.message
    });
    
    // 2. 模拟前端注册处理（修复后）
    console.log('\n2. 模拟前端注册处理:');
    if (registerResponse.data.success && registerResponse.data.data) {
      const userData = registerResponse.data.data;
      console.log('✅ 注册成功，用户数据:', {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username
      });
      
      // 验证显示
      const displayName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
      const displayUsername = userData.username ? `@${userData.username}` : (userData.first_name || 'TG用户');
      
      console.log('注册后显示效果:');
      console.log(`  姓名: "${displayName}"`);
      console.log(`  用户名: "${displayUsername}"`);
    } else {
      console.log('❌ 注册响应格式错误');
    }
    
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log('ℹ️ 用户已存在，跳过注册测试');
    } else {
      console.error('❌ 注册测试失败:', error.message);
    }
  }
}

// 主函数
async function main() {
  console.log('🔍 前端API数据获取测试\n');
  console.log('=' .repeat(50));
  
  await testFrontendAPI();
  await testUserRegistration();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 测试完成');
}

if (require.main === module) {
  main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}
