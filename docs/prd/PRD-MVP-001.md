# PRD-MVP-001: 基础用户注册与ProfileApp框架 (v1.0)

- **创建日期**: 2024-12-07
- **负责人**: 项目创始人
- **状态**: 开发中
- **服务器**: 150.109.95.231

---

## 1. 背景与目标 (Background & Goals)

为启动"帝国远征"MVP阶段，我们必须首先建立用户的身份识别机制，并为用户提供一个能感知其在社区中存在的"家"。本功能旨在实现最核心的用户自动化注册流程，并搭建起个人主页 `ProfileApp.mini` 的基础框架。

**业务目标**:
- 验证Telegram Bot与Mini App之间的基础通信与跳转流程。
- 为后续所有需要用户身份的功能（如签到、发布内容）提供用户数据基础。
- 让首批种子用户拥有一个最基本的"个人中心"，建立初步的归属感。

## 2. 功能范围 (Feature Scope)

**本期实现 (In Scope):**
- 当新用户首次与机器人互动时，系统自动在后端数据库中为其创建账户。
- 创建一个基础的、能够运行的 `ProfileApp.mini` 应用框架。
- 用户可通过 `/profile` 指令或键盘按钮，启动 `ProfileApp.mini`。
- `ProfileApp.mini` 必须能获取并展示当前用户的 Telegram 用户名和唯一ID。
- `ProfileApp.mini` 需展示声望点(RP)和帝国之星(Stars)的占位符，默认值为0。

**下期实现 (Out of Scope):**
- 每日签到功能 (将在 `PRD-MVP-002` 中定义)。
- 成就徽章墙、内容列表等任何复杂UI模块。
- 可分享的荣耀卡片。

## 3. 用户故事 (User Stories)

| ID    | 用户角色 | 我希望... (I want to...)                               | 以便... (So that...)                                     |
|:------|:---------|:------------------------------------------------------|:--------------------------------------------------------|
| US-01 | 新用户   | 首次与机器人互动时，系统能自动为我注册。                 | 我可以无缝地开始使用社区的所有功能。                       |
| US-02 | 注册用户 | 能通过简单指令或按钮，方便地打开我的个人主页Mini App。   | 我能随时查看我的个人状态。                                 |
| US-03 | 注册用户 | 打开个人主页时，能看到我自己的Telegram用户名和ID。       | 我能确认这个页面是属于我本人的。                           |
| US-04 | 注册用户 | 打开个人主页时，能看到RP和Stars这两个核心资产的显示。    | 我能理解社区的核心价值体系，并有动力去赚取它们。           |

## 4. 界面与交互流程 (UI & UX Flow)

### 流程 1: 新用户自动注册

1. **触发**: 新用户在Telegram中找到我们的Bot，点击"开始(Start)"按钮。
2. **后端**:
   - 接收到Telegram API发送的 `start` 事件及用户信息。
   - 检查 `users` 表中是否存在该用户的 `telegram_id`。
   - 若不存在，则在 `users` 表中插入一条新纪录，至少包含 `telegram_id`, `username`, `first_name`, `last_name`。
3. **前端 (Bot)**:
   - 向用户私聊发送一条欢迎消息。
   - 欢迎消息下方附带一个持久键盘 (Persistent Keyboard)，包含一个核心按钮：`[🏛️ 我的主页]`。

### 流程 2: 查看个人主页

1. **触发**: 用户点击 `[🏛️ 我的主页]` 按钮，或直接发送 `/profile` 指令。
2. **后端**: Bot接收到指令。
3. **前端 (Bot)**:
   - Bot回复一条消息，消息中包含一个内联按钮 (Inline Button)，文字为"点击打开主页"。
   - 该按钮内嵌一个指向 `ProfileApp.mini` 的URL。
4. **前端 (Mini App)**:
   - 用户点击按钮，Telegram客户端加载WebView，并打开 `ProfileApp.mini`。
   - App启动时，通过Telegram的初始化参数获取用户信息。
   - App界面渲染一个极简布局：
     - **标题**: "我的帝国主页"
     - **欢迎信息**: "你好，[User's First Name]! (ID: [User's Telegram ID])"
     - **资产显示**:
       - "声望点 (RP): 0"
       - "帝国之星 (Stars): 0"

*(注: 此阶段无需精美UI，实现基础布局和数据显示即可)*

## 5. 技术实现要求

### 5.1 后端API设计

**基础用户API**:
```
POST /api/v1/users/register
GET  /api/v1/users/me
PUT  /api/v1/users/me
```

**Telegram Webhook**:
```
POST /webhook/telegram
```

### 5.2 数据库设计

**users表**:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    reputation_points INTEGER DEFAULT 0,
    empire_stars INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Mini App技术栈

- **框架**: Vue 3 + Vite
- **样式**: Tailwind CSS
- **Telegram SDK**: @twa-dev/sdk
- **HTTP客户端**: Axios

## 6. 数据埋点与衡量指标 (Data & Metrics)

- `event_user_registered`: 每次有新用户在 `users` 表中创建时触发，用于衡量用户增长。
- `event_profile_app_opened`: 每次 `ProfileApp.mini`被成功加载时触发，用于衡量核心页面的使用频率。

## 7. 测试计划

### 7.1 功能测试
- [ ] 新用户注册流程测试
- [ ] 个人主页打开测试
- [ ] 用户信息显示测试
- [ ] 数据库数据验证

### 7.2 集成测试
- [ ] Telegram Bot与后端API集成
- [ ] Mini App与后端API集成
- [ ] Webhook接收测试

## 8. 部署要求

### 8.1 环境配置
- **服务器**: 150.109.95.231
- **域名**: 使用IP地址 (后续可配置域名)
- **HTTPS**: 必须配置SSL证书 (Telegram要求)
- **端口**: 80 (HTTP), 443 (HTTPS), 3000 (API)

### 8.2 环境变量
```
TELEGRAM_BOT_TOKEN=799873409:AAEuUvkK2I948UY0xZ5rp_VNDnPJK0RMsec
TELEGRAM_BOT_USERNAME=TupianXZ_bot
DATABASE_URL=postgresql://user:password@localhost:5432/tg_empire
REDIS_URL=redis://localhost:6379
API_BASE_URL=https://150.109.95.231/api
WEBHOOK_URL=https://150.109.95.231/webhook
```

---

## 9. 验收标准

### 9.1 功能验收
- [ ] 新用户可以通过 `/start` 命令自动注册
- [ ] 用户可以通过按钮或命令打开个人主页
- [ ] 个人主页正确显示用户信息和初始资产
- [ ] 所有API接口正常响应
- [ ] 数据库正确存储用户信息

### 9.2 性能验收
- [ ] Mini App加载时间 < 3秒
- [ ] API响应时间 < 500ms
- [ ] 支持并发用户数 > 100

### 9.3 安全验收
- [ ] Telegram InitData验证正确
- [ ] 用户数据安全存储
- [ ] API接口有适当的权限控制

---

*文档结束*
