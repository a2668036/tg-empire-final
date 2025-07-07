/**
 * 签到相关的API路由
 */
const express = require('express');
const router = express.Router();
const checkInService = require('../services/checkInService');
const auth = require('../middleware/auth');

/**
 * @api {post} /api/v1/check-in 用户签到
 * @apiDescription 用户每日签到，获取声誉点数
 * @apiName CheckIn
 * @apiGroup CheckIn
 * @apiHeader {String} x-telegram-id 用户Telegram ID
 * @apiSuccess {Object} data 签到结果
 */
router.post('/check-in', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await checkInService.checkIn(userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('签到失败:', error);
    res.status(500).json({ error: '签到失败', message: error.message });
  }
});

/**
 * @api {get} /api/v1/check-in/history 获取签到历史
 * @apiDescription 获取用户签到历史记录
 * @apiName GetCheckInHistory
 * @apiGroup CheckIn
 * @apiHeader {String} x-telegram-id 用户Telegram ID
 * @apiParam {Number} [limit=30] 每页数量
 * @apiParam {Number} [page=1] 页码
 * @apiSuccess {Array} records 签到记录
 * @apiSuccess {Number} total 总记录数
 */
router.get('/check-in/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit || 30, 10);
    const page = parseInt(req.query.page || 1, 10);
    const offset = (page - 1) * limit;
    
    const result = await checkInService.getCheckInHistory(userId, limit, offset);
    
    res.json(result);
  } catch (error) {
    console.error('获取签到历史失败:', error);
    res.status(500).json({ error: '获取签到历史失败', message: error.message });
  }
});

/**
 * @api {get} /api/v1/check-in/status 获取签到状态
 * @apiDescription 获取用户当前签到状态和连续签到信息
 * @apiName GetCheckInStatus
 * @apiGroup CheckIn
 * @apiHeader {String} x-telegram-id 用户Telegram ID
 * @apiSuccess {Object} data 签到状态信息
 */
router.get('/check-in/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await checkInService.getConsecutiveInfo(userId);
    
    res.json(result);
  } catch (error) {
    console.error('获取签到状态失败:', error);
    res.status(500).json({ error: '获取签到状态失败', message: error.message });
  }
});

/**
 * @api {get} /api/v1/check-in/stats 获取签到统计
 * @apiDescription 获取用户签到统计数据
 * @apiName GetCheckInStats
 * @apiGroup CheckIn
 * @apiHeader {String} x-telegram-id 用户Telegram ID
 * @apiSuccess {Object} data 签到统计数据
 */
router.get('/check-in/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await checkInService.getCheckInStats(userId);
    
    res.json(result);
  } catch (error) {
    console.error('获取签到统计失败:', error);
    res.status(500).json({ error: '获取签到统计失败', message: error.message });
  }
});

module.exports = router;
