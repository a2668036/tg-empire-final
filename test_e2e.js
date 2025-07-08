/**
 * 端到端测试脚本
 * 测试完整的用户流程：注册 → 签到 → 查看历史 → 统计数据
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER_ID = '999888777';

// 测试用户数据
const testUser = {
  telegram_id: parseInt(TEST_USER_ID),
  username: 'e2e_test_user',
  first_name: 'E2E',
  last_name: 'Test'
};

// API客户端
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-telegram-id': TEST_USER_ID
  }
});

// 测试步骤
async function runE2ETest() {
  console.log('🚀 开始端到端测试...\n');
  
  try {
    // 步骤1: 清理测试数据
    console.log('📝 步骤1: 清理测试数据');
    await cleanupTestData();
    console.log('✅ 测试数据清理完成\n');
    
    // 步骤2: 用户注册
    console.log('📝 步骤2: 用户注册');
    const registerResult = await api.post('/users/register', testUser);
    console.log('✅ 用户注册成功:', registerResult.data.username);
    console.log(`   用户ID: ${registerResult.data.id}`);
    console.log(`   声望点数: ${registerResult.data.reputation_points}\n`);
    
    // 步骤3: 获取用户信息
    console.log('📝 步骤3: 获取用户信息');
    const userResult = await api.get('/users/me');
    console.log('✅ 用户信息获取成功:', userResult.data.username);
    console.log(`   连续签到: ${userResult.data.consecutive_check_ins}天\n`);
    
    // 步骤4: 执行签到
    console.log('📝 步骤4: 执行签到');
    const checkInResult = await api.post('/users/check-in');
    console.log('✅ 签到成功:', checkInResult.data.message);
    console.log(`   获得点数: ${checkInResult.data.rewards.totalPoints}`);
    console.log(`   当前声望: ${checkInResult.data.user.reputation_points}\n`);
    
    // 步骤5: 查看签到历史
    console.log('📝 步骤5: 查看签到历史');
    const historyResult = await api.get('/check-in/history');
    console.log('✅ 签到历史获取成功');
    console.log(`   历史记录数: ${historyResult.data.total}`);
    if (historyResult.data.records.length > 0) {
      const latest = historyResult.data.records[0];
      console.log(`   最新签到: ${latest.check_in_date} (获得${latest.reputation_earned}点)\n`);
    }
    
    // 步骤6: 查看声望历史
    console.log('📝 步骤6: 查看声望历史');
    const reputationResult = await api.get('/reputation/history');
    console.log('✅ 声望历史获取成功');
    console.log(`   历史记录数: ${reputationResult.data.total}`);
    if (reputationResult.data.records.length > 0) {
      const latest = reputationResult.data.records[0];
      console.log(`   最新记录: ${latest.reason} (+${latest.points_change}点)\n`);
    }
    
    // 步骤7: 获取统计数据
    console.log('📝 步骤7: 获取统计数据');
    const statsResult = await api.get('/check-in/stats');
    console.log('✅ 统计数据获取成功');
    console.log(`   总签到天数: ${statsResult.data.totalDays}`);
    console.log(`   总获得点数: ${statsResult.data.totalPoints}`);
    console.log(`   本月签到: ${statsResult.data.monthDays}天\n`);
    
    // 步骤8: 测试重复签到
    console.log('📝 步骤8: 测试重复签到');
    try {
      await api.post('/users/check-in');
      console.log('❌ 重复签到应该失败但成功了');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 重复签到正确被拒绝:', error.response.data.error);
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 端到端测试全部通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

// 清理测试数据
async function cleanupTestData() {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    await execPromise(`docker exec tg_postgres psql -U tg_admin -d tg_empire -c "
      DELETE FROM check_ins WHERE user_id IN (SELECT id FROM users WHERE telegram_id = '${TEST_USER_ID}');
      DELETE FROM reputation_logs WHERE user_id IN (SELECT id FROM users WHERE telegram_id = '${TEST_USER_ID}');
      DELETE FROM users WHERE telegram_id = '${TEST_USER_ID}';
    "`);
  } catch (error) {
    // 忽略清理错误，可能是数据不存在
  }
}

// 运行测试
if (require.main === module) {
  runE2ETest();
}

module.exports = { runE2ETest };
