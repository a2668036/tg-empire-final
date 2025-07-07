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
