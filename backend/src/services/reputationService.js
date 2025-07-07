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
