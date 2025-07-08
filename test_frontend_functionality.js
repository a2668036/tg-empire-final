#!/usr/bin/env node

const axios = require('axios');
const { JSDOM } = require('jsdom');

async function testFrontendFunctionality() {
  console.log('🎨 开始测试ProfileApp前端功能...\n');
  
  const results = [];
  
  // 测试1: 检查前端页面加载
  console.log('📝 测试1: 检查前端页面加载');
  try {
    const frontendUrl = 'http://localhost:5173/src/apps/ProfileApp/index.html';
    const response = await axios.get(frontendUrl, { timeout: 10000 });
    
    console.log('✅ 前端页面加载成功');
    console.log('页面大小:', response.data.length, '字符');
    console.log('Content-Type:', response.headers['content-type']);
    
    // 解析HTML内容
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // 检查关键元素
    const hasVueApp = document.querySelector('#app') !== null;
    const hasTelegramSDK = response.data.includes('telegram-web-app.js');
    const hasIndexJS = response.data.includes('index.js');
    const hasViewport = response.data.includes('viewport');
    
    console.log('页面元素检查:');
    console.log(`  - Vue应用挂载点: ${hasVueApp ? '✅' : '❌'}`);
    console.log(`  - Telegram SDK: ${hasTelegramSDK ? '✅' : '❌'}`);
    console.log(`  - 入口脚本: ${hasIndexJS ? '✅' : '❌'}`);
    console.log(`  - 响应式视口: ${hasViewport ? '✅' : '❌'}`);
    
    if (hasVueApp && hasTelegramSDK && hasIndexJS && hasViewport) {
      results.push({
        test: '前端页面加载',
        status: 'PASS',
        details: '所有关键元素都存在'
      });
    } else {
      results.push({
        test: '前端页面加载',
        status: 'FAIL',
        details: '缺少关键元素'
      });
    }
    
  } catch (error) {
    console.log('❌ 前端页面加载失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: '前端页面加载',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试2: 检查Vue组件文件
  console.log('📝 测试2: 检查Vue组件文件');
  try {
    const vueComponentUrl = 'http://localhost:5173/src/apps/ProfileApp/ProfileApp.vue';
    const response = await axios.get(vueComponentUrl, { timeout: 10000 });
    
    console.log('✅ Vue组件文件可访问');
    console.log('组件大小:', response.data.length, '字符');
    
    // 检查Vue组件内容
    const hasTemplate = response.data.includes('<template>');
    const hasScript = response.data.includes('<script>');
    const hasStyle = response.data.includes('<style>');
    const hasCheckInButton = response.data.includes('签到');
    const hasReputationDisplay = response.data.includes('声望');
    
    console.log('Vue组件内容检查:');
    console.log(`  - Template部分: ${hasTemplate ? '✅' : '❌'}`);
    console.log(`  - Script部分: ${hasScript ? '✅' : '❌'}`);
    console.log(`  - Style部分: ${hasStyle ? '✅' : '❌'}`);
    console.log(`  - 签到功能: ${hasCheckInButton ? '✅' : '❌'}`);
    console.log(`  - 声望显示: ${hasReputationDisplay ? '✅' : '❌'}`);
    
    if (hasTemplate && hasScript && hasStyle && hasCheckInButton && hasReputationDisplay) {
      results.push({
        test: 'Vue组件结构',
        status: 'PASS',
        details: 'Vue组件结构完整，包含所有必要功能'
      });
    } else {
      results.push({
        test: 'Vue组件结构',
        status: 'FAIL',
        details: 'Vue组件结构不完整'
      });
    }
    
  } catch (error) {
    console.log('❌ Vue组件文件检查失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'Vue组件结构',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试3: 检查JavaScript入口文件
  console.log('📝 测试3: 检查JavaScript入口文件');
  try {
    const jsEntryUrl = 'http://localhost:5173/src/apps/ProfileApp/index.js';
    const response = await axios.get(jsEntryUrl, { timeout: 10000 });
    
    console.log('✅ JavaScript入口文件可访问');
    console.log('文件大小:', response.data.length, '字符');
    
    // 检查JavaScript内容
    const hasVueImport = response.data.includes('createApp') || response.data.includes('Vue');
    const hasProfileAppImport = response.data.includes('ProfileApp');
    const hasMount = response.data.includes('mount');
    const hasApiService = response.data.includes('apiService') || response.data.includes('api');
    
    console.log('JavaScript内容检查:');
    console.log(`  - Vue导入: ${hasVueImport ? '✅' : '❌'}`);
    console.log(`  - ProfileApp导入: ${hasProfileAppImport ? '✅' : '❌'}`);
    console.log(`  - 应用挂载: ${hasMount ? '✅' : '❌'}`);
    console.log(`  - API服务: ${hasApiService ? '✅' : '❌'}`);
    
    if (hasVueImport && hasProfileAppImport && hasMount) {
      results.push({
        test: 'JavaScript入口',
        status: 'PASS',
        details: 'JavaScript入口配置正确'
      });
    } else {
      results.push({
        test: 'JavaScript入口',
        status: 'FAIL',
        details: 'JavaScript入口配置不完整'
      });
    }
    
  } catch (error) {
    console.log('❌ JavaScript入口文件检查失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: 'JavaScript入口',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试4: 检查工具模块
  console.log('📝 测试4: 检查工具模块');
  try {
    const modules = [
      { name: 'API服务', url: 'http://localhost:5173/src/utils/apiService.js' },
      { name: 'WebApp SDK', url: 'http://localhost:5173/src/utils/webAppSdk.js' }
    ];
    
    let moduleResults = [];
    
    for (const module of modules) {
      try {
        const response = await axios.get(module.url, { timeout: 5000 });
        console.log(`✅ ${module.name}: 可访问 (${response.data.length} 字符)`);
        moduleResults.push(true);
      } catch (error) {
        console.log(`❌ ${module.name}: 无法访问`);
        moduleResults.push(false);
      }
    }
    
    const allModulesOk = moduleResults.every(result => result);
    
    if (allModulesOk) {
      results.push({
        test: '工具模块',
        status: 'PASS',
        details: '所有工具模块都可访问'
      });
    } else {
      results.push({
        test: '工具模块',
        status: 'FAIL',
        details: '部分工具模块无法访问'
      });
    }
    
  } catch (error) {
    console.log('❌ 工具模块检查失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: '工具模块',
      status: 'FAIL',
      error: error.message
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试5: 检查简化版页面（用于调试）
  console.log('📝 测试5: 检查简化版页面');
  try {
    const simplePageUrl = 'http://localhost:5173/src/apps/ProfileApp/simple.html';
    const response = await axios.get(simplePageUrl, { timeout: 10000 });
    
    console.log('✅ 简化版页面可访问');
    console.log('页面大小:', response.data.length, '字符');
    
    results.push({
      test: '简化版页面',
      status: 'PASS',
      details: '简化版页面可正常访问'
    });
    
  } catch (error) {
    console.log('❌ 简化版页面检查失败');
    console.log('错误信息:', error.message);
    
    results.push({
      test: '简化版页面',
      status: 'FAIL',
      error: error.message
    });
  }
  
  // 生成测试报告
  console.log('\n📊 前端功能测试报告:');
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
  
  console.log('\n🌐 前端访问地址:');
  console.log('- 主页面: http://localhost:5173/src/apps/ProfileApp/index.html');
  console.log('- 简化版: http://localhost:5173/src/apps/ProfileApp/simple.html');
  console.log('- 调试版: http://localhost:5173/src/apps/ProfileApp/debug.html');
  
  return { results, successRate: Math.round((passCount / totalCount) * 100) };
}

// 运行测试
testFrontendFunctionality().then(result => {
  console.log('\n🎉 前端功能测试完成！');
  if (result.successRate >= 80) {
    console.log('🟢 前端功能基本正常');
    process.exit(0);
  } else {
    console.log('🟡 前端功能存在问题，需要检查');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ 前端功能测试失败:', error.message);
  process.exit(1);
});
