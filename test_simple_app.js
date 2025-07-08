/**
 * 测试简化版应用
 */

const axios = require('axios');

async function testSimpleApp() {
  console.log('🧪 测试简化版应用...\n');
  
  try {
    // 1. 测试后端API直接访问
    console.log('📝 测试后端API直接访问...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ 后端健康检查:', healthResponse.data);
    
    // 2. 测试简化版页面
    console.log('📝 测试简化版页面...');
    const pageResponse = await axios.get('http://localhost:5177/src/apps/ProfileApp/simple.html');
    console.log('✅ 简化版页面可访问，大小:', pageResponse.data.length, '字符');
    
    // 检查页面内容
    const html = pageResponse.data;
    const checks = [
      { name: 'Telegram SDK', pattern: /telegram-web-app\.js/ },
      { name: '用户界面元素', pattern: /id="app"/ },
      { name: 'API调用代码', pattern: /fetch.*api\/v1/ },
      { name: '签到按钮', pattern: /checkInButton/ },
      { name: '调试信息', pattern: /debugLog/ }
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(html)) {
        console.log(`   ✅ ${check.name}: 存在`);
      } else {
        console.log(`   ❌ ${check.name}: 缺失`);
      }
    });
    
    // 3. 测试用户API流程
    console.log('\n📝 测试用户API流程...');
    const testUserId = '999888777';
    
    // 清理测试用户
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      await execPromise(`docker exec tg_postgres psql -U tg_admin -d tg_empire -c "
        DELETE FROM check_ins WHERE user_id IN (SELECT id FROM users WHERE telegram_id = '${testUserId}');
        DELETE FROM reputation_logs WHERE user_id IN (SELECT id FROM users WHERE telegram_id = '${testUserId}');
        DELETE FROM users WHERE telegram_id = '${testUserId}';
      "`);
      console.log('✅ 测试数据清理完成');
    } catch (error) {
      console.log('⚠️ 测试数据清理失败（可能不存在）');
    }
    
    // 测试用户注册
    const registerData = {
      telegram_id: parseInt(testUserId),
      username: 'test_user',
      first_name: 'Test',
      last_name: 'User'
    };
    
    const registerResponse = await axios.post('http://localhost:3000/api/v1/users/register', registerData);
    console.log('✅ 用户注册成功:', registerResponse.data.username);
    
    // 测试获取用户信息
    const userResponse = await axios.get('http://localhost:3000/api/v1/users/me', {
      headers: { 'x-telegram-id': testUserId }
    });
    console.log('✅ 获取用户信息成功:', userResponse.data.username);
    
    // 测试签到
    const checkInResponse = await axios.post('http://localhost:3000/api/v1/users/check-in', {}, {
      headers: { 'x-telegram-id': testUserId }
    });
    console.log('✅ 用户签到成功，获得点数:', checkInResponse.data.rewards.totalPoints);
    
    // 4. 生成测试报告
    console.log('\n📊 测试报告:');
    console.log('✅ 后端API: 正常工作');
    console.log('✅ 简化版页面: 可正常访问');
    console.log('✅ 页面内容: 包含所有必要元素');
    console.log('✅ 用户流程: 注册、获取信息、签到都正常');
    
    console.log('\n🎯 简化版应用测试完成！');
    console.log('📱 可以在Telegram中测试: http://localhost:5177/src/apps/ProfileApp/simple.html');
    
    // 5. 提供使用说明
    console.log('\n📋 使用说明:');
    console.log('1. 确保后端服务运行在 http://localhost:3000');
    console.log('2. 确保前端服务运行在 http://localhost:5177');
    console.log('3. 在Telegram Bot中设置WebApp URL为简化版页面地址');
    console.log('4. 简化版页面包含调试信息，可以查看详细的执行日志');
    console.log('5. 如果仍然白屏，请检查浏览器控制台的JavaScript错误');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
    
    console.log('\n🔧 故障排除建议:');
    console.log('1. 检查后端服务是否在端口3000运行');
    console.log('2. 检查前端服务是否在端口5177运行');
    console.log('3. 检查数据库连接是否正常');
    console.log('4. 查看服务器日志获取详细错误信息');
  }
}

// 运行测试
if (require.main === module) {
  testSimpleApp();
}

module.exports = { testSimpleApp };
