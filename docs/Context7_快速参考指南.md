# Context7 MCP 快速参考指南

## 🚀 快速开始

### 基本查询语法
```
# 基础查询
你的问题描述。use context7

# 指定主题
你的问题描述。use context7 topic: 主题关键词

# 指定库
你的问题描述。use library /库名/项目名
```

## 📋 常用查询速查表

### 🔧 后端开发
| 问题类型 | 查询示例 | 相关文件 |
|---------|---------|---------|
| API路由 | `如何添加新的API端点？use context7` | `backend/src/routes/` |
| 数据库 | `如何设计用户表结构？use context7` | `backend/src/models/` |
| 中间件 | `如何实现认证中间件？use context7` | `backend/src/middleware/` |
| Bot处理 | `如何处理Telegram命令？use context7` | `backend/src/services/botHandler.js` |

### 🎨 前端开发
| 问题类型 | 查询示例 | 相关文件 |
|---------|---------|---------|
| Vue组件 | `如何创建Vue组件？use context7` | `frontend/src/components/` |
| 页面开发 | `如何开发Mini App页面？use context7` | `frontend/public/` |
| 状态管理 | `如何管理应用状态？use context7` | `frontend/src/utils/` |
| 构建配置 | `如何配置Vite构建？use context7` | `frontend/vite.config.js` |

### 🚀 部署运维
| 问题类型 | 查询示例 | 相关文件 |
|---------|---------|---------|
| Docker | `如何容器化部署？use context7` | `docker-compose.yml` |
| 脚本 | `如何启动项目？use context7` | `scripts/start_mvp_001.sh` |
| 内网穿透 | `如何配置Cpolar？use context7` | `docs/安装与配置指南.md` |
| 监控 | `如何监控服务状态？use context7` | `scripts/monitor_*.sh` |

### 🧪 测试调试
| 问题类型 | 查询示例 | 相关文件 |
|---------|---------|---------|
| 单元测试 | `如何编写单元测试？use context7` | `backend/tests/` |
| 集成测试 | `如何测试API接口？use context7` | `backend/tests/integration/` |
| 性能测试 | `如何进行性能测试？use context7` | `backend/tests/performance/` |
| 调试技巧 | `如何调试应用问题？use context7` | `logs/` |

## 🎯 场景化查询模板

### 新功能开发
```
# 1. 需求理解
我需要实现[功能描述]，请提供技术方案。use context7

# 2. 数据库设计
如何为[功能名称]设计数据库表结构？use context7 topic: database-design

# 3. API开发
如何实现[功能名称]的RESTful API？use context7 topic: api-development

# 4. 前端集成
如何在前端集成[功能名称]？use context7 topic: frontend-integration
```

### 问题排查
```
# 1. 错误分析
遇到[错误信息]，如何排查和解决？use context7 topic: troubleshooting

# 2. 性能问题
[功能模块]响应慢，如何优化？use context7 topic: performance-optimization

# 3. 配置问题
[服务名称]配置不正确，如何修复？use context7 topic: configuration

# 4. 部署问题
部署时遇到[问题描述]，如何解决？use context7 topic: deployment
```

### 代码重构
```
# 1. 架构优化
如何重构[模块名称]的架构？use context7 topic: refactoring architecture

# 2. 性能优化
如何优化[功能模块]的性能？use context7 topic: performance-tuning

# 3. 代码规范
如何改进代码质量和规范？use context7 topic: code-quality

# 4. 测试覆盖
如何提高测试覆盖率？use context7 topic: testing-coverage
```

## 🔍 高级查询技巧

### 1. 多主题组合
```
实现用户认证和权限管理系统。use context7 topic: authentication authorization jwt middleware
```

### 2. 特定技术栈
```
使用Express.js和PostgreSQL实现用户管理API。use library /expressjs/express /brianc/node-postgres
```

### 3. 问题上下文
```
在TG Empire项目中，如何实现Telegram Bot的webhook处理和消息路由？use context7
```

### 4. 代码示例请求
```
提供完整的Express.js中间件代码示例，包括错误处理。use context7 topic: middleware examples error-handling
```

## 📚 项目特定查询

### TG Empire核心功能
```
# 用户系统
如何实现Telegram用户自动注册和资料管理？use context7

# 签到系统
如何开发每日签到功能和连续签到奖励？use context7

# 声望系统
如何设计和实现用户声望点数系统？use context7

# Bot交互
如何处理Telegram Bot的命令和回调？use context7
```

### 技术架构查询
```
# 系统架构
TG Empire的整体系统架构是什么？use context7

# 数据流
用户数据在系统中如何流转？use context7

# 安全设计
系统的安全机制如何实现？use context7

# 扩展性
如何设计可扩展的系统架构？use context7
```

## ⚡ 效率提升技巧

### 1. 预设查询模板
将常用查询保存为模板，快速复用：
```
# 保存为代码片段
snippet: api-dev
如何在TG Empire中开发新的API端点？use context7 topic: api-development express routing
```

### 2. 渐进式查询
从宽泛到具体，逐步细化：
```
# 第一步：概览
TG Empire项目的技术栈和架构。use context7

# 第二步：具体模块
用户管理模块的实现细节。use context7

# 第三步：代码实现
用户注册API的具体代码实现。use context7
```

### 3. 关联查询
查询相关联的功能模块：
```
# 主功能
如何实现用户签到功能？use context7

# 关联功能
签到功能相关的数据库设计和缓存策略。use context7
```

## 🎨 查询优化建议

### ✅ 好的查询方式
- 明确具体的问题和需求
- 包含项目上下文信息
- 指定相关的技术栈
- 使用准确的技术术语

### ❌ 避免的查询方式
- 过于宽泛的问题
- 缺乏上下文的查询
- 不指定技术栈版本
- 使用模糊的描述

## 🔧 故障排除

### 常见问题
1. **查询无结果**：检查关键词是否准确
2. **结果不相关**：添加更多上下文信息
3. **响应慢**：简化查询条件
4. **连接失败**：检查MCP服务器状态

### 解决方案
```bash
# 检查Context7服务状态
npx @upstash/context7-mcp --help

# 重新安装
npm install -g @upstash/context7-mcp

# 测试连接
npx @upstash/context7-mcp --transport stdio
```

---

*快速参考指南 - 2025-07-08*
