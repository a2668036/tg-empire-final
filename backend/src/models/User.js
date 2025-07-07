const { Pool } = require('pg');
const config = require('../config/database');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || config.url
});

class User {
  /**
   * 根据Telegram ID查找用户
   * @param {number} telegramId - 用户的Telegram ID
   * @returns {Promise<Object|null>} - 返回用户对象或null
   */
  static async findByTelegramId(telegramId) {
    const query = 'SELECT * FROM users WHERE telegram_id = $1';
    const result = await pool.query(query, [telegramId]);
    
    return result.rows[0] || null;
  }
  
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @param {number} userData.telegram_id - 用户的Telegram ID
   * @param {string} [userData.username] - 用户的Telegram用户名
   * @param {string} [userData.first_name] - 用户的名字
   * @param {string} [userData.last_name] - 用户的姓氏
   * @returns {Promise<Object>} - 返回创建的用户对象
   */
  static async create(userData) {
    const { telegram_id, username, first_name, last_name } = userData;
    
    const query = `
      INSERT INTO users (telegram_id, username, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [telegram_id, username || null, first_name || null, last_name || null];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  }
  
  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} userData - 要更新的用户数据
   * @returns {Promise<Object>} - 返回更新后的用户对象
   */
  static async update(userId, userData) {
    // 构建动态更新语句
    const keys = Object.keys(userData).filter(key => key !== 'id' && key !== 'telegram_id');
    
    if (keys.length === 0) {
      // 没有需要更新的字段
      return await this.findById(userId);
    }
    
    // 构建SET部分的语句
    const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map(key => userData[key]);
    
    // 添加ID作为WHERE条件
    values.push(userId);
    
    const query = `
      UPDATE users
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * 根据用户ID查找用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} - 返回用户对象或null
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * 用户签到
   * @param {number} telegramId - 用户的Telegram ID
   * @returns {Promise<Object>} - 返回签到结果
   */
  static async checkIn(telegramId) {
    // 开始事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 获取用户信息
      const getUserQuery = 'SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE';
      const userResult = await client.query(getUserQuery, [telegramId]);
      const user = userResult.rows[0];
      
      if (!user) {
        throw new Error('用户未找到');
      }
      
      // 获取当前日期
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastCheckInDate = user.last_check_in_date ? new Date(user.last_check_in_date) : null;
      lastCheckInDate && lastCheckInDate.setHours(0, 0, 0, 0);
      
      // 检查是否已经签到
      if (lastCheckInDate && lastCheckInDate.getTime() === today.getTime()) {
        await client.query('COMMIT');
        return { message: '今日已签到', user };
      }
      
      // 计算连续签到天数
      let consecutiveCheckIns = user.consecutive_check_ins || 0;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCheckInDate && lastCheckInDate.getTime() === yesterday.getTime()) {
        // 连续签到
        consecutiveCheckIns += 1;
      } else {
        // 重置连续签到
        consecutiveCheckIns = 1;
      }
      
      // 计算奖励点数
      let reputationPoints = user.reputation_points || 0;
      const basePoints = 5; // 基础签到奖励
      let bonusPoints = 0;
      
      // 连续签到奖励，每连续7天额外奖励
      if (consecutiveCheckIns % 7 === 0) {
        bonusPoints = 10;
      }
      
      reputationPoints += (basePoints + bonusPoints);
      
      // 更新用户信息
      const updateQuery = `
        UPDATE users
        SET last_check_in_date = $1, 
            consecutive_check_ins = $2,
            reputation_points = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const updateResult = await client.query(
        updateQuery, 
        [today, consecutiveCheckIns, reputationPoints, user.id]
      );
      
      // 提交事务
      await client.query('COMMIT');
      
      return { 
        message: '签到成功', 
        user: updateResult.rows[0],
        rewards: {
          basePoints,
          bonusPoints,
          totalPoints: basePoints + bonusPoints
        } 
      };
    } catch (error) {
      // 回滚事务
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // 释放连接
      client.release();
    }
  }
}

module.exports = User; 