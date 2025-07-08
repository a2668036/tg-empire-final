/**
 * 白屏问题诊断脚本
 */

const axios = require('axios');
const fs = require('fs');

async function diagnoseWhiteScreen() {
  console.log('🔍 开始诊断白屏问题...\n');
  
  const checks = [];
  
  // 1. 检查后端服务
  console.log('📝 检查后端服务...');
  try {
    const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
    checks.push({ name: '后端健康检查', status: 'OK', data: response.data });
    console.log('✅ 后端服务正常');
  } catch (error) {
    checks.push({ name: '后端健康检查', status: 'FAIL', error: error.message });
    console.log('❌ 后端服务异常:', error.message);
  }
  
  // 2. 检查前端服务
  console.log('📝 检查前端服务...');
  try {
    const response = await axios.get('http://localhost:5177/', { timeout: 5000 });
    checks.push({ name: '前端服务', status: 'OK', contentLength: response.data.length });
    console.log('✅ 前端服务可访问');
  } catch (error) {
    checks.push({ name: '前端服务', status: 'FAIL', error: error.message });
    console.log('❌ 前端服务异常:', error.message);
  }
  
  // 3. 检查Vue应用页面
  console.log('📝 检查Vue应用页面...');
  try {
    const response = await axios.get('http://localhost:5177/src/apps/ProfileApp/index.html', { timeout: 5000 });
    const html = response.data;
    
    const hasVueApp = html.includes('<div id="app">');
    const hasTelegramSDK = html.includes('telegram-web-app.js');
    const hasIndexJS = html.includes('index.js');
    
    checks.push({ 
      name: 'Vue应用页面', 
      status: 'OK', 
      hasVueApp, 
      hasTelegramSDK, 
      hasIndexJS,
      contentLength: html.length
    });
    
    console.log('✅ Vue应用页面可访问');
    console.log(`   - Vue挂载点: ${hasVueApp ? '✅' : '❌'}`);
    console.log(`   - Telegram SDK: ${hasTelegramSDK ? '✅' : '❌'}`);
    console.log(`   - 入口脚本: ${hasIndexJS ? '✅' : '❌'}`);
    
  } catch (error) {
    checks.push({ name: 'Vue应用页面', status: 'FAIL', error: error.message });
    console.log('❌ Vue应用页面异常:', error.message);
  }
  
  // 4. 检查API代理
  console.log('📝 检查API代理...');
  try {
    const response = await axios.get('http://localhost:5177/api/v1/health', { timeout: 5000 });
    checks.push({ name: 'API代理', status: 'OK', data: response.data });
    console.log('✅ API代理正常工作');
  } catch (error) {
    checks.push({ name: 'API代理', status: 'FAIL', error: error.message });
    console.log('❌ API代理异常:', error.message);
  }
  
  // 5. 检查Vue应用入口脚本
  console.log('📝 检查Vue应用入口脚本...');
  try {
    const response = await axios.get('http://localhost:5177/src/apps/ProfileApp/index.js', { timeout: 5000 });
    checks.push({ name: 'Vue入口脚本', status: 'OK', contentLength: response.data.length });
    console.log('✅ Vue入口脚本可访问');
  } catch (error) {
    checks.push({ name: 'Vue入口脚本', status: 'FAIL', error: error.message });
    console.log('❌ Vue入口脚本异常:', error.message);
  }
  
  // 6. 检查Vue组件文件
  console.log('📝 检查Vue组件文件...');
  try {
    const response = await axios.get('http://localhost:5177/src/apps/ProfileApp/ProfileApp.vue', { timeout: 5000 });
    checks.push({ name: 'Vue组件文件', status: 'OK', contentLength: response.data.length });
    console.log('✅ Vue组件文件可访问');
  } catch (error) {
    checks.push({ name: 'Vue组件文件', status: 'FAIL', error: error.message });
    console.log('❌ Vue组件文件异常:', error.message);
  }
  
  // 7. 检查工具模块
  console.log('📝 检查工具模块...');
  const modules = [
    '/src/utils/apiService.js',
    '/src/utils/webAppSdk.js'
  ];
  
  for (const module of modules) {
    try {
      const response = await axios.get(`http://localhost:5177${module}`, { timeout: 5000 });
      checks.push({ name: `工具模块${module}`, status: 'OK', contentLength: response.data.length });
      console.log(`✅ ${module} 可访问`);
    } catch (error) {
      checks.push({ name: `工具模块${module}`, status: 'FAIL', error: error.message });
      console.log(`❌ ${module} 异常:`, error.message);
    }
  }
  
  // 8. 生成诊断报告
  console.log('\n📊 生成诊断报告...');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.status === 'OK').length,
      failed: checks.filter(c => c.status === 'FAIL').length
    },
    checks: checks
  };
  
  fs.writeFileSync('white_screen_diagnosis.json', JSON.stringify(report, null, 2));
  console.log('✅ 诊断报告已保存到 white_screen_diagnosis.json');
  
  // 9. 提供修复建议
  console.log('\n💡 修复建议:');
  
  const failedChecks = checks.filter(c => c.status === 'FAIL');
  if (failedChecks.length === 0) {
    console.log('✅ 所有检查都通过了，白屏问题可能是浏览器缓存或JavaScript错误');
    console.log('   建议: 清除浏览器缓存，打开开发者工具查看控制台错误');
  } else {
    failedChecks.forEach(check => {
      console.log(`❌ ${check.name}: ${check.error}`);
    });
    
    if (failedChecks.some(c => c.name.includes('后端'))) {
      console.log('   建议: 重启后端服务');
    }
    if (failedChecks.some(c => c.name.includes('前端'))) {
      console.log('   建议: 重启前端服务');
    }
    if (failedChecks.some(c => c.name.includes('API代理'))) {
      console.log('   建议: 检查Vite代理配置');
    }
  }
  
  console.log('\n🎯 完成诊断');
}

// 运行诊断
if (require.main === module) {
  diagnoseWhiteScreen().catch(console.error);
}

module.exports = { diagnoseWhiteScreen };
