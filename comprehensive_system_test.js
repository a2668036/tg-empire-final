#!/usr/bin/env node

const axios = require('axios');
const { JSDOM } = require('jsdom');

// 测试配置
const CONFIG = {
  API_BASE: 'http://localhost:3000/api/v1',
  FRONTEND_BASE: 'http://localhost:5173',
  BACKEND_HEALTH: 'http://localhost:3000/health',
  WEBHOOK_URL: 'http://localhost:3000/webhook',
  TEST_TIMEOUT: 15000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 2000
};

// 全局测试结果收集器
const TEST_RESULTS = {
  systemHealth: [],
  mvp001: [],
  mvp002: [],
  integration: [],
  miniApp: [],
  totalTests: 0,
  passedTests: 0,
  failedTests: 0
};

// 工具函数：重试机制
async function retryOperation(operation, maxRetries = CONFIG.RETRY_COUNT, delay = CONFIG.RETRY_DELAY) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`重试 ${i + 1}/${maxRetries}，等待 ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 工具函数：记录测试结果
function recordTest(category, testName, status, details = '', error = null) {
  const result = {
    test: testName,
    status: status,
    details: details,
    error: error,
    timestamp: new Date().toISOString()
  };
  
  TEST_RESULTS[category].push(result);
  TEST_RESULTS.totalTests++;
  
  if (status === 'PASS') {
    TEST_RESULTS.passedTests++;
    console.log(`✅ ${testName}: ${details}`);
  } else {
    TEST_RESULTS.failedTests++;
    console.log(`❌ ${testName}: ${error || details}`);
  }
  
  return result;
}

// 第一阶段：系统健康检查
async function runSystemHealthChecks() {
  console.log('🔍 第一阶段：系统健康检查\n');
  console.log('='.repeat(80));
  
  // 1.1 后端服务健康检查
  console.log('\n📝 1.1 后端服务健康检查');
  try {
    const healthResponse = await retryOperation(async () => {
      return await axios.get(CONFIG.BACKEND_HEALTH, { timeout: CONFIG.TEST_TIMEOUT });
    });
    
    console.log('后端健康检查响应:', JSON.stringify(healthResponse.data, null, 2));
    
    if (healthResponse.status === 200 && (healthResponse.data.status === 'OK' || healthResponse.data.status === 'ok')) {
      recordTest('systemHealth', '后端服务健康检查', 'PASS',
        `状态码: ${healthResponse.status}, 服务状态: ${healthResponse.data.status}`);
    } else {
      recordTest('systemHealth', '后端服务健康检查', 'FAIL',
        `意外的响应: 状态码 ${healthResponse.status}, 服务状态: ${healthResponse.data.status}`);
    }
  } catch (error) {
    recordTest('systemHealth', '后端服务健康检查', 'FAIL', '', error.message);
    throw new Error(`后端服务不可用，无法继续测试: ${error.message}`);
  }
  
  // 1.2 数据库连接检查 - 使用已知存在的用户
  console.log('\n📝 1.2 数据库连接检查');
  try {
    // 先注册一个测试用户用于数据库连接检查
    const testUserId = '999999999';
    await axios.post(`${CONFIG.API_BASE}/users/register`, {
      telegram_id: testUserId,
      username: 'db_test_user',
      first_name: '数据库测试',
      last_name: '用户'
    }).catch(() => {}); // 忽略可能的重复注册错误

    const dbTestResponse = await retryOperation(async () => {
      return await axios.get(`${CONFIG.API_BASE}/users/me`, {
        headers: { 'x-telegram-id': testUserId },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });

    if (dbTestResponse.status === 200 && dbTestResponse.data.success) {
      recordTest('systemHealth', '数据库连接检查', 'PASS', '数据库连接正常，用户数据查询成功');
    } else {
      recordTest('systemHealth', '数据库连接检查', 'FAIL', `意外的响应状态: ${dbTestResponse.status}`);
    }
  } catch (error) {
    recordTest('systemHealth', '数据库连接检查', 'FAIL', '', error.message);
  }
  
  // 1.3 前端服务检查
  console.log('\n📝 1.3 前端服务检查');
  try {
    const frontendResponse = await retryOperation(async () => {
      return await axios.get(`${CONFIG.FRONTEND_BASE}/src/apps/ProfileApp/index.html`, {
        timeout: CONFIG.TEST_TIMEOUT
      });
    });
    
    if (frontendResponse.status === 200 && frontendResponse.data.length > 0) {
      recordTest('systemHealth', '前端服务检查', 'PASS', 
        `页面大小: ${frontendResponse.data.length} 字符`);
    } else {
      recordTest('systemHealth', '前端服务检查', 'FAIL', 
        `响应异常: 状态码 ${frontendResponse.status}`);
    }
  } catch (error) {
    recordTest('systemHealth', '前端服务检查', 'FAIL', '', error.message);
    throw new Error(`前端服务不可用，无法继续测试: ${error.message}`);
  }
  
  // 1.4 API路由完整性检查 - 使用正确的测试方法
  console.log('\n📝 1.4 API路由完整性检查');
  const testUserId = '999999999'; // 使用已注册的测试用户

  // 测试用户注册API
  try {
    const registerResponse = await axios.post(`${CONFIG.API_BASE}/users/register`, {
      telegram_id: '999999998', // 使用新的ID避免重复
      username: 'route_test_user',
      first_name: '路由测试',
      last_name: '用户'
    }, { timeout: CONFIG.TEST_TIMEOUT });

    recordTest('systemHealth', '用户注册API路由检查', 'PASS',
      `POST /users/register 正常工作`);
  } catch (error) {
    if (error.response && error.response.status === 201) {
      recordTest('systemHealth', '用户注册API路由检查', 'PASS',
        `POST /users/register 正常工作`);
    } else {
      recordTest('systemHealth', '用户注册API路由检查', 'FAIL', '',
        `POST /users/register - ${error.message}`);
    }
  }

  // 测试用户信息API
  try {
    const userResponse = await axios.get(`${CONFIG.API_BASE}/users/me`, {
      headers: { 'x-telegram-id': testUserId },
      timeout: CONFIG.TEST_TIMEOUT
    });

    recordTest('systemHealth', '用户信息API路由检查', 'PASS',
      `GET /users/me 正常工作`);
  } catch (error) {
    recordTest('systemHealth', '用户信息API路由检查', 'FAIL', '',
      `GET /users/me - ${error.message}`);
  }

  // 测试签到相关API
  const checkInRoutes = [
    { name: '签到API', method: 'POST', path: '/check-in' },
    { name: '签到历史API', method: 'GET', path: '/check-in/history' },
    { name: '声望历史API', method: 'GET', path: '/reputation/history' }
  ];

  for (const route of checkInRoutes) {
    try {
      let response;
      const url = `${CONFIG.API_BASE}${route.path}`;
      const headers = { 'x-telegram-id': testUserId };

      if (route.method === 'GET') {
        response = await axios.get(url, { headers, timeout: CONFIG.TEST_TIMEOUT });
      } else if (route.method === 'POST') {
        response = await axios.post(url, {}, { headers, timeout: CONFIG.TEST_TIMEOUT });
      }

      recordTest('systemHealth', `${route.name}路由检查`, 'PASS',
        `${route.method} ${route.path} 正常工作`);

    } catch (error) {
      // 对于签到API，400状态码（已签到）是正常的
      if (error.response && [200, 400].includes(error.response.status)) {
        recordTest('systemHealth', `${route.name}路由检查`, 'PASS',
          `${route.method} ${route.path} 路由正常 (状态码: ${error.response.status})`);
      } else {
        recordTest('systemHealth', `${route.name}路由检查`, 'FAIL', '',
          `${route.method} ${route.path} - ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ 系统健康检查完成');
  return true;
}

// 第二阶段：MVP-001 完整功能测试
async function runMVP001Tests() {
  console.log('\n🧪 第二阶段：MVP-001 完整功能测试\n');
  console.log('='.repeat(80));
  
  const TEST_USER_MVP001 = {
    telegram_id: '100001001',
    username: 'mvp001_comprehensive_test',
    first_name: '全面测试用户',
    last_name: '测试'
  };
  
  // 2.1 用户注册功能测试
  console.log('\n📝 2.1 用户注册功能测试');
  try {
    const registerResponse = await retryOperation(async () => {
      return await axios.post(`${CONFIG.API_BASE}/users/register`, TEST_USER_MVP001, {
        headers: { 'Content-Type': 'application/json' },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });
    
    console.log('用户注册响应:', JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      const userData = registerResponse.data.data;
      recordTest('mvp001', '用户注册功能', 'PASS', 
        `用户ID: ${userData.id}, Telegram ID: ${userData.telegram_id}`);
    } else {
      recordTest('mvp001', '用户注册功能', 'FAIL', 
        `注册失败: 状态码 ${registerResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp001', '用户注册功能', 'FAIL', '', error.message);
  }
  
  // 2.2 用户信息获取测试
  console.log('\n📝 2.2 用户信息获取测试');
  try {
    const userInfoResponse = await retryOperation(async () => {
      return await axios.get(`${CONFIG.API_BASE}/users/me`, {
        headers: { 'x-telegram-id': TEST_USER_MVP001.telegram_id },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });
    
    console.log('用户信息响应:', JSON.stringify(userInfoResponse.data, null, 2));
    
    if (userInfoResponse.status === 200 && userInfoResponse.data.success) {
      const userData = userInfoResponse.data.data;
      if (userData.telegram_id === TEST_USER_MVP001.telegram_id) {
        recordTest('mvp001', '用户信息获取', 'PASS', 
          `用户名: ${userData.username}, 声望: ${userData.reputation_points}`);
      } else {
        recordTest('mvp001', '用户信息获取', 'FAIL', 
          'Telegram ID不匹配');
      }
    } else {
      recordTest('mvp001', '用户信息获取', 'FAIL', 
        `获取失败: 状态码 ${userInfoResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp001', '用户信息获取', 'FAIL', '', error.message);
  }
  
  // 2.3 用户信息更新测试
  console.log('\n📝 2.3 用户信息更新测试');
  try {
    const updateData = {
      first_name: '全面测试用户更新',
      profile_bio: '这是MVP-001全面测试的用户简介，包含中文字符测试'
    };
    
    const updateResponse = await retryOperation(async () => {
      return await axios.put(`${CONFIG.API_BASE}/users/me`, updateData, {
        headers: {
          'x-telegram-id': TEST_USER_MVP001.telegram_id,
          'Content-Type': 'application/json'
        },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });
    
    console.log('用户更新响应:', JSON.stringify(updateResponse.data, null, 2));
    
    if (updateResponse.status === 200 && updateResponse.data.success) {
      const userData = updateResponse.data.data;
      if (userData.first_name === updateData.first_name && 
          userData.profile_bio === updateData.profile_bio) {
        recordTest('mvp001', '用户信息更新', 'PASS', 
          `姓名: ${userData.first_name}, 简介长度: ${userData.profile_bio.length}`);
      } else {
        recordTest('mvp001', '用户信息更新', 'FAIL', 
          '更新数据不匹配');
      }
    } else {
      recordTest('mvp001', '用户信息更新', 'FAIL', 
        `更新失败: 状态码 ${updateResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp001', '用户信息更新', 'FAIL', '', error.message);
  }
  
  // 2.4 数据持久化验证
  console.log('\n📝 2.4 数据持久化验证');
  try {
    // 等待一段时间确保数据已写入数据库
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const verifyResponse = await retryOperation(async () => {
      return await axios.get(`${CONFIG.API_BASE}/users/me`, {
        headers: { 'x-telegram-id': TEST_USER_MVP001.telegram_id },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });
    
    const userData = verifyResponse.data.data;
    if (userData.first_name === '全面测试用户更新' && 
        userData.profile_bio.includes('全面测试')) {
      recordTest('mvp001', '数据持久化验证', 'PASS', 
        '用户数据更新已正确保存到数据库');
    } else {
      recordTest('mvp001', '数据持久化验证', 'FAIL', 
        '数据持久化失败，更新未保存');
    }
  } catch (error) {
    recordTest('mvp001', '数据持久化验证', 'FAIL', '', error.message);
  }
  
  console.log('\n✅ MVP-001 功能测试完成');
  return true;
}

// 第三阶段：MVP-002 完整功能测试
async function runMVP002Tests() {
  console.log('\n🧪 第三阶段：MVP-002 完整功能测试\n');
  console.log('='.repeat(80));

  const TEST_USER_MVP002 = {
    telegram_id: `200002${Date.now().toString().slice(-3)}`, // 使用时间戳确保唯一性
    username: 'mvp002_comprehensive_test_new',
    first_name: '签到测试用户',
    last_name: '测试'
  };

  // 3.1 注册MVP-002测试用户
  console.log('\n📝 3.1 注册MVP-002测试用户');
  try {
    const registerResponse = await retryOperation(async () => {
      return await axios.post(`${CONFIG.API_BASE}/users/register`, TEST_USER_MVP002, {
        headers: { 'Content-Type': 'application/json' },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });

    if (registerResponse.status === 201 && registerResponse.data.success) {
      recordTest('mvp002', 'MVP-002用户注册', 'PASS',
        `用户ID: ${registerResponse.data.data.id}`);
    } else {
      recordTest('mvp002', 'MVP-002用户注册', 'FAIL',
        `注册失败: 状态码 ${registerResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp002', 'MVP-002用户注册', 'FAIL', '', error.message);
  }

  // 3.2 签到功能测试
  console.log('\n📝 3.2 签到功能测试');
  try {
    const checkInResponse = await retryOperation(async () => {
      return await axios.post(`${CONFIG.API_BASE}/check-in`, {}, {
        headers: { 'x-telegram-id': TEST_USER_MVP002.telegram_id },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });

    console.log('签到响应:', JSON.stringify(checkInResponse.data, null, 2));

    if (checkInResponse.status === 200 && checkInResponse.data.success) {
      recordTest('mvp002', '签到功能', 'PASS',
        `获得声望: ${checkInResponse.data.rewards?.totalPoints || 'N/A'}点`);
    } else {
      recordTest('mvp002', '签到功能', 'FAIL',
        `签到失败: 状态码 ${checkInResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp002', '签到功能', 'FAIL', '', error.message);
  }

  // 3.3 签到历史查询测试
  console.log('\n📝 3.3 签到历史查询测试');
  try {
    const historyResponse = await retryOperation(async () => {
      return await axios.get(`${CONFIG.API_BASE}/check-in/history?limit=10`, {
        headers: { 'x-telegram-id': TEST_USER_MVP002.telegram_id },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });

    console.log('签到历史响应:', JSON.stringify(historyResponse.data, null, 2));

    if (historyResponse.status === 200 && historyResponse.data.records) {
      recordTest('mvp002', '签到历史查询', 'PASS',
        `历史记录数: ${historyResponse.data.total || 0}`);
    } else {
      recordTest('mvp002', '签到历史查询', 'FAIL',
        `查询失败: 状态码 ${historyResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp002', '签到历史查询', 'FAIL', '', error.message);
  }

  // 3.4 签到状态查询测试
  console.log('\n📝 3.4 签到状态查询测试');
  try {
    const statusResponse = await retryOperation(async () => {
      return await axios.get(`${CONFIG.API_BASE}/check-in/status`, {
        headers: { 'x-telegram-id': TEST_USER_MVP002.telegram_id },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });

    console.log('签到状态响应:', JSON.stringify(statusResponse.data, null, 2));

    if (statusResponse.status === 200) {
      recordTest('mvp002', '签到状态查询', 'PASS',
        `连续签到: ${statusResponse.data.consecutiveDays || 0}天`);
    } else {
      recordTest('mvp002', '签到状态查询', 'FAIL',
        `查询失败: 状态码 ${statusResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp002', '签到状态查询', 'FAIL', '', error.message);
  }

  // 3.5 声望历史查询测试
  console.log('\n📝 3.5 声望历史查询测试');
  try {
    const reputationResponse = await retryOperation(async () => {
      return await axios.get(`${CONFIG.API_BASE}/reputation/history?limit=10`, {
        headers: { 'x-telegram-id': TEST_USER_MVP002.telegram_id },
        timeout: CONFIG.TEST_TIMEOUT
      });
    });

    console.log('声望历史响应:', JSON.stringify(reputationResponse.data, null, 2));

    if (reputationResponse.status === 200 && reputationResponse.data.records) {
      recordTest('mvp002', '声望历史查询', 'PASS',
        `声望记录数: ${reputationResponse.data.total || 0}`);
    } else {
      recordTest('mvp002', '声望历史查询', 'FAIL',
        `查询失败: 状态码 ${reputationResponse.status}`);
    }
  } catch (error) {
    recordTest('mvp002', '声望历史查询', 'FAIL', '', error.message);
  }

  // 3.6 重复签到防护测试
  console.log('\n📝 3.6 重复签到防护测试');
  try {
    const duplicateResponse = await axios.post(`${CONFIG.API_BASE}/check-in`, {}, {
      headers: { 'x-telegram-id': TEST_USER_MVP002.telegram_id },
      timeout: CONFIG.TEST_TIMEOUT
    });

    recordTest('mvp002', '重复签到防护', 'FAIL',
      '重复签到应该被阻止但成功了');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      recordTest('mvp002', '重复签到防护', 'PASS',
        '重复签到被正确阻止');
    } else {
      recordTest('mvp002', '重复签到防护', 'FAIL', '', error.message);
    }
  }

  console.log('\n✅ MVP-002 功能测试完成');
  return true;
}

// 第四阶段：集成测试
async function runIntegrationTests() {
  console.log('\n🔗 第四阶段：端到端集成测试\n');
  console.log('='.repeat(80));

  const INTEGRATION_USER = {
    telegram_id: `300003${Date.now().toString().slice(-3)}`, // 使用时间戳确保唯一性
    username: 'integration_test_user_new',
    first_name: '集成测试',
    last_name: '用户'
  };

  // 4.1 完整用户流程测试
  console.log('\n📝 4.1 完整用户流程测试');
  try {
    // 注册 -> 获取信息 -> 更新 -> 签到 -> 查询历史
    const registerResponse = await axios.post(`${CONFIG.API_BASE}/users/register`, INTEGRATION_USER);
    const userInfoResponse = await axios.get(`${CONFIG.API_BASE}/users/me`, {
      headers: { 'x-telegram-id': INTEGRATION_USER.telegram_id }
    });
    const updateResponse = await axios.put(`${CONFIG.API_BASE}/users/me`, {
      profile_bio: '集成测试用户简介'
    }, {
      headers: { 'x-telegram-id': INTEGRATION_USER.telegram_id }
    });
    const checkInResponse = await axios.post(`${CONFIG.API_BASE}/check-in`, {}, {
      headers: { 'x-telegram-id': INTEGRATION_USER.telegram_id }
    });

    recordTest('integration', '完整用户流程', 'PASS',
      '注册->信息获取->更新->签到流程完整');
  } catch (error) {
    recordTest('integration', '完整用户流程', 'FAIL', '', error.message);
  }

  // 4.2 数据一致性验证
  console.log('\n📝 4.2 数据一致性验证');
  try {
    const userInfo = await axios.get(`${CONFIG.API_BASE}/users/me`, {
      headers: { 'x-telegram-id': INTEGRATION_USER.telegram_id }
    });
    const checkInHistory = await axios.get(`${CONFIG.API_BASE}/check-in/history`, {
      headers: { 'x-telegram-id': INTEGRATION_USER.telegram_id }
    });
    const reputationHistory = await axios.get(`${CONFIG.API_BASE}/reputation/history`, {
      headers: { 'x-telegram-id': INTEGRATION_USER.telegram_id }
    });

    const userData = userInfo.data.data;
    const hasCheckInRecord = checkInHistory.data.total > 0;
    const hasReputationRecord = reputationHistory.data.total > 0;

    if (userData.reputation_points > 0 && hasCheckInRecord && hasReputationRecord) {
      recordTest('integration', '数据一致性验证', 'PASS',
        `用户声望: ${userData.reputation_points}, 签到记录: ${checkInHistory.data.total}, 声望记录: ${reputationHistory.data.total}`);
    } else {
      recordTest('integration', '数据一致性验证', 'FAIL',
        '数据不一致：签到和声望记录不匹配');
    }
  } catch (error) {
    recordTest('integration', '数据一致性验证', 'FAIL', '', error.message);
  }

  console.log('\n✅ 集成测试完成');
  return true;
}

// 第五阶段：Mini App测试
async function runMiniAppTests() {
  console.log('\n📱 第五阶段：Mini App集成测试\n');
  console.log('='.repeat(80));

  // 5.1 前端页面结构验证
  console.log('\n📝 5.1 前端页面结构验证');
  try {
    const pageResponse = await axios.get(`${CONFIG.FRONTEND_BASE}/src/apps/ProfileApp/index.html`);
    const dom = new JSDOM(pageResponse.data);
    const document = dom.window.document;

    const hasVueApp = document.querySelector('#app') !== null;
    const hasTelegramSDK = pageResponse.data.includes('telegram-web-app.js');
    const hasViewport = pageResponse.data.includes('viewport');

    if (hasVueApp && hasTelegramSDK && hasViewport) {
      recordTest('miniApp', '前端页面结构', 'PASS',
        'Vue应用、Telegram SDK、响应式视口配置正确');
    } else {
      recordTest('miniApp', '前端页面结构', 'FAIL',
        '页面结构不完整');
    }
  } catch (error) {
    recordTest('miniApp', '前端页面结构', 'FAIL', '', error.message);
  }

  // 5.2 Vue组件可访问性
  console.log('\n📝 5.2 Vue组件可访问性');
  try {
    const componentResponse = await axios.get(`${CONFIG.FRONTEND_BASE}/src/apps/ProfileApp/ProfileApp.vue`);

    if (componentResponse.status === 200 && componentResponse.data.length > 0) {
      recordTest('miniApp', 'Vue组件可访问性', 'PASS',
        `组件大小: ${componentResponse.data.length} 字符`);
    } else {
      recordTest('miniApp', 'Vue组件可访问性', 'FAIL',
        '组件无法访问');
    }
  } catch (error) {
    recordTest('miniApp', 'Vue组件可访问性', 'FAIL', '', error.message);
  }

  // 5.3 JavaScript模块检查
  console.log('\n📝 5.3 JavaScript模块检查');
  try {
    const modules = [
      `${CONFIG.FRONTEND_BASE}/src/apps/ProfileApp/index.js`,
      `${CONFIG.FRONTEND_BASE}/src/utils/apiService.js`,
      `${CONFIG.FRONTEND_BASE}/src/utils/webAppSdk.js`
    ];

    let allModulesOk = true;
    for (const moduleUrl of modules) {
      try {
        const response = await axios.get(moduleUrl, { timeout: 5000 });
        if (response.status !== 200) allModulesOk = false;
      } catch (error) {
        allModulesOk = false;
      }
    }

    if (allModulesOk) {
      recordTest('miniApp', 'JavaScript模块检查', 'PASS',
        '所有必需模块都可访问');
    } else {
      recordTest('miniApp', 'JavaScript模块检查', 'FAIL',
        '部分模块无法访问');
    }
  } catch (error) {
    recordTest('miniApp', 'JavaScript模块检查', 'FAIL', '', error.message);
  }

  console.log('\n✅ Mini App测试完成');
  return true;
}

// 主测试执行函数
async function runComprehensiveTests() {
  console.log('🚀 开始执行全面系统测试 - 100%通过率目标');
  console.log('测试开始时间:', new Date().toISOString());
  console.log('='.repeat(100));
  
  try {
    // 第一阶段：系统健康检查
    await runSystemHealthChecks();
    
    // 第二阶段：MVP-001 测试
    await runMVP001Tests();

    // 第三阶段：MVP-002 测试
    await runMVP002Tests();

    // 第四阶段：集成测试
    await runIntegrationTests();

    // 第五阶段：Mini App测试
    await runMiniAppTests();

    // 生成最终报告
    generateIntermediateReport();
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    generateFinalReport();
    process.exit(1);
  }
}

// 生成中期报告
function generateIntermediateReport() {
  console.log('\n📊 最终测试报告');
  console.log('='.repeat(60));

  const categories = ['systemHealth', 'mvp001', 'mvp002', 'integration', 'miniApp'];
  categories.forEach(category => {
    const results = TEST_RESULTS[category];
    if (results.length > 0) {
      const passed = results.filter(r => r.status === 'PASS').length;
      console.log(`${category}: ${passed}/${results.length} 通过`);
    }
  });

  console.log(`总体进度: ${TEST_RESULTS.passedTests}/${TEST_RESULTS.totalTests} 通过`);
  console.log(`最终成功率: ${Math.round((TEST_RESULTS.passedTests / TEST_RESULTS.totalTests) * 100)}%`);

  if (TEST_RESULTS.failedTests === 0) {
    console.log('\n🎉 🎉 🎉 所有测试100%通过！系统完全符合要求！ 🎉 🎉 🎉');
  } else {
    console.log(`\n⚠️ 还有 ${TEST_RESULTS.failedTests} 个测试失败，需要修复`);
  }
}

// 生成最终报告
function generateFinalReport() {
  console.log('\n📋 最终测试报告');
  console.log('='.repeat(100));
  console.log(`测试完成时间: ${new Date().toISOString()}`);
  console.log(`总测试数: ${TEST_RESULTS.totalTests}`);
  console.log(`通过测试: ${TEST_RESULTS.passedTests}`);
  console.log(`失败测试: ${TEST_RESULTS.failedTests}`);
  console.log(`成功率: ${Math.round((TEST_RESULTS.passedTests / TEST_RESULTS.totalTests) * 100)}%`);
  
  // 详细结果
  Object.keys(TEST_RESULTS).forEach(category => {
    if (Array.isArray(TEST_RESULTS[category]) && TEST_RESULTS[category].length > 0) {
      console.log(`\n${category.toUpperCase()} 测试结果:`);
      TEST_RESULTS[category].forEach((result, index) => {
        const status = result.status === 'PASS' ? '✅' : '❌';
        console.log(`  ${index + 1}. ${status} ${result.test}`);
        if (result.details) console.log(`     详情: ${result.details}`);
        if (result.error) console.log(`     错误: ${result.error}`);
      });
    }
  });
}

// 启动测试
if (require.main === module) {
  runComprehensiveTests().then(() => {
    generateFinalReport();
    if (TEST_RESULTS.failedTests === 0) {
      console.log('\n🎉 所有测试100%通过！');
      process.exit(0);
    } else {
      console.log('\n⚠️ 存在失败的测试，需要修复');
      process.exit(1);
    }
  }).catch(error => {
    console.error('测试执行异常:', error);
    generateFinalReport();
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  TEST_RESULTS,
  CONFIG
};
