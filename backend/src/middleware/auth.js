/**
 * 用户身份验证中间件
 * 验证请求头中是否包含有效的Telegram用户ID
 */
const { Pool } = require('pg');
const dbConfig = require('../config/database');

// 创建数据库连接池
const pool = new Pool(dbConfig.pool);
const connectionString = dbConfig.url;
pool.options = { connectionString };

module.exports = async function(req, res, next) {
  const telegramId = req.headers['x-telegram-id'];
  
  if (!telegramId) {
    return res.status(401).json({ error: '未授权', message: '缺少身份验证信息' });
  }
  
  try {
    // 查询用户信息
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '未授权', message: '用户不存在' });
    }
    
    // 将用户信息添加到请求对象
    req.user = result.rows[0];
    
    // 继续执行下一个中间件
    next();
  } catch (error) {
    console.error('身份验证失败:', error);
    res.status(500).json({ error: '身份验证失败', message: error.message });
  }
}; 