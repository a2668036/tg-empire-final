#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

# 输出带颜色的信息函数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检测Docker是否安装和运行
if ! command -v docker &> /dev/null; then
  log_error "Docker未安装，请先安装Docker"
  exit 1
fi

if ! docker info &> /dev/null; then
  log_error "Docker未运行或需要root权限，请检查Docker状态"
  exit 1
fi

# 进入项目根目录
cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

log_info "启动数据库和Redis容器..."
docker-compose up -d postgres redis
if [ $? -ne 0 ]; then
  log_error "启动容器失败，请检查docker-compose.yml配置"
  exit 1
fi

# 等待数据库完全启动
log_info "等待数据库启动中..."
sleep 5

# 检查数据库表是否存在，如果不存在则创建
log_info "检查数据库表..."
TABLES_EXIST=$(docker exec -i tg_postgres psql -U tg_admin -d tg_empire -t -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users');")

if [[ $TABLES_EXIST == *"f"* ]]; then
  log_info "数据库表不存在，正在创建..."
  docker exec -i tg_postgres psql -U tg_admin -d tg_empire < ./scripts/init_database.sql
  if [ $? -ne 0 ]; then
    log_error "创建数据库表失败"
    exit 1
  fi
  log_info "数据库表创建成功"
else
  log_info "数据库表已存在，跳过创建步骤"
fi

# 启动后端服务
log_info "启动后端服务..."
cd $ROOT_DIR/backend
if [ ! -f ".env" ]; then
  log_warning ".env文件不存在，创建示例配置..."
  echo "PORT=3000
DATABASE_URL=postgresql://tg_admin:tg_password@localhost:5432/tg_empire
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
REDIS_URL=redis://localhost:6379" > .env
  log_warning "请在后端目录的.env文件中设置正确的Telegram Bot Token"
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
  log_info "安装后端依赖..."
  npm install
  if [ $? -ne 0 ]; then
    log_error "安装后端依赖失败"
    exit 1
  fi
fi

# 后台启动后端服务
log_info "后台启动后端服务..."
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
log_info "后端服务已启动，进程ID: $BACKEND_PID"

# 启动前端服务
log_info "启动前端服务..."
cd $ROOT_DIR/frontend
if [ ! -d "node_modules" ]; then
  log_info "安装前端依赖..."
  npm install
  if [ $? -ne 0 ]; then
    log_error "安装前端依赖失败"
    exit 1
  fi
fi

# 后台启动前端服务
log_info "后台启动前端服务..."
mkdir -p ../logs
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
log_info "前端服务已启动，进程ID: $FRONTEND_PID"

log_info "======================================================================================"
log_info "🎉 MVP-001 服务已全部启动"
log_info "📊 后端API访问地址: http://localhost:3000"
log_info "🖥️ 前端页面访问地址: http://localhost:5173/profile.html"
log_info "📝 日志文件位置: $ROOT_DIR/logs/"
log_info "🛑 停止服务请运行: ./scripts/stop_mvp_001.sh"
log_info "======================================================================================" 