/**
 * 应用常量配置
 * 集中管理所有魔法数字和配置常量
 */

// 签到系统常量
const CHECK_IN_CONSTANTS = {
  BASE_POINTS: 5,           // 基础签到奖励
  BONUS_THRESHOLD: 7,       // 连续签到奖励阈值（天）
  BONUS_POINTS: 10,         // 连续签到奖励点数
  MAX_CONSECUTIVE_DAYS: 365 // 最大连续签到天数
};

// 声望系统常量
const REPUTATION_CONSTANTS = {
  MIN_POINTS: 0,            // 最小声望点数
  MAX_POINTS: 999999,       // 最大声望点数
  DAILY_LIMIT: 100          // 每日获得声望上限
};

// API常量
const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,    // 默认分页大小
  MAX_PAGE_SIZE: 100,       // 最大分页大小
  REQUEST_TIMEOUT: 10000,   // 请求超时时间（毫秒）
  RATE_LIMIT_WINDOW: 900000, // 速率限制窗口（15分钟）
  RATE_LIMIT_MAX: 100       // 速率限制最大请求数
};

// 数据库常量
const DATABASE_CONSTANTS = {
  CONNECTION_TIMEOUT: 2000,  // 连接超时时间
  IDLE_TIMEOUT: 30000,      // 空闲超时时间
  MAX_CONNECTIONS: 20,      // 最大连接数
  QUERY_TIMEOUT: 5000       // 查询超时时间
};

// 缓存常量
const CACHE_CONSTANTS = {
  USER_CACHE_TTL: 300,      // 用户缓存TTL（秒）
  STATS_CACHE_TTL: 600,     // 统计数据缓存TTL（秒）
  SESSION_TTL: 86400        // 会话TTL（秒）
};

// 安全常量
const SECURITY_CONSTANTS = {
  BCRYPT_ROUNDS: 12,        // bcrypt加密轮数
  JWT_EXPIRES_IN: '24h',    // JWT过期时间
  MAX_LOGIN_ATTEMPTS: 5,    // 最大登录尝试次数
  LOCKOUT_TIME: 900000      // 锁定时间（15分钟）
};

// 文件上传常量
const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  UPLOAD_PATH: './uploads'
};

// 导出所有常量
module.exports = {
  CHECK_IN_CONSTANTS,
  REPUTATION_CONSTANTS,
  API_CONSTANTS,
  DATABASE_CONSTANTS,
  CACHE_CONSTANTS,
  SECURITY_CONSTANTS,
  UPLOAD_CONSTANTS
};
