const { expect } = require('chai');
const sinon = require('sinon');
const { Pool } = require('pg');
const checkInService = require('../src/services/checkInService');

describe('签到服务测试', () => {
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
  
  describe('checkIn', () => {
    it('用户首次签到应成功记录并返回正确结果', async () => {
      // 模拟用户查询结果
      const userId = 1;
      const today = new Date();
      const user = { 
        id: userId, 
        telegram_id: 123456, 
        reputation_points: 0,
        consecutive_check_ins: 0
      };
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves({ rows: [user] }); // BEGIN
      queryStub.onCall(1).resolves({ rows: [user] }); // SELECT user
      queryStub.onCall(2).resolves({ rows: [] }); // SELECT check_ins
      queryStub.onCall(3).resolves({ rows: [] }); // SELECT yesterday check_in
      queryStub.onCall(4).resolves({ rows: [{ id: 1 }] }); // INSERT check_ins
      queryStub.onCall(5).resolves(); // UPDATE users
      queryStub.onCall(6).resolves(); // INSERT reputation_logs
      queryStub.onCall(7).resolves({ rows: [{ 
        ...user, 
        reputation_points: 5,
        consecutive_check_ins: 1
      }] }); // SELECT updated user
      queryStub.onCall(8).resolves(); // COMMIT
      
      // 执行签到
      const result = await checkInService.checkIn(userId);
      
      // 验证结果
      expect(result).to.have.property('success', true);
      expect(result).to.have.property('message', '签到成功');
      expect(result.rewards).to.have.property('basePoints', 5);
      expect(result.user).to.have.property('reputation_points', 5);
      expect(result.user).to.have.property('consecutive_check_ins', 1);
      
      // 验证数据库操作
      expect(clientStub.query.callCount).to.be.at.least(8);
      expect(clientStub.release.calledOnce).to.be.true;
    });
    
    it('用户已签到时应返回已签到消息', async () => {
      // 模拟用户查询结果
      const userId = 1;
      const today = new Date();
      const user = { 
        id: userId, 
        telegram_id: 123456, 
        reputation_points: 5,
        consecutive_check_ins: 1
      };
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves({ rows: [user] }); // BEGIN
      queryStub.onCall(1).resolves({ rows: [user] }); // SELECT user
      queryStub.onCall(2).resolves({ rows: [{ id: 1 }] }); // SELECT check_ins (已签到)
      queryStub.onCall(3).resolves(); // ROLLBACK
      
      // 执行签到
      const result = await checkInService.checkIn(userId);
      
      // 验证结果
      expect(result).to.have.property('success', false);
      expect(result).to.have.property('message', '今天已经签到过了');
      
      // 验证数据库操作
      expect(clientStub.query.callCount).to.be.at.least(4);
      expect(clientStub.release.calledOnce).to.be.true;
    });
    
    it('连续签到时应增加连续签到天数和额外奖励', async () => {
      // 模拟用户查询结果
      const userId = 1;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const user = { 
        id: userId, 
        telegram_id: 123456, 
        reputation_points: 5,
        consecutive_check_ins: 1,
        last_check_in_date: yesterday
      };
      
      // 设置模拟查询返回结果
      queryStub.onCall(0).resolves({ rows: [user] }); // BEGIN
      queryStub.onCall(1).resolves({ rows: [user] }); // SELECT user
      queryStub.onCall(2).resolves({ rows: [] }); // SELECT check_ins
      queryStub.onCall(3).resolves({ 
        rows: [{ consecutive_days: 1 }] 
      }); // SELECT yesterday check_in
      queryStub.onCall(4).resolves({ rows: [{ id: 2 }] }); // INSERT check_ins
      queryStub.onCall(5).resolves(); // UPDATE users
      queryStub.onCall(6).resolves(); // INSERT reputation_logs
      queryStub.onCall(7).resolves({ 
        rows: [{ 
          ...user, 
          reputation_points: 12,  // 5(原始) + 5(基础) + 2(连续3天奖励)
          consecutive_check_ins: 2
        }] 
      }); // SELECT updated user
      queryStub.onCall(8).resolves(); // COMMIT
      
      // 执行签到
      const result = await checkInService.checkIn(userId);
      
      // 验证结果
      expect(result).to.have.property('success', true);
      expect(result.rewards).to.have.property('basePoints', 5);
      expect(result.rewards).to.have.property('bonusPoints').that.is.at.least(0);
      expect(result.user).to.have.property('consecutive_check_ins', 2);
    });
  });
  
  describe('getConsecutiveInfo', () => {
    it('应返回用户的连续签到信息', async () => {
      const userId = 1;
      const lastCheckInDate = new Date();
      const user = {
        consecutive_check_ins: 3,
        last_check_in_date: lastCheckInDate
      };
      
      // 设置模拟查询返回结果
      queryStub.resolves({ rows: [user] });
      
      // 获取连续签到信息
      const result = await checkInService.getConsecutiveInfo(userId);
      
      // 验证结果
      expect(result).to.have.property('consecutiveDays', 3);
      expect(result).to.have.property('lastCheckInDate');
      expect(result).to.have.property('checkedInToday');
    });
  });
}); 