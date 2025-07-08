/**
 * 验证器单元测试
 */

const { expect } = require('chai');
const Validator = require('../../src/utils/validator');
const { ValidationError } = require('../../src/middleware/errorHandler');

describe('Validator', () => {
  describe('validateField', () => {
    it('应该验证必填字段', () => {
      const rule = { required: true, type: 'string' };
      
      expect(() => {
        Validator.validateField(null, 'testField', rule);
      }).to.throw(ValidationError, 'testField 是必填字段');
      
      expect(() => {
        Validator.validateField('', 'testField', rule);
      }).to.throw(ValidationError, 'testField 是必填字段');
      
      expect(() => {
        Validator.validateField(undefined, 'testField', rule);
      }).to.throw(ValidationError, 'testField 是必填字段');
    });
    
    it('应该验证字符串类型', () => {
      const rule = { type: 'string' };
      
      const result = Validator.validateField('  test  ', 'testField', rule);
      expect(result).to.equal('test');
      
      expect(() => {
        Validator.validateField(123, 'testField', rule);
      }).to.throw(ValidationError, 'testField 必须是字符串类型');
    });
    
    it('应该验证数字类型', () => {
      const rule = { type: 'number' };
      
      expect(Validator.validateField('123', 'testField', rule)).to.equal(123);
      expect(Validator.validateField(123, 'testField', rule)).to.equal(123);
      
      expect(() => {
        Validator.validateField('abc', 'testField', rule);
      }).to.throw(ValidationError, 'testField 必须是数字类型');
    });
    
    it('应该验证字符串长度', () => {
      const rule = { type: 'string', minLength: 3, maxLength: 10 };
      
      expect(() => {
        Validator.validateField('ab', 'testField', rule);
      }).to.throw(ValidationError, 'testField 长度不能少于 3 个字符');
      
      expect(() => {
        Validator.validateField('12345678901', 'testField', rule);
      }).to.throw(ValidationError, 'testField 长度不能超过 10 个字符');
      
      expect(Validator.validateField('test', 'testField', rule)).to.equal('test');
    });
    
    it('应该验证数值范围', () => {
      const rule = { type: 'number', min: 1, max: 100 };
      
      expect(() => {
        Validator.validateField(0, 'testField', rule);
      }).to.throw(ValidationError, 'testField 不能小于 1');
      
      expect(() => {
        Validator.validateField(101, 'testField', rule);
      }).to.throw(ValidationError, 'testField 不能大于 100');
      
      expect(Validator.validateField(50, 'testField', rule)).to.equal(50);
    });
    
    it('应该验证正则表达式', () => {
      const rule = { type: 'string', pattern: /^[a-zA-Z]+$/ };
      
      expect(() => {
        Validator.validateField('test123', 'testField', rule);
      }).to.throw(ValidationError, 'testField 格式不正确');
      
      expect(Validator.validateField('test', 'testField', rule)).to.equal('test');
    });
    
    it('应该返回默认值', () => {
      const rule = { type: 'number', default: 10 };
      
      expect(Validator.validateField(undefined, 'testField', rule)).to.equal(10);
      expect(Validator.validateField(null, 'testField', rule)).to.equal(10);
      expect(Validator.validateField('', 'testField', rule)).to.equal(10);
    });
  });
  
  describe('validateUserRegistration', () => {
    it('应该验证有效的用户注册数据', () => {
      const data = {
        telegram_id: 123456789,
        username: 'test_user',
        first_name: 'Test',
        last_name: 'User'
      };
      
      const result = Validator.validateUserRegistration(data);
      expect(result).to.deep.equal(data);
    });
    
    it('应该要求telegram_id', () => {
      const data = {
        username: 'test_user'
      };
      
      expect(() => {
        Validator.validateUserRegistration(data);
      }).to.throw(ValidationError);
    });
    
    it('应该验证telegram_id范围', () => {
      const data = {
        telegram_id: -1
      };
      
      expect(() => {
        Validator.validateUserRegistration(data);
      }).to.throw(ValidationError);
    });
  });
  
  describe('validatePagination', () => {
    it('应该验证分页参数', () => {
      const query = { page: '2', limit: '10' };
      const result = Validator.validatePagination(query);
      
      expect(result.page).to.equal(2);
      expect(result.limit).to.equal(10);
    });
    
    it('应该使用默认值', () => {
      const query = {};
      const result = Validator.validatePagination(query);
      
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(20);
    });
    
    it('应该验证分页范围', () => {
      expect(() => {
        Validator.validatePagination({ page: 0 });
      }).to.throw(ValidationError);
      
      expect(() => {
        Validator.validatePagination({ limit: 101 });
      }).to.throw(ValidationError);
    });
  });
  
  describe('isValidTelegramId', () => {
    it('应该验证有效的Telegram ID', () => {
      expect(Validator.isValidTelegramId(123456789)).to.be.true;
      expect(Validator.isValidTelegramId('123456789')).to.be.true;
    });
    
    it('应该拒绝无效的Telegram ID', () => {
      expect(Validator.isValidTelegramId(0)).to.be.false;
      expect(Validator.isValidTelegramId(-1)).to.be.false;
      expect(Validator.isValidTelegramId('abc')).to.be.false;
      expect(Validator.isValidTelegramId(null)).to.be.false;
      expect(Validator.isValidTelegramId(undefined)).to.be.false;
    });
  });
  
  describe('sanitizeHtml', () => {
    it('应该转义HTML字符', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      
      expect(Validator.sanitizeHtml(input)).to.equal(expected);
    });
    
    it('应该处理非字符串输入', () => {
      expect(Validator.sanitizeHtml(123)).to.equal(123);
      expect(Validator.sanitizeHtml(null)).to.equal(null);
      expect(Validator.sanitizeHtml(undefined)).to.equal(undefined);
    });
  });
});
