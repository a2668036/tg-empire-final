#!/usr/bin/env node

const axios = require('axios');

async function healthCheck() {
  console.log('🔍 开始服务健康检查...\n');
  
  const checks = [];
  
  // 1. 后端健康检查
  console.log('📝 检查后端服务健康状态...');
  try {
    const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
    checks.push({ 
      service: '后端API服务', 
      status: 'OK', 
      port: 3000,
      response: response.data 
    });
    console.log('✅ 后端服务健康');
  } catch (error) {
    checks.push({ 
      service: '后端API服务', 
      status: 'FAIL', 
      port: 3000,
      error: error.message 
    });
    console.log('❌ 后端服务异常:', error.message);
  }
  
  // 2. 前端服务检查
  console.log('📝 检查前端开发服务器...');
  try {
    const response = await axios.get('http://localhost:5173/src/apps/ProfileApp/index.html', { timeout: 5000 });
    checks.push({ 
      service: '前端开发服务器', 
      status: 'OK', 
      port: 5173,
      contentLength: response.data.length 
    });
    console.log('✅ 前端服务正常');
  } catch (error) {
    checks.push({ 
      service: '前端开发服务器', 
      status: 'FAIL', 
      port: 5173,
      error: error.message 
    });
    console.log('❌ 前端服务异常:', error.message);
  }
  
  // 3. 数据库连接检查
  console.log('📝 检查数据库连接...');
  try {
    const response = await axios.get('http://localhost:3000/api/v1/users/me', {
      headers: { 'x-telegram-id': '123456789' },
      timeout: 5000
    });
    checks.push({ 
      service: '数据库连接', 
      status: 'OK', 
      details: '用户数据查询成功' 
    });
    console.log('✅ 数据库连接正常');
  } catch (error) {
    checks.push({ 
      service: '数据库连接', 
      status: 'FAIL', 
      error: error.message 
    });
    console.log('❌ 数据库连接异常:', error.message);
  }
  
  // 4. API路由检查
  console.log('📝 检查主要API路由...');
  const apiRoutes = [
    { name: '用户信息API', path: '/api/v1/users/me' },
    { name: '签到API', path: '/api/v1/check-in' },
    { name: '签到历史API', path: '/api/v1/check-in/history' },
    { name: '声望历史API', path: '/api/v1/reputation/history' }
  ];
  
  for (const route of apiRoutes) {
    try {
      const response = await axios.get(`http://localhost:3000${route.path}`, {
        headers: { 'x-telegram-id': '123456789' },
        timeout: 5000
      });
      checks.push({ 
        service: route.name, 
        status: 'OK', 
        path: route.path 
      });
      console.log(`✅ ${route.name}: 可访问`);
    } catch (error) {
      // 对于POST接口，405错误是正常的
      if (error.response && error.response.status === 405 && route.path.includes('check-in') && !route.path.includes('history')) {
        checks.push({ 
          service: route.name, 
          status: 'OK', 
          path: route.path,
          note: 'POST接口，GET返回405正常' 
        });
        console.log(`✅ ${route.name}: 路由存在 (POST接口)`);
      } else {
        checks.push({ 
          service: route.name, 
          status: 'FAIL', 
          path: route.path,
          error: error.message 
        });
        console.log(`❌ ${route.name}: ${error.message}`);
      }
    }
  }
  
  // 5. 生成报告
  console.log('\n📊 健康检查报告:');
  console.log('='.repeat(50));
  
  const okCount = checks.filter(c => c.status === 'OK').length;
  const totalCount = checks.length;
  
  console.log(`总检查项: ${totalCount}`);
  console.log(`通过项: ${okCount}`);
  console.log(`失败项: ${totalCount - okCount}`);
  console.log(`健康度: ${Math.round((okCount / totalCount) * 100)}%`);
  
  console.log('\n详细结果:');
  checks.forEach((check, index) => {
    const status = check.status === 'OK' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${check.service}`);
    if (check.error) {
      console.log(`   错误: ${check.error}`);
    }
    if (check.note) {
      console.log(`   说明: ${check.note}`);
    }
  });
  
  return { checks, healthScore: Math.round((okCount / totalCount) * 100) };
}

// 运行健康检查
healthCheck().then(result => {
  console.log('\n🎉 健康检查完成！');
  if (result.healthScore >= 80) {
    console.log('🟢 系统状态良好，可以进行功能测试');
    process.exit(0);
  } else {
    console.log('🟡 系统存在问题，建议修复后再进行测试');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ 健康检查失败:', error.message);
  process.exit(1);
});
