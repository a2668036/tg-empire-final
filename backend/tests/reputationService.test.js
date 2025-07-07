const { expect } = require('chai');
const sinon = require('sinon');
const { Pool } = require('pg');
const reputationService = require('../src/services/reputationService');

describe('声望服务测试', () => {
  // 模拟数据库查询
  let poolStub;
  let clientStub;
  let queryStub;
  let connectStub;
  let releaseStub;
  
  beforeEach(() => {
    // 设置数据库查询的模拟
    queryStub = sinon.stub();
    releaseStub = sinon.stub();
    
    clientStub = {
      query: queryStub,
      release: releaseStub
    };
    
    connectStub = sinon.stub().resolves(clientStub);
    
    poolStub = sinon.stub(Pool.prototype, 'connect').callsFake(connectStub);
    sinon.stub(Pool.prototype, 'query').callsFake(queryStub);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('addPoints', () => {
    it('应成功添加声望点数并更新用户记录', async () => {
      // 测试数据
      const userId = 1;
      const points = 10;
      const reason = '测试添加点数';
      const sourceType = 'test';
      const user = {
        id: userId,
        telegram_id: 123456,
        reputation_points: 5
      };
      const updatedUser = {
        ...user,
        reputation_points: 15
      };
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves(); // BEGIN
      queryStub.onCall(1).resolves({ rows: [user] }); // SELECT user
      queryStub.onCall(2).resolves(); // UPDATE users
      queryStub.onCall(3).resolves(); // INSERT reputation_logs
      queryStub.onCall(4).resolves({ rows: [updatedUser] }); // SELECT updated user
      queryStub.onCall(5).resolves(); // COMMIT
      
      // 执行添加声望点数
      const result = await reputationService.addPoints(userId, points, reason, sourceType);
      
      // 验证结果
      expect(result).to.have.property('success', true);
      expect(result.pointsChange).to.equal(points);
      expect(result.newBalance).to.equal(15);
      expect(result.user).to.deep.equal(updatedUser);
      
      // 验证数据库操作
      expect(clientStub.query.callCount).to.equal(6);
      expect(clientStub.release.calledOnce).to.be.true;
    });
    
    it('点数为负值或零时应抛出错误', async () => {
      try {
        await reputationService.addPoints(1, -5, '测试', 'test');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('点数必须为正数');
      }
      
      try {
        await reputationService.addPoints(1, 0, '测试', 'test');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('点数必须为正数');
      }
    });
  });
  
  describe('deductPoints', () => {
    it('应成功减少声望点数并更新用户记录', async () => {
      // 测试数据
      const userId = 1;
      const points = 3;
      const reason = '测试减少点数';
      const sourceType = 'test';
      const user = {
        id: userId,
        telegram_id: 123456,
        reputation_points: 10
      };
      const updatedUser = {
        ...user,
        reputation_points: 7
      };
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves(); // BEGIN
      queryStub.onCall(1).resolves({ rows: [user] }); // SELECT user
      queryStub.onCall(2).resolves(); // UPDATE users
      queryStub.onCall(3).resolves(); // INSERT reputation_logs
      queryStub.onCall(4).resolves({ rows: [updatedUser] }); // SELECT updated user
      queryStub.onCall(5).resolves(); // COMMIT
      
      // 执行减少声望点数
      const result = await reputationService.deductPoints(userId, points, reason, sourceType);
      
      // 验证结果
      expect(result).to.have.property('success', true);
      expect(result.pointsChange).to.equal(-points);
      expect(result.newBalance).to.equal(7);
      expect(result.user).to.deep.equal(updatedUser);
      
      // 验证数据库操作
      expect(clientStub.query.callCount).to.equal(6);
      expect(clientStub.release.calledOnce).to.be.true;
    });
    
    it('减少点数超过用户当前点数时应返回错误', async () => {
      // 测试数据
      const userId = 1;
      const points = 20;
      const reason = '测试减少过多点数';
      const sourceType = 'test';
      const user = {
        id: userId,
        telegram_id: 123456,
        reputation_points: 10
      };
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves(); // BEGIN
      queryStub.onCall(1).resolves({ rows: [user] }); // SELECT user
      queryStub.onCall(2).resolves(); // ROLLBACK
      
      // 执行减少声望点数
      const result = await reputationService.deductPoints(userId, points, reason, sourceType);
      
      // 验证结果
      expect(result).to.have.property('success', false);
      expect(result.message).to.equal('声誉点数不足');
      
      // 验证数据库操作
      expect(clientStub.query.callCount).to.equal(3);
      expect(clientStub.release.calledOnce).to.be.true;
    });
  });
  
  describe('getReputationHistory', () => {
    it('应返回用户的声望历史记录', async () => {
      // 测试数据
      const userId = 1;
      const historyRecords = [
        { id: 1, points_change: 10, reason: '签到', created_at: new Date() },
        { id: 2, points_change: -5, reason: '兑换', created_at: new Date() }
      ];
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves({ rows: historyRecords }); // SELECT reputation_logs
      queryStub.onCall(1).resolves({ rows: [{ count: '2' }] }); // SELECT COUNT
      
      // 获取声望历史
      const result = await reputationService.getReputationHistory(userId);
      
      // 验证结果
      expect(result).to.have.property('records').that.deep.equals(historyRecords);
      expect(result).to.have.property('total', 2);
      
      // 验证数据库操作
      expect(queryStub.callCount).to.equal(2);
    });
  });
  
  describe('getReputationStats', () => {
    it('应返回用户的声望统计数据', async () => {
      // 测试数据
      const userId = 1;
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves({ rows: [{ reputation_points: 50 }] }); // SELECT user
      queryStub.onCall(1).resolves({ rows: [{ sum: '100' }] }); // SELECT total income
      queryStub.onCall(2).resolves({ rows: [{ sum: '50' }] }); // SELECT total expense
      queryStub.onCall(3).resolves({ 
        rows: [
          { source_type: 'check_in', total: '80' },
          { source_type: 'admin', total: '20' }
        ] 
      }); // SELECT income by source
      queryStub.onCall(4).resolves({ 
        rows: [
          { source_type: 'exchange', total: '50' }
        ] 
      }); // SELECT expense by source
      
      // 获取声望统计
      const result = await reputationService.getReputationStats(userId);
      
      // 验证结果
      expect(result).to.have.property('currentPoints', 50);
      expect(result).to.have.property('totalIncome', 100);
      expect(result).to.have.property('totalExpense', 50);
      expect(result.incomeBySource).to.deep.equal({
        'check_in': 80,
        'admin': 20
      });
      expect(result.expenseBySource).to.deep.equal({
        'exchange': 50
      });
      
      // 验证数据库操作
      expect(queryStub.callCount).to.equal(5);
    });
  });
}); 