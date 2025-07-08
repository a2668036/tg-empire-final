/**
 * 数据库配置
 * 使用环境配置管理系统
 */
const { getDatabaseConfig } = require('./environment');

module.exports = getDatabaseConfig();