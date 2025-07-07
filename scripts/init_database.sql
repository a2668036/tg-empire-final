-- 电报社区项目 - 数据库初始化脚本
-- 此脚本用于创建所有数据库表结构

-- 清理现有表
DROP TABLE IF EXISTS supplier_tokens CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_specifications CASCADE;
DROP TABLE IF EXISTS content_products CASCADE;
DROP TABLE IF EXISTS content_likes CASCADE;
DROP TABLE IF EXISTS user_check_ins CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 创建用户表 (PRD-MVP-001)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    reputation_points INTEGER DEFAULT 0,
    empire_stars INTEGER DEFAULT 0,
    last_check_in_date DATE,
    consecutive_check_ins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建供应商表 (PRD-MVP-005)
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

-- 创建内容表 (PRD-MVP-003)
CREATE TABLE IF NOT EXISTS contents (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 创建商品表 (PRD-MVP-004)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    images TEXT[],
    supplier_id INTEGER REFERENCES suppliers(id),
    stock_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户签到表 (PRD-MVP-002)
CREATE TABLE IF NOT EXISTS user_check_ins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    points_earned INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, check_in_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建内容点赞表 (PRD-MVP-003)
CREATE TABLE IF NOT EXISTS content_likes (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (content_id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建内容商品关联表 (PRD-MVP-003)
CREATE TABLE content_products (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES contents(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建商品规格表 (PRD-MVP-004)
CREATE TABLE product_specifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    spec_type VARCHAR(50) NOT NULL,
    spec_value VARCHAR(50) NOT NULL,
    stock_count INTEGER DEFAULT 0,
    additional_price INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单表 (PRD-MVP-004)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建订单项表 (PRD-MVP-004)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_spec_id INTEGER REFERENCES product_specifications(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建供应商令牌表 (PRD-MVP-005)
CREATE TABLE supplier_tokens (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加测试数据: 供应商
INSERT INTO suppliers (name, email, password_hash, phone, address, logo_url)
VALUES 
('潮玩前线', 'chaowanqx@example.com', '$2b$10$ILdYYUGMRGfJL0QGXrCN6ejhrA7k4tXH0iy4U6yvAm3Z8VCdBoNSu', '13800138000', '北京市朝阳区国贸CBD', 'https://placeholder.com/logo1.png'),
('数码先锋', 'digital@example.com', '$2b$10$vb8YJvpVRbtKgwUQAFwlF.4Xg/JQUFcvrHFTx.f6ihLZHCW3m1AF6', '13900139000', '广州市天河区高新技术开发区', 'https://placeholder.com/logo2.png');

-- 添加测试数据: 商品
INSERT INTO products (name, description, price, images, supplier_id, stock_count, is_active)
VALUES 
('倒钩 AJ1', '限量版 Air Jordan 1 倒钩联名款，采用优质麂皮与皮革材质...', 120, ARRAY['https://placeholder.com/aj1_1.jpg', 'https://placeholder.com/aj1_2.jpg'], 1, 50, true),
('AirPods Pro 2', '全新降噪科技，空间音频，续航提升30%，音质更加出色...', 80, ARRAY['https://placeholder.com/airpods_1.jpg', 'https://placeholder.com/airpods_2.jpg'], 2, 100, true);

-- 添加测试数据: 商品规格
INSERT INTO product_specifications (product_id, spec_type, spec_value, stock_count)
VALUES 
(1, 'size', 'US 8.5', 10),
(1, 'size', 'US 9', 15),
(1, 'size', 'US 9.5', 15),
(1, 'size', 'US 10', 10),
(2, 'color', '白色', 50),
(2, 'color', '黑色', 50);

-- 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_content_likes_content_id ON content_likes(content_id);
CREATE INDEX idx_content_likes_user_id ON content_likes(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_user_check_ins_user_id ON user_check_ins(user_id, check_in_date);

-- 添加演示数据
INSERT INTO users (telegram_id, username, first_name, last_name, reputation_points, empire_stars)
VALUES (9876543210, 'demo_user', '演示', '用户', 100, 5)
ON CONFLICT (telegram_id) DO NOTHING;

-- 输出完成信息
SELECT 'Database initialization completed successfully!' as message; 