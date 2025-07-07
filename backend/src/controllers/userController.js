const userService = require('../services/userService');

/**
 * 用户控制器
 * 处理用户相关的HTTP请求
 */
const userController = {
  /**
   * 注册用户
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async register(req, res) {
    try {
      const userData = req.body;
      
      // 验证必填字段
      if (!userData.telegram_id) {
        return res.status(400).json({ error: '缺少必要的telegram_id字段' });
      }
      
      const user = await userService.registerUser(userData);
      return res.status(201).json(user);
    } catch (error) {
      console.error('注册用户失败:', error);
      return res.status(500).json({ error: '注册用户时发生错误' });
    }
  },
  
  /**
   * 获取当前用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async getMe(req, res) {
    try {
      const telegramId = req.headers['x-telegram-id'];
      
      if (!telegramId) {
        return res.status(401).json({ error: '未提供Telegram ID' });
      }
      
      const user = await userService.getUserByTelegramId(parseInt(telegramId, 10));
      
      if (!user) {
        return res.status(404).json({ error: '用户未找到' });
      }
      
      return res.json(user);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return res.status(500).json({ error: '获取用户信息时发生错误' });
    }
  },
  
  /**
   * 更新用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async update(req, res) {
    try {
      const telegramId = req.headers['x-telegram-id'];
      const userData = req.body;
      
      if (!telegramId) {
        return res.status(401).json({ error: '未提供Telegram ID' });
      }
      
      // 不允许更新telegram_id
      if (userData.telegram_id) {
        delete userData.telegram_id;
      }
      
      const user = await userService.updateUser(parseInt(telegramId, 10), userData);
      return res.json(user);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      
      if (error.message === '用户未找到') {
        return res.status(404).json({ error: '用户未找到' });
      }
      
      return res.status(500).json({ error: '更新用户信息时发生错误' });
    }
  },

  /**
   * 用户签到
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async checkIn(req, res) {
    try {
      const telegramId = req.headers['x-telegram-id'];
      
      if (!telegramId) {
        return res.status(401).json({ error: '未提供Telegram ID' });
      }
      
      const result = await userService.checkIn(parseInt(telegramId, 10));
      
      if (result.message === '今日已签到') {
        return res.status(400).json({ error: '今日已完成签到', user: result.user });
      }
      
      return res.json({
        message: '签到成功',
        rewards: result.rewards,
        user: result.user
      });
    } catch (error) {
      console.error('用户签到失败:', error);
      
      if (error.message === '用户未找到') {
        return res.status(404).json({ error: '用户未找到' });
      }
      
      return res.status(500).json({ error: '签到处理失败，请稍后再试' });
    }
  }
};

module.exports = userController; 