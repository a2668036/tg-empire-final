const userService = require('../services/userService');
const Validator = require('../utils/validator');
const logger = require('../utils/logger');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

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
  register: asyncHandler(async (req, res) => {
    // 验证输入数据
    const validatedData = Validator.validateUserRegistration(req.body);

    logger.info('用户注册请求', { telegram_id: validatedData.telegram_id });

    const user = await userService.registerUser(validatedData);

    logger.info('用户注册成功', { user_id: user.id, telegram_id: user.telegram_id });

    res.status(201).json({
      success: true,
      data: user,
      message: '用户注册成功'
    });
  }),
  
  /**
   * 获取当前用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  getMe: asyncHandler(async (req, res) => {
    const telegramId = req.headers['x-telegram-id'];

    if (!telegramId || !Validator.isValidTelegramId(telegramId)) {
      throw new ValidationError('无效的Telegram ID');
    }

    const user = await userService.getUserByTelegramId(parseInt(telegramId, 10));

    if (!user) {
      throw new NotFoundError('用户未找到');
    }

    logger.debug('获取用户信息', { user_id: user.id, telegram_id: user.telegram_id });

    res.json({
      success: true,
      data: user
    });
  }),
  
  /**
   * 更新用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  update: asyncHandler(async (req, res) => {
    const telegramId = req.headers['x-telegram-id'];

    if (!telegramId || !Validator.isValidTelegramId(telegramId)) {
      throw new ValidationError('无效的Telegram ID');
    }

    // 验证更新数据
    const validatedData = Validator.validateUserUpdate(req.body);

    logger.info('用户更新请求', { telegram_id: telegramId, fields: Object.keys(validatedData) });

    const user = await userService.updateUser(parseInt(telegramId, 10), validatedData);

    logger.info('用户更新成功', { user_id: user.id, telegram_id: user.telegram_id });

    res.json({
      success: true,
      data: user,
      message: '用户信息更新成功'
    });
  }),

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