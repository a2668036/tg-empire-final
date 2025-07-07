# TDD-MVP-001: 基础用户注册与ProfileApp技术设计文档

- **创建日期**: 2024-12-07
- **对应PRD**: PRD-MVP-001
- **负责人**: 项目技术负责人
- **状态**: 开发中

---

## 1. 技术架构设计

### 1.1 整体架构

采用前后端分离的架构，使用RESTful API进行通信：

```
                   ┌─────────────┐
                   │  Telegram   │
                   │    客户端    │
                   └──────┬──────┘
                          │
                          ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Telegram   │     │   Node.js   │     │ PostgreSQL  │
│   Bot API   │◄────┤   后端服务   ├────►│   数据库     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Vue 3     │
                   │  Mini App   │
                   └─────────────┘
```

### 1.2 技术栈选择

**后端技术栈**:
- 语言/框架: Node.js + Express
- 数据库: PostgreSQL
- 缓存/消息队列: Redis
- Bot框架: Telegraf.js

**前端技术栈**:
- 框架: Vue 3 + Vite
- UI库: 原生组件 + Tailwind CSS
- 状态管理: Pinia
- HTTP客户端: Axios
- Telegram集成: @twa-dev/sdk

### 1.3 关键技术点

1. **Telegram Bot注册流程**: 通过Webhook接收和处理Bot事件
2. **用户身份识别**: 利用Telegram InitData进行用户身份验证
3. **Mini App通信**: 利用WebApp SDK实现Telegram客户端与Mini App的通信

---

## 2. 数据模型设计

### 2.1 用户表(users)详细设计

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                             -- 内部用户ID，自增主键
    telegram_id BIGINT UNIQUE NOT NULL,                -- Telegram用户ID，唯一标识符
    username VARCHAR(255),                             -- Telegram用户名
    first_name VARCHAR(255),                           -- 用户名
    last_name VARCHAR(255),                            -- 用户姓
    reputation_points INTEGER DEFAULT 0,               -- 声望点数
    empire_stars INTEGER DEFAULT 0,                    -- 帝国之星(与Telegram Stars关联)
    last_check_in_date DATE,                           -- 上次签到日期
    consecutive_check_ins INTEGER DEFAULT 0,           -- 连续签到天数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP     -- 更新时间
);

-- 创建索引以提高查询性能
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
```

### 2.2 数据访问模式

采用Repository模式封装数据库操作:

```javascript
// UserRepository.js
class UserRepository {
  async findByTelegramId(telegramId) { /* ... */ }
  async create(userData) { /* ... */ }
  async update(id, userData) { /* ... */ }
  // ...其他方法
}
```

---

## 3. API设计

### 3.1 用户注册API

**接口**: `POST /api/v1/users/register`

**请求体**:
```json
{
  "telegram_id": 123456789,
  "username": "user123",
  "first_name": "张",
  "last_name": "三"
}
```

**响应**:
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "username": "user123",
  "first_name": "张",
  "last_name": "三",
  "reputation_points": 0,
  "empire_stars": 0,
  "created_at": "2024-12-07T12:00:00Z"
}
```

**状态码**:
- 201: 创建成功
- 400: 请求参数错误
- 409: 用户已存在
- 500: 服务器错误

### 3.2 获取用户信息API

**接口**: `GET /api/v1/users/me`

**请求头**:
```
x-telegram-id: 123456789
```

**响应**:
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "username": "user123",
  "first_name": "张",
  "last_name": "三",
  "reputation_points": 0,
  "empire_stars": 0,
  "created_at": "2024-12-07T12:00:00Z"
}
```

**状态码**:
- 200: 请求成功
- 401: 未授权
- 404: 用户不存在
- 500: 服务器错误

### 3.3 更新用户信息API

**接口**: `PUT /api/v1/users/me`

**请求头**:
```
x-telegram-id: 123456789
```

**请求体**:
```json
{
  "username": "newuser123",
  "first_name": "李",
  "last_name": "四"
}
```

**响应**:
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "username": "newuser123",
  "first_name": "李",
  "last_name": "四",
  "reputation_points": 0,
  "empire_stars": 0,
  "updated_at": "2024-12-07T13:00:00Z"
}
```

**状态码**:
- 200: 更新成功
- 400: 请求参数错误
- 401: 未授权
- 404: 用户不存在
- 500: 服务器错误

### 3.4 Telegram Webhook

**接口**: `POST /webhook/telegram`

**请求体**: Telegram Update对象
**响应**: 空响应，状态码200

---

## 4. 组件设计

### 4.1 后端组件

#### 4.1.1 User Service

```javascript
class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  
  async registerUser(userData) {
    // 检查用户是否已存在
    const existingUser = await this.userRepository.findByTelegramId(userData.telegram_id);
    if (existingUser) {
      return existingUser; // 返回现有用户
    }
    
    // 创建新用户
    const newUser = await this.userRepository.create(userData);
    return newUser;
  }
  
  async getUserByTelegramId(telegramId) {
    return await this.userRepository.findByTelegramId(telegramId);
  }
  
  async updateUser(telegramId, userData) {
    const user = await this.userRepository.findByTelegramId(telegramId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return await this.userRepository.update(user.id, userData);
  }
}
```

#### 4.1.2 Bot Handler

```javascript
class BotHandler {
  constructor(userService) {
    this.userService = userService;
  }
  
  setupCommands(bot) {
    // 处理 /start 命令
    bot.start(async (ctx) => {
      const { id, username, first_name, last_name } = ctx.from;
      
      // 注册用户
      await this.userService.registerUser({
        telegram_id: id,
        username,
        first_name,
        last_name
      });
      
      // 发送欢迎消息
      return ctx.reply(`欢迎来到帝国社区，${first_name}！`, {
        reply_markup: {
          keyboard: [
            [{ text: '🏛️ 我的主页' }]
          ],
          resize_keyboard: true,
          persistent: true
        }
      });
    });
    
    // 处理 /profile 命令
    bot.command('profile', (ctx) => {
      return ctx.reply('点击下方按钮打开你的个人主页', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏛️ 打开个人主页', web_app: { url: 'https://150.109.95.231/profile.html' } }]
          ]
        }
      });
    });
    
    // 处理文本消息
    bot.on('text', (ctx) => {
      const text = ctx.message.text;
      
      if (text === '🏛️ 我的主页') {
        return ctx.reply('点击下方按钮打开你的个人主页', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏛️ 打开个人主页', web_app: { url: 'https://150.109.95.231/profile.html' } }]
            ]
          }
        });
      }
      
      return ctx.reply('抱歉，我不理解这个命令。请使用 /profile 查看个人主页。');
    });
  }
}
```

### 4.2 前端组件

#### 4.2.1 ProfileApp.vue

```vue
<template>
  <div class="app-container">
    <header class="profile-header">
      <h1 class="profile-title">我的帝国主页</h1>
    </header>
    
    <div v-if="loading" class="loading">
      <p>正在加载...</p>
    </div>
    
    <div v-else class="profile-content">
      <!-- 用户信息区 -->
      <section class="user-info">
        <h2 class="welcome-text">你好，{{ user.first_name }}!</h2>
        <p class="user-id">ID: {{ user.telegram_id }}</p>
      </section>
      
      <!-- 资产区 -->
      <section class="assets">
        <div class="asset-card">
          <h3>声望点 (RP)</h3>
          <p class="asset-value">{{ user.reputation_points || 0 }}</p>
        </div>
        
        <div class="asset-card">
          <h3>帝国之星 (Stars)</h3>
          <p class="asset-value">{{ user.empire_stars || 0 }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { webApp } from '@twa-dev/sdk';
import axios from 'axios';

export default {
  name: 'ProfileApp',
  setup() {
    const user = ref({});
    const loading = ref(true);
    
    const fetchUserInfo = async () => {
      try {
        // 从Telegram WebApp获取用户信息
        const telegramId = webApp.initDataUnsafe?.user?.id;
        if (!telegramId) {
          throw new Error('无法获取Telegram用户ID');
        }
        
        // 调用API获取用户详细信息
        const response = await axios.get('/api/v1/users/me', {
          headers: { 'x-telegram-id': telegramId }
        });
        
        user.value = response.data;
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      // 通知Telegram WebApp已准备好
      webApp.ready();
      // 获取用户信息
      fetchUserInfo();
    });
    
    return {
      user,
      loading
    };
  }
}
</script>

<style>
/* 省略样式定义... */
</style>
```

---

## 5. 安全设计

### 5.1 用户身份验证

**Telegram InitData验证**:
1. 前端收到来自Telegram的initData(含有签名)
2. 前端将initData传递给后端API
3. 后端验证initData的签名
4. 验证通过后，提取用户ID并进行后续操作

```javascript
// 后端验证函数
function validateInitData(initData, botToken) {
  // 解析initData
  const parsedData = new URLSearchParams(initData);
  const hash = parsedData.get('hash');
  
  // 移除hash后排序
  parsedData.delete('hash');
  const dataCheckArray = Array.from(parsedData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
    
  // 计算数据字符串
  const dataCheckString = dataCheckArray.join('\n');
  
  // 生成密钥
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  // 计算哈希
  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // 比较哈希
  return calculatedHash === hash;
}
```

### 5.2 API安全措施

1. **请求头验证**: 所有用户API都需要在请求头中传递有效的x-telegram-id
2. **HTTPS**: 所有API通信必须通过HTTPS进行，确保数据传输安全
3. **速率限制**: 针对用户注册和信息查询API实施速率限制，防止滥用

---

## 6. 部署设计

### 6.1 部署流程

```
                ┌─────────────┐
                │   GitHub    │
                │   Actions   │
                └──────┬──────┘
                       │
                       ▼
 ┌────────────┐  ┌─────────────┐  ┌────────────┐
 │            │  │             │  │            │
 │  前端构建   ├─►│  后端构建   ├─►│ 数据库迁移  │
 │            │  │             │  │            │
 └────────────┘  └──────┬──────┘  └────────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   服务器    │
                 │   部署      │
                 └─────────────┘
```

### 6.2 Nginx配置

```nginx
server {
    listen 443 ssl;
    server_name 150.109.95.231;
    
    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
    
    # 前端文件
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API请求
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Webhook
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 7. 测试策略

### 7.1 单元测试

使用Jest框架对核心服务和组件进行单元测试:

```javascript
// UserService测试示例
describe('UserService', () => {
  // 模拟依赖
  const mockUserRepository = {
    findByTelegramId: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  };
  
  const userService = new UserService(mockUserRepository);
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('registerUser应该创建新用户', async () => {
    // 设置模拟返回值
    mockUserRepository.findByTelegramId.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({ id: 1, telegram_id: 123 });
    
    // 执行测试
    const result = await userService.registerUser({ telegram_id: 123 });
    
    // 验证结果
    expect(mockUserRepository.findByTelegramId).toHaveBeenCalledWith(123);
    expect(mockUserRepository.create).toHaveBeenCalledWith({ telegram_id: 123 });
    expect(result).toEqual({ id: 1, telegram_id: 123 });
  });
  
  // 更多测试...
});
```

### 7.2 API测试

使用Supertest对API端点进行集成测试:

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('User API', () => {
  test('POST /api/v1/users/register 应该创建新用户', async () => {
    const response = await request(app)
      .post('/api/v1/users/register')
      .send({
        telegram_id: 123456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.telegram_id).toBe(123456789);
  });
  
  // 更多测试...
});
```

### 7.3 前端测试

使用Vitest和Testing Library测试Vue组件:

```javascript
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ProfileApp from '../src/apps/ProfileApp/ProfileView.vue';
import axios from 'axios';

// 模拟依赖
vi.mock('axios');
vi.mock('@twa-dev/sdk', () => ({
  webApp: {
    ready: vi.fn(),
    initDataUnsafe: {
      user: { id: 123456789 }
    }
  }
}));

describe('ProfileApp.vue', () => {
  it('显示用户信息', async () => {
    // 设置模拟响应
    axios.get.mockResolvedValue({
      data: {
        first_name: 'Test',
        telegram_id: 123456789,
        reputation_points: 10,
        empire_stars: 5
      }
    });
    
    const wrapper = mount(ProfileApp);
    
    // 等待异步操作完成
    await new Promise(r => setTimeout(r, 0));
    
    // 验证显示的内容
    expect(wrapper.text()).toContain('Test');
    expect(wrapper.text()).toContain('123456789');
    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('5');
  });
});
```

---

## 8. 监控与日志

### 8.1 日志策略

使用Winston进行分级日志记录:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 8.2 关键指标监控

1. **API响应时间**: 统计各API端点的平均响应时间
2. **注册用户数**: 每日新注册用户统计
3. **错误率**: API调用失败比率
4. **资源使用**: CPU、内存、磁盘使用率监控

---

## 9. 迭代计划

### 9.1 阶段一(当前阶段)

- 基础用户注册流程
- ProfileApp.mini基本框架
- 展示用户基本信息

### 9.2 阶段二(下一阶段)

- 集成签到功能(PRD-MVP-002)
- 声望点数系统
- 签到动画效果

---

*文档结束* 