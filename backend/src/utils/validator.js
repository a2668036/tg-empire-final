/**
 * 输入验证工具
 * 提供统一的数据验证功能
 */

const { ValidationError } = require('../middleware/errorHandler');

// 验证规则
const VALIDATION_RULES = {
  // Telegram ID验证
  telegramId: {
    required: true,
    type: 'number',
    min: 1,
    max: 9999999999999
  },
  
  // 用户名验证
  username: {
    type: 'string',
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  
  // 姓名验证
  name: {
    type: 'string',
    minLength: 1,
    maxLength: 255,
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/
  },
  
  // 简介验证
  bio: {
    type: 'string',
    maxLength: 500
  },
  
  // 分页参数验证
  page: {
    type: 'number',
    min: 1,
    max: 1000,
    default: 1
  },
  
  limit: {
    type: 'number',
    min: 1,
    max: 100,
    default: 20
  },
  
  // 声望点数验证
  reputationPoints: {
    type: 'number',
    min: 0,
    max: 999999
  }
};

class Validator {
  // 验证单个字段
  static validateField(value, fieldName, rules) {
    const rule = rules || VALIDATION_RULES[fieldName];
    
    if (!rule) {
      throw new ValidationError(`未知的验证字段: ${fieldName}`);
    }
    
    // 必填验证
    if (rule.required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${fieldName} 是必填字段`);
    }
    
    // 如果值为空且非必填，返回默认值或undefined
    if (value === undefined || value === null || value === '') {
      return rule.default !== undefined ? rule.default : value;
    }
    
    // 类型验证
    if (rule.type) {
      const validatedValue = this.validateType(value, rule.type, fieldName);
      value = validatedValue;
    }
    
    // 长度验证
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      throw new ValidationError(`${fieldName} 长度不能少于 ${rule.minLength} 个字符`);
    }
    
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      throw new ValidationError(`${fieldName} 长度不能超过 ${rule.maxLength} 个字符`);
    }
    
    // 数值范围验证
    if (rule.min !== undefined && value < rule.min) {
      throw new ValidationError(`${fieldName} 不能小于 ${rule.min}`);
    }
    
    if (rule.max !== undefined && value > rule.max) {
      throw new ValidationError(`${fieldName} 不能大于 ${rule.max}`);
    }
    
    // 正则表达式验证
    if (rule.pattern && !rule.pattern.test(value)) {
      throw new ValidationError(`${fieldName} 格式不正确`);
    }
    
    return value;
  }
  
  // 类型验证
  static validateType(value, type, fieldName) {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new ValidationError(`${fieldName} 必须是字符串类型`);
        }
        return value.trim();
        
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new ValidationError(`${fieldName} 必须是数字类型`);
        }
        return num;
        
      case 'boolean':
        if (typeof value === 'boolean') {
          return value;
        }
        if (value === 'true' || value === '1' || value === 1) {
          return true;
        }
        if (value === 'false' || value === '0' || value === 0) {
          return false;
        }
        throw new ValidationError(`${fieldName} 必须是布尔类型`);
        
      case 'array':
        if (!Array.isArray(value)) {
          throw new ValidationError(`${fieldName} 必须是数组类型`);
        }
        return value;
        
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new ValidationError(`${fieldName} 必须是对象类型`);
        }
        return value;
        
      default:
        throw new ValidationError(`未知的验证类型: ${type}`);
    }
  }
  
  // 验证对象
  static validateObject(data, schema) {
    const validated = {};
    const errors = [];
    
    // 验证每个字段
    for (const [fieldName, rules] of Object.entries(schema)) {
      try {
        validated[fieldName] = this.validateField(data[fieldName], fieldName, rules);
      } catch (error) {
        errors.push(error.message);
      }
    }
    
    // 如果有验证错误，抛出异常
    if (errors.length > 0) {
      throw new ValidationError('数据验证失败', errors);
    }
    
    return validated;
  }
  
  // 验证用户注册数据
  static validateUserRegistration(data) {
    const schema = {
      telegram_id: VALIDATION_RULES.telegramId,
      username: { ...VALIDATION_RULES.username, required: false },
      first_name: { ...VALIDATION_RULES.name, required: false },
      last_name: { ...VALIDATION_RULES.name, required: false }
    };
    
    return this.validateObject(data, schema);
  }
  
  // 验证用户更新数据
  static validateUserUpdate(data) {
    const schema = {
      username: { ...VALIDATION_RULES.username, required: false },
      first_name: { ...VALIDATION_RULES.name, required: false },
      last_name: { ...VALIDATION_RULES.name, required: false },
      profile_bio: { ...VALIDATION_RULES.bio, required: false }
    };
    
    return this.validateObject(data, schema);
  }
  
  // 验证分页参数
  static validatePagination(query) {
    const schema = {
      page: VALIDATION_RULES.page,
      limit: VALIDATION_RULES.limit
    };
    
    return this.validateObject(query, schema);
  }
  
  // 清理和转义HTML
  static sanitizeHtml(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // 验证Telegram ID格式
  static isValidTelegramId(id) {
    const num = Number(id);
    return !isNaN(num) && num > 0 && num <= 9999999999999;
  }
}

module.exports = Validator;
