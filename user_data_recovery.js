#!/usr/bin/env node

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000/api/v1';

async function checkUserData() {
  console.log('🔍 开始检查用户数据状态...\n');
  
  try {
    // 获取所有用户数据（需要添加管理员API）
    console.log('📊 检查数据库中的用户数据...');
    
    // 检查最近注册的用户
    const testUsers = [
      '999999999', // 测试用户1
      '999999998', // 测试用户2
      '100001001', // MVP-001测试用户
      '200002002', // MVP-002测试用户
      '300003003'  // 集成测试用户
    ];
    
    console.log('检查已知测试用户的数据状态:');
    console.log('='.repeat(60));
    
    for (const telegramId of testUsers) {
      try {
        const userResponse = await axios.get(`${API_BASE}/users/me`, {
          headers: { 'x-telegram-id': telegramId }
        });
        
        const user = userResponse.data.data;
        console.log(`✅ 用户 ${telegramId}:`);
        console.log(`   姓名: ${user.first_name} ${user.last_name || ''}`);
        console.log(`   用户名: ${user.username || '无'}`);
        console.log(`   声望点数: ${user.reputation_points}`);
        console.log(`   连续签到: ${user.consecutive_check_ins}天`);
        console.log(`   最后签到: ${user.last_check_in_date || '从未签到'}`);
        
        // 检查签到历史
        try {
          const historyResponse = await axios.get(`${API_BASE}/check-in/history?limit=5`, {
            headers: { 'x-telegram-id': telegramId }
          });
          console.log(`   签到记录: ${historyResponse.data.total}条`);
        } catch (err) {
          console.log(`   签到记录: 查询失败`);
        }
        
        console.log('');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`❌ 用户 ${telegramId}: 不存在`);
        } else {
          console.log(`❌ 用户 ${telegramId}: 查询失败 - ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 检查用户数据失败:', error.message);
  }
}

async function createTestUserWithData() {
  console.log('\n🔧 创建测试用户并添加历史数据...');
  
  const testUser = {
    telegram_id: '888888888',
    username: 'production_test_user',
    first_name: '生产测试',
    last_name: '用户'
  };
  
  try {
    // 1. 注册用户
    console.log('1. 注册测试用户...');
    const registerResponse = await axios.post(`${API_BASE}/users/register`, testUser);
    console.log('✅ 用户注册成功:', registerResponse.data.data.id);
    
    // 2. 执行签到
    console.log('2. 执行签到...');
    const checkInResponse = await axios.post(`${API_BASE}/check-in`, {}, {
      headers: { 'x-telegram-id': testUser.telegram_id }
    });
    console.log('✅ 签到成功，获得声望:', checkInResponse.data.rewards.totalPoints);
    
    // 3. 验证数据
    console.log('3. 验证用户数据...');
    const userResponse = await axios.get(`${API_BASE}/users/me`, {
      headers: { 'x-telegram-id': testUser.telegram_id }
    });
    
    const user = userResponse.data.data;
    console.log('✅ 用户数据验证:');
    console.log(`   姓名: ${user.first_name} ${user.last_name}`);
    console.log(`   用户名: ${user.username}`);
    console.log(`   声望点数: ${user.reputation_points}`);
    console.log(`   连续签到: ${user.consecutive_check_ins}天`);
    
    return testUser;
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    return null;
  }
}

async function testRealUserFlow(telegramId) {
  console.log(`\n🧪 测试真实用户流程 (Telegram ID: ${telegramId})...`);
  
  try {
    // 1. 检查用户是否存在
    console.log('1. 检查用户状态...');
    let user;
    try {
      const userResponse = await axios.get(`${API_BASE}/users/me`, {
        headers: { 'x-telegram-id': telegramId }
      });
      user = userResponse.data.data;
      console.log('✅ 用户已存在');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('ℹ️ 用户不存在，需要通过Bot注册');
        return;
      } else {
        throw error;
      }
    }
    
    // 2. 显示用户信息
    console.log('2. 用户信息:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Telegram ID: ${user.telegram_id}`);
    console.log(`   姓名: ${user.first_name} ${user.last_name || ''}`);
    console.log(`   用户名: ${user.username || '无'}`);
    console.log(`   声望点数: ${user.reputation_points}`);
    console.log(`   连续签到: ${user.consecutive_check_ins}天`);
    console.log(`   最后签到: ${user.last_check_in_date || '从未签到'}`);
    
    // 3. 检查签到状态
    console.log('3. 检查签到状态...');
    const statusResponse = await axios.get(`${API_BASE}/check-in/status`, {
      headers: { 'x-telegram-id': telegramId }
    });
    console.log(`   今日已签到: ${statusResponse.data.checkedInToday ? '是' : '否'}`);
    console.log(`   连续签到天数: ${statusResponse.data.consecutiveDays}天`);
    
    // 4. 检查历史记录
    console.log('4. 检查历史记录...');
    const historyResponse = await axios.get(`${API_BASE}/check-in/history?limit=10`, {
      headers: { 'x-telegram-id': telegramId }
    });
    console.log(`   签到记录总数: ${historyResponse.data.total}`);
    
    if (historyResponse.data.records.length > 0) {
      console.log('   最近签到记录:');
      historyResponse.data.records.slice(0, 3).forEach((record, index) => {
        console.log(`     ${index + 1}. ${record.check_in_date} - 获得${record.reputation_earned}点声望`);
      });
    }
    
    // 5. 检查声望历史
    const reputationResponse = await axios.get(`${API_BASE}/reputation/history?limit=5`, {
      headers: { 'x-telegram-id': telegramId }
    });
    console.log(`   声望记录总数: ${reputationResponse.data.total}`);
    
    return user;
    
  } catch (error) {
    console.error('❌ 测试用户流程失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return null;
  }
}

async function fixUserDisplayIssues() {
  console.log('\n🔧 修复用户显示问题...');
  
  // 检查所有测试用户的用户名字段
  const testUsers = ['999999999', '100001001', '200002002'];
  
  for (const telegramId of testUsers) {
    try {
      const userResponse = await axios.get(`${API_BASE}/users/me`, {
        headers: { 'x-telegram-id': telegramId }
      });
      
      const user = userResponse.data.data;
      console.log(`检查用户 ${telegramId}:`);
      console.log(`  first_name: "${user.first_name}"`);
      console.log(`  last_name: "${user.last_name}"`);
      console.log(`  username: "${user.username}"`);
      
      // 如果用户名为空，尝试更新
      if (!user.username) {
        console.log(`  ⚠️ 用户名为空，尝试更新...`);
        try {
          await axios.put(`${API_BASE}/users/me`, {
            username: `user_${telegramId}`
          }, {
            headers: { 'x-telegram-id': telegramId }
          });
          console.log(`  ✅ 用户名已更新为: user_${telegramId}`);
        } catch (updateError) {
          console.log(`  ❌ 更新用户名失败: ${updateError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ 检查用户 ${telegramId} 失败: ${error.message}`);
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    await checkUserData();
  } else if (command === 'create-test') {
    await createTestUserWithData();
  } else if (command === 'test-user') {
    const telegramId = args[1];
    if (!telegramId) {
      console.error('请提供Telegram ID: node user_data_recovery.js test-user <telegram_id>');
      process.exit(1);
    }
    await testRealUserFlow(telegramId);
  } else if (command === 'fix-display') {
    await fixUserDisplayIssues();
  } else {
    console.log('用户数据恢复和检查工具');
    console.log('');
    console.log('使用方法:');
    console.log('  node user_data_recovery.js check                    # 检查所有测试用户数据');
    console.log('  node user_data_recovery.js create-test             # 创建新的测试用户');
    console.log('  node user_data_recovery.js test-user <telegram_id> # 测试特定用户流程');
    console.log('  node user_data_recovery.js fix-display             # 修复用户显示问题');
    console.log('');
    console.log('示例:');
    console.log('  node user_data_recovery.js test-user 123456789');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}

module.exports = { checkUserData, createTestUserWithData, testRealUserFlow };
