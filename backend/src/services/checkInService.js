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
