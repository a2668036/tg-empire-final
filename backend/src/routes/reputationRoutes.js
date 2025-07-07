/**
 * 声誉相关的API路由
 */
const express = require('express');
const router = express.Router();
const reputationService = require('../services/reputationService');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

/**
 * @api {get} /api/v1/reputation/history 获取声誉历史
 * @apiDescription 获取用户声誉变化历史记录
 * @apiName GetReputationHistory
 * @apiGroup Reputation
 * @apiHeader {String} x-telegram-id 用户Telegram ID
 * @apiParam {Number} [limit=20] 每页数量
 * @apiParam {Number} [page=1] 页码
 * @apiSuccess {Array} records 声誉变化记录
 * @apiSuccess {Number} total 总记录数
 */
router.get('/reputation/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit || 20, 10);
    const page = parseInt(req.query.page || 1, 10);
    const offset = (page - 1) * limit;
    
    const result = await reputationService.getReputationHistory(userId, limit, offset);
    
    res.json(result);
  } catch (error) {
    console.error('获取声誉历史失败:', error);
    res.status(500).json({ error: '获取声誉历史失败', message: error.message });
  }
});

/**
 * @api {get} /api/v1/reputation/stats 获取声誉统计
 * @apiDescription 获取用户声誉统计数据
 * @apiName GetReputationStats
 * @apiGroup Reputation
 * @apiHeader {String} x-telegram-id 用户Telegram ID
 * @apiSuccess {Object} data 声誉统计数据
 */
router.get('/reputation/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await reputationService.getReputationStats(userId);
    
    res.json(result);
  } catch (error) {
    console.error('获取声誉统计失败:', error);
    res.status(500).json({ error: '获取声誉统计失败', message: error.message });
  }
});

/**
 * @api {post} /api/v1/reputation/add 添加声誉点数（管理员）
 * @apiDescription 管理员为用户添加声誉点数
 * @apiName AddReputationPoints
 * @apiGroup Reputation
 * @apiHeader {String} x-telegram-id 管理员Telegram ID
 * @apiParam {Number} userId 目标用户ID
 * @apiParam {Number} points 点数
 * @apiParam {String} reason 原因
 * @apiSuccess {Object} data 添加结果
 */
router.post('/reputation/add', adminAuth, async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    
    if (!userId || !points || !reason) {
      return res.status(400).json({ 
        error: '参数错误', 
        message: '用户ID、点数和原因都是必需的' 
      });
    }
    
    const pointsNum = parseInt(points, 10);
    
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ 
        error: '参数错误', 
        message: '点数必须为正数' 
      });
    }
    
    const result = await reputationService.addPoints(
      userId, 
      pointsNum, 
      reason, 
      reputationService.getSourceTypes().ADMIN
    );
    
    res.json(result);
  } catch (error) {
    console.error('添加声誉点数失败:', error);
    res.status(500).json({ error: '添加声誉点数失败', message: error.message });
  }
});

/**
 * @api {post} /api/v1/reputation/deduct 减少声誉点数（管理员）
 * @apiDescription 管理员减少用户声誉点数
 * @apiName DeductReputationPoints
 * @apiGroup Reputation
 * @apiHeader {String} x-telegram-id 管理员Telegram ID
 * @apiParam {Number} userId 目标用户ID
 * @apiParam {Number} points 点数
 * @apiParam {String} reason 原因
 * @apiSuccess {Object} data 减少结果
 */
router.post('/reputation/deduct', adminAuth, async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    
    if (!userId || !points || !reason) {
      return res.status(400).json({ 
        error: '参数错误', 
        message: '用户ID、点数和原因都是必需的' 
      });
    }
    
    const pointsNum = parseInt(points, 10);
    
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ 
        error: '参数错误', 
        message: '点数必须为正数' 
      });
    }
    
    const result = await reputationService.deductPoints(
      userId, 
      pointsNum, 
      reason, 
      reputationService.getSourceTypes().ADMIN
    );
    
    res.json(result);
  } catch (error) {
    console.error('减少声誉点数失败:', error);
    res.status(500).json({ error: '减少声誉点数失败', message: error.message });
  }
});

module.exports = router;
