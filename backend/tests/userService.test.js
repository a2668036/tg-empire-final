const { expect } = require('chai');
const sinon = require('sinon');
const User = require('../src/models/User');
const userService = require('../src/services/userService');

describe('用户服务测试', () => {
  let findByTelegramIdStub;
  let createStub;
  let updateStub;
  let checkInStub;
  
  beforeEach(() => {
    // 为User模型方法创建Stub
    findByTelegramIdStub = sinon.stub(User, 'findByTelegramId');
    createStub = sinon.stub(User, 'create');
    updateStub = sinon.stub(User, 'update');
    checkInStub = sinon.stub(User, 'checkIn');
  });
  
  afterEach(() => {
    // 恢复所有Stub
    sinon.restore();
  });
  
  describe('registerUser', () => {
    it('用户不存在时应创建新用户', async () => {
      const userData = { telegram_id: 123456, username: 'test_user' };
      const expectedUser = { id: 1, ...userData };
      
      findByTelegramIdStub.resolves(null);
      createStub.resolves(expectedUser);
      
      const result = await userService.registerUser(userData);
      
      expect(findByTelegramIdStub.calledOnceWith(userData.telegram_id)).to.be.true;
      expect(createStub.calledOnceWith(userData)).to.be.true;
      expect(result).to.deep.equal(expectedUser);
    });
    
    it('用户已存在时应返回现有用户', async () => {
      const userData = { telegram_id: 123456, username: 'test_user' };
      const existingUser = { id: 1, ...userData };
      
      findByTelegramIdStub.resolves(existingUser);
      
      const result = await userService.registerUser(userData);
      
      expect(findByTelegramIdStub.calledOnceWith(userData.telegram_id)).to.be.true;
      expect(createStub.notCalled).to.be.true;
      expect(result).to.deep.equal(existingUser);
    });
  });
  
  describe('getUserByTelegramId', () => {
    it('应返回通过Telegram ID查找到的用户', async () => {
      const telegramId = 123456;
      const expectedUser = { id: 1, telegram_id: telegramId, username: 'test_user' };
      
      findByTelegramIdStub.resolves(expectedUser);
      
      const result = await userService.getUserByTelegramId(telegramId);
      
      expect(findByTelegramIdStub.calledOnceWith(telegramId)).to.be.true;
      expect(result).to.deep.equal(expectedUser);
    });
  });
  
  describe('updateUser', () => {
    it('用户不存在时应抛出错误', async () => {
      const telegramId = 123456;
      const userData = { username: 'new_username' };
      
      findByTelegramIdStub.resolves(null);
      
      try {
        await userService.updateUser(telegramId, userData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('用户未找到');
      }
      
      expect(findByTelegramIdStub.calledOnceWith(telegramId)).to.be.true;
      expect(updateStub.notCalled).to.be.true;
    });
    
    it('用户存在时应更新并返回用户信息', async () => {
      const telegramId = 123456;
      const userData = { username: 'new_username' };
      const existingUser = { id: 1, telegram_id: telegramId, username: 'old_username' };
      const updatedUser = { id: 1, telegram_id: telegramId, username: 'new_username' };
      
      findByTelegramIdStub.resolves(existingUser);
      updateStub.resolves(updatedUser);
      
      const result = await userService.updateUser(telegramId, userData);
      
      expect(findByTelegramIdStub.calledOnceWith(telegramId)).to.be.true;
      expect(updateStub.calledOnceWith(existingUser.id, userData)).to.be.true;
      expect(result).to.deep.equal(updatedUser);
    });
  });
  
  describe('checkIn', () => {
    it('签到成功时应返回签到结果', async () => {
      const telegramId = 123456;
      const checkInResult = {
        message: '签到成功',
        user: { id: 1, telegram_id: telegramId, reputation_points: 5 },
        rewards: { basePoints: 5, bonusPoints: 0, totalPoints: 5 }
      };
      
      checkInStub.resolves(checkInResult);
      
      const result = await userService.checkIn(telegramId);
      
      expect(checkInStub.calledOnceWith(telegramId)).to.be.true;
      expect(result).to.deep.equal(checkInResult);
    });
    
    it('已签到时应返回今日已签到信息', async () => {
      const telegramId = 123456;
      const checkInResult = {
        message: '今日已签到',
        user: { id: 1, telegram_id: telegramId, reputation_points: 5 }
      };
      
      checkInStub.resolves(checkInResult);
      
      const result = await userService.checkIn(telegramId);
      
      expect(checkInStub.calledOnceWith(telegramId)).to.be.true;
      expect(result).to.deep.equal(checkInResult);
    });
    
    it('用户不存在时应抛出错误', async () => {
      const telegramId = 123456;
      
      checkInStub.rejects(new Error('用户未找到'));
      
      try {
        await userService.checkIn(telegramId);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('用户未找到');
      }
      
      expect(checkInStub.calledOnceWith(telegramId)).to.be.true;
    });
  });
}); 