/**
 * 环境配置管理
 * 统一管理所有环境变量和配置
 */

const { DATABASE_CONSTANTS, API_CONSTANTS } = require('./constants');

// 验证必需的环境变量
const requiredEnvVars = [
  'DATABASE_URL',
  'BOT_TOKEN',
  'FRONTEND_APP_URL'
];

// 检查必需的环境变量
function validateEnvironment() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
}

// 获取数据库配置
function getDatabaseConfig() {
  return {
    url: process.env.DATABASE_URL,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || DATABASE_CONSTANTS.MAX_CONNECTIONS,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || DATABASE_CONSTANTS.IDLE_TIMEOUT,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || DATABASE_CONSTANTS.CONNECTION_TIMEOUT,
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT) || DATABASE_CONSTANTS.QUERY_TIMEOUT
    }
  };
}

// 获取Redis配置
function getRedisConfig() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  };
}

// 获取应用配置
function getAppConfig() {
  return {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || API_CONSTANTS.REQUEST_TIMEOUT
  };
}

// 获取Telegram配置
function getTelegramConfig() {
  return {
    botToken: process.env.BOT_TOKEN,
    webhookUrl: process.env.WEBHOOK_URL,
    frontendAppUrl: process.env.FRONTEND_APP_URL,
    adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id)) : []
  };
}

// 获取安全配置
function getSecurityConfig() {
  return {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || API_CONSTANTS.RATE_LIMIT_WINDOW,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || API_CONSTANTS.RATE_LIMIT_MAX
  };
}

// 初始化配置
function initializeConfig() {
  try {
    validateEnvironment();
    
    return {
      database: getDatabaseConfig(),
      redis: getRedisConfig(),
      app: getAppConfig(),
      telegram: getTelegramConfig(),
      security: getSecurityConfig()
    };
  } catch (error) {
    console.error('配置初始化失败:', error.message);
    process.exit(1);
  }
}

module.exports = {
  initializeConfig,
  getDatabaseConfig,
  getRedisConfig,
  getAppConfig,
  getTelegramConfig,
  getSecurityConfig
};
