/**
 * 统一错误处理中间件
 * 提供标准化的错误响应和日志记录
 */

const logger = require('../utils/logger');

// 错误类型定义
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// 认证错误
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// 授权错误
class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// 资源未找到错误
class NotFoundError extends AppError {
  constructor(message = '资源未找到') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

// 业务逻辑错误
class BusinessError extends AppError {
  constructor(message, code = null) {
    super(message, 400, code || 'BUSINESS_ERROR');
  }
}

// 数据库错误处理
function handleDatabaseError(error) {
  logger.error('数据库错误:', error);
  
  // PostgreSQL错误码处理
  switch (error.code) {
    case '23505': // 唯一约束违反
      return new ValidationError('数据已存在，请检查输入');
    case '23503': // 外键约束违反
      return new ValidationError('关联数据不存在');
    case '23502': // 非空约束违反
      return new ValidationError('必填字段不能为空');
    case '42P01': // 表不存在
      return new AppError('系统配置错误', 500, 'DATABASE_CONFIG_ERROR');
    default:
      return new AppError('数据库操作失败', 500, 'DATABASE_ERROR');
  }
}

// 格式化错误响应
function formatErrorResponse(error, req) {
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };
  
  // 开发环境下包含更多调试信息
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    response.error.details = error.details;
  }
  
  return response;
}

// 主错误处理中间件
function errorHandler(error, req, res, next) {
  let processedError = error;
  
  // 处理不同类型的错误
  if (error.name === 'ValidationError') {
    processedError = new ValidationError(error.message);
  } else if (error.code && error.code.startsWith('23')) {
    processedError = handleDatabaseError(error);
  } else if (!error.isOperational) {
    // 未知错误，记录详细日志
    logger.error('未处理的错误:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      headers: req.headers
    });
    
    processedError = new AppError('服务器内部错误', 500, 'INTERNAL_ERROR');
  }
  
  // 记录错误日志
  logger.error('API错误:', {
    message: processedError.message,
    code: processedError.code,
    statusCode: processedError.statusCode,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // 发送错误响应
  const response = formatErrorResponse(processedError, req);
  res.status(processedError.statusCode || 500).json(response);
}

// 404处理中间件
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`路由 ${req.method} ${req.path} 不存在`);
  next(error);
}

// 异步错误包装器
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BusinessError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
