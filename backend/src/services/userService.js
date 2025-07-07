const User = require('../models/User');

/**
 * 用户服务类
 * 处理与用户相关的业务逻辑
 */
class UserService {
  /**
   * 注册新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} - 返回用户对象
   */
  async registerUser(userData) {
    // 检查用户是否已存在
    const existingUser = await User.findByTelegramId(userData.telegram_id);
    if (existingUser) {
      return existingUser; // 返回现有用户
    }
    
    // 创建新用户
    const newUser = await User.create(userData);
    return newUser;
  }
  
  /**
   * 根据Telegram ID获取用户
   * @param {number} telegramId - 用户的Telegram ID
   * @returns {Promise<Object|null>} - 返回用户对象或null
   */
  async getUserByTelegramId(telegramId) {
    return await User.findByTelegramId(telegramId);
  }
  
  /**
   * 更新用户信息
   * @param {number} telegramId - 用户的Telegram ID
   * @param {Object} userData - 要更新的用户数据
   * @returns {Promise<Object>} - 返回更新后的用户对象
   */
  async updateUser(telegramId, userData) {
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      throw new Error('用户未找到');
    }
    
    return await User.update(user.id, userData);
  }

  /**
   * 用户签到
   * @param {number} telegramId - 用户的Telegram ID
   * @returns {Promise<Object>} - 返回签到结果
   */
  async checkIn(telegramId) {
    try {
      return await User.checkIn(telegramId);
    } catch (error) {
      if (error.message === '用户未找到') {
        throw error;
      }
      console.error('用户签到失败:', error);
      throw new Error('签到处理失败，请稍后再试');
    }
  }
}

module.exports = new UserService(); 