# 帝国社区 Telegram Bot

这是一个Telegram社区管理机器人项目，提供用户注册、签到、声望系统等功能。

## 功能特点

- 用户注册与个人资料管理
- 每日签到系统
- 声望点数系统
- Telegram Mini App个人主页

## 项目结构

- `backend/`: 后端API服务
- `frontend/`: 前端应用和静态文件
- `docs/`: 项目文档

## 文档指南

详细文档请查看:
- [项目说明](./docs/项目说明.md)
- [开发流程记录](./docs/开发流程记录.md)
- [安装与配置指南](./docs/安装与配置指南.md)

## 快速开始

1. 克隆仓库
```bash
git clone https://github.com/a2668036/tg-empire.git
cd tg-empire
```

2. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端 (如果需要)
cd ../frontend
npm install
```

3. 配置环境变量
- 参考 `backend/.env.example` 创建并编辑 `.env` 文件。

4. 启动服务
```bash
# 启动后端
cd backend
npm run dev
```

## 技术栈

- 后端: Node.js, Express
- 数据库: PostgreSQL, Redis
- 前端: HTML, CSS, JavaScript, Vue.js
- 部署: Nginx, Cpolar

## 开发与贡献

欢迎提交问题和改进建议。

## 许可证

MIT
