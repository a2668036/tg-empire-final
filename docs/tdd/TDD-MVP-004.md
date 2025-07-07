# TDD-MVP-004: 商品展示与购买功能技术设计文档

- **创建日期**: 2024-12-07
- **对应PRD**: PRD-MVP-004
- **负责人**: 项目技术负责人
- **状态**: 待开发

---

## 1. 系统设计概述

### 1.1 功能模块图

\`\`\`
┌─────────────────────────────────────────┐
│            商品展示与购买系统            │
└───────────────────┬───────────────────┘
          ┌─────────┴─────────┐
┌─────────▼───────┐  ┌────────▼────────┐
│   商品展示模块   │  │   商品交易模块   │
├─────────────────┤  ├─────────────────┤
│ - 商品列表       │  │ - 购买流程      │
│ - 商品详情       │  │ - 订单管理      │
│ - 商品搜索       │  │ - 支付集成      │
└─────────────────┘  └─────────────────┘
\`\`\`
│            商品展示与购买系统            │
└───────────────────┬───────────────────┘
          ┌─────────┴─────────┐
┌─────────▼───────┐  ┌────────▼────────┐
│   商品展示模块   │  │   商品交易模块   │
├─────────────────┤  ├─────────────────┤
│ - 商品列表       │  │ - 购买流程      │
│ - 商品详情       │  │ - 订单管理      │
│ - 商品搜索       │  │ - 支付集成      │
└─────────────────┘  └─────────────────┘
```

### 1.2 关键技术要点

1. **商品数据管理**: 商品信息的存储、索引与更新
2. **商品展示优化**: 前端展示与缓存策略
3. **用户购买流程**: 完整购买流程的设计与实现
4. **支付集成**: Telegram支付系统的集成
5. **订单生命周期**: 订单状态跟踪与管理
6. **库存管理**: 实时库存控制与并发处理

---

## 2. 数据模型设计

### 2.1 商品表

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,                             -- 商品ID
    name VARCHAR(255) NOT NULL,                        -- 商品名称
    description TEXT,                                  -- 商品描述
    price DECIMAL(10, 2) NOT NULL,                     -- 商品价格(帝国之星)
    original_price DECIMAL(10, 2),                     -- 原价(如果有折扣)
    inventory_count INTEGER NOT NULL DEFAULT 0,        -- 库存数量
    sold_count INTEGER NOT NULL DEFAULT 0,             -- 已售数量
    status VARCHAR(20) DEFAULT 'active',               -- 状态(active, out_of_stock, discontinued)
    product_type VARCHAR(50) NOT NULL,                 -- 商品类型(digital, physical)
    category VARCHAR(50) NOT NULL,                     -- 商品类别
    thumbnail_url VARCHAR(500),                        -- 缩略图URL
    supplier_id INTEGER,                               -- 供应商ID(关联到供应商表)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 创建索引
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_supplier ON products(supplier_id);
```

### 2.2 商品图片表

```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,                      -- 图片ID
    product_id INTEGER NOT NULL,                -- 商品ID
    image_url VARCHAR(500) NOT NULL,            -- 图片URL
    sort_order INTEGER DEFAULT 0,               -- 排序顺序
    is_primary BOOLEAN DEFAULT FALSE,           -- 是否主图
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_product_images_product ON product_images(product_id);
```

### 2.3 商品规格表

```sql
CREATE TABLE product_specifications (
    id SERIAL PRIMARY KEY,                      -- 规格ID
    product_id INTEGER NOT NULL,                -- 商品ID
    spec_name VARCHAR(100) NOT NULL,            -- 规格名称(如"颜色"、"尺寸")
    spec_value VARCHAR(100) NOT NULL,           -- 规格值(如"红色"、"XL")
    additional_price DECIMAL(10, 2) DEFAULT 0,  -- 额外价格(如果有)
    inventory_count INTEGER NOT NULL DEFAULT 0, -- 特定规格库存
    sku_code VARCHAR(100),                      -- SKU编码
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, spec_name, spec_value)  -- 确保同一商品的规格组合唯一
);

-- 创建索引
CREATE INDEX idx_product_specs_product ON product_specifications(product_id);
```

### 2.4 订单表

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,                             -- 订单ID
    order_number VARCHAR(50) UNIQUE NOT NULL,          -- 订单编号(业务使用)
    user_id INTEGER NOT NULL,                          -- 用户ID
    total_amount DECIMAL(10, 2) NOT NULL,              -- 订单总金额
    payment_status VARCHAR(20) DEFAULT 'pending',      -- 支付状态(pending, paid, failed, refunded)
    order_status VARCHAR(20) DEFAULT 'created',        -- 订单状态(created, processing, shipped, delivered, cancelled)
    shipping_address JSON,                             -- 收货地址(仅实物商品)
    shipping_fee DECIMAL(10, 2) DEFAULT 0,             -- 运费(仅实物商品)
    contact_phone VARCHAR(20),                         -- 联系电话
    payment_method VARCHAR(50),                        -- 支付方式
    payment_transaction_id VARCHAR(100),               -- 支付交易号
    paid_at TIMESTAMP,                                 -- 支付时间
    note TEXT,                                         -- 订单备注
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status, payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### 2.5 订单商品表

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,                      -- 订单商品ID
    order_id INTEGER NOT NULL,                  -- 订单ID
    product_id INTEGER NOT NULL,                -- 商品ID
    product_name VARCHAR(255) NOT NULL,         -- 商品名称(快照)
    product_price DECIMAL(10, 2) NOT NULL,      -- 商品单价(快照)
    quantity INTEGER NOT NULL,                  -- 购买数量
    total_price DECIMAL(10, 2) NOT NULL,        -- 小计金额
    specs JSON,                                 -- 选择的规格(JSON格式)
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 创建索引
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

### 2.6 购物车表

```sql
CREATE TABLE shopping_carts (
    id SERIAL PRIMARY KEY,                      -- 购物车ID
    user_id INTEGER NOT NULL,                   -- 用户ID
    product_id INTEGER NOT NULL,                -- 商品ID
    quantity INTEGER NOT NULL DEFAULT 1,        -- 数量
    selected_specs JSON,                        -- 选择的规格(JSON格式)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE (user_id, product_id, (selected_specs::text)) -- 确保同一规格的商品不重复
);

-- 创建索引
CREATE INDEX idx_shopping_carts_user ON shopping_carts(user_id);
```

---

## 3. API设计

### 3.1 商品列表API

**接口**: `GET /api/v1/products`

**查询参数**:
```
category=electronics     # 商品类别(可选)
sort=newest|price_asc|price_desc|popular # 排序方式(可选，默认newest)
page=1                   # 页码(可选，默认1)
limit=10                 # 每页数量(可选，默认10)
```

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(可选，用于个性化)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 28,
    "page": 1,
    "limit": 10,
    "products": [
      {
        "id": 1,
        "name": "帝国限定版T恤",
        "description": "帝国专属定制T恤，高品质面料...",
        "price": 50.00,
        "original_price": 65.00,
        "inventory_count": 100,
        "sold_count": 30,
        "product_type": "physical",
        "category": "clothing",
        "thumbnail_url": "https://empire-assets.com/products/tshirt_thumb.jpg",
        "has_specs": true,
        "created_at": "2024-12-01T08:30:00Z"
      },
      // 更多商品...
    ]
  }
}
```

**状态码**:
- 200: 请求成功
- 400: 请求参数错误
- 500: 服务器错误

### 3.2 商品详情API

**接口**: `GET /api/v1/products/:productId`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(可选，用于个性化)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "帝国限定版T恤",
    "description": "帝国专属定制T恤，采用100%有机棉制作，柔软舒适。正面印有帝国标志，背面有星系图案...",
    "price": 50.00,
    "original_price": 65.00,
    "discount_percentage": 23,
    "inventory_count": 100,
    "sold_count": 30,
    "status": "active",
    "product_type": "physical",
    "category": "clothing",
    "supplier": {
      "id": 2,
      "name": "帝国服饰"
    },
    "images": [
      {
        "id": 1,
        "url": "https://empire-assets.com/products/tshirt_1.jpg",
        "is_primary": true
      },
      {
        "id": 2,
        "url": "https://empire-assets.com/products/tshirt_2.jpg",
        "is_primary": false
      }
    ],
    "specifications": [
      {
        "spec_name": "颜色",
        "options": ["黑色", "白色", "蓝色"]
      },
      {
        "spec_name": "尺寸",
        "options": ["S", "M", "L", "XL"]
      }
    ],
    "created_at": "2024-12-01T08:30:00Z",
    "updated_at": "2024-12-05T14:20:00Z"
  }
}
```

**状态码**:
- 200: 请求成功
- 404: 商品不存在
- 500: 服务器错误

### 3.3 购物车API

#### 3.3.1 添加商品到购物车

**接口**: `POST /api/v1/cart/items`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**请求体**:
```json
{
  "product_id": 1,
  "quantity": 2,
  "selected_specs": {
    "颜色": "黑色",
    "尺寸": "XL"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cart_id": 5,
    "product_id": 1,
    "product_name": "帝国限定版T恤",
    "quantity": 2,
    "selected_specs": {
      "颜色": "黑色",
      "尺寸": "XL"
    },
    "price": 50.00,
    "total_price": 100.00,
    "thumbnail_url": "https://empire-assets.com/products/tshirt_thumb.jpg"
  },
  "message": "商品已添加到购物车"
}
```

#### 3.3.2 获取购物车列表

**接口**: `GET /api/v1/cart/items`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cart_id": 5,
        "product_id": 1,
        "product_name": "帝国限定版T恤",
        "quantity": 2,
        "selected_specs": {
          "颜色": "黑色",
          "尺寸": "XL"
        },
        "price": 50.00,
        "total_price": 100.00,
        "thumbnail_url": "https://empire-assets.com/products/tshirt_thumb.jpg",
        "status": "active"
      }
    ],
    "total_items": 1,
    "total_price": 100.00
  }
}
```

#### 3.3.3 更新购物车商品数量

**接口**: `PUT /api/v1/cart/items/:cartItemId`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**请求体**:
```json
{
  "quantity": 3
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cart_id": 5,
    "quantity": 3,
    "total_price": 150.00
  },
  "message": "购物车已更新"
}
```

#### 3.3.4 删除购物车商品

**接口**: `DELETE /api/v1/cart/items/:cartItemId`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**响应**:
```json
{
  "success": true,
  "message": "商品已从购物车中移除"
}
```

### 3.4 订单API

#### 3.4.1 创建订单

**接口**: `POST /api/v1/orders`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**请求体**:
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "selected_specs": {
        "颜色": "黑色",
        "尺寸": "XL"
      }
    }
  ],
  "shipping_address": {
    "name": "张三",
    "phone": "13800138000",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "address": "科技园路1号",
    "postal_code": "518000"
  },
  "note": "请尽快发货"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "order_id": 10,
    "order_number": "EO202412070001",
    "total_amount": 100.00,
    "payment_status": "pending",
    "order_status": "created",
    "items": [
      {
        "product_id": 1,
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
    "created_at": "2024-12-07T10:30:00Z",
    "payment_url": "https://t.me/$EmpireCommunityBot?start=pay_EO202412070001" // Telegram支付链接
  },
  "message": "订单创建成功，请在30分钟内完成支付"
}
```

#### 3.4.2 获取订单列表

**接口**: `GET /api/v1/orders`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**查询参数**:
```
status=all|pending|paid|completed|cancelled # 订单状态(可选，默认all)
page=1                   # 页码(可选，默认1)
limit=10                 # 每页数量(可选，默认10)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "orders": [
      {
        "id": 10,
        "order_number": "EO202412070001",
        "total_amount": 100.00,
        "payment_status": "paid",
        "order_status": "processing",
        "item_count": 2,
        "created_at": "2024-12-07T10:30:00Z",
        "paid_at": "2024-12-07T10:35:00Z"
      },
      // 更多订单...
    ]
  }
}
```

#### 3.4.3 获取订单详情

**接口**: `GET /api/v1/orders/:orderNumber`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "EO202412070001",
    "total_amount": 100.00,
    "payment_status": "paid",
    "order_status": "processing",
    "shipping_address": {
      "name": "张三",
      "phone": "13800138000",
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "address": "科技园路1号",
      "postal_code": "518000"
    },
    "items": [
      {
        "product_id": 1,
        "product_name": "帝国限定版T恤",
        "quantity": 2,
        "product_price": 50.00,
        "total_price": 100.00,
        "specs": {
          "颜色": "黑色",
          "尺寸": "XL"
        },
        "thumbnail_url": "https://empire-assets.com/products/tshirt_thumb.jpg"
      }
    ],
    "timeline": [
      {
        "status": "created",
        "time": "2024-12-07T10:30:00Z",
        "description": "订单创建"
      },
      {
        "status": "paid",
        "time": "2024-12-07T10:35:00Z",
        "description": "支付成功"
      },
      {
        "status": "processing",
        "time": "2024-12-07T11:00:00Z",
        "description": "订单处理中"
      }
    ],
    "created_at": "2024-12-07T10:30:00Z",
    "paid_at": "2024-12-07T10:35:00Z"
  }
}
```

#### 3.4.4 取消订单

**接口**: `PUT /api/v1/orders/:orderNumber/cancel`

**请求头**:
```
x-telegram-id: 123456789 # 用户身份(必需)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "order_number": "EO202412070001",
    "order_status": "cancelled",
    "cancelled_at": "2024-12-07T12:30:00Z"
  },
  "message": "订单已取消"
}
```

---

## 4. 业务逻辑实现

### 4.1 商品服务设计

```javascript
// ProductService.js
class ProductService {
  constructor(
    productRepository,
    productImageRepository,
    productSpecRepository
  ) {
    this.productRepository = productRepository;
    this.productImageRepository = productImageRepository;
    this.productSpecRepository = productSpecRepository;
  }
  
  async getProductsList(options = {}) {
    const {
      category,
      sort = 'newest',
      page = 1,
      limit = 10
    } = options;
    
    // 构建查询条件
    const filters = { status: 'active' };
    if (category) filters.category = category;
    
    // 构建排序条件
    let order = { created_at: 'DESC' }; // 默认按创建时间降序
    
    switch (sort) {
      case 'price_asc':
        order = { price: 'ASC' };
        break;
      case 'price_desc':
        order = { price: 'DESC' };
        break;
      case 'popular':
        order = { sold_count: 'DESC', created_at: 'DESC' };
        break;
    }
    
    // 获取商品列表
    const { products, total } = await this.productRepository.findAll({
      filters,
      order,
      page,
      limit
    });
    
    // 为每个商品添加是否有规格的标志
    const productIds = products.map(product => product.id);
    const productsWithSpecs = await this.productSpecRepository.findProductsWithSpecs(productIds);
    const specsMap = new Map(productsWithSpecs.map(id => [id, true]));
    
    products.forEach(product => {
      product.has_specs = specsMap.has(product.id);
    });
    
    return { products, total, page, limit };
  }
  
  async getProductDetail(productId) {
    // 获取商品详情
    const product = await this.productRepository.findById(productId, {
      withSupplier: true
    });
    
    if (!product) {
      throw new Error('商品不存在');
    }
    
    // 获取商品图片
    const images = await this.productImageRepository.findByProductId(productId);
    product.images = images;
    
    // 获取商品规格
    const specs = await this.productSpecRepository.findByProductId(productId);
    
    // 将规格组织成更友好的结构
    const groupedSpecs = specs.reduce((result, spec) => {
      if (!result.find(s => s.spec_name === spec.spec_name)) {
        result.push({
          spec_name: spec.spec_name,
          options: specs
            .filter(s => s.spec_name === spec.spec_name)
            .map(s => s.spec_value)
        });
      }
      return result;
    }, []);
    
    product.specifications = groupedSpecs;
    
    // 计算折扣比例
    if (product.original_price && product.original_price > product.price) {
      const discount = ((product.original_price - product.price) / product.original_price) * 100;
      product.discount_percentage = Math.round(discount);
    }
    
    return product;
  }
  
  async checkInventory(productId, specOptions, quantity = 1) {
    // 检查是否有足够的库存
    if (specOptions && Object.keys(specOptions).length > 0) {
      // 检查特定规格的库存
      const specs = [];
      
      for (const [specName, specValue] of Object.entries(specOptions)) {
        specs.push({ spec_name: specName, spec_value: specValue });
      }
      
      const specInventory = await this.productSpecRepository.getInventory(productId, specs);
      return specInventory && specInventory >= quantity;
    } else {
      // 检查商品总库存
      const product = await this.productRepository.findById(productId);
      return product && product.inventory_count >= quantity;
    }
  }
}
```

### 4.2 购物车服务设计

```javascript
// CartService.js
class CartService {
  constructor(
    cartRepository,
    productService,
    productRepository
  ) {
    this.cartRepository = cartRepository;
    this.productService = productService;
    this.productRepository = productRepository;
  }
  
  async addToCart(userId, productId, quantity, selectedSpecs = null) {
    // 检查商品是否存在
    const product = await this.productRepository.findById(productId);
    if (!product || product.status !== 'active') {
      throw new Error('商品不存在或已下架');
    }
    
    // 检查库存
    const hasInventory = await this.productService.checkInventory(
      productId,
      selectedSpecs,
      quantity
    );
    
    if (!hasInventory) {
      throw new Error('商品库存不足');
    }
    
    // 检查购物车中是否已存在相同商品和规格
    const existingCartItem = await this.cartRepository.findByUserAndProduct(
      userId,
      productId,
      selectedSpecs ? JSON.stringify(selectedSpecs) : null
    );
    
    if (existingCartItem) {
      // 更新现有购物车项的数量
      const newQuantity = existingCartItem.quantity + quantity;
      
      // 再次检查库存是否足够新的数量
      const hasEnoughInventory = await this.productService.checkInventory(
        productId,
        selectedSpecs,
        newQuantity
      );
      
      if (!hasEnoughInventory) {
        throw new Error('商品库存不足');
      }
      
      // 更新购物车项
      const updatedCartItem = await this.cartRepository.update(
        existingCartItem.id,
        { quantity: newQuantity }
      );
      
      return {
        cart_id: updatedCartItem.id,
        product_id: product.id,
        product_name: product.name,
        quantity: updatedCartItem.quantity,
        selected_specs: selectedSpecs,
        price: product.price,
        total_price: product.price * updatedCartItem.quantity,
        thumbnail_url: product.thumbnail_url
      };
    } else {
      // 创建新的购物车项
      const cartItem = await this.cartRepository.create({
        user_id: userId,
        product_id: productId,
        quantity: quantity,
        selected_specs: selectedSpecs ? JSON.stringify(selectedSpecs) : null
      });
      
      return {
        cart_id: cartItem.id,
        product_id: product.id,
        product_name: product.name,
        quantity: cartItem.quantity,
        selected_specs: selectedSpecs,
        price: product.price,
        total_price: product.price * cartItem.quantity,
        thumbnail_url: product.thumbnail_url
      };
    }
  }
  
  async getUserCartItems(userId) {
    // 获取用户购物车项
    const cartItems = await this.cartRepository.findByUserId(userId);
    
    if (cartItems.length === 0) {
      return { items: [], total_items: 0, total_price: 0 };
    }
    
    // 获取商品详情
    const productIds = cartItems.map(item => item.product_id);
    const products = await this.productRepository.findByIds(productIds);
    
    // 创建商品ID到商品的映射
    const productMap = new Map(products.map(product => [product.id, product]));
    
    // 组织购物车数据
    const items = cartItems.map(item => {
      const product = productMap.get(item.product_id);
      
      // 检查商品是否存在和状态
      const status = !product ? 'unavailable' : 
                    product.status !== 'active' ? 'inactive' :
                    product.inventory_count < item.quantity ? 'insufficient_inventory' : 'active';
      
      return {
        cart_id: item.id,
        product_id: item.product_id,
        product_name: product ? product.name : '商品不可用',
        quantity: item.quantity,
        selected_specs: item.selected_specs ? JSON.parse(item.selected_specs) : null,
        price: product ? product.price : 0,
        total_price: product ? product.price * item.quantity : 0,
        thumbnail_url: product ? product.thumbnail_url : null,
        status: status
      };
    });
    
    // 计算总数和总价
    const activeItems = items.filter(item => item.status === 'active');
    const totalPrice = activeItems.reduce((sum, item) => sum + item.total_price, 0);
    
    return {
      items: items,
      total_items: items.length,
      total_price: totalPrice
    };
  }
  
  async updateCartItemQuantity(userId, cartItemId, quantity) {
    // 确认购物车项属于该用户
    const cartItem = await this.cartRepository.findById(cartItemId);
    
    if (!cartItem || cartItem.user_id !== userId) {
      throw new Error('购物车项不存在');
    }
    
    // 检查库存
    const hasInventory = await this.productService.checkInventory(
      cartItem.product_id,
      cartItem.selected_specs ? JSON.parse(cartItem.selected_specs) : null,
      quantity
    );
    
    if (!hasInventory) {
      throw new Error('商品库存不足');
    }
    
    // 更新购物车项
    const updatedCartItem = await this.cartRepository.update(
      cartItemId,
      { quantity: quantity }
    );
    
    // 获取商品信息以计算总价
    const product = await this.productRepository.findById(cartItem.product_id);
    
    return {
      cart_id: updatedCartItem.id,
      quantity: updatedCartItem.quantity,
      total_price: product.price * updatedCartItem.quantity
    };
  }
  
  async removeCartItem(userId, cartItemId) {
    // 确认购物车项属于该用户
    const cartItem = await this.cartRepository.findById(cartItemId);
    
    if (!cartItem || cartItem.user_id !== userId) {
      throw new Error('购物车项不存在');
    }
    
    // 删除购物车项
    await this.cartRepository.delete(cartItemId);
    
    return true;
  }
}
```

### 4.3 订单服务设计

```javascript
// OrderService.js
class OrderService {
  constructor(
    orderRepository,
    orderItemRepository,
    productService,
    productRepository,
    cartRepository,
    userRepository,
    paymentService
  ) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.productService = productService;
    this.productRepository = productRepository;
    this.cartRepository = cartRepository;
    this.userRepository = userRepository;
    this.paymentService = paymentService;
  }
  
  async createOrder(userId, orderData) {
    const { items, shipping_address, note } = orderData;
    
    if (!items || items.length === 0) {
      throw new Error('订单必须包含至少一个商品');
    }
    
    // 验证商品信息并计算总价
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const { product_id, quantity, selected_specs } = item;
      
      // 检查商品是否存在
      const product = await this.productRepository.findById(product_id);
      if (!product || product.status !== 'active') {
        throw new Error(`商品ID为${product_id}的商品不存在或已下架`);
      }
      
      // 检查库存
      const hasInventory = await this.productService.checkInventory(
        product_id,
        selected_specs,
        quantity
      );
      
      if (!hasInventory) {
        throw new Error(`商品"${product.name}"库存不足`);
      }
      
      // 计算商品总价
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;
      
      validatedItems.push({
        product_id,
        product_name: product.name,
        product_price: product.price,
        quantity,
        total_price: itemTotal,
        selected_specs
      });
    }
    
    // 生成订单编号
    const orderNumber = await this.generateOrderNumber();
    
    // 创建订单记录
    const order = await this.orderRepository.create({
      order_number: orderNumber,
      user_id: userId,
      total_amount: totalAmount,
      payment_status: 'pending',
      order_status: 'created',
      shipping_address: shipping_address ? JSON.stringify(shipping_address) : null,
      note
    });
    
    // 创建订单商品记录
    for (const item of validatedItems) {
      await this.orderItemRepository.create({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        total_price: item.total_price,
        specs: item.selected_specs ? JSON.stringify(item.selected_specs) : null
      });
    }
    
    // 从购物车中移除这些商品(如果适用)
    // 这里省略实现...
    
    // 生成支付链接
    const paymentUrl = await this.paymentService.generatePaymentUrl(orderNumber);
    
    // 返回订单信息
    return {
      order_id: order.id,
      order_number: orderNumber,
      total_amount: totalAmount,
      payment_status: 'pending',
      order_status: 'created',
      items: validatedItems,
      created_at: order.created_at,
      payment_url: paymentUrl
    };
  }
  
  async getUserOrders(userId, options = {}) {
    const { status = 'all', page = 1, limit = 10 } = options;
    
    // 构建查询条件
    const filters = { user_id: userId };
    
    if (status !== 'all') {
      if (status === 'pending') {
        filters.payment_status = 'pending';
      } else if (status === 'paid') {
        filters.payment_status = 'paid';
        filters.order_status = ['processing', 'shipped'];
      } else if (status === 'completed') {
        filters.order_status = 'delivered';
      } else if (status === 'cancelled') {
        filters.order_status = 'cancelled';
      }
    }
    
    // 获取订单列表
    const { orders, total } = await this.orderRepository.findAll({
      filters,
      order: { created_at: 'DESC' },
      page,
      limit
    });
    
    // 获取订单商品数量
    const orderIds = orders.map(order => order.id);
    const itemCounts = await this.orderItemRepository.countByOrderIds(orderIds);
    
    // 将商品数量添加到订单对象
    orders.forEach(order => {
      order.item_count = itemCounts[order.id] || 0;
    });
    
    return { orders, total, page, limit };
  }
  
  async getOrderDetails(userId, orderNumber) {
    // 获取订单信息
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    
    if (!order || order.user_id !== userId) {
      throw new Error('订单不存在');
    }
    
    // 获取订单商品
    const items = await this.orderItemRepository.findByOrderId(order.id);
    
    // 获取商品缩略图
    const productIds = items.map(item => item.product_id);
    const products = await this.productRepository.findByIds(productIds);
    const productMap = new Map(products.map(product => [product.id, product]));
    
    // 组织订单数据
    const orderItems = items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      product_price: item.product_price,
      total_price: item.total_price,
      specs: item.specs ? JSON.parse(item.specs) : null,
      thumbnail_url: productMap.get(item.product_id)?.thumbnail_url || null
    }));
    
    // 生成订单时间线
    const timeline = this.generateOrderTimeline(order);
    
    return {
      id: order.id,
      order_number: order.order_number,
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      order_status: order.order_status,
      shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
      items: orderItems,
      timeline,
      created_at: order.created_at,
      paid_at: order.paid_at
    };
  }
  
  async cancelOrder(userId, orderNumber) {
    // 获取订单信息
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    
    if (!order || order.user_id !== userId) {
      throw new Error('订单不存在');
    }
    
    // 检查订单是否可以取消
    if (order.payment_status !== 'pending' && order.order_status !== 'created') {
      throw new Error('该订单状态无法取消');
    }
    
    // 更新订单状态
    const updatedOrder = await this.orderRepository.update(order.id, {
      order_status: 'cancelled',
      updated_at: new Date()
    });
    
    return {
      order_number: updatedOrder.order_number,
      order_status: updatedOrder.order_status,
      cancelled_at: updatedOrder.updated_at
    };
  }
  
  // 辅助方法
  
  async generateOrderNumber() {
    // 生成订单编号: EO + 年月日 + 4位序号
    const date = new Date();
    const dateStr = date.getFullYear().toString().substring(2) +
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0');
    
    // 获取当天最大订单编号
    const latestOrder = await this.orderRepository.findLatestOrderByPrefix(`EO${dateStr}`);
    
    let sequenceNumber = 1;
    if (latestOrder) {
      const latestSequence = parseInt(latestOrder.order_number.substring(8));
      sequenceNumber = latestSequence + 1;
    }
    
    return `EO${dateStr}${sequenceNumber.toString().padStart(4, '0')}`;
  }
  
  generateOrderTimeline(order) {
    const timeline = [
      {
        status: 'created',
        time: order.created_at,
        description: '订单创建'
      }
    ];
    
    if (order.payment_status === 'paid' && order.paid_at) {
      timeline.push({
        status: 'paid',
        time: order.paid_at,
        description: '支付成功'
      });
    }
    
    if (order.order_status === 'processing') {
      timeline.push({
        status: 'processing',
        time: order.updated_at, // 假设更新时间是状态变更时间
        description: '订单处理中'
      });
    }
    
    if (order.order_status === 'shipped' && order.shipped_at) {
      timeline.push({
        status: 'shipped',
        time: order.shipped_at,
        description: '已发货'
      });
    }
    
    if (order.order_status === 'delivered' && order.delivered_at) {
      timeline.push({
        status: 'delivered',
        time: order.delivered_at,
        description: '已送达'
      });
    }
    
    if (order.order_status === 'cancelled') {
      timeline.push({
        status: 'cancelled',
        time: order.updated_at, // 假设更新时间是状态变更时间
        description: '订单已取消'
      });
    }
    
    return timeline;
  }
}
```

### 4.4 支付服务设计

```javascript
// PaymentService.js
class PaymentService {
  constructor(
    orderRepository,
    userRepository,
    telegramBotService
  ) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
    this.telegramBotService = telegramBotService;
  }
  
  async generatePaymentUrl(orderNumber) {
    // 生成Telegram Bot支付链接
    // 格式: https://t.me/$BotUsername?start=pay_ORDER_NUMBER
    return `https://t.me/$EmpireCommunityBot?start=pay_${orderNumber}`;
  }
  
  async processPayment(userId, orderNumber) {
    // 获取订单信息
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.payment_status === 'paid') {
      throw new Error('订单已支付');
    }
    
    // 获取用户信息
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 检查用户帝国之星余额是否足够
    if (user.empire_stars < order.total_amount) {
      throw new Error('帝国之星余额不足');
    }
    
    // 使用事务处理支付过程
    return await this.executeTransaction(async (transaction) => {
      // 扣减用户帝国之星余额
      await this.userRepository.updateWithTransaction(
        transaction,
        userId,
        { empire_stars: user.empire_stars - order.total_amount }
      );
      
      // 更新订单状态
      await this.orderRepository.updateWithTransaction(
        transaction,
        order.id,
        {
          payment_status: 'paid',
          order_status: 'processing',
          paid_at: new Date(),
          payment_method: 'empire_stars',
          payment_transaction_id: `ES${Date.now()}`
        }
      );
      
      // 处理库存扣减(实际项目中应该放到队列中异步处理)
      // 这里省略实现...
      
      // 发送支付成功通知
      await this.telegramBotService.sendPaymentSuccessNotification(
        user.telegram_id,
        orderNumber,
        order.total_amount
      );
      
      return {
        success: true,
        order_number: orderNumber,
        amount: order.total_amount,
        payment_status: 'paid',
        paid_at: new Date()
      };
    });
  }
  
  // 事务辅助方法
  async executeTransaction(callback) {
    // 事务实现...
  }
}
```

---

## 5. 前端组件设计

### 5.1 商品列表组件

```vue
<template>
  <div class="product-list-container">
    <div class="product-filters">
      <div class="category-tabs">
        <button 
          v-for="category in categories" 
          :key="category.value" 
          :class="['category-tab', { active: activeCategory === category.value }]"
          @click="changeCategory(category.value)"
        >
          {{ category.label }}
        </button>
      </div>
      
      <div class="sort-options">
        <button 
          v-for="option in sortOptions" 
          :key="option.value" 
          :class="['sort-option', { active: activeSort === option.value }]"
          @click="changeSort(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="products.length === 0" class="empty-state">
      <p>暂无商品</p>
    </div>
    
    <div v-else class="product-grid">
      <product-card
        v-for="product in products"
        :key="product.id"
        :product="product"
        @click="navigateToProduct(product.id)"
      />
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { webApp } from '@twa-dev/sdk';
import axios from 'axios';
import ProductCard from './ProductCard.vue';

export default {
  name: 'ProductList',
  components: {
    ProductCard
  },
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const products = ref([]);
    const currentPage = ref(1);
    const totalProducts = ref(0);
    const limit = 10;
    
    const activeCategory = ref('all');
    const activeSort = ref('newest');
    
    const categories = [
      { label: '全部', value: 'all' },
      { label: '服饰', value: 'clothing' },
      { label: '电子', value: 'electronics' },
      { label: '纪念品', value: 'souvenirs' },
      { label: '数字商品', value: 'digital' }
    ];
    
    const sortOptions = [
      { label: '最新', value: 'newest' },
      { label: '价格↑', value: 'price_asc' },
      { label: '价格↓', value: 'price_desc' },
      { label: '热门', value: 'popular' }
    ];
    
    const totalPages = computed(() => {
      return Math.ceil(totalProducts.value / limit);
    });
    
    // 获取商品列表
    const fetchProducts = async () => {
      loading.value = true;
      
      try {
        // 构建查询参数
        const params = {
          page: currentPage.value,
          limit: limit,
          sort: activeSort.value
        };
        
        // 添加类别过滤
        if (activeCategory.value !== 'all') {
          params.category = activeCategory.value;
        }
        
        const telegramId = webApp.initDataUnsafe?.user?.id;
        const headers = telegramId ? { 'x-telegram-id': telegramId } : {};
        
        const response = await axios.get('/api/v1/products', { 
          params,
          headers
        });
        
        const { data } = response.data;
        products.value = data.products;
        totalProducts.value = data.total;
      } catch (error) {
        console.error('获取商品列表失败:', error);
        webApp.showAlert('获取商品列表失败，请稍后再试');
      } finally {
        loading.value = false;
      }
    };
    
    const navigateToProduct = (productId) => {
      router.push(`/product/${productId}`);
    };
    
    const changeCategory = (category) => {
      if (activeCategory.value === category) return;
      activeCategory.value = category;
      currentPage.value = 1;
      fetchProducts();
    };
    
    const changeSort = (sort) => {
      if (activeSort.value === sort) return;
      activeSort.value = sort;
      currentPage.value = 1;
      fetchProducts();
    };
    
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      currentPage.value = page;
      fetchProducts();
    };
    
    onMounted(() => {
      fetchProducts();
    });
    
    return {
      loading,
      products,
      currentPage,
      totalPages,
      activeCategory,
      activeSort,
      categories,
      sortOptions,
      changeCategory,
      changeSort,
      changePage,
      navigateToProduct
    };
  }
}
</script>
```

### 5.2 商品卡片组件

```vue
<template>
  <div class="product-card" @click="$emit('click')">
    <div class="product-thumbnail">
      <img :src="product.thumbnail_url || defaultImage" :alt="product.name">
      <span v-if="isDiscounted" class="discount-tag">-{{ product.discount_percentage }}%</span>
    </div>
    
    <div class="product-content">
      <h3 class="product-name">{{ product.name }}</h3>
      
      <div class="product-price">
        <span class="current-price">{{ product.price }} 星</span>
        <span v-if="isDiscounted" class="original-price">{{ product.original_price }} 星</span>
      </div>
      
      <div class="product-meta">
        <span class="product-sales">已售 {{ product.sold_count }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  emits: ['click'],
  setup(props) {
    const defaultImage = '/assets/default-product.jpg';
    
    const isDiscounted = computed(() => {
      return props.product.original_price && props.product.original_price > props.product.price;
    });
    
    return {
      defaultImage,
      isDiscounted
    };
  }
}
</script>
```

### 5.3 商品详情组件

```vue
<template>
  <div class="product-detail-container">
    <div v-if="loading" class="loading-container">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!product" class="error-state">
      <p>商品不存在或已下架</p>
      <button class="back-button" @click="goBack">返回商品列表</button>
    </div>
    
    <div v-else class="product-detail">
      <!-- 商品图片轮播 -->
      <div class="product-gallery">
        <div class="main-image">
          <img :src="selectedImage" :alt="product.name">
        </div>
        
        <div class="image-thumbnails" v-if="product.images && product.images.length > 1">
          <div 
            v-for="image in product.images" 
            :key="image.id"
            :class="['thumbnail', { active: image.url === selectedImage }]"
            @click="selectedImage = image.url"
          >
            <img :src="image.url" :alt="product.name">
          </div>
        </div>
      </div>
      
      <!-- 商品信息 -->
      <div class="product-info">
        <h1 class="product-name">{{ product.name }}</h1>
        
        <div class="product-price-container">
          <div class="price-section">
            <span class="current-price">{{ product.price }} 星</span>
            <span v-if="isDiscounted" class="original-price">{{ product.original_price }} 星</span>
            <span v-if="isDiscounted" class="discount-tag">{{ product.discount_percentage }}% 优惠</span>
          </div>
          
          <div class="sales-section">
            <span>已售 {{ product.sold_count }}</span>
            <span>库存 {{ product.inventory_count }}</span>
          </div>
        </div>
        
        <!-- 商品规格选择 -->
        <div class="product-specs" v-if="product.specifications && product.specifications.length > 0">
          <div 
            v-for="spec in product.specifications" 
            :key="spec.spec_name"
            class="spec-group"
          >
            <div class="spec-name">{{ spec.spec_name }}</div>
            <div class="spec-options">
              <button 
                v-for="option in spec.options" 
                :key="`${spec.spec_name}-${option}`"
                :class="['spec-option', { active: selectedSpecs[spec.spec_name] === option }]"
                @click="selectSpec(spec.spec_name, option)"
              >
                {{ option }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- 数量选择 -->
        <div class="quantity-selector">
          <span class="quantity-label">数量</span>
          <div class="quantity-controls">
            <button 
              class="quantity-btn" 
              @click="decreaseQuantity"
              :disabled="quantity <= 1"
            >
              -
            </button>
            <input 
              type="number" 
              v-model.number="quantity" 
              min="1" 
              :max="product.inventory_count"
              class="quantity-input"
            >
            <button 
              class="quantity-btn" 
              @click="increaseQuantity"
              :disabled="quantity >= product.inventory_count"
            >
              +
            </button>
          </div>
          <span class="inventory-info">库存: {{ product.inventory_count }}</span>
        </div>
        
        <!-- 购买按钮 -->
        <div class="purchase-actions">
          <button 
            class="add-to-cart-btn" 
            @click="addToCart"
            :disabled="isAddingToCart || !isValidSelection"
          >
            {{ isAddingToCart ? '添加中...' : '加入购物车' }}
          </button>
          
          <button 
            class="buy-now-btn" 
            @click="buyNow"
            :disabled="isAddingToCart || !isValidSelection"
          >
            立即购买
          </button>
        </div>
      </div>
      
      <!-- 商品详情 -->
      <div class="product-description">
        <h2>商品详情</h2>
        <div class="description-content">
          {{ product.description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { webApp } from '@twa-dev/sdk';
import axios from 'axios';

export default {
  name: 'ProductDetail',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const product = ref(null);
    const selectedImage = ref('');
    const selectedSpecs = ref({});
    const quantity = ref(1);
    const isAddingToCart = ref(false);
    
    const productId = computed(() => route.params.id);
    
    const isDiscounted = computed(() => {
      return product.value?.original_price && product.value.original_price > product.value.price;
    });
    
    const isValidSelection = computed(() => {
      // 如果产品有规格选项，检查是否都已选择
      if (product.value?.specifications && product.value.specifications.length > 0) {
        return product.value.specifications.every(spec => 
          selectedSpecs.value[spec.spec_name] !== undefined
        );
      }
      return true;
    });
    
    // 获取商品详情
    const fetchProductDetail = async () => {
      loading.value = true;
      
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        const headers = telegramId ? { 'x-telegram-id': telegramId } : {};
        
        const response = await axios.get(`/api/v1/products/${productId.value}`, { headers });
        
        product.value = response.data.data;
        
        // 设置默认选中图片
        if (product.value.images && product.value.images.length > 0) {
          const primaryImage = product.value.images.find(img => img.is_primary);
          selectedImage.value = primaryImage ? primaryImage.url : product.value.images[0].url;
        }
      } catch (error) {
        console.error('获取商品详情失败:', error);
        product.value = null;
      } finally {
        loading.value = false;
      }
    };
    
    // 选择规格
    const selectSpec = (specName, option) => {
      selectedSpecs.value[specName] = option;
    };
    
    // 增加数量
    const increaseQuantity = () => {
      if (quantity.value < product.value.inventory_count) {
        quantity.value++;
      }
    };
    
    // 减少数量
    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--;
      }
    };
    
    // 添加到购物车
    const addToCart = async () => {
      const telegramId = webApp.initDataUnsafe?.user?.id;
      if (!telegramId) {
        webApp.showAlert('请登录后再添加商品到购物车');
        return;
      }
      
      if (!isValidSelection.value) {
        webApp.showAlert('请选择商品规格');
        return;
      }
      
      isAddingToCart.value = true;
      
      try {
        const response = await axios.post('/api/v1/cart/items', {
          product_id: productId.value,
          quantity: quantity.value,
          selected_specs: Object.keys(selectedSpecs.value).length > 0 ? selectedSpecs.value : null
        }, {
          headers: { 'x-telegram-id': telegramId }
        });
        
        webApp.showPopup({
          title: '添加成功',
          message: '商品已添加到购物车',
          buttons: [
            { id: 'view_cart', type: 'default', text: '查看购物车' },
            { id: 'continue', type: 'cancel', text: '继续购物' }
          ]
        }, (buttonId) => {
          if (buttonId === 'view_cart') {
            router.push('/cart');
          }
        });
      } catch (error) {
        console.error('添加到购物车失败:', error);
        webApp.showAlert(error.response?.data?.message || '添加到购物车失败，请稍后再试');
      } finally {
        isAddingToCart.value = false;
      }
    };
    
    // 立即购买
    const buyNow = async () => {
      const telegramId = webApp.initDataUnsafe?.user?.id;
      if (!telegramId) {
        webApp.showAlert('请登录后再购买商品');
        return;
      }
      
      if (!isValidSelection.value) {
        webApp.showAlert('请选择商品规格');
        return;
      }
      
      // 直接跳转到结算页，带上商品信息
      router.push({
        path: '/checkout',
        query: {
          direct: 'true'
        },
        state: {
          directPurchase: {
            product_id: productId.value,
            quantity: quantity.value,
            selected_specs: selectedSpecs.value
          }
        }
      });
    };
    
    const goBack = () => {
      router.push('/products');
    };
    
    onMounted(() => {
      fetchProductDetail();
    });
    
    // 当路由参数变化时重新获取商品详情
    watch(() => route.params.id, (newId, oldId) => {
      if (newId !== oldId) {
        fetchProductDetail();
      }
    });
    
    return {
      loading,
      product,
      selectedImage,
      selectedSpecs,
      quantity,
      isAddingToCart,
      isDiscounted,
      isValidSelection,
      selectSpec,
      increaseQuantity,
      decreaseQuantity,
      addToCart,
      buyNow,
      goBack
    };
  }
}
</script>
```

### 5.4 购物车组件

```vue
<template>
  <div class="cart-container">
    <h1 class="cart-title">购物车</h1>
    
    <div v-if="loading" class="loading-container">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="cartItems.length === 0" class="empty-cart">
      <div class="empty-icon">🛒</div>
      <p>购物车还是空的</p>
      <button class="go-shopping-btn" @click="goToProductList">去购物</button>
    </div>
    
    <div v-else class="cart-content">
      <!-- 购物车商品列表 -->
      <div class="cart-items">
        <div 
          v-for="item in cartItems" 
          :key="item.cart_id"
          :class="['cart-item', { 'item-unavailable': item.status !== 'active' }]"
        >
          <div class="item-thumbnail">
            <img :src="item.thumbnail_url || defaultImage" :alt="item.product_name">
          </div>
          
          <div class="item-info">
            <h3 class="item-name">{{ item.product_name }}</h3>
            
            <div v-if="item.selected_specs" class="item-specs">
              <span 
                v-for="(value, key) in item.selected_specs" 
                :key="key"
                class="spec-tag"
              >
                {{ key }}: {{ value }}
              </span>
            </div>
            
            <div class="item-price">{{ item.price }} 星</div>
            
            <div v-if="item.status !== 'active'" class="item-status">
              {{ getStatusText(item.status) }}
            </div>
          </div>
          
          <div class="item-quantity">
            <div v-if="item.status === 'active'" class="quantity-controls">
              <button 
                class="quantity-btn" 
                @click="updateItemQuantity(item, item.quantity - 1)"
                :disabled="item.quantity <= 1 || updatingItemId === item.cart_id"
              >
                -
              </button>
              <input 
                type="number" 
                v-model.number="item.quantity" 
                min="1" 
                class="quantity-input"
                @change="updateItemQuantity(item, item.quantity)"
                :disabled="updatingItemId === item.cart_id"
              >
              <button 
                class="quantity-btn" 
                @click="updateItemQuantity(item, item.quantity + 1)"
                :disabled="updatingItemId === item.cart_id"
              >
                +
              </button>
            </div>
            <div v-else class="quantity-text">
              数量: {{ item.quantity }}
            </div>
          </div>
          
          <div class="item-total">
            <div class="total-price">{{ item.total_price }} 星</div>
            <button 
              class="remove-btn" 
              @click="removeItem(item)"
              :disabled="removingItemId === item.cart_id"
            >
              删除
            </button>
          </div>
        </div>
      </div>
      
      <!-- 购物车结算 -->
      <div class="cart-summary">
        <div class="summary-row">
          <span>商品总数:</span>
          <span>{{ cartInfo.total_items }} 件</span>
        </div>
        <div class="summary-row total">
          <span>合计:</span>
          <span>{{ cartInfo.total_price }} 星</span>
        </div>
        
        <button 
          class="checkout-btn" 
          @click="checkout"
          :disabled="!hasActiveItems || isCheckingOut"
        >
          {{ isCheckingOut ? '结算中...' : '结算' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { webApp } from '@twa-dev/sdk';
import axios from 'axios';

export default {
  name: 'ShoppingCart',
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const cartItems = ref([]);
    const cartInfo = ref({ total_items: 0, total_price: 0 });
    const updatingItemId = ref(null);
    const removingItemId = ref(null);
    const isCheckingOut = ref(false);
    const defaultImage = '/assets/default-product.jpg';
    
    const hasActiveItems = computed(() => {
      return cartItems.value.some(item => item.status === 'active');
    });
    
    // 获取购物车列表
    const fetchCartItems = async () => {
      loading.value = true;
      
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        if (!telegramId) {
          throw new Error('未登录');
        }
        
        const response = await axios.get('/api/v1/cart/items', {
          headers: { 'x-telegram-id': telegramId }
        });
        
        cartItems.value = response.data.data.items;
        cartInfo.value = {
          total_items: response.data.data.total_items,
          total_price: response.data.data.total_price
        };
      } catch (error) {
        console.error('获取购物车失败:', error);
        if (error.message === '未登录') {
          webApp.showAlert('请登录后查看购物车');
        } else {
          webApp.showAlert('获取购物车失败，请稍后再试');
        }
      } finally {
        loading.value = false;
      }
    };
    
    // 更新商品数量
    const updateItemQuantity = async (item, newQuantity) => {
      if (newQuantity < 1 || updatingItemId.value) return;
      
      updatingItemId.value = item.cart_id;
      
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        
        const response = await axios.put(`/api/v1/cart/items/${item.cart_id}`, {
          quantity: newQuantity
        }, {
          headers: { 'x-telegram-id': telegramId }
        });
        
        // 更新本地数据
        const index = cartItems.value.findIndex(i => i.cart_id === item.cart_id);
        if (index !== -1) {
          cartItems.value[index].quantity = newQuantity;
          cartItems.value[index].total_price = response.data.data.total_price;
          
          // 重新计算总价
          recalculateTotal();
        }
      } catch (error) {
        console.error('更新购物车失败:', error);
        webApp.showAlert(error.response?.data?.message || '更新购物车失败，请稍后再试');
        
        // 还原数量
        item.quantity = item.quantity;
      } finally {
        updatingItemId.value = null;
      }
    };
    
    // 删除商品
    const removeItem = async (item) => {
      if (removingItemId.value) return;
      
      webApp.showConfirm('确定要从购物车中移除此商品吗？', (confirmed) => {
        if (confirmed) {
          doRemoveItem(item);
        }
      });
    };
    
    const doRemoveItem = async (item) => {
      removingItemId.value = item.cart_id;
      
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        
        await axios.delete(`/api/v1/cart/items/${item.cart_id}`, {
          headers: { 'x-telegram-id': telegramId }
        });
        
        // 更新本地数据
        cartItems.value = cartItems.value.filter(i => i.cart_id !== item.cart_id);
        
        // 重新计算总价
        recalculateTotal();
      } catch (error) {
        console.error('删除购物车商品失败:', error);
        webApp.showAlert('删除购物车商品失败，请稍后再试');
      } finally {
        removingItemId.value = null;
      }
    };
    
    // 重新计算总价
    const recalculateTotal = () => {
      const activeItems = cartItems.value.filter(item => item.status === 'active');
      
      cartInfo.value = {
        total_items: cartItems.value.length,
        total_price: activeItems.reduce((sum, item) => sum + item.total_price, 0)
      };
    };
    
    // 结算
    const checkout = () => {
      router.push('/checkout');
    };
    
    const goToProductList = () => {
      router.push('/products');
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 'inactive':
          return '商品已下架';
        case 'insufficient_inventory':
          return '库存不足';
        case 'unavailable':
          return '商品不可用';
        default:
          return '';
      }
    };
    
    onMounted(() => {
      fetchCartItems();
    });
    
    return {
      loading,
      cartItems,
      cartInfo,
      updatingItemId,
      removingItemId,
      isCheckingOut,
      hasActiveItems,
      defaultImage,
      updateItemQuantity,
      removeItem,
      checkout,
      goToProductList,
      getStatusText
    };
  }
}
</script>
```

---

## 6. 安全与性能考量

### 6.1 商品库存并发控制

为防止超卖问题，库存管理需要实现乐观锁或悲观锁机制：

```sql
-- 使用乐观锁更新库存
UPDATE products
SET inventory_count = inventory_count - :quantity,
    version = version + 1
WHERE id = :product_id AND version = :current_version AND inventory_count >= :quantity
```

对于高并发场景，可使用Redis实现库存预占机制：

```javascript
// 库存预占示例
async function preoccupyInventory(productId, quantity, userId) {
  const lockKey = `inventory_lock:${productId}`;
  const preoccupyKey = `preoccupy:${productId}:${userId}`;
  
  try {
    // 获取分布式锁
    const locked = await redisClient.set(lockKey, '1', 'NX', 'PX', 5000);
    if (!locked) {
      throw new Error('无法获取库存锁');
    }
    
    // 检查当前库存
    const currentInventory = await redisClient.get(`inventory:${productId}`);
    
    if (!currentInventory || parseInt(currentInventory) < quantity) {
      throw new Error('库存不足');
    }
    
    // 预占库存(15分钟有效期)
    await redisClient.setex(preoccupyKey, 15 * 60, quantity.toString());
    
    // 减少可用库存
    await redisClient.decrby(`inventory:${productId}`, quantity);
    
    return true;
  } finally {
    // 释放锁
    await redisClient.del(lockKey);
  }
}
```

### 6.2 API安全防护

1. **支付请求验证**:
   - 使用HMAC签名验证所有支付请求的真实性
   - 实现幂等性设计，防止重复支付

```javascript
// 支付请求签名验证
function verifyPaymentRequest(payload, signature, secret) {
  const calculatedSignature = createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return calculatedSignature === signature;
}
```

2. **交易防重放**:
   - 使用唯一的请求ID
   - 设置请求时效性

```javascript
// 防重放验证
async function verifyNonceAndTimestamp(nonce, timestamp) {
  // 检查时间戳是否在允许的时间窗口内(例如30秒)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 30) {
    return false;
  }
  
  // 检查nonce是否已使用(使用Redis存储已用nonce)
  const exists = await redisClient.exists(`used_nonce:${nonce}`);
  if (exists) {
    return false;
  }
  
  // 记录nonce(有效期设为时间窗口的两倍)
  await redisClient.setex(`used_nonce:${nonce}`, 60, '1');
  
  return true;
}
```

### 6.3 性能优化策略

1. **商品列表缓存**:
   - 使用Redis缓存热门商品列表(5分钟TTL)
   - 实现多级缓存策略(内存->Redis->数据库)

```javascript
// 获取商品列表的缓存实现
async function getCachedProductList(category, sort, page, limit) {
  const cacheKey = `products:${category}:${sort}:${page}:${limit}`;
  
  // 尝试从缓存获取
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 从数据库获取
  const products = await productRepository.findAll({
    category,
    sort,
    page,
    limit
  });
  
  // 缓存结果(5分钟)
  await redisClient.setex(cacheKey, 300, JSON.stringify(products));
  
  return products;
}
```

2. **商品详情数据预热**:
   - 定时预热热门商品的缓存
   - 使用流水线(pipeline)批量获取关联数据

---

## 7. 测试策略

### 7.1 单元测试

商品服务的单元测试示例:

```javascript
describe('ProductService', () => {
  // 模拟依赖
  const mockProductRepo = {
    findAll: jest.fn(),
    findById: jest.fn()
  };
  const mockImageRepo = {
    findByProductId: jest.fn()
  };
  const mockSpecRepo = {
    findByProductId: jest.fn(),
    findProductsWithSpecs: jest.fn(),
    getInventory: jest.fn()
  };
  
  const productService = new ProductService(
    mockProductRepo,
    mockImageRepo,
    mockSpecRepo
  );
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('getProductsList should return formatted products', async () => {
    // 设置模拟返回值
    mockProductRepo.findAll.mockResolvedValue({
      products: [
        { id: 1, name: '测试商品', price: 50 }
      ],
      total: 1
    });
    mockSpecRepo.findProductsWithSpecs.mockResolvedValue([1]);
    
    // 执行测试
    const result = await productService.getProductsList({
      category: 'clothing',
      sort: 'newest',
      page: 1,
      limit: 10
    });
    
    // 验证结果
    expect(result.products.length).toBe(1);
    expect(result.products[0].has_specs).toBe(true);
    expect(mockProductRepo.findAll).toHaveBeenCalledWith({
      filters: { status: 'active', category: 'clothing' },
      order: { created_at: 'DESC' },
      page: 1,
      limit: 10
    });
  });
  
  test('getProductDetail should return complete product info', async () => {
    // 模拟实现...
  });
  
  test('checkInventory should verify available stock', async () => {
    // 模拟实现...
  });
});
```

### 7.2 API集成测试

```javascript
const request = require('supertest');
const app = require('../src/app');
const { setupTestDatabase, cleanupTestDatabase } = require('./helpers/database');

describe('商品API集成测试', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  test('GET /api/v1/products - 获取商品列表', async () => {
    const response = await request(app)
      .get('/api/v1/products')
      .query({ category: 'clothing', sort: 'newest', page: 1, limit: 10 });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('products');
    expect(Array.isArray(response.body.data.products)).toBe(true);
  });
  
  test('GET /api/v1/products/:id - 获取商品详情', async () => {
    // 实现测试...
  });
  
  test('POST /api/v1/cart/items - 添加商品到购物车', async () => {
    // 实现测试...
  });
});
```

### 7.3 前端组件测试

```javascript
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../src/components/ProductCard.vue';

describe('ProductCard.vue', () => {
  it('正确显示商品信息', () => {
    const product = {
      id: 1,
      name: '测试商品',
      price: 50.00,
      thumbnail_url: '/test.jpg',
      sold_count: 10
    };
    
    const wrapper = mount(ProductCard, {
      props: { product }
    });
    
    expect(wrapper.text()).toContain('测试商品');
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('已售 10');
    expect(wrapper.find('img').attributes('src')).toBe('/test.jpg');
  });
  
  it('显示折扣标签和原价', () => {
    const product = {
      id: 1,
      name: '测试商品',
      price: 50.00,
      original_price: 100.00,
      discount_percentage: 50,
      thumbnail_url: '/test.jpg',
      sold_count: 10
    };
    
    const wrapper = mount(ProductCard, {
      props: { product }
    });
    
    expect(wrapper.text()).toContain('100');
    expect(wrapper.find('.discount-tag').text()).toContain('-50%');
  });
});
```

---

## 8. 部署与监控

### 8.1 关键监控指标

1. **商品系统健康指标**:
   - 商品浏览量(每日/每小时)
   - 商品转化率(浏览->加购->下单)
   - 库存告警(低于阈值的商品数量)

2. **订单系统指标**:
   - 订单创建速率
   - 支付完成率
   - 订单处理时间
   - 异常订单比例

### 8.2 系统告警设置

```javascript
// 低库存告警示例
async function checkLowInventoryAlert() {
  // 获取所有库存低于阈值的商品
  const lowInventoryProducts = await productRepository.findLowInventory(10); // 低于10个库存告警
  
  if (lowInventoryProducts.length > 0) {
    // 发送告警通知
    await notificationService.sendLowInventoryAlert(lowInventoryProducts);
    
    // 记录告警日志
    logger.warn('低库存告警', { products: lowInventoryProducts.map(p => p.id) });
  }
}
```

---

## 9. 迭代计划

### 9.1 第一阶段(当前阶段)

- 基础商品展示功能
- 购物车基本功能
- 下单与支付流程(仅支持帝国之星)

### 9.2 第二阶段

- 商品评价与评分系统
- 多规格库存管理优化
- 订单状态推送通知

### 9.3 第三阶段

- 商品推荐算法
- 优惠券系统
- 商品分组与标签体系优化
- 支付方式多样化

---

*文档结束*
