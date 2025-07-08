# Context7 MCP 代码文档库索引手册

## 📚 概述

本手册详细说明了如何使用Context7 MCP为TG Empire项目建立代码文档索引，以及在不同问题场景下应该查询哪些文档和代码。

## 🛠️ Context7 MCP 安装配置

### 安装
```bash
# 全局安装Context7 MCP
npm install -g @upstash/context7-mcp

# 或使用npx运行
npx -y @upstash/context7-mcp
```

### 配置示例 (Cursor)
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## 📂 项目结构索引

### 核心目录结构
```
tg-empire/
├── backend/                 # 后端API服务
│   ├── src/
│   │   ├── app.js          # Express应用主文件
│   │   ├── server.js       # 服务器入口
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试文件
│   └── package.json        # 依赖配置
├── frontend/               # 前端Vue应用
│   ├── src/
│   │   ├── apps/          # Mini App应用
│   │   ├── components/    # Vue组件
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态文件
│   └── package.json       # 依赖配置
├── admin/                  # 供应商后台
├── docs/                   # 项目文档
│   ├── prd/               # 产品需求文档
│   ├── tdd/               # 技术设计文档
│   ├── 安装与配置指南.md
│   ├── 项目说明.md
│   └── MVP_开发指南.md
├── scripts/               # 部署脚本
├── config/                # 配置文件
└── docker-compose.yml     # 容器编排
```

## 🔍 问题类型与索引策略

### 1. 架构和设计问题
**查询文档：**
- `docs/项目说明.md` - 系统架构概述
- `docs/MVP_开发指南.md` - 技术栈和项目结构
- `docs/MVP任务分解计划.md` - 开发任务规划
- `README.md` - 项目概览

**使用Context7：**
```
解释TG Empire项目的整体架构设计。use context7
```

### 2. 后端API开发问题
**查询文档：**
- `backend/src/app.js` - Express应用配置
- `backend/src/routes/` - API路由定义
- `backend/src/controllers/` - 控制器逻辑
- `backend/src/services/` - 业务服务
- `backend/src/models/` - 数据模型

**使用Context7：**
```
如何在TG Empire后端添加新的API端点？use context7
```

### 3. Telegram Bot开发问题
**查询文档：**
- `backend/src/services/botHandler.js` - Bot处理逻辑
- `backend/src/app.js` - Webhook配置
- `docs/安装与配置指南.md` - Bot配置说明

**使用Context7：**
```
如何配置Telegram Bot的webhook和命令处理？use context7
```

### 4. 前端开发问题
**查询文档：**
- `frontend/src/` - Vue组件和应用
- `frontend/public/profile.html` - 静态页面
- `frontend/vite.config.js` - 构建配置
- `frontend/package.json` - 依赖配置

**使用Context7：**
```
如何在TG Empire前端创建新的Vue组件？use context7
```

### 5. 数据库和存储问题
**查询文档：**
- `backend/src/models/` - 数据模型定义
- `backend/src/config/database.js` - 数据库配置
- `scripts/init_database.sql` - 数据库初始化
- `docker-compose.yml` - 数据库容器配置

**使用Context7：**
```
如何在TG Empire中设计新的数据库表结构？use context7
```

### 6. 部署和运维问题
**查询文档：**
- `docs/安装与配置指南.md` - 完整部署指南
- `scripts/start_mvp_001.sh` - 启动脚本
- `scripts/deploy_mvp_002.sh` - 部署脚本
- `docker-compose.yml` - 容器配置

**使用Context7：**
```
如何部署TG Empire项目到生产环境？use context7
```

### 7. 内网穿透和网络配置问题
**查询文档：**
- `docs/安装与配置指南.md` - Cpolar配置详解
- `docs/项目说明.md` - 网络架构说明
- `docs/开发流程记录.md` - 内网穿透实践

**使用Context7：**
```
如何配置Cpolar内网穿透服务？use context7
```

### 8. 测试相关问题
**查询文档：**
- `backend/tests/` - 测试文件
- `backend/run-tests.sh` - 测试脚本
- `backend/tests/README.md` - 测试指南

**使用Context7：**
```
如何为TG Empire编写和运行测试？use context7
```

## 🎯 Context7使用最佳实践

### 1. 精确查询
使用具体的库ID进行查询：
```
实现Telegram Bot的webhook处理。use library /telegraf/telegraf for api and docs
```

### 2. 主题聚焦
指定特定主题：
```
配置Express.js的中间件和路由。use context7 topic: middleware routing
```

### 3. 组合查询
结合多个相关文档：
```
设置PostgreSQL数据库连接和Redis缓存。use context7
```

## 📋 常用查询模板

### 后端开发
```
# API开发
如何在Express.js中创建RESTful API端点？use context7

# 数据库操作
如何使用pg库连接PostgreSQL数据库？use context7

# 中间件开发
如何创建Express.js认证中间件？use context7
```

### 前端开发
```
# Vue组件
如何创建Vue 3组合式API组件？use context7

# Telegram WebApp
如何集成Telegram WebApp SDK？use context7

# 状态管理
如何使用Pinia进行状态管理？use context7
```

### DevOps
```
# 容器化
如何使用Docker Compose部署多服务应用？use context7

# 反向代理
如何配置Nginx作为反向代理？use context7

# 进程管理
如何使用PM2管理Node.js应用？use context7
```

## 🔧 索引配置建议

### 包含的文件类型
- `.js` - JavaScript源码
- `.vue` - Vue组件
- `.json` - 配置文件
- `.md` - 文档文件
- `.sql` - 数据库脚本
- `.sh` - Shell脚本
- `.yml/.yaml` - Docker配置

### 排除的目录
- `node_modules/` - 依赖包
- `.git/` - Git版本控制
- `logs/` - 日志文件
- `uploads/` - 上传文件
- `dist/` - 构建输出

### 索引深度
- 源码目录：完全索引
- 文档目录：完全索引
- 配置文件：重点索引
- 脚本文件：选择性索引

## 📞 技术支持

如果在使用Context7 MCP过程中遇到问题：

1. 查看Context7官方文档：https://github.com/upstash/context7
2. 检查MCP服务器连接状态
3. 验证查询语法是否正确
4. 确认项目文件路径是否正确

## 🚀 高级使用场景

### 9. 性能优化问题
**查询文档：**
- `backend/src/services/` - 业务逻辑优化
- `backend/tests/performance/` - 性能测试
- `docs/测试报告-MVP-001.md` - 性能分析

**使用Context7：**
```
如何优化TG Empire的API响应时间和数据库查询性能？use context7
```

### 10. 安全和认证问题
**查询文档：**
- `backend/src/middleware/auth.js` - 认证中间件
- `backend/src/middleware/adminAuth.js` - 管理员认证
- `backend/src/controllers/userController.js` - 用户控制器

**使用Context7：**
```
如何实现Telegram用户身份验证和JWT token管理？use context7
```

### 11. 错误处理和日志问题
**查询文档：**
- `backend/src/app.js` - 错误处理中间件
- `logs/` - 日志文件示例
- `scripts/` - 日志管理脚本

**使用Context7：**
```
如何在Express.js应用中实现统一的错误处理和日志记录？use context7
```

## 📊 项目特定库索引

### Telegram相关
```
# Telegraf框架
实现Telegram Bot命令处理。use library /telegraf/telegraf

# Telegram WebApp SDK
集成Telegram Mini App功能。use library /@twa-dev/sdk
```

### 后端技术栈
```
# Express.js
创建RESTful API服务。use library /expressjs/express

# PostgreSQL
数据库连接和查询。use library /brianc/node-postgres

# Redis
缓存和会话管理。use library /redis/node-redis
```

### 前端技术栈
```
# Vue 3
组合式API开发。use library /vuejs/core

# Vite
构建工具配置。use library /vitejs/vite

# Axios
HTTP客户端请求。use library /axios/axios
```

### DevOps工具
```
# Docker
容器化部署。use library /docker/docker

# PM2
进程管理。use library /unitech/pm2

# Nginx
反向代理配置。use library /nginx/nginx
```

## 🎨 查询语法技巧

### 1. 组合查询
```
# 多个相关主题
实现用户注册、登录和权限验证功能。use context7 topic: authentication authorization user-management

# 特定功能模块
开发Telegram Bot的签到和声望系统。use context7 topic: check-in reputation-system
```

### 2. 问题导向查询
```
# 具体问题解决
解决Telegram Webhook接收失败的问题。use context7 topic: webhook troubleshooting

# 功能实现指导
如何实现每日签到功能的数据库设计和API接口？use context7 topic: daily-checkin database-design
```

### 3. 代码示例查询
```
# 获取代码示例
提供Express.js中间件的完整代码示例。use context7 topic: middleware examples

# 配置文件示例
展示Docker Compose的完整配置示例。use context7 topic: docker-compose configuration
```

## 🔄 工作流程集成

### 开发流程
1. **需求分析** → 查询PRD文档
2. **技术设计** → 查询TDD文档和架构说明
3. **代码实现** → 查询相关源码和API文档
4. **测试验证** → 查询测试文件和测试指南
5. **部署上线** → 查询部署脚本和配置文档

### 问题排查流程
1. **问题描述** → 查询相关日志和错误处理
2. **原因分析** → 查询相关源码和配置
3. **解决方案** → 查询最佳实践和示例代码
4. **验证测试** → 查询测试方法和验证步骤

## 📈 索引效果监控

### 查询效果评估
- **响应速度**：Context7查询响应时间
- **结果准确性**：返回内容的相关性
- **覆盖完整性**：是否涵盖所需信息

### 优化建议
- 定期更新文档内容
- 完善代码注释
- 优化查询关键词
- 补充缺失的文档

## 🛡️ 最佳实践总结

### DO（推荐做法）
✅ 使用具体的技术栈名称进行查询
✅ 结合项目上下文描述问题
✅ 指定相关的主题和功能模块
✅ 查询前先明确问题类型

### DON'T（避免做法）
❌ 使用过于宽泛的查询词
❌ 忽略项目特定的配置和约定
❌ 不指定技术栈版本信息
❌ 查询与项目无关的通用问题

---

*最后更新：2025-07-08*
