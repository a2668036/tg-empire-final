/**
 * Telegram用户模拟测试工具
 * 模拟Telegram用户日常使用场景
 */
const request = require('supertest');
const app = require('../src/app');

class TelegramUserSimulator {
  constructor(username, firstName, lastName) {
    this.telegramId = Date.now().toString() + Math.floor(Math.random() * 1000);
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userId = null;
    this.token = null;
    this.reputationPoints = 0;
    this.consecutiveDays = 0;
  }
  
  /**
   * 注册新用户
   */
  async register() {
    try {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          telegram_id: this.telegramId,
          username: this.username,
          first_name: this.firstName,
          last_name: this.lastName
        });
      
      if (response.status !== 200) {
        throw new Error(`注册失败: ${response.body.message || '未知错误'}`);
      }
      
      this.userId = response.body.user.id;
      this.token = response.body.token;
      
      console.log(`用户 ${this.username} (ID: ${this.userId}) 注册成功`);
      return response.body;
    } catch (error) {
      console.error(`注册失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 更新个人资料
   */
  async updateProfile(profileData) {
    try {
      const response = await request(app)
        .put('/api/v1/users/me')
        .set('x-telegram-id', this.telegramId)
        .send(profileData);
      
      if (response.status !== 200) {
        throw new Error(`更新个人资料失败: ${response.body.message || '未知错误'}`);
      }
      
      console.log(`用户 ${this.username} 更新个人资料成功`);
      return response.body;
    } catch (error) {
      console.error(`更新个人资料失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 签到
   */
  async checkIn() {
    try {
      const response = await request(app)
        .post('/api/v1/check-in')
        .set('x-telegram-id', this.telegramId);
      
      if (response.status === 400 && response.body.message.includes('已经签到')) {
        console.log(`用户 ${this.username} 今天已经签到过了`);
        return { alreadyCheckedIn: true };
      }
      
      if (response.status !== 200) {
        throw new Error(`签到失败: ${response.body.message || '未知错误'}`);
      }
      
      const rewards = response.body.rewards;
      this.reputationPoints = response.body.user.reputation_points;
      this.consecutiveDays = response.body.user.consecutive_check_ins;
      
      console.log(`用户 ${this.username} 签到成功，获得 ${rewards.totalPoints} 声望点数，连续签到 ${this.consecutiveDays} 天`);
      return response.body;
    } catch (error) {
      console.error(`签到失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 获取签到状态
   */
  async getCheckInStatus() {
    try {
      const response = await request(app)
        .get('/api/v1/check-in/status')
        .set('x-telegram-id', this.telegramId);
      
      if (response.status !== 200) {
        throw new Error(`获取签到状态失败: ${response.body.message || '未知错误'}`);
      }
      
      this.consecutiveDays = response.body.consecutiveDays;
      
      console.log(`用户 ${this.username} 连续签到 ${this.consecutiveDays} 天`);
      return response.body;
    } catch (error) {
      console.error(`获取签到状态失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 获取声望历史
   */
  async getReputationHistory() {
    try {
      const response = await request(app)
        .get('/api/v1/reputation/history')
        .set('x-telegram-id', this.telegramId);
      
      if (response.status !== 200) {
        throw new Error(`获取声望历史失败: ${response.body.message || '未知错误'}`);
      }
      
      console.log(`用户 ${this.username} 声望历史记录: ${response.body.records.length} 条`);
      return response.body;
    } catch (error) {
      console.error(`获取声望历史失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 获取声望统计
   */
  async getReputationStats() {
    try {
      const response = await request(app)
        .get('/api/v1/reputation/stats')
        .set('x-telegram-id', this.telegramId);
      
      if (response.status !== 200) {
        throw new Error(`获取声望统计失败: ${response.body.message || '未知错误'}`);
      }
      
      this.reputationPoints = response.body.currentPoints;
      
      console.log(`用户 ${this.username} 当前声望: ${this.reputationPoints} 点`);
      return response.body;
    } catch (error) {
      console.error(`获取声望统计失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 模拟正常用户行为序列
   */
  async simulateNormalUserBehavior() {
    try {
      console.log(`\n开始模拟用户 ${this.username} 的正常行为...`);
      
      // 步骤1: 注册
      await this.register();
      
      // 步骤2: 完善个人资料
      await this.updateProfile({
        profile_bio: `这是 ${this.username} 的个人简介`,
        avatar_url: `https://example.com/avatar/${this.username}.jpg`
      });
      
      // 步骤3: 查看个人签到状态
      await this.getCheckInStatus();
      
      // 步骤4: 签到
      await this.checkIn();
      
      // 步骤5: 查看声望历史
      await this.getReputationHistory();
      
      // 步骤6: 查看声望统计
      await this.getReputationStats();
      
      console.log(`用户 ${this.username} 模拟完成，当前声望: ${this.reputationPoints} 点，连续签到: ${this.consecutiveDays} 天\n`);
      return {
        userId: this.userId,
        reputationPoints: this.reputationPoints,
        consecutiveDays: this.consecutiveDays
      };
    } catch (error) {
      console.error(`用户 ${this.username} 模拟失败: ${error.message}`);
      throw error;
    }
  }
}

/**
 * 模拟多个用户
 * @param {number} count 用户数量
 */
async function simulateMultipleUsers(count = 3) {
  console.log(`开始模拟 ${count} 个用户的行为...\n`);
  
  const users = [];
  for (let i = 1; i <= count; i++) {
    const user = new TelegramUserSimulator(
      `user_${i}`,
      `测试${i}`,
      '用户'
    );
    
    users.push(user);
  }
  
  const results = [];
  for (const user of users) {
    try {
      const result = await user.simulateNormalUserBehavior();
      results.push(result);
    } catch (error) {
      console.error(`用户 ${user.username} 模拟出错: ${error.message}`);
    }
  }
  
  console.log('所有用户模拟完成');
  console.table(results);
}

// 导出模拟器
module.exports = {
  TelegramUserSimulator,
  simulateMultipleUsers
};

// 如果直接运行此脚本，则执行模拟
if (require.main === module) {
  simulateMultipleUsers()
    .catch(err => console.error('模拟失败:', err));
} 