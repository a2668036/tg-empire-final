# Context7 MCP 使用指南

## 🎉 安装完成确认

✅ **Context7 MCP已成功安装和配置！**

根据测试报告，所有组件都已正确配置：
- ✅ Node.js和npm环境正常
- ✅ Context7 MCP安装成功
- ✅ 项目文件索引完整
- ✅ 配置文件格式正确
- ✅ 文档索引完备

## 🚀 立即开始使用

### 1. 在编辑器中配置Context7

#### Cursor配置
在Cursor中添加以下配置到 `~/.cursor/mcp.json`：
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

#### VS Code配置
在VS Code设置中添加：
```json
"mcp": {
  "servers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### 2. 基础查询示例

#### 项目概览查询
```
TG Empire项目的整体架构是什么？use context7
```

#### 具体功能查询
```
如何在TG Empire中实现Telegram Bot的webhook处理？use context7
```

#### 技术实现查询
```
如何使用Express.js和PostgreSQL实现用户注册API？use context7
```

## 📚 核心功能查询模板

### 后端开发
```bash
# API开发
如何在TG Empire中添加新的API端点？use context7 topic: api-development

# 数据库操作
如何设计用户表和签到表的关系？use context7 topic: database-design

# Telegram Bot
如何处理Telegram Bot的命令和回调？use context7 topic: telegram-bot

# 认证授权
如何实现JWT认证中间件？use context7 topic: authentication
```

### 前端开发
```bash
# Vue组件
如何创建Telegram Mini App的Vue组件？use context7 topic: vue-component

# 页面开发
如何开发用户个人主页？use context7 topic: frontend-development

# 状态管理
如何在Vue应用中管理用户状态？use context7 topic: state-management
```

### 部署运维
```bash
# Docker部署
如何使用Docker Compose部署TG Empire？use context7 topic: deployment

# 内网穿透
如何配置Cpolar实现外网访问？use context7 topic: cpolar

# 监控维护
如何监控服务状态和性能？use context7 topic: monitoring
```

## 🔍 高级查询技巧

### 1. 组合查询
```
实现用户签到功能，包括数据库设计、API接口和前端界面。use context7 topic: check-in database api frontend
```

### 2. 特定库查询
```
使用Telegraf框架处理Telegram Bot消息。use library /telegraf/telegraf
```

### 3. 问题排查
```
Telegram Webhook接收失败，如何排查和解决？use context7 topic: troubleshooting webhook
```

### 4. 性能优化
```
如何优化TG Empire的API响应时间？use context7 topic: performance-optimization
```

## 📊 项目特定查询场景

### 用户系统
```bash
# 用户注册
如何实现Telegram用户自动注册？use context7

# 用户认证
如何验证Telegram用户身份？use context7

# 用户资料
如何管理用户个人资料？use context7
```

### 签到系统
```bash
# 签到功能
如何实现每日签到功能？use context7

# 连续签到
如何计算连续签到天数？use context7

# 签到奖励
如何设计签到奖励机制？use context7
```

### 声望系统
```bash
# 声望计算
如何计算用户声望点数？use context7

# 声望历史
如何记录声望变化历史？use context7

# 声望应用
如何在功能中使用声望系统？use context7
```

## 🛠️ 开发工作流集成

### 新功能开发流程
1. **需求分析**
   ```
   我需要开发[功能名称]，请提供技术方案。use context7
   ```

2. **数据库设计**
   ```
   如何为[功能名称]设计数据库表？use context7 topic: database-design
   ```

3. **API开发**
   ```
   如何实现[功能名称]的API接口？use context7 topic: api-development
   ```

4. **前端实现**
   ```
   如何在前端实现[功能名称]？use context7 topic: frontend-development
   ```

5. **测试验证**
   ```
   如何为[功能名称]编写测试？use context7 topic: testing
   ```

### 问题排查流程
1. **问题描述**
   ```
   遇到[具体错误]，如何排查？use context7 topic: troubleshooting
   ```

2. **日志分析**
   ```
   如何分析应用日志定位问题？use context7 topic: logging
   ```

3. **性能分析**
   ```
   如何分析性能瓶颈？use context7 topic: performance-analysis
   ```

## 📈 使用效果优化

### 查询优化建议
1. **明确问题**：描述具体的技术问题或需求
2. **添加上下文**：提及TG Empire项目相关信息
3. **指定主题**：使用topic参数聚焦查询范围
4. **引用库名**：指定具体的技术栈和版本

### 常见问题解决
```bash
# 查询无结果
如果查询没有返回相关结果，尝试：
- 使用更具体的关键词
- 添加项目上下文信息
- 指定相关的topic

# 结果不准确
如果返回结果不够准确，尝试：
- 细化问题描述
- 使用多个相关的topic
- 指定具体的技术栈
```

## 🎯 下一步行动

### 立即可以做的
1. **配置编辑器**：在你的编辑器中配置Context7 MCP
2. **尝试查询**：使用提供的模板进行第一次查询
3. **熟悉语法**：练习不同类型的查询语法

### 进阶使用
1. **自定义模板**：根据项目需求创建自定义查询模板
2. **工作流集成**：将Context7集成到日常开发工作流中
3. **团队分享**：与团队成员分享使用技巧和最佳实践

## 📞 技术支持

### 文档资源
- 📖 [Context7 MCP 索引手册](./Context7_MCP_索引手册.md) - 完整的索引说明
- 📋 [快速参考指南](./Context7_快速参考指南.md) - 常用查询速查表
- 🔧 [项目说明](./项目说明.md) - TG Empire项目详情
- 📚 [安装与配置指南](./安装与配置指南.md) - 部署和配置说明

### 测试和验证
```bash
# 运行Context7测试
./scripts/test_context7.sh

# 查看测试报告
cat logs/context7_test_report_*.txt
```

### 问题反馈
如果遇到问题，请：
1. 查看测试报告确认配置状态
2. 检查编辑器MCP配置
3. 验证查询语法是否正确
4. 参考文档中的故障排除部分

---

🎉 **恭喜！Context7 MCP已成功配置，开始享受智能代码文档查询的便利吧！**

*最后更新：2025-07-08*
