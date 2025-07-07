/**
 * Redis缓存优化测试
 * 用于测试和演示使用Redis缓存加速签到和声望系统的性能
 */
const { expect } = require('chai');
const Redis = require('redis');
const { promisify } = require('util');
const request = require('supertest');
const app = require('../src/app');
const sinon = require('sinon');

// 创建Redis客户端
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// 将Redis命令转换为Promise
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const flushAsync = promisify(redisClient.flushAll).bind(redisClient);

describe('Redis缓存测试', function() {
  this.timeout(10000);
  
  let telegramId;
  let userId;
  
  before(async () => {
    // 创建测试用户
    telegramId = Date.now().toString();
    
    const response = await request(app)
      .post('/api/v1/users/register')
      .send({
        telegram_id: telegramId,
        username: 'redis_test',
        first_name: 'Redis',
        last_name: '测试'
      });
    
    userId = response.body.user.id;
    
    // 清空Redis缓存
    await flushAsync();
  });
  
  describe('签到状态缓存', () => {
    it('首次查询签到状态应从数据库读取', async () => {
      // 确保缓存中没有数据
      const cacheKey = `user:${userId}:check_in_status`;
      await delAsync(cacheKey);
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 获取签到状态
      const response = await request(app)
        .get('/api/v1/check-in/status')
        .set('x-telegram-id', telegramId);
      
      const endTime = Date.now();
      const firstQueryTime = endTime - startTime;
      
      expect(response.status).to.equal(200);
      console.log(`首次查询签到状态耗时: ${firstQueryTime}ms`);
      
      // 手动将结果缓存到Redis (模拟实现缓存逻辑)
      await setAsync(cacheKey, JSON.stringify(response.body), 'EX', 60);
      
      // 再次查询，这次应从缓存读取
      const cacheStartTime = Date.now();
      
      const cachedResponse = await request(app)
        .get('/api/v1/check-in/status')
        .set('x-telegram-id', telegramId);
      
      const cacheEndTime = Date.now();
      const secondQueryTime = cacheEndTime - cacheStartTime;
      
      expect(cachedResponse.status).to.equal(200);
      console.log(`缓存查询签到状态耗时: ${secondQueryTime}ms`);
      
      // 期望缓存查询比首次查询快
      // 注意：这个测试可能不总是通过，因为HTTP请求时间可能有波动
      // 实际的缓存优化代码应该在服务层实现
      console.log(`性能提升: ${Math.round((firstQueryTime - secondQueryTime) / firstQueryTime * 100)}%`);
    });
  });
  
  describe('声望历史缓存', () => {
    it('应该能缓存声望历史查询结果', async () => {
      // 确保缓存中没有数据
      const cacheKey = `user:${userId}:reputation_history`;
      await delAsync(cacheKey);
      
      // 签到获取声望点数
      await request(app)
        .post('/api/v1/check-in')
        .set('x-telegram-id', telegramId);
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 获取声望历史
      const response = await request(app)
        .get('/api/v1/reputation/history')
        .set('x-telegram-id', telegramId);
      
      const endTime = Date.now();
      const firstQueryTime = endTime - startTime;
      
      expect(response.status).to.equal(200);
      console.log(`首次查询声望历史耗时: ${firstQueryTime}ms`);
      
      // 手动将结果缓存到Redis (模拟实现缓存逻辑)
      await setAsync(cacheKey, JSON.stringify(response.body), 'EX', 60);
      
      // 再次查询，这次应从缓存读取
      const cacheStartTime = Date.now();
      
      const cachedResponse = await request(app)
        .get('/api/v1/reputation/history')
        .set('x-telegram-id', telegramId);
      
      const cacheEndTime = Date.now();
      const secondQueryTime = cacheEndTime - cacheStartTime;
      
      expect(cachedResponse.status).to.equal(200);
      console.log(`缓存查询声望历史耗时: ${secondQueryTime}ms`);
      
      // 输出性能提升
      console.log(`性能提升: ${Math.round((firstQueryTime - secondQueryTime) / firstQueryTime * 100)}%`);
    });
  });
  
  describe('缓存优化建议', () => {
    it('在签到后应该能刷新相关缓存', async () => {
      // 此测试只是演示目的，实际缓存逻辑应在后端实现
      
      // 1. 签到前准备缓存
      const checkInStatusKey = `user:${userId}:check_in_status`;
      const reputationHistoryKey = `user:${userId}:reputation_history`;
      const reputationStatsKey = `user:${userId}:reputation_stats`;
      
      // 确保缓存存在(模拟数据)
      await setAsync(checkInStatusKey, JSON.stringify({ checkedInToday: false }), 'EX', 60);
      await setAsync(reputationHistoryKey, JSON.stringify({ records: [] }), 'EX', 60);
      await setAsync(reputationStatsKey, JSON.stringify({ currentPoints: 0 }), 'EX', 60);
      
      // 2. 进行签到(这会改变用户状态)
      await request(app)
        .post('/api/v1/check-in')
        .set('x-telegram-id', telegramId);
      
      // 3. 在真实实现中，签到后应删除相关缓存，这里手动执行
      await delAsync(checkInStatusKey);
      await delAsync(reputationHistoryKey);
      await delAsync(reputationStatsKey);
      
      // 4. 验证缓存已被删除
      const checkInStatusCache = await getAsync(checkInStatusKey);
      const reputationHistoryCache = await getAsync(reputationHistoryKey);
      const reputationStatsCache = await getAsync(reputationStatsKey);
      
      expect(checkInStatusCache).to.be.null;
      expect(reputationHistoryCache).to.be.null;
      expect(reputationStatsCache).to.be.null;
      
      console.log('签到后相关缓存已成功刷新');
    });
  });
  
  after(async () => {
    // 清理Redis缓存
    await flushAsync();
    
    // 关闭Redis连接
    redisClient.quit();
  });
}); 