# TG社区MVP开发指南 - 服务器版

## ✅ 服务器信息 (已确认)

- **服务器IP**: 150.109.95.231 (公网IP)
- **内网IP**: 10.3.0.13
- **用户名**: ubuntu
- **操作系统**: Ubuntu Server 24.04 LTS 64bit
- **SSH连接**: ✅ 已通过VS Code连接成功

## 🎯 MVP目标

基于用户流程文档，我们要实现一个最小可用产品，包含：
1. 用户通过Telegram登录和选择兴趣
2. 浏览和点赞内容
3. 购买商品(Telegram Stars支付)
4. 查看个人订单和声望
5. 供应商管理商品和订单

## 🛠️ 技术栈

### 后端 (单体应用)
- **语言**: Node.js 20
- **框架**: Express.js
- **数据库**: PostgreSQL (Docker容器)
- **缓存**: Redis (Docker容器)
- **消息队列**: Redis
- **文件存储**: 本地存储 + 未来扩展OSS

### 前端 (Mini Apps)
- **框架**: Vue 3 + Vite
- **样式**: Tailwind CSS
- **状态管理**: Pinia
- **HTTP客户端**: Axios

### 部署
- **容器化**: Docker Compose
- **反向代理**: Nginx
- **HTTPS**: Let's Encrypt
- **进程管理**: PM2

## 📂 项目结构

```
/root/tg-empire/
├── backend/                 # Node.js后端
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试文件
│   ├── package.json
│   └── Dockerfile
├── frontend/               # Vue3 Mini Apps
│   ├── src/
│   │   ├── apps/          # 各个Mini App
│   │   ├── components/    # 共享组件
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   ├── package.json
│   └── Dockerfile
├── admin/                  # 供应商后台
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docs/                   # 项目文档
│   ├── prd/               # 产品需求文档
│   └── tdd/               # 技术设计文档
├── config/                 # 配置文件
├── scripts/               # 部署脚本
├── uploads/               # 文件上传目录
├── docker-compose.yml      # 容器编排
├── nginx.conf             # Nginx配置
└── .env                   # 环境变量
```

## 🚀 开发任务列表

### ✅ 任务1: 环境搭建 (进行中)
- [x] SSH连接配置
- [x] 项目结构创建
- [ ] Docker环境部署
- [ ] Node.js环境配置
- [ ] 数据库初始化

### 📋 任务2: Telegram Bot配置
- [ ] Bot Token配置
- [ ] Webhook设置
- [ ] 基础消息处理

### 📋 任务3: 用户身份系统
- [ ] 用户自动注册
- [ ] Telegram OAuth
- [ ] 用户数据存储
- [ ] 兴趣标签选择

### 📋 任务4: 内容展示Mini App
- [ ] 内容列表展示
- [ ] 内容详情页面
- [ ] 点赞功能
- [ ] 基础推荐算法

### 📋 任务5: 商品展示和购买
- [ ] 商品列表和详情
- [ ] 购物车功能
- [ ] 订单创建
- [ ] Telegram Stars支付

### 📋 任务6: 个人中心Mini App
- [ ] 订单状态查看
- [ ] 声望系统
- [ ] 用户资料展示
- [ ] 每日签到

### 📋 任务7: 供应商后台
- [ ] 商品管理
- [ ] 订单管理
- [ ] 数据统计

### 📋 任务8: 测试和部署
- [ ] 功能测试
- [ ] 性能测试
- [ ] 生产环境部署

## 🔧 Telegram Bot信息

```
Bot Username: @TupianXZ_bot
Bot Token: 799873409:AAEuUvkK2I948UY0xZ5rp_VNDnPJK0RMsec
Webhook URL: https://150.109.95.231/webhook
```

## 📱 测试计划

### 用户测试流程
1. **注册测试**: 用Telegram账号测试注册流程
2. **内容测试**: 浏览内容，点赞测试
3. **购买测试**: 完整的购买流程测试
4. **管理测试**: 供应商后台功能测试

## 🎯 成功标准

MVP完成后，应该能够：
1. ✅ 用户可以通过Telegram登录并选择兴趣
2. ✅ 用户可以浏览内容并点赞
3. ✅ 用户可以浏览商品并下单
4. ✅ 用户可以查看订单状态
5. ✅ 供应商可以管理商品和订单
6. ✅ 支付流程完整可用

---

## 📞 开发协作

- **开发环境**: VS Code Remote-SSH
- **代码同步**: 直接在服务器开发
- **测试方式**: 实时部署测试
- **文档更新**: 实时更新项目文档
