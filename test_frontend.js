/**
 * 前端功能测试脚本
 * 测试Vue应用的API集成和功能
 */

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:5176/src/apps/ProfileApp/index.html';
const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testFrontendIntegration() {
  console.log('🌐 开始前端集成测试...\n');
  
  try {
    // 步骤1: 测试前端页面可访问性
    console.log('📝 步骤1: 测试前端页面可访问性');
    const pageResponse = await axios.get(FRONTEND_URL);
    console.log('✅ 前端页面可正常访问');
    console.log(`   状态码: ${pageResponse.status}`);
    console.log(`   内容类型: ${pageResponse.headers['content-type']}\n`);
    
    // 步骤2: 检查页面内容
    console.log('📝 步骤2: 检查页面内容');
    const html = pageResponse.data;
    
    // 检查关键元素
    const checks = [
      { name: 'Telegram WebApp SDK', pattern: /telegram-web-app\.js/ },
      { name: 'Vue应用挂载点', pattern: /<div id="app">/ },
      { name: '应用入口脚本', pattern: /index\.js/ },
      { name: '响应式视口', pattern: /viewport.*width=device-width/ },
      { name: 'Telegram主题变量', pattern: /--tg-theme-/ }
    ];
    
    for (const check of checks) {
      if (check.pattern.test(html)) {
        console.log(`   ✅ ${check.name}: 存在`);
      } else {
        console.log(`   ❌ ${check.name}: 缺失`);
      }
    }
    console.log();
    
    // 步骤3: 测试API端点可访问性
    console.log('📝 步骤3: 测试API端点可访问性');
    const apiEndpoints = [
      { name: '健康检查', path: '/health', baseURL: 'http://localhost:3000' },
      { name: '用户信息', path: '/users/me' },
      { name: '签到历史', path: '/check-in/history' },
      { name: '声望历史', path: '/reputation/history' },
      { name: '签到统计', path: '/check-in/stats' },
      { name: '声望统计', path: '/reputation/stats' }
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const url = (endpoint.baseURL || API_BASE_URL) + endpoint.path;
        const headers = endpoint.path === '/health' ? {} : { 'x-telegram-id': '999888777' };
        
        const response = await axios.get(url, { headers, timeout: 5000 });
        console.log(`   ✅ ${endpoint.name}: 可访问 (${response.status})`);
      } catch (error) {
        const status = error.response ? error.response.status : 'timeout';
        console.log(`   ❌ ${endpoint.name}: 错误 (${status})`);
      }
    }
    console.log();
    
    // 步骤4: 测试CORS配置
    console.log('📝 步骤4: 测试CORS配置');
    try {
      const corsResponse = await axios.options(API_BASE_URL + '/users/me', {
        headers: {
          'Origin': 'http://localhost:5176',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'x-telegram-id'
        }
      });
      console.log('✅ CORS预检请求成功');
      console.log(`   允许的方法: ${corsResponse.headers['access-control-allow-methods'] || '未设置'}`);
      console.log(`   允许的头部: ${corsResponse.headers['access-control-allow-headers'] || '未设置'}\n`);
    } catch (error) {
      console.log('❌ CORS配置可能有问题');
      console.log(`   错误: ${error.message}\n`);
    }
    
    // 步骤5: 模拟前端API调用
    console.log('📝 步骤5: 模拟前端API调用');
    const frontendApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-id': '999888777',
        'Origin': 'http://localhost:5176'
      }
    });
    
    try {
      // 模拟获取用户信息
      const userResponse = await frontendApi.get('/users/me');
      console.log('✅ 模拟前端获取用户信息成功');
      console.log(`   用户名: ${userResponse.data.username}`);
      console.log(`   声望点数: ${userResponse.data.reputation_points}`);
      
      // 模拟获取签到历史
      const historyResponse = await frontendApi.get('/check-in/history');
      console.log('✅ 模拟前端获取签到历史成功');
      console.log(`   记录数量: ${historyResponse.data.total}`);
      
      // 模拟获取统计数据
      const statsResponse = await frontendApi.get('/check-in/stats');
      console.log('✅ 模拟前端获取统计数据成功');
      console.log(`   总签到天数: ${statsResponse.data.totalDays}\n`);
      
    } catch (error) {
      console.log('❌ 前端API调用模拟失败');
      console.log(`   错误: ${error.message}\n`);
    }
    
    // 步骤6: 检查前端资源
    console.log('📝 步骤6: 检查前端资源');
    const resources = [
      { name: 'Vue应用脚本', path: '/src/apps/ProfileApp/index.js' },
      { name: 'API服务模块', path: '/src/utils/apiService.js' },
      { name: 'WebApp SDK模块', path: '/src/utils/webAppSdk.js' }
    ];
    
    for (const resource of resources) {
      try {
        const resourceUrl = `http://localhost:5176${resource.path}`;
        const response = await axios.get(resourceUrl, { timeout: 5000 });
        console.log(`   ✅ ${resource.name}: 可访问`);
      } catch (error) {
        console.log(`   ❌ ${resource.name}: 无法访问`);
      }
    }
    
    console.log('\n🎉 前端集成测试完成！');
    
  } catch (error) {
    console.error('\n❌ 前端测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
    }
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testFrontendIntegration();
}

module.exports = { testFrontendIntegration };
