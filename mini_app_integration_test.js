#!/usr/bin/env node

const axios = require('axios');
const { JSDOM } = require('jsdom');

async function testMiniAppIntegration() {
  console.log('📱 开始Telegram Mini App集成测试...\n');
  
  const results = [];
  const FRONTEND_BASE = 'http://localhost:5173';
  
  // 测试1: Mini App页面结构验证
  console.log('📝 测试1: Mini App页面结构验证');
  try {
    const pageUrl = `${FRONTEND_BASE}/src/apps/ProfileApp/index.html`;
    const response = await axios.get(pageUrl, { timeout: 10000 });
    
    console.log('✅ Mini App页面可访问');
    console.log('页面大小:', response.data.length, '字符');
    
    // 解析HTML内容
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // 检查Mini App必需元素
    const checks = {
      vueApp: document.querySelector('#app') !== null,
      telegramSDK: response.data.includes('telegram-web-app.js'),
      viewport: response.data.includes('viewport'),
      indexJS: response.data.includes('index.js'),
      title: document.title.length > 0
    };
    
    console.log('页面结构检查:');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value ? '✅' : '❌'}`);
    });
    
    const allChecksPass = Object.values(checks).every(check => check);
    
    if (allChecksPass) {
      results.push({
        test: 'Mini App页面结构',
        status: 'PASS',
        details: '所有必需元素都存在'
      });
    } else {
      results.push({
        test: 'Mini App页面结构',
        status: 'FAIL',
        details: '缺少必需元素'
      });
    }
    
  } catch (error) {
    console.log('❌ Mini App页面访问失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'Mini App页面结构',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试2: Vue组件完整性验证
  console.log('📝 测试2: Vue组件完整性验证');
  try {
    const componentUrl = `${FRONTEND_BASE}/src/apps/ProfileApp/ProfileApp.vue`;
    const response = await axios.get(componentUrl, { timeout: 10000 });
    
    console.log('✅ Vue组件文件可访问');
    console.log('组件大小:', response.data.length, '字符');
    
    // 检查Vue组件内容
    const componentChecks = {
      hasSetup: response.data.includes('setup()') || response.data.includes('<script setup>'),
      hasTemplate: response.data.includes('<template>') || response.data.includes('template:'),
      hasStyle: response.data.includes('<style>') || response.data.includes('style:'),
      hasCheckIn: response.data.includes('签到') || response.data.includes('check-in'),
      hasReputation: response.data.includes('声望') || response.data.includes('reputation'),
      hasApiCalls: response.data.includes('apiService') || response.data.includes('axios'),
      hasTelegramSDK: response.data.includes('webAppSdk') || response.data.includes('Telegram')
    };
    
    console.log('Vue组件内容检查:');
    Object.entries(componentChecks).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value ? '✅' : '❌'}`);
    });
    
    const componentScore = Object.values(componentChecks).filter(check => check).length;
    const totalChecks = Object.values(componentChecks).length;
    
    if (componentScore >= totalChecks * 0.8) { // 80%通过率
      results.push({
        test: 'Vue组件完整性',
        status: 'PASS',
        details: `组件功能完整度: ${componentScore}/${totalChecks}`
      });
    } else {
      results.push({
        test: 'Vue组件完整性',
        status: 'FAIL',
        details: `组件功能不完整: ${componentScore}/${totalChecks}`
      });
    }
    
  } catch (error) {
    console.log('❌ Vue组件检查失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'Vue组件完整性',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试3: JavaScript模块依赖验证
  console.log('📝 测试3: JavaScript模块依赖验证');
  try {
    const modules = [
      { name: 'Vue应用入口', url: `${FRONTEND_BASE}/src/apps/ProfileApp/index.js` },
      { name: 'API服务模块', url: `${FRONTEND_BASE}/src/utils/apiService.js` },
      { name: 'WebApp SDK模块', url: `${FRONTEND_BASE}/src/utils/webAppSdk.js` }
    ];
    
    let moduleResults = [];
    
    for (const module of modules) {
      try {
        const response = await axios.get(module.url, { timeout: 5000 });
        console.log(`✅ ${module.name}: 可访问 (${response.data.length} 字符)`);
        
        // 检查模块内容
        let contentChecks = {};
        if (module.name.includes('入口')) {
          contentChecks = {
            hasVueImport: response.data.includes('createApp') || response.data.includes('Vue'),
            hasMount: response.data.includes('mount'),
            hasProfileApp: response.data.includes('ProfileApp')
          };
        } else if (module.name.includes('API')) {
          contentChecks = {
            hasAxios: response.data.includes('axios'),
            hasBaseURL: response.data.includes('baseURL') || response.data.includes('API_BASE'),
            hasExports: response.data.includes('export') || response.data.includes('module.exports')
          };
        } else if (module.name.includes('SDK')) {
          contentChecks = {
            hasTelegramWebApp: response.data.includes('Telegram') || response.data.includes('WebApp'),
            hasInitData: response.data.includes('initData') || response.data.includes('init_data'),
            hasExports: response.data.includes('export') || response.data.includes('module.exports')
          };
        }
        
        const passedChecks = Object.values(contentChecks).filter(check => check).length;
        const totalChecks = Object.values(contentChecks).length;
        
        console.log(`  内容检查: ${passedChecks}/${totalChecks} 通过`);
        moduleResults.push(passedChecks >= totalChecks * 0.7); // 70%通过率
        
      } catch (error) {
        console.log(`❌ ${module.name}: 无法访问 - ${error.message}`);
        moduleResults.push(false);
      }
    }
    
    const passedModules = moduleResults.filter(result => result).length;
    const totalModules = moduleResults.length;
    
    if (passedModules === totalModules) {
      results.push({
        test: 'JavaScript模块依赖',
        status: 'PASS',
        details: `所有模块 (${passedModules}/${totalModules}) 都可访问且内容完整`
      });
    } else {
      results.push({
        test: 'JavaScript模块依赖',
        status: 'FAIL',
        details: `部分模块不可访问: ${passedModules}/${totalModules}`
      });
    }
    
  } catch (error) {
    console.log('❌ JavaScript模块检查失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'JavaScript模块依赖',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试4: API集成验证
  console.log('📝 测试4: API集成验证');
  try {
    // 测试关键API端点的可访问性
    const apiEndpoints = [
      { name: '用户信息API', path: '/api/v1/users/me' },
      { name: '签到API', path: '/api/v1/check-in' },
      { name: '签到历史API', path: '/api/v1/check-in/history' },
      { name: '声望历史API', path: '/api/v1/reputation/history' }
    ];
    
    let apiResults = [];
    const testUserId = '999888777'; // 使用已存在的测试用户
    
    for (const endpoint of apiEndpoints) {
      try {
        let response;
        if (endpoint.path.includes('check-in') && !endpoint.path.includes('history')) {
          // 对于签到API，预期可能返回400（已签到）
          try {
            response = await axios.post(`http://localhost:3000${endpoint.path}`, {}, {
              headers: { 'x-telegram-id': testUserId },
              timeout: 5000
            });
          } catch (error) {
            if (error.response && error.response.status === 400) {
              response = error.response; // 400状态码是预期的
            } else {
              throw error;
            }
          }
        } else {
          response = await axios.get(`http://localhost:3000${endpoint.path}`, {
            headers: { 'x-telegram-id': testUserId },
            timeout: 5000
          });
        }
        
        console.log(`✅ ${endpoint.name}: 可访问 (状态码: ${response.status})`);
        apiResults.push(true);
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: 无法访问 - ${error.message}`);
        apiResults.push(false);
      }
    }
    
    const passedAPIs = apiResults.filter(result => result).length;
    const totalAPIs = apiResults.length;
    
    if (passedAPIs >= totalAPIs * 0.8) { // 80%通过率
      results.push({
        test: 'API集成验证',
        status: 'PASS',
        details: `API可访问性: ${passedAPIs}/${totalAPIs}`
      });
    } else {
      results.push({
        test: 'API集成验证',
        status: 'FAIL',
        details: `API可访问性不足: ${passedAPIs}/${totalAPIs}`
      });
    }
    
  } catch (error) {
    console.log('❌ API集成验证失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'API集成验证',
      status: 'FAIL',
      error: error.message
    });
  }
  
  // 生成测试报告
  console.log('\n📊 Mini App集成测试报告:');
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
  
  console.log('\n🎯 Mini App集成总结:');
  if (passCount === totalCount) {
    console.log('🟢 Mini App集成完美！所有组件和API都正常工作。');
  } else if (passCount >= totalCount * 0.8) {
    console.log('🟡 Mini App集成基本正常，存在少量问题。');
  } else {
    console.log('🔴 Mini App集成存在较多问题，需要修复。');
  }
  
  return { results, successRate: Math.round((passCount / totalCount) * 100) };
}

// 运行测试
testMiniAppIntegration().then(result => {
  console.log('\n🎉 Mini App集成测试完成！');
  if (result.successRate >= 80) {
    console.log('🟢 Mini App集成测试通过');
    process.exit(0);
  } else {
    console.log('🟡 Mini App集成存在问题');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Mini App集成测试失败:', error.message);
  process.exit(1);
});
