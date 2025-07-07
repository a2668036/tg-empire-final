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

# 进入项目根目录
cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

# 停止后端服务
if [ -f "$ROOT_DIR/logs/backend.pid" ]; then
  BACKEND_PID=$(cat "$ROOT_DIR/logs/backend.pid")
  log_info "停止后端服务 (PID: $BACKEND_PID)..."
  
  if ps -p $BACKEND_PID > /dev/null; then
    kill $BACKEND_PID
    log_info "后端服务已停止"
  else
    log_warning "后端服务进程已不存在"
  fi
  
  rm -f "$ROOT_DIR/logs/backend.pid"
else
  log_warning "没有找到后端服务PID文件，可能未启动"
fi

# 停止前端服务
if [ -f "$ROOT_DIR/logs/frontend.pid" ]; then
  FRONTEND_PID=$(cat "$ROOT_DIR/logs/frontend.pid")
  log_info "停止前端服务 (PID: $FRONTEND_PID)..."
  
  if ps -p $FRONTEND_PID > /dev/null; then
    kill $FRONTEND_PID
    log_info "前端服务已停止"
  else
    log_warning "前端服务进程已不存在"
  fi
  
  rm -f "$ROOT_DIR/logs/frontend.pid"
else
  log_warning "没有找到前端服务PID文件，可能未启动"
fi

# 停止Docker容器
log_info "停止Docker容器..."
docker-compose down
if [ $? -ne 0 ]; then
  log_error "停止Docker容器失败，请手动检查"
else
  log_info "Docker容器已停止"
fi

log_info "======================================================================================"
log_info "🛑 MVP-001 服务已全部停止"
log_info "🔄 重新启动请运行: ./scripts/start_mvp_001.sh"
log_info "======================================================================================"