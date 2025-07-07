# TDD-MVP-005: 供应商后台管理系统技术设计文档

- **创建日期**: 2024-12-07
- **对应PRD**: PRD-MVP-005
- **负责人**: 项目技术负责人
- **状态**: 待开发

---

## 1. 系统设计概述

### 1.1 功能模块图

```
┌─────────────────────────────────────────┐
│           供应商后台管理系统             │
└───────────────────┬───────────────────┘
          ┌─────────┼─────────┐
┌─────────▼───────┐ ┌▼────────▼────────┐ ┌─────────▼───────┐
│  供应商账户管理  │ │   商品管理模块   │ │   订单管理模块   │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ - 注册与认证     │ │ - 商品上架      │ │ - 订单查看      │
│ - 资料管理       │ │ - 商品编辑      │ │ - 订单处理      │
│ - 权限控制       │ │ - 库存管理      │ │ - 物流更新      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                         │
              ┌──────────┴──────────┐
              │     数据分析模块     │
              ├─────────────────────┤
              │ - 销售统计          │
              │ - 库存报表          │
              │ - 绩效分析          │
              └─────────────────────┘
```

### 1.2 关键技术要点

1. **多角色权限管理**: 实现基于RBAC的权限控制系统
2. **供应商隔离**: 确保数据安全与隔离性
3. **审核工作流**: 商品上架的审核流程
4. **数据可视化**: 销售与库存数据的可视化展示
5. **批量操作**: 批量商品管理与订单处理
6. **集成通知**: 与Telegram Bot的消息通知集成

---

## 2. 数据模型设计

### 2.1 供应商表

```sql
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,                             -- 供应商ID
    name VARCHAR(255) NOT NULL,                        -- 供应商名称
    description TEXT,                                  -- 供应商描述
    logo_url VARCHAR(500),                             -- Logo URL
    contact_name VARCHAR(100) NOT NULL,                -- 联系人姓名
    contact_phone VARCHAR(20) NOT NULL,                -- 联系电话
    contact_email VARCHAR(100),                        -- 联系邮箱
    status VARCHAR(20) DEFAULT 'pending',              -- 状态(pending, active, suspended)
    verified BOOLEAN DEFAULT FALSE,                    -- 是否已验证
    verification_code VARCHAR(100),                    -- 验证码
    telegram_chat_id VARCHAR(100),                     -- Telegram聊天ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP     -- 更新时间
);

-- 创建索引
CREATE INDEX idx_suppliers_status ON suppliers(status);
```

### 2.2 供应商用户表

```sql
CREATE TABLE supplier_users (
    id SERIAL PRIMARY KEY,                             -- 用户ID
    supplier_id INTEGER NOT NULL,                      -- 供应商ID
    username VARCHAR(100) NOT NULL,                    -- 用户名
    password_hash VARCHAR(255) NOT NULL,               -- 密码哈希
    full_name VARCHAR(100) NOT NULL,                   -- 姓名
    email VARCHAR(100) NOT NULL,                       -- 邮箱
    phone VARCHAR(20),                                 -- 电话
    role VARCHAR(50) NOT NULL,                         -- 角色(admin, manager, operator)
    status VARCHAR(20) DEFAULT 'active',               -- 状态(active, disabled)
    last_login TIMESTAMP,                              -- 最后登录时间
    telegram_id BIGINT,                                -- Telegram用户ID(可选)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    UNIQUE (username),
    UNIQUE (email)
);

-- 创建索引
CREATE INDEX idx_supplier_users_supplier ON supplier_users(supplier_id);
```

### 2.3 供应商权限表

```sql
CREATE TABLE supplier_permissions (
    id SERIAL PRIMARY KEY,                             -- 权限ID
    supplier_id INTEGER NOT NULL,                      -- 供应商ID
    user_id INTEGER NOT NULL,                          -- 用户ID
    resource VARCHAR(50) NOT NULL,                     -- 资源类型(product, order, report, etc)
    action VARCHAR(50) NOT NULL,                       -- 操作(view, create, update, delete)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (user_id) REFERENCES supplier_users(id),
    UNIQUE (user_id, resource, action)
);

-- 创建索引
CREATE INDEX idx_supplier_permissions_user ON supplier_permissions(user_id);
```

### 2.4 供应商商品表

> 注：这是对现有商品表的扩展，不是新表

```sql
-- 在现有的products表中添加supplier_id字段
ALTER TABLE products ADD COLUMN supplier_id INTEGER;
ALTER TABLE products ADD FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
CREATE INDEX idx_products_supplier ON products(supplier_id);

-- 添加审核相关字段
ALTER TABLE products ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE products ADD COLUMN approval_comment TEXT;
ALTER TABLE products ADD COLUMN approved_by INTEGER;
ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
```

### 2.5 商品审核日志表

```sql
CREATE TABLE product_approval_logs (
    id SERIAL PRIMARY KEY,                             -- 日志ID
    product_id INTEGER NOT NULL,                       -- 商品ID
    supplier_id INTEGER NOT NULL,                      -- 供应商ID
    admin_id INTEGER,                                  -- 管理员ID(平台管理员)
    previous_status VARCHAR(20) NOT NULL,              -- 之前的状态
    new_status VARCHAR(20) NOT NULL,                   -- 新状态
    comment TEXT,                                      -- 备注
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 创建索引
CREATE INDEX idx_product_approval_logs_product ON product_approval_logs(product_id);
CREATE INDEX idx_product_approval_logs_supplier ON product_approval_logs(supplier_id);
```

### 2.6 供应商订单视图

```sql
CREATE VIEW supplier_orders AS
SELECT o.*, oi.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.supplier_id IS NOT NULL;
```

### 2.7 供应商结算表

```sql
CREATE TABLE supplier_settlements (
    id SERIAL PRIMARY KEY,                             -- 结算ID
    supplier_id INTEGER NOT NULL,                      -- 供应商ID
    period_start DATE NOT NULL,                        -- 结算周期开始
    period_end DATE NOT NULL,                          -- 结算周期结束
    total_sales DECIMAL(10, 2) NOT NULL,               -- 总销售额
    platform_fee DECIMAL(10, 2) NOT NULL,              -- 平台费用
    settlement_amount DECIMAL(10, 2) NOT NULL,         -- 结算金额
    status VARCHAR(20) DEFAULT 'pending',              -- 状态(pending, completed)
    completed_at TIMESTAMP,                            -- 完成时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 创建索引
CREATE INDEX idx_supplier_settlements_supplier ON supplier_settlements(supplier_id);
CREATE INDEX idx_supplier_settlements_period ON supplier_settlements(period_start, period_end);
```

---

## 3. API设计

### 3.1 供应商账户API

#### 3.1.1 供应商注册

**接口**: `POST /api/v1/supplier/register`

**请求体**:
```json
{
  "name": "帝国服饰",
  "description": "专注提供帝国风格服饰与配件",
  "contact_name": "李四",
  "contact_phone": "13800138001",
  "contact_email": "supplier@empire.com",
  "telegram_chat_id": "123456789"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "帝国服饰",
    "status": "pending",
    "verification_code": "S-12345-ABCDE",
    "created_at": "2024-12-07T10:00:00Z"
  },
  "message": "注册申请已提交，请等待审核"
}
```

#### 3.1.2 供应商用户登录

**接口**: `POST /api/v1/supplier/login`

**请求体**:
```json
{
  "username": "supplier_admin",
  "password": "secure_password"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "supplier_admin",
      "full_name": "李四",
      "role": "admin",
      "supplier_id": 1,
      "supplier_name": "帝国服饰"
    },
    "permissions": [
      {"resource": "product", "action": "view"},
      {"resource": "product", "action": "create"},
      {"resource": "product", "action": "update"}
    ]
  },
  "message": "登录成功"
}
```

### 3.2 商品管理API

#### 3.2.1 创建商品

**接口**: `POST /api/v1/supplier/products`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**请求体**:
```json
{
  "name": "帝国限定版T恤",
  "description": "帝国专属定制T恤，高品质面料...",
  "price": 50.00,
  "original_price": 65.00,
  "inventory_count": 100,
  "product_type": "physical",
  "category": "clothing",
  "specifications": [
    {
      "spec_name": "颜色",
      "options": [
        {
          "spec_value": "黑色",
          "additional_price": 0,
          "inventory_count": 50,
          "sku_code": "BLK-001"
        },
        {
          "spec_value": "白色",
          "additional_price": 0,
          "inventory_count": 50,
          "sku_code": "WHT-001"
        }
      ]
    },
    {
      "spec_name": "尺寸",
      "options": [
        {
          "spec_value": "M",
          "additional_price": 0,
          "inventory_count": 30,
          "sku_code": "M-001"
        },
        {
          "spec_value": "L",
          "additional_price": 5,
          "inventory_count": 40,
          "sku_code": "L-001"
        },
        {
          "spec_value": "XL",
          "additional_price": 10,
          "inventory_count": 30,
          "sku_code": "XL-001"
        }
      ]
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "帝国限定版T恤",
    "price": 50.00,
    "approval_status": "pending",
    "created_at": "2024-12-07T11:30:00Z"
  },
  "message": "商品创建成功，等待审核"
}
```

#### 3.2.2 获取供应商商品列表

**接口**: `GET /api/v1/supplier/products`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:
```
status=all|pending|approved|rejected # 审核状态(可选，默认all)
page=1                   # 页码(可选，默认1)
limit=10                 # 每页数量(可选，默认10)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "products": [
      {
        "id": 5,
        "name": "帝国限定版T恤",
        "price": 50.00,
        "inventory_count": 100,
        "sold_count": 0,
        "approval_status": "pending",
        "product_type": "physical",
        "category": "clothing",
        "created_at": "2024-12-07T11:30:00Z"
      },
      // 更多商品...
    ]
  }
}
```

#### 3.2.3 更新商品信息

**接口**: `PUT /api/v1/supplier/products/:productId`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**请求体**:
```json
{
  "name": "帝国限定版T恤(升级版)",
  "description": "升级版帝国专属定制T恤，采用更高品质面料...",
  "price": 55.00,
  "original_price": 70.00,
  "status": "active",
  "product_type": "physical",
  "category": "clothing"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "帝国限定版T恤(升级版)",
    "price": 55.00,
    "approval_status": "pending",
    "updated_at": "2024-12-08T09:15:00Z"
  },
  "message": "商品信息已更新，等待审核"
}
```

#### 3.2.4 更新商品库存

**接口**: `PUT /api/v1/supplier/products/:productId/inventory`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**请求体**:
```json
{
  "inventory_count": 150,
  "specifications": [
    {
      "spec_name": "颜色",
      "spec_value": "黑色",
      "inventory_count": 80
    },
    {
      "spec_name": "颜色",
      "spec_value": "白色",
      "inventory_count": 70
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "帝国限定版T恤(升级版)",
    "inventory_count": 150,
    "updated_at": "2024-12-08T10:30:00Z"
  },
  "message": "商品库存已更新"
}
```

### 3.3 订单管理API

#### 3.3.1 获取供应商订单列表

**接口**: `GET /api/v1/supplier/orders`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:
```
status=all|processing|shipped|delivered|cancelled # 订单状态(可选，默认all)
start_date=2024-12-01       # 开始日期(可选)
end_date=2024-12-07         # 结束日期(可选)
page=1                      # 页码(可选，默认1)
limit=10                    # 每页数量(可选，默认10)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "orders": [
      {
        "id": 10,
        "order_number": "EO202412070001",
        "total_amount": 100.00,
        "payment_status": "paid",
        "order_status": "processing",
        "created_at": "2024-12-07T10:30:00Z",
        "items": [
          {
            "product_id": 5,
            "product_name": "帝国限定版T恤",
            "quantity": 2,
            "product_price": 50.00,
            "total_price": 100.00,
            "specs": {
              "颜色": "黑色",
              "尺寸": "XL"
            }
          }
        ],
        "shipping_address": {
          "name": "张三",
          "phone": "13800138000",
          "address": "广东省深圳市南山区科技园路1号"
        }
      },
      // 更多订单...
    ]
  }
}
```

#### 3.3.2 更新订单状态

**接口**: `PUT /api/v1/supplier/orders/:orderNumber/status`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**请求体**:
```json
{
  "status": "shipped",
  "tracking_number": "SF1234567890",
  "tracking_company": "顺丰速运",
  "comment": "已发货，预计3天内送达"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "order_number": "EO202412070001",
    "previous_status": "processing",
    "current_status": "shipped",
    "updated_at": "2024-12-08T14:20:00Z"
  },
  "message": "订单状态已更新"
}
```

### 3.4 数据统计API

#### 3.4.1 获取销售统计数据

**接口**: `GET /api/v1/supplier/stats/sales`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:
```
period=daily|weekly|monthly       # 统计周期(可选，默认daily)
start_date=2024-12-01             # 开始日期(可选)
end_date=2024-12-07               # 结束日期(可选)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total_sales": 1250.00,
    "total_orders": 15,
    "avg_order_value": 83.33,
    "period": "daily",
    "stats": [
      {
        "date": "2024-12-01",
        "sales": 150.00,
        "orders": 2
      },
      {
        "date": "2024-12-02",
        "sales": 300.00,
        "orders": 3
      },
      // 更多数据...
    ]
  }
}
```

#### 3.4.2 获取商品销量排行

**接口**: `GET /api/v1/supplier/stats/products/top`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:
```
start_date=2024-12-01             # 开始日期(可选)
end_date=2024-12-07               # 结束日期(可选)
limit=10                          # 返回数量(可选，默认10)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": 5,
        "product_name": "帝国限定版T恤",
        "sold_count": 25,
        "sales_amount": 1250.00
      },
      {
        "product_id": 8,
        "product_name": "帝国徽章套装",
        "sold_count": 18,
        "sales_amount": 720.00
      },
      // 更多商品...
    ]
  }
}
```

---

## 4. 业务逻辑实现

### 4.1 供应商服务设计

```javascript
// SupplierService.js
class SupplierService {
  constructor(
    supplierRepository,
    supplierUserRepository,
    authService,
    notificationService
  ) {
    this.supplierRepository = supplierRepository;
    this.supplierUserRepository = supplierUserRepository;
    this.authService = authService;
    this.notificationService = notificationService;
  }
  
  async registerSupplier(supplierData) {
    // 验证供应商数据
    this.validateSupplierData(supplierData);
    
    // 生成验证码
    const verificationCode = this.generateVerificationCode();
    
    // 创建供应商记录
    const supplier = await this.supplierRepository.create({
      ...supplierData,
      status: 'pending',
      verification_code: verificationCode
    });
    
    // 发送通知给平台管理员
    await this.notificationService.notifyAdminNewSupplier(supplier);
    
    // 发送通知给供应商
    if (supplier.telegram_chat_id) {
      await this.notificationService.notifySupplierRegistration(
        supplier.telegram_chat_id,
        supplier.name,
        verificationCode
      );
    }
    
    return {
      id: supplier.id,
      name: supplier.name,
      status: supplier.status,
      verification_code: supplier.verification_code,
      created_at: supplier.created_at
    };
  }
  
  async createSupplierUser(supplierAdmin, userData) {
    // 验证是否有权限创建用户
    if (!this.authService.hasPermission(supplierAdmin, 'user', 'create')) {
      throw new Error('没有创建用户的权限');
    }
    
    // 验证用户数据
    this.validateUserData(userData);
    
    // 哈希密码
    const passwordHash = await this.authService.hashPassword(userData.password);
    
    // 创建用户
    const user = await this.supplierUserRepository.create({
      supplier_id: supplierAdmin.supplier_id,
      username: userData.username,
      password_hash: passwordHash,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: 'active'
    });
    
    // 创建默认权限
    await this.createDefaultPermissions(user.id, user.role, supplierAdmin.supplier_id);
    
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };
  }
  
  async loginSupplierUser(username, password) {
    // 查找用户
    const user = await this.supplierUserRepository.findByUsername(username);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证密码
    const isPasswordValid = await this.authService.verifyPassword(
      password,
      user.password_hash
    );
    
    if (!isPasswordValid) {
      throw new Error('密码错误');
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      throw new Error('账户已禁用');
    }
    
    // 获取供应商信息
    const supplier = await this.supplierRepository.findById(user.supplier_id);
    
    if (!supplier || supplier.status !== 'active') {
      throw new Error('供应商账户不可用');
    }
    
    // 获取用户权限
    const permissions = await this.authService.getUserPermissions(user.id);
    
    // 生成认证令牌
    const token = this.authService.generateToken({
      user_id: user.id,
      username: user.username,
      role: user.role,
      supplier_id: user.supplier_id
    });
    
    // 更新最后登录时间
    await this.supplierUserRepository.update(user.id, {
      last_login: new Date(),
      updated_at: new Date()
    });
    
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        supplier_id: user.supplier_id,
        supplier_name: supplier.name
      },
      permissions
    };
  }
  
  // 其他供应商相关方法...
  
  // 辅助方法
  
  validateSupplierData(data) {
    // 实现数据验证逻辑...
  }
  
  generateVerificationCode() {
    // 生成格式为"S-12345-ABCDE"的验证码
    const numPart = Math.floor(10000 + Math.random() * 90000);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let alphaPath = '';
    for (let i = 0; i < 5; i++) {
      alphaPath += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `S-${numPart}-${alphaPath}`;
  }
  
  async createDefaultPermissions(userId, role, supplierId) {
    // 根据角色创建默认权限
    let permissions = [];
    
    switch (role) {
      case 'admin':
        permissions = [
          { resource: 'product', action: 'view' },
          { resource: 'product', action: 'create' },
          { resource: 'product', action: 'update' },
          { resource: 'product', action: 'delete' },
          { resource: 'order', action: 'view' },
          { resource: 'order', action: 'update' },
          { resource: 'report', action: 'view' },
          { resource: 'user', action: 'view' },
          { resource: 'user', action: 'create' },
          { resource: 'user', action: 'update' }
        ];
        break;
      case 'manager':
        permissions = [
          { resource: 'product', action: 'view' },
          { resource: 'product', action: 'create' },
          { resource: 'product', action: 'update' },
          { resource: 'order', action: 'view' },
          { resource: 'order', action: 'update' },
          { resource: 'report', action: 'view' }
        ];
        break;
      case 'operator':
        permissions = [
          { resource: 'product', action: 'view' },
          { resource: 'order', action: 'view' },
          { resource: 'order', action: 'update' }
        ];
        break;
    }
    
    // 创建权限记录
    for (const perm of permissions) {
      await this.authService.createPermission(
        userId,
        supplierId,
        perm.resource,
        perm.action
      );
    }
  }
}
```

### 4.2 供应商商品服务设计

```javascript
// SupplierProductService.js
class SupplierProductService {
  constructor(
    productRepository,
    productSpecRepository,
    productImageRepository,
    productApprovalLogRepository,
    supplierRepository,
    authService,
    notificationService
  ) {
    this.productRepository = productRepository;
    this.productSpecRepository = productSpecRepository;
    this.productImageRepository = productImageRepository;
    this.productApprovalLogRepository = productApprovalLogRepository;
    this.supplierRepository = supplierRepository;
    this.authService = authService;
    this.notificationService = notificationService;
  }
  
  async createProduct(supplierUser, productData) {
    // 验证权限
    if (!this.authService.hasPermission(supplierUser, 'product', 'create')) {
      throw new Error('没有创建商品的权限');
    }
    
    // 验证商品数据
    this.validateProductData(productData);
    
    // 创建商品基本信息
    const product = await this.productRepository.create({
      ...productData,
      supplier_id: supplierUser.supplier_id,
      status: 'inactive',           // 初始状态为未激活
      approval_status: 'pending',   // 审核状态为待审核
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // 处理规格信息
    if (productData.specifications && productData.specifications.length > 0) {
      for (const specGroup of productData.specifications) {
        const { spec_name, options } = specGroup;
        
        for (const option of options) {
          await this.productSpecRepository.create({
            product_id: product.id,
            spec_name,
            spec_value: option.spec_value,
            additional_price: option.additional_price || 0,
            inventory_count: option.inventory_count || 0,
            sku_code: option.sku_code
          });
        }
      }
    }
    
    // 记录审核日志
    await this.productApprovalLogRepository.create({
      product_id: product.id,
      supplier_id: supplierUser.supplier_id,
      previous_status: null,
      new_status: 'pending',
      comment: '新商品创建，等待审核'
    });
    
    // 发送通知给平台管理员
    await this.notificationService.notifyAdminNewProduct(
      product.id,
      product.name,
      supplierUser.supplier_id
    );
    
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      approval_status: product.approval_status,
      created_at: product.created_at
    };
  }
  
  async getSupplierProducts(supplierUser, filters = {}) {
    // 验证权限
    if (!this.authService.hasPermission(supplierUser, 'product', 'view')) {
      throw new Error('没有查看商品的权限');
    }
    
    // 构建查询条件
    const queryOptions = {
      supplier_id: supplierUser.supplier_id,
      approval_status: filters.status !== 'all' ? filters.status : undefined,
      page: filters.page || 1,
      limit: filters.limit || 10,
      order: { created_at: 'DESC' }
    };
    
    // 获取商品列表
    const { products, total } = await this.productRepository.findAll(queryOptions);
    
    return {
      total,
      page: queryOptions.page,
      limit: queryOptions.limit,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        inventory_count: product.inventory_count,
        sold_count: product.sold_count,
        approval_status: product.approval_status,
        product_type: product.product_type,
        category: product.category,
        created_at: product.created_at
      }))
    };
  }
  
  async updateProduct(supplierUser, productId, updateData) {
    // 验证权限
    if (!this.authService.hasPermission(supplierUser, 'product', 'update')) {
      throw new Error('没有更新商品的权限');
    }
    
    // 获取商品信息
    const product = await this.productRepository.findById(productId);
    
    // 验证商品是否属于该供应商
    if (!product || product.supplier_id !== supplierUser.supplier_id) {
      throw new Error('商品不存在或无权访问');
    }
    
    // 验证更新数据
    this.validateProductUpdateData(updateData);
    
    // 保存之前的审核状态
    const previousStatus = product.approval_status;
    
    // 某些字段的修改需要重新审核
    const needReapproval = this.checkIfNeedReapproval(product, updateData);
    
    // 更新商品信息
    const updatedProduct = await this.productRepository.update(
      productId,
      {
        ...updateData,
        approval_status: needReapproval ? 'pending' : product.approval_status,
        updated_at: new Date()
      }
    );
    
    // 如果需要重新审核，记录审核日志
    if (needReapproval) {
      await this.productApprovalLogRepository.create({
        product_id: productId,
        supplier_id: supplierUser.supplier_id,
        previous_status: previousStatus,
        new_status: 'pending',
        comment: '商品信息更新，等待重新审核'
      });
      
      // 通知平台管理员
      await this.notificationService.notifyAdminProductUpdate(
        productId,
        updatedProduct.name,
        supplierUser.supplier_id
      );
    }
    
    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      approval_status: updatedProduct.approval_status,
      updated_at: updatedProduct.updated_at
    };
  }
  
  async updateProductInventory(supplierUser, productId, inventoryData) {
    // 验证权限
    if (!this.authService.hasPermission(supplierUser, 'product', 'update')) {
      throw new Error('没有更新商品库存的权限');
    }
    
    // 获取商品信息
    const product = await this.productRepository.findById(productId);
    
    // 验证商品是否属于该供应商
    if (!product || product.supplier_id !== supplierUser.supplier_id) {
      throw new Error('商品不存在或无权访问');
    }
    
    // 更新主商品库存
    const updatedProduct = await this.productRepository.update(
      productId,
      {
        inventory_count: inventoryData.inventory_count,
        updated_at: new Date()
      }
    );
    
    // 更新规格库存
    if (inventoryData.specifications && inventoryData.specifications.length > 0) {
      for (const spec of inventoryData.specifications) {
        await this.productSpecRepository.updateInventory(
          productId,
          spec.spec_name,
          spec.spec_value,
          spec.inventory_count
        );
      }
    }
    
    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      inventory_count: updatedProduct.inventory_count,
      updated_at: updatedProduct.updated_at
    };
  }
  
  // 其他商品管理方法...
  
  // 辅助方法
  
  validateProductData(data) {
    // 实现数据验证逻辑...
  }
  
  validateProductUpdateData(data) {
    // 实现更新数据验证逻辑...
  }
  
  checkIfNeedReapproval(product, updateData) {
    // 检查哪些字段的修改需要重新审核
    const criticalFields = ['name', 'description', 'product_type', 'category'];
    return criticalFields.some(field => 
      updateData[field] !== undefined && 
      updateData[field] !== product[field]
    );
  }
}
```

### 4.3 供应商订单服务设计

```javascript
// SupplierOrderService.js
class SupplierOrderService {
  constructor(
    orderRepository,
    orderItemRepository,
    productRepository,
    authService,
    notificationService
  ) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.productRepository = productRepository;
    this.authService = authService;
    this.notificationService = notificationService;
  }
  
  async getSupplierOrders(supplierUser, filters = {}) {
    // 验证权限
    if (!this.authService.hasPermission(supplierUser, 'order', 'view')) {
      throw new Error('没有查看订单的权限');
    }
    
    // 构建查询条件
    const queryOptions = {
      supplier_id: supplierUser.supplier_id,
      order_status: filters.status !== 'all' ? filters.status : undefined,
      start_date: filters.start_date,
      end_date: filters.end_date,
      page: filters.page || 1,
      limit: filters.limit || 10,
      order: { created_at: 'DESC' }
    };
    
    // 获取该供应商的订单
    const { orders, total } = await this.orderRepository.findSupplierOrders(queryOptions);
    
    // 获取订单详情(包括商品)
    const processedOrders = [];
    for (const order of orders) {
      const items = await this.orderItemRepository.findByOrderId(order.id);
      
      // 过滤出属于该供应商的商品
      const supplierItems = [];
      for (const item of items) {
        const product = await this.productRepository.findById(item.product_id);
        if (product && product.supplier_id === supplierUser.supplier_id) {
          supplierItems.push({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            product_price: item.product_price,
            total_price: item.total_price,
            specs: item.specs ? JSON.parse(item.specs) : null
          });
        }
      }
      
      if (supplierItems.length > 0) {
        processedOrders.push({
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          order_status: order.order_status,
          created_at: order.created_at,
          items: supplierItems,
          shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null
        });
      }
    }
    
    return {
      total,
      page: queryOptions.page,
      limit: queryOptions.limit,
      orders: processedOrders
    };
  }
  
  async updateOrderStatus(supplierUser, orderNumber, statusData) {
    // 验证权限
    if (!this.authService.hasPermission(supplierUser, 'order', 'update')) {
      throw new Error('没有更新订单状态的权限');
    }
    
    // 获取订单信息
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new Error('订单不存在');
    }
    
    // 验证订单是否包含该供应商的商品
    const items = await this.orderItemRepository.findByOrderId(order.id);
    const hasSupplierItems = await this.validateSupplierOrder(
      items, 
      supplierUser.supplier_id
    );
    
    if (!hasSupplierItems) {
      throw new Error('无权更新此订单');
    }
    
    // 验证状态变更是否合法
    this.validateStatusChange(order.order_status, statusData.status);
    
    // 保存之前的状态
    const previousStatus = order.order_status;
    
    // 更新订单状态
    const updateData = {
      order_status: statusData.status,
      updated_at: new Date()
    };
    
    // 根据状态设置其他字段
    if (statusData.status === 'shipped') {
      updateData.shipped_at = new Date();
      updateData.tracking_number = statusData.tracking_number;
      updateData.tracking_company = statusData.tracking_company;
    } else if (statusData.status === 'delivered') {
      updateData.delivered_at = new Date();
    }
    
    // 更新订单
    const updatedOrder = await this.orderRepository.update(order.id, updateData);
    
    // 发送通知给用户
    await this.notificationService.notifyUserOrderStatusChange(
      order.user_id,
      orderNumber,
      previousStatus,
      statusData.status,
      statusData.comment
    );
    
    return {
      order_number: orderNumber,
      previous_status: previousStatus,
      current_status: statusData.status,
      updated_at: updatedOrder.updated_at
    };
  }
  
  // 其他订单管理方法...
  
  // 辅助方法
  
  async validateSupplierOrder(orderItems, supplierId) {
    for (const item of orderItems) {
      const product = await this.productRepository.findById(item.product_id);
      if (product && product.supplier_id === supplierId) {
        return true;
      }
    }
    return false;
  }
  
  validateStatusChange(currentStatus, newStatus) {
    // 定义允许的状态转换
    const allowedTransitions = {
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': []
    };
    
    if (!allowedTransitions[currentStatus] || 
        !allowedTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`不允许从${currentStatus}状态转换为${newStatus}状态`);
    }
  }
}
```

---

## 5. 前端组件设计

### 5.1 供应商管理控制台布局

```vue
<template>
  <div class="supplier-dashboard">
    <header class="dashboard-header">
      <div class="logo">
        <img :src="supplierLogo || defaultLogo" alt="供应商Logo">
        <h1>{{ supplierName }} 管理控制台</h1>
      </div>
      
      <div class="user-info">
        <span class="welcome">欢迎, {{ user.full_name }}</span>
        <span class="role-badge">{{ roleLabel }}</span>
        <button class="logout-btn" @click="logout">退出</button>
      </div>
    </header>
    
    <div class="dashboard-body">
      <nav class="sidebar">
        <div class="nav-group">
          <h3>商品管理</h3>
          <ul>
            <li>
              <router-link to="/supplier/products">
                <span class="icon">📦</span>
                <span class="label">商品列表</span>
              </router-link>
            </li>
            <li v-if="canCreateProduct">
              <router-link to="/supplier/products/new">
                <span class="icon">➕</span>
                <span class="label">添加商品</span>
              </router-link>
            </li>
          </ul>
        </div>
        
        <div class="nav-group">
          <h3>订单管理</h3>
          <ul>
            <li>
              <router-link to="/supplier/orders">
                <span class="icon">🛒</span>
                <span class="label">订单列表</span>
              </router-link>
            </li>
            <li>
              <router-link to="/supplier/orders/processing">
                <span class="icon">⚙️</span>
                <span class="label">待处理订单</span>
                <span v-if="processingOrdersCount > 0" class="badge">
                  {{ processingOrdersCount }}
                </span>
              </router-link>
            </li>
          </ul>
        </div>
        
        <div class="nav-group" v-if="canViewReports">
          <h3>数据分析</h3>
          <ul>
            <li>
              <router-link to="/supplier/stats/sales">
                <span class="icon">📊</span>
                <span class="label">销售统计</span>
              </router-link>
            </li>
            <li>
              <router-link to="/supplier/stats/products">
                <span class="icon">📈</span>
                <span class="label">商品分析</span>
              </router-link>
            </li>
          </ul>
        </div>
        
        <div class="nav-group" v-if="isAdmin">
          <h3>账户管理</h3>
          <ul>
            <li>
              <router-link to="/supplier/users">
                <span class="icon">👥</span>
                <span class="label">用户管理</span>
              </router-link>
            </li>
            <li>
              <router-link to="/supplier/settings">
                <span class="icon">⚙️</span>
                <span class="label">账户设置</span>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>
      
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useOrdersStore } from '../stores/orders';

export default {
  name: 'SupplierDashboard',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const ordersStore = useOrdersStore();
    
    const defaultLogo = '/assets/default-supplier-logo.png';
    const processingOrdersCount = ref(0);
    
    const user = computed(() => authStore.user);
    const supplierName = computed(() => authStore.user.supplier_name);
    const supplierLogo = computed(() => authStore.supplierInfo.logo_url);
    
    const roleLabel = computed(() => {
      const roleMap = {
        'admin': '管理员',
        'manager': '经理',
        'operator': '操作员'
      };
      return roleMap[user.value.role] || user.value.role;
    });
    
    const isAdmin = computed(() => user.value.role === 'admin');
    
    const canCreateProduct = computed(() => {
      return authStore.hasPermission('product', 'create');
    });
    
    const canViewReports = computed(() => {
      return authStore.hasPermission('report', 'view');
    });
    
    const logout = () => {
      authStore.logout();
      router.push('/supplier/login');
    };
    
    const fetchProcessingOrdersCount = async () => {
      try {
        const count = await ordersStore.getProcessingOrdersCount();
        processingOrdersCount.value = count;
      } catch (error) {
        console.error('获取待处理订单数量失败:', error);
      }
    };
    
    onMounted(() => {
      fetchProcessingOrdersCount();
    });
    
    return {
      user,
      supplierName,
      supplierLogo,
      defaultLogo,
      roleLabel,
      isAdmin,
      canCreateProduct,
      canViewReports,
      processingOrdersCount,
      logout
    };
  }
}
</script>
```

### 5.2 供应商商品列表组件

```vue
<template>
  <div class="supplier-products">
    <header class="page-header">
      <h1>商品管理</h1>
      
      <div class="header-actions">
        <button v-if="canCreateProduct" class="add-btn" @click="navigateToCreate">
          添加商品
        </button>
      </div>
    </header>
    
    <div class="filter-bar">
      <div class="status-filter">
        <span class="filter-label">状态:</span>
        <button 
          v-for="status in statusOptions" 
          :key="status.value" 
          :class="['filter-option', { active: currentStatus === status.value }]"
          @click="changeStatus(status.value)"
        >
          {{ status.label }}
        </button>
      </div>
      
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索商品名称" 
          @keyup.enter="searchProducts"
        />
        <button class="search-btn" @click="searchProducts">搜索</button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="products.length === 0" class="empty-state">
      <p>暂无商品</p>
      <button v-if="canCreateProduct" class="add-btn" @click="navigateToCreate">
        添加第一个商品
      </button>
    </div>
    
    <div v-else class="products-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>价格</th>
            <th>库存</th>
            <th>已售</th>
            <th>类别</th>
            <th>审核状态</th>
            <th>创建日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.id }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.price }} 星</td>
            <td>{{ product.inventory_count }}</td>
            <td>{{ product.sold_count }}</td>
            <td>{{ getCategoryLabel(product.category) }}</td>
            <td>
              <span :class="['status-badge', product.approval_status]">
                {{ getApprovalStatusLabel(product.approval_status) }}
              </span>
            </td>
            <td>{{ formatDate(product.created_at) }}</td>
            <td class="actions">
              <button class="view-btn" @click="viewProduct(product.id)">查看</button>
              <button 
                v-if="canUpdateProduct" 
                class="edit-btn" 
                @click="editProduct(product.id)"
              >
                编辑
              </button>
              <button 
                v-if="canUpdateProduct && product.approval_status === 'approved'" 
                class="stock-btn" 
                @click="updateInventory(product.id)"
              >
                库存
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="pagination" v-if="totalPages > 1">
      <button 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useProductStore } from '../stores/product';

export default {
  name: 'SupplierProducts',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const productStore = useProductStore();
    
    const loading = ref(true);
    const products = ref([]);
    const totalProducts = ref(0);
    const currentPage = ref(1);
    const currentStatus = ref('all');
    const searchQuery = ref('');
    const limit = 10;
    
    const statusOptions = [
      { label: '全部', value: 'all' },
      { label: '待审核', value: 'pending' },
      { label: '已通过', value: 'approved' },
      { label: '已拒绝', value: 'rejected' }
    ];
    
    const totalPages = computed(() => {
      return Math.ceil(totalProducts.value / limit);
    });
    
    const canCreateProduct = computed(() => {
      return authStore.hasPermission('product', 'create');
    });
    
    const canUpdateProduct = computed(() => {
      return authStore.hasPermission('product', 'update');
    });
    
    const fetchProducts = async () => {
      loading.value = true;
      
      try {
        const result = await productStore.getSupplierProducts({
          status: currentStatus.value,
          search: searchQuery.value || undefined,
          page: currentPage.value,
          limit
        });
        
        products.value = result.products;
        totalProducts.value = result.total;
      } catch (error) {
        console.error('获取商品列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const changeStatus = (status) => {
      if (currentStatus.value === status) return;
      currentStatus.value = status;
      currentPage.value = 1;
      fetchProducts();
    };
    
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      currentPage.value = page;
      fetchProducts();
    };
    
    const searchProducts = () => {
      currentPage.value = 1;
      fetchProducts();
    };
    
    const navigateToCreate = () => {
      router.push('/supplier/products/new');
    };
    
    const viewProduct = (productId) => {
      router.push(`/supplier/products/${productId}`);
    };
    
    const editProduct = (productId) => {
      router.push(`/supplier/products/${productId}/edit`);
    };
    
    const updateInventory = (productId) => {
      router.push(`/supplier/products/${productId}/inventory`);
    };
    
    const getCategoryLabel = (category) => {
      const categoryMap = {
        'clothing': '服饰',
        'electronics': '电子',
        'souvenirs': '纪念品',
        'digital': '数字商品'
      };
      return categoryMap[category] || category;
    };
    
    const getApprovalStatusLabel = (status) => {
      const statusMap = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝'
      };
      return statusMap[status] || status;
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    onMounted(() => {
      fetchProducts();
    });
    
    return {
      loading,
      products,
      currentPage,
      totalPages,
      currentStatus,
      searchQuery,
      statusOptions,
      canCreateProduct,
      canUpdateProduct,
      changeStatus,
      changePage,
      searchProducts,
      navigateToCreate,
      viewProduct,
      editProduct,
      updateInventory,
      getCategoryLabel,
      getApprovalStatusLabel,
      formatDate
    };
  }
}
</script>
```

---

## 6. 安全设计

### 6.1 权限控制架构

基于RBAC(Role-Based Access Control)的权限控制系统:

```javascript
// AuthService.js
class AuthService {
  constructor(
    supplierUserRepository,
    supplierPermissionRepository,
    jwtService
  ) {
    this.supplierUserRepository = supplierUserRepository;
    this.supplierPermissionRepository = supplierPermissionRepository;
    this.jwtService = jwtService;
  }
  
  // 验证用户权限
  async hasPermission(user, resource, action) {
    // 检查用户是否存在
    if (!user || !user.id) {
      return false;
    }
    
    // 获取用户权限
    const permissions = await this.supplierPermissionRepository.findByUser(user.id);
    
    // 检查是否有指定的权限
    return permissions.some(permission => 
      permission.resource === resource && 
      permission.action === action
    );
  }
  
  // 中间件：验证请求是否带有有效的JWT
  async verifyToken(req, res, next) {
    try {
      const bearerHeader = req.headers['authorization'];
      if (!bearerHeader) {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌'
        });
      }
      
      const bearer = bearerHeader.split(' ');
      const token = bearer[1];
      
      // 验证令牌
      const decoded = this.jwtService.verify(token);
      
      // 检查用户是否存在
      const user = await this.supplierUserRepository.findById(decoded.user_id);
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '无效的用户账户'
        });
      }
      
      // 将用户信息添加到请求对象
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        supplier_id: user.supplier_id
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
  }
  
  // 中间件：验证请求是否有特定资源的权限
  requirePermission(resource, action) {
    return async (req, res, next) => {
      try {
        const hasPermission = await this.hasPermission(req.user, resource, action);
        
        if (hasPermission) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: '没有权限执行此操作'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '验证权限时出错'
        });
      }
    };
  }
}
```

### 6.2 数据隔离策略

每个供应商的数据需要严格隔离，防止跨供应商访问:

```javascript
// 应用于所有查询的供应商过滤器
function supplierFilter(query, supplierId) {
  if (query.where) {
    query.where.supplier_id = supplierId;
  } else {
    query.where = { supplier_id: supplierId };
  }
  return query;
}

// 使用示例
async function findAllProducts(queryOptions, supplierId) {
  // 确保查询只包含该供应商的商品
  const filteredQuery = supplierFilter(queryOptions, supplierId);
  return await productModel.findAll(filteredQuery);
}
```

---

## 7. 测试策略

### 7.1 单元测试

供应商服务的单元测试:

```javascript
describe('SupplierService', () => {
  // 模拟依赖
  const mockSupplierRepo = {
    create: jest.fn(),
    findById: jest.fn()
  };
  const mockSupplierUserRepo = {
    create: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn()
  };
  const mockAuthService = {
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
    generateToken: jest.fn(),
    hasPermission: jest.fn(),
    getUserPermissions: jest.fn(),
    createPermission: jest.fn()
  };
  const mockNotificationService = {
    notifyAdminNewSupplier: jest.fn(),
    notifySupplierRegistration: jest.fn()
  };
  
  const supplierService = new SupplierService(
    mockSupplierRepo,
    mockSupplierUserRepo,
    mockAuthService,
    mockNotificationService
  );
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('registerSupplier should create a new supplier', async () => {
    // 设置模拟返回值
    const supplierData = {
      name: '测试供应商',
      description: '测试描述',
      contact_name: '测试联系人',
      contact_phone: '13800000000',
      contact_email: 'test@example.com'
    };
    
    mockSupplierRepo.create.mockResolvedValue({
      id: 1,
      ...supplierData,
      status: 'pending',
      verification_code: 'S-12345-ABCDE',
      created_at: new Date()
    });
    
    // 执行测试
    const result = await supplierService.registerSupplier(supplierData);
    
    // 验证结果
    expect(result).toHaveProperty('id', 1);
    expect(result).toHaveProperty('name', '测试供应商');
    expect(result).toHaveProperty('status', 'pending');
    expect(result).toHaveProperty('verification_code');
    expect(mockSupplierRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '测试供应商',
        status: 'pending'
      })
    );
    expect(mockNotificationService.notifyAdminNewSupplier).toHaveBeenCalled();
  });
  
  test('loginSupplierUser should authenticate and return token', async () => {
    // 模拟实现...
  });
});
```

### 7.2 集成测试

```javascript
const request = require('supertest');
const app = require('../src/app');
const { setupTestDatabase, cleanupTestDatabase } = require('./helpers/database');

describe('供应商API集成测试', () => {
  let authToken;
  
  beforeAll(async () => {
    await setupTestDatabase();
    
    // 登录获取令牌
    const loginResponse = await request(app)
      .post('/api/v1/supplier/login')
      .send({
        username: 'test_supplier',
        password: 'test_password'
      });
    
    authToken = loginResponse.body.data.token;
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  test('GET /api/v1/supplier/products - 获取供应商商品列表', async () => {
    const response = await request(app)
      .get('/api/v1/supplier/products')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('products');
    expect(Array.isArray(response.body.data.products)).toBe(true);
  });
  
  test('POST /api/v1/supplier/products - 创建新商品', async () => {
    const productData = {
      name: '测试商品',
      description: '测试描述',
      price: 50.00,
      inventory_count: 100,
      product_type: 'physical',
      category: 'clothing'
    };
    
    const response = await request(app)
      .post('/api/v1/supplier/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(productData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe('测试商品');
    expect(response.body.data.approval_status).toBe('pending');
  });
});
```

---

## 8. 部署与监控

### 8.1 供应商控制台性能监控

1. **API响应时间**:
   - 按端点分类统计响应时间
   - 监控95%响应时间阈值

2. **供应商活跃度指标**:
   - 登录频率
   - 商品上架数量
   - 订单处理时间

```javascript
// API响应时间中间件
function responseTimeMonitor(req, res, next) {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const elapsed = process.hrtime(start);
    const ms = elapsed[0] * 1000 + elapsed[1] / 1000000;
    
    // 记录API响应时间
    metrics.recordResponseTime(req.path, ms);
    
    // 如果响应时间超过阈值，记录警告
    if (ms > 500) {
      logger.warn(`慢响应 ${req.method} ${req.path}: ${ms.toFixed(2)}ms`);
    }
  });
  
  next();
}
```

### 8.2 供应商活动审计

所有关键操作需要记录审计日志:

```javascript
// AuditService.js
class AuditService {
  constructor(auditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }
  
  async logActivity(supplierId, userId, action, resourceType, resourceId, details) {
    await this.auditLogRepository.create({
      supplier_id: supplierId,
      user_id: userId,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: JSON.stringify(details),
      ip_address: details.ip_address,
      created_at: new Date()
    });
  }
}

// 使用审计服务的示例
// 在商品创建时
await auditService.logActivity(
  supplierUser.supplier_id,
  supplierUser.id,
  'create',
  'product',
  product.id,
  {
    product_name: product.name,
    ip_address: req.ip
  }
);
```

---

## 9. 迭代计划

### 9.1 第一阶段(当前阶段)

- 供应商基础账户系统
- 商品管理基本功能
- 订单处理流程
- 基础数据统计

### 9.2 第二阶段

- 商品批量导入/导出功能
- 高级数据分析与可视化
- 供应商对账与结算系统
- 客户评价管理

### 9.3 第三阶段

- 供应商绩效评分系统
- 供应商级别与权益系统
- 平台营销活动集成
- 供应商社区与消息系统

---

*文档结束*
