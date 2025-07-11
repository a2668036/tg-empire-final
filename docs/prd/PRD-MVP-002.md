# PRD-MVP-002: 每日签到功能与声望系统 (v1.0)

- **创建日期**: 2024-12-08
- **负责人**: 项目创始人
- **状态**: 待开发
- **服务器**: 150.109.95.231

---

## 1. 背景与目标 (Background & Goals)

每日签到是用户活跃度的核心驱动力，也是声望点数(RP)获取的基础途径。本功能旨在建立一个简单但有效的用户留存机制，使用户养成每日打开应用的习惯，同时完善声望点数系统作为平台激励机制的基础。

**业务目标**:
- 提高用户日活跃度，建立用户习惯。
- 构建声望点数(RP)系统的基础获取机制。
- 让用户感受到平台的互动性和成长性。

## 2. 功能范围 (Feature Scope)

**本期实现 (In Scope):**
- 在 `ProfileApp.mini` 中增加每日签到按钮和功能。
- 创建声望点数(RP)的存储和管理系统。
- 实现签到后的动画反馈。
- 实现签到记录的存储和连续签到的判定。
- 显示用户当前的RP余额和连续签到天数。

**下期实现 (Out of Scope):**
- 签到奖励的递增机制（如连续7天奖励翻倍）。
- 声望点数的使用场景（如积分商城）。
- 签到日历和历史记录展示。

## 3. 用户故事 (User Stories)

| ID    | 用户角色 | 我希望... (I want to...)                               | 以便... (So that...)                                     |
|:------|:---------|:------------------------------------------------------|:--------------------------------------------------------|
| US-01 | 注册用户 | 每天都能在个人主页上进行签到                           | 我能获得声望点数(RP)作为奖励                             |
| US-02 | 注册用户 | 签到后看到直观的动画反馈                               | 我能感受到成就感和满足感                                 |
| US-03 | 注册用户 | 能看到我当前的声望点数余额                             | 我能了解我在平台中的资产状况                             |
| US-04 | 注册用户 | 能看到我的连续签到天数                                 | 我能有动力保持每天登录的习惯                             |

## 4. 界面与交互流程 (UI & UX Flow)

### 流程 1: 每日签到

1. **触发**: 用户在 `ProfileApp.mini` 中点击"每日签到"按钮。
2. **后端**:
   - 检查该用户今天是否已经签到。
   - 如果未签到，记录签到时间，增加用户RP余额（+10点）。
   - 检查并更新连续签到天数。
3. **前端 (Mini App)**:
   - 签到成功后，播放一个流畅的Lottie动画，展示RP数值从当前值增加到新值。
   - 更新显示的连续签到天数。
   - 禁用签到按钮，并将文字改为"今日已签到"。

### 流程 2: 查看声望点数

1. **触发**: 用户打开 `ProfileApp.mini`。
2. **后端**: 返回用户的当前RP余额和连续签到天数。
3. **前端 (Mini App)**:
   - 在界面上醒目位置显示用户的RP余额。
   - 显示连续签到天数。
   - 如果当天已签到，签到按钮显示为"今日已签到"且不可点击。

## 5. 技术实现要求

### 5.1 后端API设计

**签到相关API**:
```
POST /api/v1/users/me/check-in       # 执行签到
GET  /api/v1/users/me/check-in/status # 获取签到状态
```

**声望点数相关API**:
```
GET  /api/v1/users/me/reputation      # 获取声望点数余额
POST /api/v1/users/me/reputation/add  # 增加声望点数（管理员接口）
```

### 5.2 数据库设计

**user_check_ins表**:
```sql
CREATE TABLE user_check_ins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    check_in_date DATE NOT NULL,
    consecutive_days INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, check_in_date)
);
```

**更新users表**:
```sql
ALTER TABLE users ADD COLUMN last_check_in_date DATE;
ALTER TABLE users ADD COLUMN consecutive_check_ins INTEGER DEFAULT 0;
```

### 5.3 Mini App技术栈

- **动画库**: Lottie
- **状态管理**: Pinia
- **HTTP客户端**: Axios

## 6. 数据埋点与衡量指标 (Data & Metrics)

- `event_user_check_in`: 每次用户成功签到时触发，用于衡量日活跃用户数。
- `metric_daily_check_in_rate`: 日签到率 = 当日签到用户数 / 总注册用户数。
- `metric_consecutive_check_in_7days`: 连续签到7天以上的用户比例。

## 7. 测试计划

### 7.1 功能测试
- [ ] 首次签到功能测试
- [ ] 重复签到处理测试
- [ ] 跨天签到连续性测试
- [ ] 签到动画效果测试
- [ ] RP余额显示测试

### 7.2 边缘情况测试
- [ ] 用户在0点前后签到的处理
- [ ] 用户跳过一天后再签到的连续性重置
- [ ] 网络异常情况下的签到处理

## 8. 部署要求

与PRD-MVP-001相同，使用已配置的环境。

## 9. 验收标准

### 9.1 功能验收
- [ ] 用户可以成功进行每日签到
- [ ] 签到后RP余额正确增加
- [ ] 连续签到天数正确计算和显示
- [ ] 签到动画流畅展示
- [ ] 重复签到得到合理提示

### 9.2 性能验收
- [ ] 签到API响应时间 < 300ms
- [ ] 动画播放流畅无卡顿

### 9.3 用户体验验收
- [ ] 动画效果令人愉悦
- [ ] 签到流程简单明了
- [ ] RP增加有成就感

---

*文档结束* 