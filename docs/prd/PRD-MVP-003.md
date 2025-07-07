# PRD-MVP-003: 内容浏览与点赞功能 (v1.0)

- **创建日期**: 2024-12-09
- **负责人**: 项目创始人
- **状态**: 待开发
- **服务器**: 150.109.95.231

---

## 1. 背景与目标 (Background & Goals)

内容浏览和互动是社区平台的核心功能，也是用户黏性的关键。本功能旨在实现基础的内容展示系统和点赞互动机制，为用户提供高质量的内容消费体验，同时为后续的商品转化奠定基础。

**业务目标**:
- 建立基础内容流通机制，打造平台核心价值。
- 通过点赞互动提高用户参与度和内容质量。
- 为商品转化路径提供内容入口。

## 2. 功能范围 (Feature Scope)

**本期实现 (In Scope):**
- 创建 `ReaderApp.mini` 应用框架，用于内容详情阅读。
- 在TG频道中实现内容摘要卡片的展示。
- 实现从摘要卡片到详情阅读的跳转。
- 实现内容点赞功能，并提供触觉反馈。
- 内容详情页底部增加"购买同款"按钮。

**下期实现 (Out of Scope):**
- 内容评论功能。
- 内容分享功能。
- 内容收藏功能。
- 复杂的内容推荐算法。

## 3. 用户故事 (User Stories)

| ID    | 用户角色 | 我希望... (I want to...)                               | 以便... (So that...)                                     |
|:------|:---------|:------------------------------------------------------|:--------------------------------------------------------|
| US-01 | 浏览用户 | 在频道中看到精美的内容摘要卡片                         | 我可以快速了解内容主题并决定是否阅读详情                |
| US-02 | 浏览用户 | 点击摘要卡片后能进入沉浸式阅读页面                     | 我可以不受干扰地阅读完整内容                            |
| US-03 | 浏览用户 | 阅读时能够方便地点赞内容                               | 我可以表达对内容的喜爱并鼓励创作者                      |
| US-04 | 浏览用户 | 被内容种草后能直接点击购买相关商品                     | 我可以无缝地完成从内容消费到商品购买的转化              |

## 4. 界面与交互流程 (UI & UX Flow)

### 流程 1: 内容摘要卡片展示

1. **触发**: 系统在TG频道中发布内容摘要卡片。
2. **后端**:
   - 提供摘要卡片所需的标题、封面图、作者信息和点赞数。
3. **前端 (Bot)**:
   - 在频道内显示一张精美的卡片，包含:
     - 高质量封面图
     - 内容标题
     - 作者名称和头像
     - 当前点赞数
     - "点击展开，沉浸阅读"按钮

### 流程 2: 内容详情阅读

1. **触发**: 用户点击摘要卡片上的阅读按钮。
2. **后端**:
   - 根据内容ID，返回完整的内容数据。
3. **前端 (ReaderApp.mini)**:
   - 以全屏方式打开，提供清爽、无干扰的阅读界面。
   - 展示内容标题、作者信息。
   - 正文内容支持富文本格式（加粗、引用等）。
   - 支持高清图片和短视频的无缝加载。
   - 底部显示点赞按钮和当前点赞数。
   - 右下角显示醒目的"购买同款"浮动按钮。

### 流程 3: 内容点赞

1. **触发**: 用户在阅读界面点击点赞按钮。
2. **后端**:
   - 检查用户是否已点赞过该内容。
   - 如未点赞，记录点赞信息，更新内容点赞计数。
3. **前端 (ReaderApp.mini)**:
   - 点击时触发轻微的触觉反馈（使用Telegram HapticFeedback API）。
   - 点赞按钮变为已点赞状态（填充色变化）。
   - 点赞数+1。

### 流程 4: 商品转化

1. **触发**: 用户点击"购买同款"按钮。
2. **前端 (ReaderApp.mini & Marketplace.mini)**:
   - 平滑切换到Marketplace.mini。
   - 直接定位至对应商品的详情页。

## 5. 技术实现要求

### 5.1 后端API设计

**内容相关API**:
```
GET  /api/v1/content              # 获取内容列表
GET  /api/v1/content/:id          # 获取内容详情
POST /api/v1/content/:id/like     # 点赞内容
DELETE /api/v1/content/:id/like   # 取消点赞
GET  /api/v1/content/:id/products # 获取内容关联的商品
```

### 5.2 数据库设计

**contents表**:
```sql
CREATE TABLE contents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image VARCHAR(255),
    author_id INTEGER REFERENCES users(id),
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**content_likes表**:
```sql
CREATE TABLE content_likes (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES contents(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, user_id)
);
```

**content_products表**:
```sql
CREATE TABLE content_products (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES contents(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Mini App技术栈

- **框架**: Vue 3 + Vite
- **UI组件**: 自定义组件
- **媒体处理**: 懒加载 + 渐进式图片加载
- **触觉反馈**: Telegram HapticFeedback API

## 6. 数据埋点与衡量指标 (Data & Metrics)

- `event_content_view`: 每次内容被打开阅读时触发，记录内容ID和用户ID。
- `event_content_like`: 每次内容被点赞时触发，记录内容ID和用户ID。
- `event_product_click`: 从内容详情页点击"购买同款"时触发，记录内容ID、商品ID和用户ID。
- `metric_content_engagement`: 内容互动率 = 点赞数 / 阅读数。
- `metric_content_conversion`: 内容转化率 = 点击"购买同款"次数 / 阅读数。

## 7. 测试计划

### 7.1 功能测试
- [ ] 内容摘要卡片展示测试
- [ ] 内容详情页加载测试
- [ ] 内容点赞功能测试
- [ ] 取消点赞功能测试
- [ ] "购买同款"跳转测试

### 7.2 性能测试
- [ ] 图片加载性能测试
- [ ] 视频播放流畅性测试
- [ ] 大型内容页面加载性能测试

### 7.3 兼容性测试
- [ ] iOS版Telegram客户端测试
- [ ] Android版Telegram客户端测试
- [ ] 桌面版Telegram客户端测试

## 8. 部署要求

与PRD-MVP-001相同，使用已配置的环境。

## 9. 验收标准

### 9.1 功能验收
- [ ] 内容摘要卡片能正确展示在TG频道
- [ ] 点击摘要卡片能成功打开内容详情页
- [ ] 用户能成功对内容进行点赞和取消点赞
- [ ] 点赞时有明显的触觉反馈
- [ ] "购买同款"按钮能正确跳转到对应商品页面

### 9.2 性能验收
- [ ] 内容详情页加载时间 < 3秒
- [ ] 图片加载流畅无闪烁
- [ ] 视频播放流畅无卡顿
- [ ] 点赞响应时间 < 300ms

### 9.3 用户体验验收
- [ ] 阅读界面整洁、无干扰
- [ ] 点赞反馈明确直观
- [ ] 浏览和互动流程自然流畅

---

*文档结束* 