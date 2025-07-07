# PRD-MVP-004: 商品展示与购买功能 (v1.0)

- **创建日期**: 2024-12-10
- **负责人**: 项目创始人
- **状态**: 待开发
- **服务器**: 150.109.95.231

---

## 1. 背景与目标 (Background & Goals)

商品交易是平台价值变现的核心渠道，也是用户需求满足的关键环节。本功能旨在实现基础的商品展示、选择和购买流程，使平台具备电商基础能力，并通过Telegram Stars完成支付闭环。

**业务目标**:
- 建立基础商品展示系统，实现从内容到商品的无缝转化。
- 完成Telegram Stars支付流程，验证商业闭环可行性。
- 为供应商提供基础的商品上架和订单管理能力。

## 2. 功能范围 (Feature Scope)

**本期实现 (In Scope):**
- 创建 `Marketplace.mini` 应用框架，用于商品浏览和购买。
- 实现商品详情展示，包括图片、标题、价格、描述等。
- 实现商品规格选择（如尺码、颜色等）。
- 集成Telegram Stars支付功能。
- 实现基础订单生成和状态更新流程。

**下期实现 (Out of Scope):**
- 商品搜索和筛选功能。
- 购物车功能。
- 商品评价功能。
- 复杂的库存管理。
- 订单退款流程。

## 3. 用户故事 (User Stories)

| ID    | 用户角色 | 我希望... (I want to...)                               | 以便... (So that...)                                     |
|:------|:---------|:------------------------------------------------------|:--------------------------------------------------------|
| US-01 | 购物用户 | 浏览清晰的商品列表                                     | 我可以快速发现感兴趣的商品                              |
| US-02 | 购物用户 | 查看详细的商品信息和高质量图片                         | 我可以全面了解商品并做出购买决策                        |
| US-03 | 购物用户 | 选择商品的具体规格（如尺码、颜色）                     | 我可以获得符合个人需求的商品版本                        |
| US-04 | 购物用户 | 使用Telegram Stars快速完成支付                         | 我可以安全便捷地完成购买流程                            |
| US-05 | 购物用户 | 查看我的订单状态                                       | 我可以了解商品的发货和配送进度                          |

## 4. 界面与交互流程 (UI & UX Flow)

### 流程 1: 商品列表浏览

1. **触发**: 用户点击 `/shop` 指令或"官方商店"按钮。
2. **后端**:
   - 获取商品列表数据，包含缩略图、标题、价格等基础信息。
3. **前端 (Marketplace.mini)**:
   - 以网格形式展示商品卡片列表。
   - 每个卡片包含：商品图片、标题、价格。
   - 支持下拉刷新和无限滚动加载。

### 流程 2: 商品详情查看

1. **触发**: 用户点击某个商品卡片或从内容页面点击"购买同款"。
2. **后端**:
   - 获取特定商品ID的详细信息，包括多张图片、详细描述、规格选项等。
3. **前端 (Marketplace.mini)**:
   - 展示商品详情页面，包含：
     - 商品图片轮播
     - 商品标题和价格
     - 规格选择区（如尺码、颜色等）
     - 详细描述和参数
     - 底部主按钮"购买"

### 流程 3: 商品购买

1. **触发**: 用户选择规格后点击"购买"按钮。
2. **后端**:
   - 创建待支付订单。
   - 生成Telegram支付发票。
3. **前端 (Marketplace.mini)**:
   - 调用Telegram的showInvoice API，展示支付界面。
   - 用户完成支付后，显示支付成功提示。
   - 更新订单状态为"已支付"。

### 流程 4: 订单状态查看

1. **触发**: 用户在 `ProfileApp.mini` 中访问"我的订单"页面。
2. **后端**:
   - 获取该用户的所有订单数据及状态。
3. **前端 (ProfileApp.mini)**:
   - 列表形式展示用户的订单历史。
   - 每个订单项显示：商品图片、标题、价格、状态（待发货/已发货/已完成）。
   - 点击订单可查看详情，包括物流信息（如已发货）。

## 5. 技术实现要求

### 5.1 后端API设计

**商品相关API**:
```
GET  /api/v1/products               # 获取商品列表
GET  /api/v1/products/:id           # 获取商品详情
```

**订单相关API**:
```
POST /api/v1/orders                # 创建订单
GET  /api/v1/orders                # 获取用户订单列表
GET  /api/v1/orders/:id            # 获取订单详情
```

**支付相关API**:
```
POST /api/v1/payments/create-invoice  # 创建支付发票
POST /api/v1/webhook/payment          # 支付回调接口
```

### 5.2 数据库设计

**products表**:
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,  -- 单位为Stars
    images TEXT[],  -- 存储图片URL数组
    supplier_id INTEGER REFERENCES suppliers(id),
    stock_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**product_specifications表**:
```sql
CREATE TABLE product_specifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    spec_type VARCHAR(50) NOT NULL,  -- 例如："size"、"color"
    spec_value VARCHAR(50) NOT NULL,  -- 例如："XL"、"红色"
    stock_count INTEGER DEFAULT 0,
    additional_price INTEGER DEFAULT 0,  -- 附加价格
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**orders表**:
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, paid, processing, shipped, completed, cancelled
    total_amount INTEGER NOT NULL,
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    payment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**order_items表**:
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_spec_id INTEGER REFERENCES product_specifications(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Mini App技术栈

- **框架**: Vue 3 + Vite
- **UI组件**: 自定义组件
- **状态管理**: Pinia
- **支付集成**: Telegram Payments API

## 6. 数据埋点与衡量指标 (Data & Metrics)

- `event_product_view`: 每次商品详情页被查看时触发，记录商品ID和用户ID。
- `event_product_purchase_start`: 用户点击购买按钮时触发，开始支付流程。
- `event_product_purchase_complete`: 支付成功时触发，记录订单ID和商品信息。
- `metric_conversion_rate`: 转化率 = 完成购买次数 / 商品详情页浏览次数。
- `metric_average_order_value`: 平均订单金额 = 总销售额 / 订单数量。

## 7. 测试计划

### 7.1 功能测试
- [ ] 商品列表加载测试
- [ ] 商品详情展示测试
- [ ] 规格选择功能测试
- [ ] 支付流程测试
- [ ] 订单创建和状态更新测试

### 7.2 集成测试
- [ ] Telegram Stars支付集成测试
- [ ] 内容页到商品页的跳转测试
- [ ] 订单系统与用户系统的集成测试

### 7.3 安全测试
- [ ] 支付流程安全性测试
- [ ] 订单数据访问控制测试

## 8. 部署要求

与PRD-MVP-001相同，使用已配置的环境，并额外需要：

- 配置Telegram支付提供商（Stars支付）
- 设置支付回调Webhook
- 确保HTTPS安全连接

## 9. 验收标准

### 9.1 功能验收
- [ ] 用户能够浏览商品列表
- [ ] 用户能够查看商品详情和选择规格
- [ ] 用户能够使用Telegram Stars完成支付
- [ ] 支付成功后订单状态正确更新
- [ ] 用户能够在个人中心查看订单状态

### 9.2 性能验收
- [ ] 商品列表加载时间 < 3秒
- [ ] 商品详情页加载时间 < 3秒
- [ ] 支付处理响应时间 < 5秒
- [ ] 系统能同时处理至少20个并发订单

### 9.3 安全验收
- [ ] 支付流程安全无漏洞
- [ ] 用户只能访问自己的订单信息
- [ ] 支付回调验证机制有效

---

*文档结束* 