/**
 * 数据库配置
 */
module.exports = {
  url: 'postgresql://tg_admin:tg_password@localhost:5432/tg_empire',
  pool: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}; 