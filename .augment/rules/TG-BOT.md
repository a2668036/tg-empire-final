---
type: "manual"
---

# TG Empire 开发规则 v5.0 (最终版)

## 🏗️ 核心架构规则
1. 前端：Vue 3.5.17 + Vite 7.0.2 + @twa-dev/sdk 8.0.2
2. 后端：Node.js 20 + Express.js 5.1.0 + Telegraf 4.16.3
3. 数据库：PostgreSQL 14 + Redis 6 (Docker容器)
4. 部署：Docker Compose + Cpolar + PM2 + Nginx

## 🚫 严格禁止
- 静态HTML页面 (必须使用Vue组件)
- 硬编码配置 (API地址、Token等)
- 跳过认证中间件 (x-telegram-id必需)
- 直接推送主分支 (必须Code Review)
- 非RESTful API设计 (必须/api/v1/前缀)

## 📊 质量标准
- API响应时间 ≤ 500ms
- 测试覆盖率 ≥ 80%
- 函数长度 ≤ 50行
- 文件长度 ≤ 500行
- 数据库查询 ≤ 100ms

## 🔧 技术约束
- 数据库：snake_case命名 + 外键约束 + 事务管理
- API：统一JSON响应 + 完整错误处理 + 参数验证
- 认证：x-telegram-id头 + 中间件验证
- 部署：scripts/start_mvp_001.sh标准化启动

## 📋 提交检查清单
- [ ] 代码符合命名规范
- [ ] 包含完整错误处理
- [ ] 添加相应测试
- [ ] 通过性能要求
- [ ] 更新相关文档
- [ ] 通过安全检查

## 🚨 违规处理
- 轻微违规：代码审查不通过
- 严重违规：立即回滚重新开发
- 重大违规：紧急修复 + 事故分析