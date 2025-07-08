/**
 * 日志系统
 * 提供统一的日志记录功能
 */

const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 日志颜色
const LOG_COLORS = {
  ERROR: '\x1b[31m', // 红色
  WARN: '\x1b[33m',  // 黄色
  INFO: '\x1b[36m',  // 青色
  DEBUG: '\x1b[37m', // 白色
  RESET: '\x1b[0m'   // 重置
};

class Logger {
  constructor() {
    this.logLevel = this.getLogLevel();
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }
  
  // 获取日志级别
  getLogLevel() {
    const level = process.env.LOG_LEVEL || 'INFO';
    return LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  }
  
  // 确保日志目录存在
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  // 格式化日志消息
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    
    let logMessage = `[${timestamp}] [${pid}] [${level}] ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        logMessage += ` ${JSON.stringify(data, null, 2)}`;
      } else {
        logMessage += ` ${data}`;
      }
    }
    
    return logMessage;
  }
  
  // 写入日志文件
  writeToFile(level, message) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.log`;
    const filepath = path.join(this.logDir, filename);
    
    try {
      fs.appendFileSync(filepath, message + '\n');
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }
  
  // 控制台输出
  writeToConsole(level, message) {
    const color = LOG_COLORS[level] || LOG_COLORS.RESET;
    console.log(`${color}${message}${LOG_COLORS.RESET}`);
  }
  
  // 通用日志方法
  log(level, message, data = null) {
    const levelValue = LOG_LEVELS[level];
    
    if (levelValue <= this.logLevel) {
      const formattedMessage = this.formatMessage(level, message, data);
      
      // 输出到控制台
      this.writeToConsole(level, formattedMessage);
      
      // 写入文件（生产环境）
      if (process.env.NODE_ENV === 'production') {
        this.writeToFile(level, formattedMessage);
      }
    }
  }
  
  // 错误日志
  error(message, data = null) {
    this.log('ERROR', message, data);
  }
  
  // 警告日志
  warn(message, data = null) {
    this.log('WARN', message, data);
  }
  
  // 信息日志
  info(message, data = null) {
    this.log('INFO', message, data);
  }
  
  // 调试日志
  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }
  
  // API请求日志
  apiRequest(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      telegramId: req.headers['x-telegram-id']
    };
    
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, 'API请求', logData);
  }
  
  // 数据库操作日志
  database(operation, table, duration, error = null) {
    const logData = {
      operation,
      table,
      duration: `${duration}ms`
    };
    
    if (error) {
      logData.error = error.message;
      this.error('数据库操作失败', logData);
    } else {
      this.debug('数据库操作', logData);
    }
  }
  
  // 业务操作日志
  business(operation, userId, data = null) {
    const logData = {
      operation,
      userId,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    this.info('业务操作', logData);
  }
}

// 创建全局日志实例
const logger = new Logger();

module.exports = logger;
