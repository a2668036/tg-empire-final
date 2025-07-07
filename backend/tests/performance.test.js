const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');

describe('性能测试', function() {
  this.timeout(30000); // 延长测试超时时间
  
  let telegramId;
  let userIds = [];
  
  before(async () => {
    // 创建测试用户
    telegramId = Date.now().toString();
    
    const response = await request(app)
      .post('/api/v1/users/register')
      .send({
        telegram_id: telegramId,
        username: 'perf_test',
        first_name: '性能',
        last_name: '测试'
      });
    
    userIds.push(response.body.user.id);
  });
  
  describe('MVP-001 性能测试', () => {
    it('用户API响应时间应在200ms内', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('x-telegram-id', telegramId);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).to.equal(200);
      expect(responseTime).to.be.below(200);
      console.log(`用户API响应时间: ${responseTime}ms`);
    });
  });
  
  describe('MVP-002 性能测试', () => {
    it('签到API响应时间应在300ms内', async () => {
      // 在测试前先重置签到状态(这里仅做测试，实际情况不应操作)
      // 使用直接更新数据库的方式重置状态以便进行测试
      
      const startTime = Date.now();
      
      // 模拟签到
      const response = await request(app)
        .post('/api/v1/check-in')
        .set('x-telegram-id', telegramId);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 响应可能是成功或者已经签到
      expect(response.status).to.be.oneOf([200, 400]);
      expect(responseTime).to.be.below(300);
      console.log(`签到API响应时间: ${responseTime}ms`);
    });
    
    it('声望历史API响应时间应在200ms内', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/reputation/history')
        .set('x-telegram-id', telegramId);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).to.equal(200);
      expect(responseTime).to.be.below(200);
      console.log(`声望历史API响应时间: ${responseTime}ms`);
    });
  });
  
  describe('并发测试', () => {
    it('应能处理10个并发签到请求', async () => {
      // 创建10个测试用户
      const users = [];
      for (let i = 0; i < 10; i++) {
        const tempTelegramId = `${Date.now()}_${i}`;
        const response = await request(app)
          .post('/api/v1/users/register')
          .send({
            telegram_id: tempTelegramId,
            username: `concurrent_${i}`,
            first_name: '并发',
            last_name: '测试'
          });
        
        users.push({
          telegramId: tempTelegramId,
          userId: response.body.user.id
        });
        
        userIds.push(response.body.user.id);
      }
      
      // 发送并发请求
      const startTime = Date.now();
      
      const requests = users.map(user => {
        return request(app)
          .post('/api/v1/check-in')
          .set('x-telegram-id', user.telegramId);
      });
      
      const responses = await Promise.all(requests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // 验证所有请求都成功
      responses.forEach(response => {
        expect(response.status).to.equal(200);
      });
      
      // 验证总时间在可接受范围内 (平均每个请求不超过200ms)
      expect(totalTime).to.be.below(10 * 200);
      console.log(`10个并发签到请求总时间: ${totalTime}ms, 平均: ${totalTime / 10}ms`);
    });
  });
  
  after(async () => {
    // 清理测试数据的逻辑，在真实环境中可能需要直接操作数据库
  });
}); 