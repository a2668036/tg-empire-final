#!/bin/bash

# MVP-001部署脚本
# 部署基础用户注册与ProfileApp功能

set -e  # 任何命令失败就退出

echo "开始部署MVP-001: 基础用户注册与ProfileApp功能..."

# 确保在项目根目录
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo "项目根目录: $PROJECT_ROOT"

# 1. 后端部署
echo "==============================================="
echo "开始部署后端服务..."
echo "==============================================="

cd "$PROJECT_ROOT/backend"

# 安装生产依赖
echo "安装后端依赖..."
npm ci --production

# 执行数据库迁移脚本
echo "执行数据库迁移..."
node src/scripts/migrate.js

# 设置环境变量
echo "检查环境变量..."
if [ ! -f .env ]; then
  echo "未找到.env文件，请创建.env文件并设置必要的环境变量"
  exit 1
fi

# 重启后端服务
echo "重启后端服务..."
pm2 restart tg-empire-backend || pm2 start src/server.js --name tg-empire-backend

# 2. 前端部署
echo "==============================================="
echo "开始部署前端应用..."
echo "==============================================="

cd "$PROJECT_ROOT/frontend"

# 安装依赖
echo "安装前端依赖..."
npm ci

# 构建前端应用
echo "构建前端应用..."
npm run build

# 部署到Nginx
echo "部署前端文件到Nginx服务器..."
NGINX_DIR="/var/www/tg-empire"
sudo mkdir -p $NGINX_DIR
sudo cp -r dist/* $NGINX_DIR/

# 重启Nginx
echo "重启Nginx服务器..."
sudo systemctl restart nginx

# 3. 验证部署
echo "==============================================="
echo "验证部署结果..."
echo "==============================================="

# 检查后端服务状态
echo "检查后端服务状态..."
if pm2 status | grep -q "tg-empire-backend"; then
  echo "后端服务运行正常"
else
  echo "警告: 后端服务可能未正常启动"
fi

# 检查Nginx状态
echo "检查Nginx服务状态..."
if sudo systemctl status nginx | grep -q "active (running)"; then
  echo "Nginx服务运行正常"
else
  echo "警告: Nginx服务可能未正常运行"
fi

# 测试API可用性
echo "测试API可用性..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
  echo "API健康检查通过"
else
  echo "警告: API健康检查失败"
fi

echo "==============================================="
echo "MVP-001部署完成!"
echo "===============================================" 