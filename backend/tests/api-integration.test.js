const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const sinon = require('sinon');

describe('API集成测试', () => {
  let telegramId;
  let userId;
  let authToken;
  
  // 在所有测试前创建用户并获取身份验证令牌
  before(async () => {
    telegramId = Date.now().toString(); // 使用时间戳作为唯一ID
    
    // 注册用户
    const registerResponse = await request(app)
      .post('/api/v1/users/register')
      .send({
        telegram_id: telegramId,
        username: 'test_user',
        first_name: '测试',
        last_name: '用户'
      });
    
    expect(registerResponse.status).to.equal(201);
    expect(registerResponse.body).to.have.property('token');
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });
  
  describe('用户API测试 (MVP-001)', () => {
    it('应能获取用户信息', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('x-telegram-id', telegramId);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('username', 'test_user');
    });
    
    it('应能更新用户信息', async () => {
      const response = await request(app)
        .put('/api/v1/users/me')
        .set('x-telegram-id', telegramId)
        .send({
          profile_bio: '这是测试简介'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('profile_bio', '这是测试简介');
    });
  });
  
  describe('签到API测试 (MVP-002)', () => {
    it('应能成功签到并获得声望点数', async () => {
      const response = await request(app)
        .post('/api/v1/check-in')
        .set('x-telegram-id', telegramId);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '签到成功');
      expect(response.body.rewards).to.have.property('basePoints', 5);
    });
    
    it('重复签到应返回已签到信息', async () => {
      const response = await request(app)
        .post('/api/v1/check-in')
        .set('x-telegram-id', telegramId);
      
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('已经签到');
    });
    
    it('应能获取签到状态', async () => {
      const response = await request(app)
        .get('/api/v1/check-in/status')
        .set('x-telegram-id', telegramId);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('consecutiveDays').that.is.at.least(1);
      expect(response.body).to.have.property('checkedInToday', true);
    });
  });
  
  describe('声望API测试 (MVP-002)', () => {
    it('应能获取声望历史', async () => {
      const response = await request(app)
        .get('/api/v1/reputation/history')
        .set('x-telegram-id', telegramId);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('records').that.is.an('array');
      expect(response.body.records.length).to.be.at.least(1);
    });
    
    it('应能获取声望统计', async () => {
      const response = await request(app)
        .get('/api/v1/reputation/stats')
        .set('x-telegram-id', telegramId);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('currentPoints').that.is.at.least(5);
      expect(response.body).to.have.property('totalIncome').that.is.at.least(5);
    });
  });
  
  // 在测试后清理创建的测试数据
  after(async () => {
    // 这里可以添加清理测试数据的逻辑
    // 例如删除测试用户等
  });
}); 