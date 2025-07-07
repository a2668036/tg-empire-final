# TDD-MVP-002: 每日签到功能与声望系统技术设计文档

- **创建日期**: 2024-12-07
- **对应PRD**: PRD-MVP-002
- **负责人**: 项目技术负责人
- **状态**: 待开发

---

## 1. 系统设计概述

### 1.1 功能模块图
┌─────────────────────────────────────────┐
│ 签到与声望系统 │
└───────────────────┬─────────────────────┘
┌─────────┴─────────┐
┌─────────▼───────┐ ┌────────▼────────┐
│ 每日签到模块 │ │ 声望点数模块 │
└─────────┬───────┘ └────────┬────────┘
┌─────────▼───────┐ ┌────────▼────────┐
│ 连续签到奖励 │ │ 声望点数使用 │
└─────────────────┘ └─────────────────┘

### 1.2 关键技术要点

1. **签到记录追踪**: 使用日期索引记录与验证用户签到状态
2. **连续签到计算**: 计算用户连续签到天数，处理中断情况
3. **奖励发放规则**: 基于连续签到天数的动态奖励分配
4. **声望点数管理**: 声望点数增减操作的事务处理

---

## 2. 数据库设计

### 2.1 数据库表增强

在已有的users表基础上添加以下字段:

```sql
-- 已有字段不再重复列出
last_check_in_date DATE,                           -- 上次签到日期
consecutive_check_ins INTEGER DEFAULT 0,           -- 连续签到天数
reputation_points INTEGER DEFAULT 0,               -- 声望点数
```

### 2.2 签到记录表

```sql
CREATE TABLE check_ins (
    id SERIAL PRIMARY KEY,                             -- 签到记录ID
    user_id INTEGER NOT NULL,                          -- 用户ID
    check_in_date DATE NOT NULL,                       -- 签到日期
    reputation_earned INTEGER NOT NULL,                -- 获得的声望点数
    is_consecutive BOOLEAN DEFAULT FALSE,              -- 是否连续签到
    consecutive_days INTEGER DEFAULT 1,                -- 当前连续天数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (user_id, check_in_date)                    -- 确保每个用户每天只能签到一次
);

-- 创建索引
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_date ON check_ins(check_in_date);
```

### 2.3 声望点数日志表

```sql
CREATE TABLE reputation_logs (
    id SERIAL PRIMARY KEY,                             -- 日志ID
    user_id INTEGER NOT NULL,                          -- 用户ID
    points_change INTEGER NOT NULL,                    -- 点数变动(正为增加，负为减少)
    balance INTEGER NOT NULL,                          -- 变动后余额
    reason VARCHAR(255) NOT NULL,                      -- 变动原因
    source_type VARCHAR(50) NOT NULL,                  -- 来源类型(check_in, activity, admin, etc)
    source_id INTEGER,                                 -- 来源ID(对应相关记录的ID)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_reputation_logs_user_id ON reputation_logs(user_id);
```

---

## 3. API设计

### 3.1 每日签到API

**接口**: `POST /api/v1/checkin`

**请求头**:

**请求体**: 无需请求体

**响应**:
```json
{
  "success": true,
  "data": {
    "check_in_id": 1,
    "date": "2024-12-07",
    "consecutive_days": 3,
    "reputation_earned": 15,
    "total_reputation": 45,
    "next_reward": {
      "days": 4,
      "reputation": 20
    }
  },
  "message": "签到成功! 你已连续签到3天，获得15点声望"
}
```

**状态码**:
- 200: 签到成功
- 400: 今日已签到
- 401: 用户未授权
- 500: 服务器错误

### 3.2 获取签到状态API

**接口**: `GET /api/v1/checkin/status`

**请求头**:

**响应**:
```json
{
  "success": true,
  "data": {
    "has_checked_in_today": false,
    "last_check_in": "2024-12-06",
    "consecutive_days": 2,
    "next_reward": {
      "days": 3,
      "reputation": 15
    }
  }
}
```

**状态码**:
- 200: 请求成功
- 401: 用户未授权
- 500: 服务器错误

### 3.3 获取声望历史API

**接口**: `GET /api/v1/reputation/history`

**请求头**:

**查询参数**:
page=1
limit=10

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "records": [
      {
        "id": 1,
        "points_change": 15,
        "balance": 45,
        "reason": "连续签到3天奖励",
        "source_type": "check_in",
        "created_at": "2024-12-07T08:30:00Z"
      },
      {
        "id": 2,
        "points_change": 10,
        "balance": 30,
        "reason": "连续签到2天奖励",
        "source_type": "check_in",
        "created_at": "2024-12-06T09:15:00Z"
      }
    ]
  }
}
```

**状态码**:
- 200: 请求成功
- 401: 用户未授权
- 500: 服务器错误

---

## 4. 业务逻辑实现

### 4.1 签到服务设计

```javascript
// CheckInService.js
class CheckInService {
  constructor(userRepository, checkInRepository, reputationService) {
    this.userRepository = userRepository;
    this.checkInRepository = checkInRepository;
    this.reputationService = reputationService;
  }
  
  async checkIn(telegramId) {
    // 1. 获取用户信息
    const user = await this.userRepository.findByTelegramId(telegramId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 2. 检查今日是否已签到
    const today = new Date().toISOString().split('T')[0];
    const existingCheckIn = await this.checkInRepository.findByUserAndDate(user.id, today);
    if (existingCheckIn) {
      throw new Error('今日已签到');
    }
    
    // 3. 计算连续签到天数
    let consecutiveDays = 1;
    let isConsecutive = false;
    
    if (user.last_check_in_date) {
      const lastDate = new Date(user.last_check_in_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // 判断是否是连续签到(上次签到是昨天)
      if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        consecutiveDays = user.consecutive_check_ins + 1;
        isConsecutive = true;
      }
    }
    
    // 4. 计算奖励声望点数
    const reputationEarned = this.calculateReputationReward(consecutiveDays);
    
    // 5. 创建签到记录
    const checkIn = await this.checkInRepository.create({
      user_id: user.id,
      check_in_date: today,
      reputation_earned: reputationEarned,
      is_consecutive: isConsecutive,
      consecutive_days: consecutiveDays
    });
    
    // 6. 更新用户签到信息
    await this.userRepository.update(user.id, {
      last_check_in_date: today,
      consecutive_check_ins: consecutiveDays
    });
    
    // 7. 添加声望点数
    await this.reputationService.addReputationPoints(
      user.id, 
      reputationEarned, 
      `连续签到${consecutiveDays}天奖励`, 
      'check_in',
      checkIn.id
    );
    
    // 8. 计算下次奖励
    const nextReward = this.calculateReputationReward(consecutiveDays + 1);
    
    // 9. 返回签到结果
    return {
      check_in_id: checkIn.id,
      date: today,
      consecutive_days: consecutiveDays,
      reputation_earned: reputationEarned,
      total_reputation: user.reputation_points + reputationEarned,
      next_reward: {
        days: consecutiveDays + 1,
        reputation: nextReward
      }
    };
  }
  
  calculateReputationReward(consecutiveDays) {
    // 签到奖励算法:
    // - 基础奖励: 5点
    // - 连续签到额外奖励: 天数 x 5点 (上限50点)
    const baseReward = 5;
    const additionalReward = Math.min(consecutiveDays * 5, 50);
    return baseReward + additionalReward;
  }
  
  async getCheckInStatus(telegramId) {
    // 获取用户签到状态实现...
  }
}
```

### 4.2 声望服务设计

```javascript
// ReputationService.js
class ReputationService {
  constructor(userRepository, reputationLogRepository) {
    this.userRepository = userRepository;
    this.reputationLogRepository = reputationLogRepository;
  }
  
  async addReputationPoints(userId, points, reason, sourceType, sourceId = null) {
    // 参数校验
    if (points <= 0) {
      throw new Error('增加的声望点数必须为正数');
    }
    
    // 获取用户信息
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 计算新的声望点数
    const newBalance = user.reputation_points + points;
    
    // 使用事务确保数据一致性
    return await this.executeTransaction(async (transaction) => {
      // 更新用户声望点数
      await this.userRepository.updateWithTransaction(
        transaction,
        userId, 
        { reputation_points: newBalance }
      );
      
      // 记录声望变动日志
      await this.reputationLogRepository.createWithTransaction(
        transaction,
        {
          user_id: userId,
          points_change: points,
          balance: newBalance,
          reason: reason,
          source_type: sourceType,
          source_id: sourceId
        }
      );
      
      return {
        points_added: points,
        new_balance: newBalance
      };
    });
  }
  
  async deductReputationPoints(userId, points, reason, sourceType, sourceId = null) {
    // 扣除声望点数实现...
  }
  
  async getReputationHistory(userId, page = 1, limit = 10) {
    // 获取声望历史实现...
  }
  
  // 事务辅助方法
  async executeTransaction(callback) {
    // 事务实现...
  }
}
```

---

## 5. 前端组件设计

### 5.1 签到组件

```vue
<template>
  <div class="checkin-container">
    <div class="checkin-status" v-if="!loading">
      <div v-if="!hasCheckedIn" class="checkin-button-container">
        <button @click="performCheckIn" :disabled="checkingIn" class="checkin-button">
          <span v-if="!checkingIn">今日签到</span>
          <span v-else>签到中...</span>
        </button>
        <p>连续签到: {{ consecutiveDays }} 天</p>
        <p>今日可获得: {{ nextReward.reputation }} 声望</p>
      </div>
      <div v-else class="checked-in">
        <div class="success-icon">✓</div>
        <p>今日已签到</p>
        <p>连续签到: {{ consecutiveDays }} 天</p>
        <p>明日可获得: {{ nextReward.reputation }} 声望</p>
      </div>
    </div>
    
    <div class="checkin-calendar">
      <h3>本月签到记录</h3>
      <div class="calendar-grid">
        <!-- 生成日历网格... -->
      </div>
    </div>
    
    <div v-if="showResult" class="checkin-result">
      <h3>签到成功!</h3>
      <p>获得 {{ checkInResult.reputation_earned }} 点声望</p>
      <p>已连续签到 {{ checkInResult.consecutive_days }} 天</p>
      <p>当前总声望: {{ checkInResult.total_reputation }}</p>
      <button @click="showResult = false" class="close-button">关闭</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { webApp } from '@twa-dev/sdk';
import axios from 'axios';

export default {
  name: 'CheckInComponent',
  setup() {
    const loading = ref(true);
    const hasCheckedIn = ref(false);
    const consecutiveDays = ref(0);
    const nextReward = ref({ days: 1, reputation: 5 });
    const checkingIn = ref(false);
    const showResult = ref(false);
    const checkInResult = ref(null);
    
    // 获取签到状态
    const fetchCheckInStatus = async () => {
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        if (!telegramId) {
          throw new Error('无法获取Telegram用户ID');
        }
        
        const response = await axios.get('/api/v1/checkin/status', {
          headers: { 'x-telegram-id': telegramId }
        });
        
        const { data } = response.data;
        hasCheckedIn.value = data.has_checked_in_today;
        consecutiveDays.value = data.consecutive_days;
        nextReward.value = data.next_reward;
      } catch (error) {
        console.error('获取签到状态失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 执行签到
    const performCheckIn = async () => {
      if (checkingIn.value) return;
      
      checkingIn.value = true;
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        if (!telegramId) {
          throw new Error('无法获取Telegram用户ID');
        }
        
        const response = await axios.post('/api/v1/checkin', null, {
          headers: { 'x-telegram-id': telegramId }
        });
        
        checkInResult.value = response.data.data;
        showResult.value = true;
        hasCheckedIn.value = true;
        consecutiveDays.value = checkInResult.value.consecutive_days;
        
        // 通知父组件声望变化
        emitReputationChange(checkInResult.value.total_reputation);
      } catch (error) {
        console.error('签到失败:', error);
        webApp.showAlert('签到失败: ' + (error.response?.data?.message || '请稍后再试'));
      } finally {
        checkingIn.value = false;
      }
    };
    
    // 通知声望变化
    const emitReputationChange = (newTotal) => {
      // 触发自定义事件，通知父组件声望已更新
    };
    
    onMounted(() => {
      fetchCheckInStatus();
    });
    
    return {
      loading,
      hasCheckedIn,
      consecutiveDays,
      nextReward,
      checkingIn,
      showResult,
      checkInResult,
      performCheckIn
    };
  }
}
</script>
```

### 5.2 声望历史组件

```vue
<template>
  <div class="reputation-history-container">
    <h3>声望记录</h3>
    
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <div v-else>
      <div class="reputation-balance">
        <h4>当前声望</h4>
        <div class="reputation-points">{{ totalReputation }}</div>
      </div>
      
      <div class="history-list">
        <div v-if="historyRecords.length === 0" class="empty-state">
          <p>暂无声望记录</p>
        </div>
        
        <div v-for="record in historyRecords" :key="record.id" class="history-item">
          <div class="history-content">
            <div class="history-reason">{{ record.reason }}</div>
            <div class="history-date">{{ formatDate(record.created_at) }}</div>
          </div>
          <div :class="['history-points', record.points_change > 0 ? 'positive' : 'negative']">
            {{ record.points_change > 0 ? '+' : '' }}{{ record.points_change }}
          </div>
        </div>
      </div>
      
      <div class="pagination" v-if="totalPages > 1">
        <button 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)" 
          class="pagination-btn"
        >
          上一页
        </button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)" 
          class="pagination-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { webApp } from '@twa-dev/sdk';
import axios from 'axios';

export default {
  name: 'ReputationHistoryComponent',
  props: {
    userReputation: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const loading = ref(true);
    const historyRecords = ref([]);
    const totalReputation = ref(props.userReputation);
    const currentPage = ref(1);
    const totalRecords = ref(0);
    const limit = 10;
    
    const totalPages = computed(() => {
      return Math.ceil(totalRecords.value / limit);
    });
    
    const fetchReputationHistory = async (page = 1) => {
      loading.value = true;
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        if (!telegramId) {
          throw new Error('无法获取Telegram用户ID');
        }
        
        const response = await axios.get(`/api/v1/reputation/history?page=${page}&limit=${limit}`, {
          headers: { 'x-telegram-id': telegramId }
        });
        
        const { data } = response.data;
        historyRecords.value = data.records;
        totalRecords.value = data.total;
        currentPage.value = page;
      } catch (error) {
        console.error('获取声望历史失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      fetchReputationHistory(page);
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    onMounted(() => {
      fetchReputationHistory();
    });
    
    return {
      loading,
      historyRecords,
      totalReputation,
      currentPage,
      totalPages,
      changePage,
      formatDate
    };
  }
}
</script>
```

---

## 6. 安全与性能考量

### 6.1 防刷机制

为防止用户通过修改设备时间或API欺骗进行重复签到，设计以下防护措施：

1. **服务器端时间验证**: 所有签到记录使用服务器时间，不使用客户端提供的时间
2. **IP防护**: 同一IP短时间内多个用户签到将触发风控
3. **签到频率限制**: 添加API请求频率限制，防止短时间内重复调用签到接口

```javascript
// 频率限制中间件
const rateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时窗口
  max: 5, // 同一IP对签到接口限制为5次/天
  message: { success: false, message: "操作过于频繁，请稍后再试" },
  keyGenerator: (req) => req.ip // 使用IP作为限制键
});

// 应用到签到路由
app.post('/api/v1/checkin', rateLimiter, checkInController.checkIn);
```

### 6.2 数据库性能优化

1. **签到记录分区**: 按月对签到记录表进行分区，提高查询效率
2. **定期归档**: 对历史签到数据进行归档，减轻主表查询压力
3. **声望记录缓存**: 使用Redis缓存用户最近的声望变动记录

```sql
-- 签到表分区示例
CREATE TABLE check_ins (
    -- 表结构同前
) PARTITION BY RANGE (check_in_date);

-- 按月创建分区
CREATE TABLE check_ins_y2024m12 PARTITION OF check_ins
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
    
CREATE TABLE check_ins_y2025m01 PARTITION OF check_ins
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## 7. 测试策略

### 7.1 单元测试

为签到和声望服务实现单元测试:

```javascript
// 签到服务测试
describe('CheckInService', () => {
  // 模拟依赖
  const mockUserRepo = {
    findByTelegramId: jest.fn(),
    update: jest.fn(),
    findById: jest.fn()
  };
  const mockCheckInRepo = {
    findByUserAndDate: jest.fn(),
    create: jest.fn()
  };
  const mockReputationService = {
    addReputationPoints: jest.fn()
  };
  
  const checkInService = new CheckInService(
    mockUserRepo,
    mockCheckInRepo,
    mockReputationService
  );
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('用户成功首次签到', async () => {
    // 准备测试数据
    const userId = 1;
    const telegramId = 123456789;
    const today = new Date().toISOString().split('T')[0];
    
    // 设置模拟返回值
    mockUserRepo.findByTelegramId.mockResolvedValue({ 
      id: userId, 
      telegram_id: telegramId,
      reputation_points: 0
    });
    mockCheckInRepo.findByUserAndDate.mockResolvedValue(null);
    mockCheckInRepo.create.mockResolvedValue({ 
      id: 1, 
      user_id: userId, 
      check_in_date: today,
      reputation_earned: 10
    });
    mockReputationService.addReputationPoints.mockResolvedValue({
      points_added: 10,
      new_balance: 10
    });
    
    // 执行测试
    const result = await checkInService.checkIn(telegramId);
    
    // 验证结果
    expect(result).toHaveProperty('check_in_id', 1);
    expect(result).toHaveProperty('reputation_earned', 10);
    expect(mockUserRepo.findByTelegramId).toHaveBeenCalledWith(telegramId);
    expect(mockCheckInRepo.findByUserAndDate).toHaveBeenCalledWith(userId, today);
    expect(mockCheckInRepo.create).toHaveBeenCalled();
    expect(mockUserRepo.update).toHaveBeenCalled();
    expect(mockReputationService.addReputationPoints).toHaveBeenCalled();
  });
  
  test('用户尝试重复签到', async () => {
    // 测试实现...
  });
  
  test('用户连续签到奖励计算', async () => {
    // 测试实现...
  });
});
```

### 7.2 集成测试

```javascript
const request = require('supertest');
const app = require('../src/app');
const { setupTestDatabase, cleanupTestDatabase } = require('./helpers/database');

describe('签到API集成测试', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  test('POST /api/v1/checkin - 新用户首次签到', async () => {
    // 创建测试用户
    const userResponse = await request(app)
      .post('/api/v1/users/register')
      .send({
        telegram_id: 123456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      });
    
    expect(userResponse.status).toBe(201);
    
    // 执行签到
    const response = await request(app)
      .post('/api/v1/checkin')
      .set('x-telegram-id', '123456789');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('reputation_earned');
    expect(response.body.data).toHaveProperty('consecutive_days', 1);
  });
  
  test('POST /api/v1/checkin - 重复签到', async () => {
    const response = await request(app)
      .post('/api/v1/checkin')
      .set('x-telegram-id', '123456789');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });
});
```

### 7.3 前端组件测试

```javascript
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import CheckInComponent from '../src/components/CheckInComponent.vue';
import axios from 'axios';

// 模拟依赖
vi.mock('axios');
vi.mock('@twa-dev/sdk', () => ({
  webApp: {
    initDataUnsafe: {
      user: { id: 123456789 }
    },
    showAlert: vi.fn()
  }
}));

describe('CheckInComponent.vue', () => {
  it('未签到时显示签到按钮', async () => {
    // 设置模拟响应
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          has_checked_in_today: false,
          consecutive_days: 0,
          next_reward: { days: 1, reputation: 10 }
        }
      }
    });
    
    const wrapper = mount(CheckInComponent);
    
    // 等待异步操作完成
    await new Promise(r => setTimeout(r, 0));
    
    // 验证显示的内容
    expect(wrapper.find('.checkin-button').exists()).toBe(true);
    expect(wrapper.text()).toContain('今日签到');
    expect(wrapper.text()).not.toContain('今日已签到');
  });
  
  it('点击签到按钮触发签到请求', async () => {
    // 模拟响应设置...
    // 测试实现...
  });
});
```

---

## 8. 部署与监控

### 8.1 签到系统监控指标

1. **每日签到率**: 统计活跃用户中完成签到的百分比
2. **连续签到分布**: 统计用户连续签到天数的分布情况
3. **声望发放量**: 监控每日系统发放的总声望点数

```javascript
// 统计指标计算示例
async function calculateDailyCheckInRate() {
  const today = new Date().toISOString().split('T')[0];
  
  // 统计今日活跃用户数
  const activeUsers = await db.query(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_activities
    WHERE activity_date >= DATE_SUB(?, INTERVAL 7 DAY)
  `, [today]);
  
  // 统计今日签到用户数
  const checkedInUsers = await db.query(`
    SELECT COUNT(*) as count
    FROM check_ins
    WHERE check_in_date = ?
  `, [today]);
  
  // 计算签到率
  const checkInRate = activeUsers.count > 0 
    ? (checkedInUsers.count / activeUsers.count) * 100
    : 0;
  
  // 记录指标
  await metrics.recordMetric('daily_check_in_rate', checkInRate);
}
```

### 8.2 异常情况处理

1. **时区问题**: 统一使用UTC时间处理签到逻辑，在显示时转换为用户时区
2. **批量签到峰值**: 设计队列处理系统，避免凌晨签到高峰期系统压力过大
3. **签到记录丢失**: 实现签到记录备份和恢复机制

---

## 9. 迭代计划

### 9.1 第一阶段(当前阶段)

- 基础签到功能实现
- 声望点数记录与管理
- 签到页面基础UI

### 9.2 第二阶段(计划)

- 签到日历可视化
- 签到动画与交互效果增强
- 连续签到成就系统

### 9.3 第三阶段(规划)

- 社交分享功能("我已连续签到X天")
- 团队签到激励机制
- 声望点数兑换系统

---

*文档结束*