# PRD-MVP-005: 供应商后台管理系统 (v1.0)

- **创建日期**: 2024-12-11
- **负责人**: 项目创始人
- **状态**: 待开发
- **服务器**: 150.109.95.231

---

## 1. 背景与目标 (Background & Goals)

供应商是平台生态中的重要一环，为其提供高效便捷的商品和订单管理工具是平台成功的关键。本功能旨在实现基础的供应商Web后台系统，使供应商能够独立管理商品上架和订单处理，从而构建完整的电商闭环。

**业务目标**:
- 降低供应商的运营成本，提高其效率。
- 减少平台运营团队的人工介入，实现自助化管理。
- 为未来扩展更多供应商提供可扩展的系统基础。

## 2. 功能范围 (Feature Scope)

**本期实现 (In Scope):**
- 供应商账号注册和登录系统。
- 商品管理模块（增、删、改、查）。
- 订单管理模块（查看、状态更新）。
- 基础数据统计看板。

**下期实现 (Out of Scope):**
- 复杂的数据分析和报表。
- 库存预警和智能补货。
- 营销活动管理。
- 客户关系管理。
- 多级管理员权限。

## 3. 用户故事 (User Stories)

| ID    | 用户角色 | 我希望... (I want to...)                                | 以便... (So that...)                                      |
|:------|:---------|:-------------------------------------------------------|:----------------------------------------------------------|
| US-01 | 供应商   | 能够安全地登录到我的管理后台                            | 我可以独立管理我的店铺                                    |
| US-02 | 供应商   | 能够添加、编辑和上架商品                                | 我可以及时更新我的产品信息                                |
| US-03 | 供应商   | 能够上传高质量的商品图片和详细描述                      | 我的产品可以更好地展示给用户                              |
| US-04 | 供应商   | 能够管理商品规格和库存                                  | 我可以确保售卖的商品有足够库存                            |
| US-05 | 供应商   | 能够实时接收订单通知                                    | 我可以第一时间处理新订单                                  |
| US-06 | 供应商   | 能够更新订单状态和填写物流信息                          | 我可以让客户了解订单进度                                  |
| US-07 | 供应商   | 能够查看简单的销售统计                                  | 我可以了解自己的业务状况                                  |

## 4. 界面与交互流程 (UI & UX Flow)

### 流程 1: 供应商注册与登录

1. **注册**:
   - 管理员在平台后台创建供应商账号，设置初始账号和密码。
   - 系统自动发送邀请邮件给供应商，包含登录链接和初始密码。
2. **登录**:
   - 供应商访问专用的Web后台登录页面。
   - 输入账号和密码，首次登录需强制修改密码。
   - 登录成功后进入后台主界面。

### 流程 2: 商品管理

1. **商品列表**:
   - 默认展示供应商所有商品，包含缩略图、名称、价格、库存、状态等信息。
   - 提供"添加商品"按钮和搜索筛选功能。

2. **添加/编辑商品**:
   - 表单形式，包含基本信息填写区（名称、描述、价格等）。
   - 图片上传区，支持拖拽上传多张图片，并可调整顺序。
   - 规格管理区，可添加多种规格类型（如尺码、颜色）及其选项。
   - 预览和保存按钮。

### 流程 3: 订单管理

1. **订单列表**:
   - 展示所有订单，包含订单号、用户信息、商品简要、金额、状态等。
   - 按状态分类（待处理、已备货、已发货、已完成）。
   - 新订单有醒目标识和通知。

2. **订单详情**:
   - 显示完整订单信息，包括用户详情、商品详情、收货地址等。
   - 提供订单状态更新按钮。
   - 已备货状态下，显示物流信息填写区。

### 流程 4: 数据看板

1. **概览**:
   - 今日/本周/本月销售额统计。
   - 订单状态分布饼图。
   - 库存预警（低于设定阈值的商品）。
   - 热销商品排行。

## 5. 技术实现要求

### 5.1 后端API设计

**供应商账户API**:
```
POST /api/v1/suppliers/login           # 登录
GET  /api/v1/suppliers/me              # 获取当前供应商信息
PUT  /api/v1/suppliers/me              # 更新供应商信息
PUT  /api/v1/suppliers/me/password     # 修改密码
```

**商品管理API**:
```
GET    /api/v1/suppliers/products           # 获取供应商的商品列表
POST   /api/v1/suppliers/products           # 创建新商品
GET    /api/v1/suppliers/products/:id       # 获取商品详情
PUT    /api/v1/suppliers/products/:id       # 更新商品信息
DELETE /api/v1/suppliers/products/:id       # 删除商品
POST   /api/v1/suppliers/products/:id/image # 上传商品图片
```

**订单管理API**:
```
GET  /api/v1/suppliers/orders               # 获取供应商的订单列表
GET  /api/v1/suppliers/orders/:id           # 获取订单详情
PUT  /api/v1/suppliers/orders/:id/status    # 更新订单状态
PUT  /api/v1/suppliers/orders/:id/shipping  # 更新物流信息
```

**数据统计API**:
```
GET  /api/v1/suppliers/dashboard/overview   # 获取数据概览
GET  /api/v1/suppliers/dashboard/sales      # 获取销售统计
GET  /api/v1/suppliers/dashboard/products   # 获取商品统计
```

### 5.2 数据库设计

**suppliers表**:
```sql
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**supplier_tokens表**:
```sql
CREATE TABLE supplier_tokens (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 前端技术栈

- **框架**: Next.js (React)
- **UI库**: Ant Design
- **状态管理**: Redux Toolkit
- **图表库**: Echarts
- **表单验证**: Formik + Yup
- **HTTP客户端**: Axios

## 6. 数据埋点与衡量指标 (Data & Metrics)

- `event_supplier_login`: 供应商登录事件，用于监控活跃度。
- `event_product_create`: 商品创建事件，记录商品数据。
- `event_order_status_change`: 订单状态变更事件，用于监控订单处理效率。
- `metric_supplier_activity`: 供应商活跃度 = 登录次数 / 日期区间。
- `metric_order_processing_time`: 订单处理时间 = 发货时间 - 下单时间。

## 7. 测试计划

### 7.1 功能测试
- [ ] 供应商登录和密码修改测试
- [ ] 商品CRUD操作测试
- [ ] 图片上传和管理测试
- [ ] 订单状态更新测试
- [ ] 物流信息填写和更新测试

### 7.2 性能测试
- [ ] 商品列表大数据量加载测试
- [ ] 图片上传性能测试
- [ ] 数据看板加载性能测试

### 7.3 安全测试
- [ ] 登录认证和会话管理安全测试
- [ ] 跨域资源共享(CORS)安全配置测试
- [ ] API权限控制测试

## 8. 部署要求

基本环境与PRD-MVP-001相同，使用已配置的环境，并额外需要：

- 前端构建输出部署到Nginx的`/var/www/supplier`目录
- 配置Nginx虚拟主机，使`supplier.域名.com`指向供应商后台
- 设置适当的缓存策略，特别是对静态资源

## 9. 验收标准

### 9.1 功能验收
- [ ] 供应商可以成功登录和修改密码
- [ ] 供应商可以完成商品的添加、编辑、上下架操作
- [ ] 供应商可以查看订单并更新订单状态
- [ ] 供应商可以填写物流信息
- [ ] 数据看板能正确显示统计数据

### 9.2 性能验收
- [ ] 页面加载时间 < 3秒
- [ ] 图片上传响应时间 < 5秒
- [ ] 数据看板加载时间 < 5秒

### 9.3 安全验收
- [ ] 会话超时自动登出
- [ ] 供应商只能访问自己的商品和订单数据
- [ ] 密码存储使用安全的哈希算法
- [ ] 所有敏感API都有适当的权限控制

---

*文档结束* 