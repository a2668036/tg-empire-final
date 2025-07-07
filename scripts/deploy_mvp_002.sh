#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() {
  echo -e "${GREEN}[INFO] $1${NC}"
}

warning() {
  echo -e "${YELLOW}[WARNING] $1${NC}"
}

# 获取当前目录
CURRENT_DIR=$(pwd)
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

# 切换到项目根目录
cd $PROJECT_ROOT

# 创建并启动Docker容器
info "启动数据库和Redis容器..."
docker-compose -f docker-compose.yml up -d tg_postgres tg_redis

# 等待数据库启动
info "等待数据库启动中..."
sleep 3

# 确保users表有is_admin字段
info "检查数据库结构..."
docker exec tg_postgres psql -U tg_admin -d tg_empire -c "
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        
        -- 设置测试用户为管理员
        UPDATE users SET is_admin = TRUE WHERE id = 1;
    END IF;
END \$\$;
"

# 创建check_ins和reputation_logs表（如果不存在）
info "创建MVP-002所需的表..."
docker exec tg_postgres psql -U tg_admin -d tg_empire -c "
-- 创建签到表
CREATE TABLE IF NOT EXISTS check_ins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    reputation_earned INTEGER NOT NULL,
    is_consecutive BOOLEAN DEFAULT FALSE,
    consecutive_days INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, check_in_date),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建声誉日志表
CREATE TABLE IF NOT EXISTS reputation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    points_change INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(check_in_date);
CREATE INDEX IF NOT EXISTS idx_reputation_logs_user_id ON reputation_logs(user_id);
"

# 复制必要的文件
info "复制服务和路由文件..."
mkdir -p $PROJECT_ROOT/backend/src/services
mkdir -p $PROJECT_ROOT/backend/src/routes
mkdir -p $PROJECT_ROOT/backend/src/middleware

# 创建后端服务文件
cat > $PROJECT_ROOT/backend/src/services/checkInService.js << 'EOL'
/**
 * 签到服务
 * 负责处理用户签到相关的业务逻辑
 */
const { Pool } = require('pg');
const dbConfig = require('../config/database');

// 创建数据库连接池
const pool = new Pool(dbConfig.pool);
const connectionString = dbConfig.url;
pool.options = { connectionString };

class CheckInService {
  /**
   * 用户签到
   * @param {number} userId - 用户ID
   * @returns {Object} - 签到结果
   */
  async checkIn(userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 检查用户是否存在
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('用户不存在');
      }
      
      const user = userResult.rows[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 检查今天是否已经签到
      const checkInResult = await client.query(
        'SELECT * FROM check_ins WHERE user_id = $1 AND check_in_date = $2',
        [userId, today]
      );
      
      if (checkInResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: '今天已经签到过了',
          user
        };
      }
      
      // 检查是否连续签到
      let isConsecutive = false;
      let consecutiveDays = 1;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayCheckIn = await client.query(
        'SELECT * FROM check_ins WHERE user_id = $1 AND check_in_date = $2',
        [userId, yesterday]
      );
      
      if (yesterdayCheckIn.rows.length > 0) {
        isConsecutive = true;
        consecutiveDays = yesterdayCheckIn.rows[0].consecutive_days + 1;
      }
      
      // 计算获得的声誉点数
      let reputationEarned = 5; // 基础点数
      let bonusPoints = 0;
      
      // 连续签到奖励
      if (isConsecutive) {
        // 连续签到7天及以上，每天额外奖励5点
        if (consecutiveDays >= 7) {
          bonusPoints += 5;
        }
        // 连续签到3天及以上，每天额外奖励2点
        else if (consecutiveDays >= 3) {
          bonusPoints += 2;
        }
      }
      
      reputationEarned += bonusPoints;
      
      // 记录签到
      await client.query(
        `INSERT INTO check_ins 
        (user_id, check_in_date, reputation_earned, is_consecutive, consecutive_days)
        VALUES ($1, $2, $3, $4, $5)`,
        [userId, today, reputationEarned, isConsecutive, consecutiveDays]
      );
      
      // 更新用户声誉点数
      await client.query(
        `UPDATE users SET 
        reputation_points = reputation_points + $1, 
        last_check_in_date = $2,
        consecutive_check_ins = $3
        WHERE id = $4`,
        [reputationEarned, today, consecutiveDays, userId]
      );
      
      // 添加声誉日志
      await client.query(
        `INSERT INTO reputation_logs 
        (user_id, points_change, balance, reason, source_type, source_id)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId, 
          reputationEarned, 
          user.reputation_points + reputationEarned,
          `每日签到 ${isConsecutive ? `(连续${consecutiveDays}天)` : ''}`,
          'check_in',
          null
        ]
      );
      
      // 获取更新后的用户信息
      const updatedUserResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        message: '签到成功',
        rewards: {
          basePoints: 5,
          bonusPoints,
          totalPoints: reputationEarned
        },
        user: updatedUserResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取用户签到历史记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制返回条数
   * @param {number} offset - 偏移量
   * @returns {Array} - 签到历史记录
   */
  async getCheckInHistory(userId, limit = 30, offset = 0) {
    try {
      // 查询签到记录
      const result = await pool.query(
        `SELECT * FROM check_ins 
        WHERE user_id = $1 
        ORDER BY check_in_date DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      // 查询记录总数
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM check_ins WHERE user_id = $1',
        [userId]
      );
      
      return {
        records: result.rows,
        total: parseInt(countResult.rows[0].count, 10),
        limit,
        offset
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取用户连续签到信息
   * @param {number} userId - 用户ID
   * @returns {Object} - 连续签到信息
   */
  async getConsecutiveInfo(userId) {
    try {
      // 查询用户签到信息
      const userResult = await pool.query(
        'SELECT consecutive_check_ins, last_check_in_date FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('用户不存在');
      }
      
      const { consecutive_check_ins, last_check_in_date } = userResult.rows[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 判断今天是否已签到
      let checkedInToday = false;
      if (last_check_in_date) {
        const lastDate = new Date(last_check_in_date);
        lastDate.setHours(0, 0, 0, 0);
        checkedInToday = lastDate.getTime() === today.getTime();
      }
      
      return {
        consecutiveDays: consecutive_check_ins,
        lastCheckInDate: last_check_in_date,
        checkedInToday
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取签到统计数据
   * @param {number} userId - 用户ID
   * @returns {Object} - 签到统计数据
   */
  async getCheckInStats(userId) {
    try {
      // 查询用户签到总天数
      const totalDaysResult = await pool.query(
        'SELECT COUNT(*) FROM check_ins WHERE user_id = $1',
        [userId]
      );
      
      // 查询用户总计获得的签到声誉点数
      const totalPointsResult = await pool.query(
        'SELECT SUM(reputation_earned) FROM check_ins WHERE user_id = $1',
        [userId]
      );
      
      // 查询本月签到天数
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthDaysResult = await pool.query(
        'SELECT COUNT(*) FROM check_ins WHERE user_id = $1 AND check_in_date >= $2',
        [userId, firstDayOfMonth]
      );
      
      return {
        totalDays: parseInt(totalDaysResult.rows[0].count, 10),
        totalPoints: parseInt(totalPointsResult.rows[0].sum || 0, 10),
        monthDays: parseInt(monthDaysResult.rows[0].count, 10)
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CheckInService();
EOL

cat > $PROJECT_ROOT/backend/src/services/reputationService.js << 'EOL'
/**
 * 声誉服务
 * 负责处理用户声誉相关的业务逻辑
 */
const { Pool } = require('pg');
const dbConfig = require('../config/database');

// 创建数据库连接池
const pool = new Pool(dbConfig.pool);
const connectionString = dbConfig.url;
pool.options = { connectionString };

// 声誉点数来源类型
const SOURCE_TYPES = {
  CHECK_IN: 'check_in',       // 签到
  CONTENT: 'content',         // 内容创作
  LIKE: 'like',               // 点赞
  ADMIN: 'admin',             // 管理员操作
  SYSTEM: 'system',           // 系统
  TASK: 'task',               // 任务完成
  EXCHANGE: 'exchange'        // 兑换消费
};

class ReputationService {
  /**
   * 添加声誉点数
   * @param {number} userId - 用户ID
   * @param {number} points - 点数变化（正数）
   * @param {string} reason - 原因描述
   * @param {string} sourceType - 来源类型
   * @param {number} sourceId - 来源ID
   * @returns {Object} - 添加结果
   */
  async addPoints(userId, points, reason, sourceType, sourceId = null) {
    if (points <= 0) {
      throw new Error('点数必须为正数');
    }
    
    return await this._updatePoints(userId, points, reason, sourceType, sourceId);
  }
  
  /**
   * 减少声誉点数
   * @param {number} userId - 用户ID
   * @param {number} points - 点数变化（正数）
   * @param {string} reason - 原因描述
   * @param {string} sourceType - 来源类型
   * @param {number} sourceId - 来源ID
   * @returns {Object} - 减少结果
   */
  async deductPoints(userId, points, reason, sourceType, sourceId = null) {
    if (points <= 0) {
      throw new Error('点数必须为正数');
    }
    
    return await this._updatePoints(userId, -points, reason, sourceType, sourceId);
  }
  
  /**
   * 更新声誉点数
   * @param {number} userId - 用户ID
   * @param {number} pointsChange - 点数变化
   * @param {string} reason - 原因描述
   * @param {string} sourceType - 来源类型
   * @param {number} sourceId - 来源ID
   * @returns {Object} - 更新结果
   * @private
   */
  async _updatePoints(userId, pointsChange, reason, sourceType, sourceId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 检查用户是否存在
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('用户不存在');
      }
      
      const user = userResult.rows[0];
      const currentPoints = user.reputation_points;
      const newPoints = currentPoints + pointsChange;
      
      // 防止声誉点数为负数
      if (newPoints < 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: '声誉点数不足',
          user
        };
      }
      
      // 更新用户声誉点数
      await client.query(
        'UPDATE users SET reputation_points = $1 WHERE id = $2',
        [newPoints, userId]
      );
      
      // 添加声誉日志
      await client.query(
        `INSERT INTO reputation_logs 
        (user_id, points_change, balance, reason, source_type, source_id)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, pointsChange, newPoints, reason, sourceType, sourceId]
      );
      
      // 获取更新后的用户信息
      const updatedUserResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        message: pointsChange > 0 ? '增加声誉点数成功' : '减少声誉点数成功',
        pointsChange,
        newBalance: newPoints,
        user: updatedUserResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * 获取用户声誉历史记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制返回条数
   * @param {number} offset - 偏移量
   * @returns {Array} - 声誉历史记录
   */
  async getReputationHistory(userId, limit = 20, offset = 0) {
    try {
      // 查询声誉日志
      const result = await pool.query(
        `SELECT * FROM reputation_logs 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      // 查询记录总数
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM reputation_logs WHERE user_id = $1',
        [userId]
      );
      
      return {
        records: result.rows,
        total: parseInt(countResult.rows[0].count, 10),
        limit,
        offset
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取声誉统计数据
   * @param {number} userId - 用户ID
   * @returns {Object} - 声誉统计数据
   */
  async getReputationStats(userId) {
    try {
      // 获取用户信息
      const userResult = await pool.query(
        'SELECT reputation_points FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('用户不存在');
      }
      
      const currentPoints = userResult.rows[0].reputation_points;
      
      // 计算总收入（所有正数变化的总和）
      const totalIncomeResult = await pool.query(
        'SELECT SUM(points_change) FROM reputation_logs WHERE user_id = $1 AND points_change > 0',
        [userId]
      );
      
      // 计算总支出（所有负数变化的总和的绝对值）
      const totalExpenseResult = await pool.query(
        'SELECT SUM(ABS(points_change)) FROM reputation_logs WHERE user_id = $1 AND points_change < 0',
        [userId]
      );
      
      // 按来源类型统计收入
      const incomeBySourceResult = await pool.query(
        `SELECT source_type, SUM(points_change) as total 
        FROM reputation_logs 
        WHERE user_id = $1 AND points_change > 0 
        GROUP BY source_type`,
        [userId]
      );
      
      // 按来源类型统计支出
      const expenseBySourceResult = await pool.query(
        `SELECT source_type, SUM(ABS(points_change)) as total 
        FROM reputation_logs 
        WHERE user_id = $1 AND points_change < 0 
        GROUP BY source_type`,
        [userId]
      );
      
      // 整理按来源类型的收入数据
      const incomeBySource = {};
      incomeBySourceResult.rows.forEach(row => {
        incomeBySource[row.source_type] = parseInt(row.total, 10);
      });
      
      // 整理按来源类型的支出数据
      const expenseBySource = {};
      expenseBySourceResult.rows.forEach(row => {
        expenseBySource[row.source_type] = parseInt(row.total, 10);
      });
      
      return {
        currentPoints,
        totalIncome: parseInt(totalIncomeResult.rows[0].sum || 0, 10),
        totalExpense: parseInt(totalExpenseResult.rows[0].sum || 0, 10),
        incomeBySource,
        expenseBySource
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取声誉来源类型
   * @returns {Object} - 声誉来源类型常量
   */
  getSourceTypes() {
    return SOURCE_TYPES;
  }
}

module.exports = new ReputationService();
EOL

# 创建路由文件
cat > $PROJECT_ROOT/backend/src/routes/checkInRoutes.js << 'EOL'
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
EOL

cat > $PROJECT_ROOT/backend/src/routes/reputationRoutes.js << 'EOL'
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
EOL

cat > $PROJECT_ROOT/backend/src/middleware/adminAuth.js << 'EOL'
/**
 * 管理员身份验证中间件
 */
const { Pool } = require('pg');
const dbConfig = require('../config/database');

// 创建数据库连接池
const pool = new Pool(dbConfig.pool);
const connectionString = dbConfig.url;
pool.options = { connectionString };

/**
 * 管理员身份验证中间件
 * 检查请求头中的x-telegram-id是否属于管理员
 */
module.exports = async function(req, res, next) {
  const telegramId = req.headers['x-telegram-id'];
  
  if (!telegramId) {
    return res.status(401).json({ error: '未授权', message: '缺少身份验证信息' });
  }
  
  try {
    // 查询用户信息
    const userResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: '未授权', message: '用户不存在' });
    }
    
    const user = userResult.rows[0];
    
    // 检查用户是否为管理员
    if (!user.is_admin) {
      return res.status(403).json({ error: '禁止访问', message: '需要管理员权限' });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    
    // 继续执行下一个中间件
    next();
  } catch (error) {
    console.error('管理员身份验证失败:', error);
    res.status(500).json({ error: '身份验证失败', message: error.message });
  }
};
EOL

# 修改app.js文件以包含新的路由
cat > $PROJECT_ROOT/backend/src/app.js << 'EOL'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Telegraf } = require('telegraf');
const botHandler = require('./services/botHandler');
const userRoutes = require('./routes/userRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const reputationRoutes = require('./routes/reputationRoutes');

// 初始化Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 初始化Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
botHandler.setupCommands(bot);

// API路由
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', checkInRoutes);
app.use('/api/v1', reputationRoutes);

// 根路由处理
app.get('/', (req, res) => {
  res.json({ 
    message: '帝国社区API服务运行中',
    version: '1.0.0',
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Webhook
app.post('/webhook', botHandler.handleWebhook(bot));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('应用错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;
EOL

# 启动服务
info "启动MVP-002服务..."

# 启动后端服务
cd $PROJECT_ROOT/backend
LOG_FILE="$PROJECT_ROOT/logs/backend.log"
PID_FILE="$PROJECT_ROOT/logs/backend.pid"

npm run dev > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
info "后端服务已启动，进程ID: $(cat "$PID_FILE")"

# 启动前端服务
cd $PROJECT_ROOT/frontend
FRONTEND_LOG_FILE="$PROJECT_ROOT/logs/frontend.log"
FRONTEND_PID_FILE="$PROJECT_ROOT/logs/frontend.pid"

npm run dev > "$FRONTEND_LOG_FILE" 2>&1 &
echo $! > "$FRONTEND_PID_FILE"
info "前端服务已启动，进程ID: $(cat "$FRONTEND_PID_FILE")"

# 切换回原来的目录
cd $CURRENT_DIR

# 完成
info "======================================================================================"
info "🎉 MVP-002 服务已全部启动"
info "📊 后端API访问地址: http://localhost:3000"
info "🖥️ 前端页面访问地址: http://localhost:5173/profile.html"
info "📝 日志文件位置: $PROJECT_ROOT/logs/"
info "🛑 停止服务请运行: $PROJECT_ROOT/scripts/stop_mvp_001.sh"
info "======================================================================================" 