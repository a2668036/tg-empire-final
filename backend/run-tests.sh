#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的消息
echo_color() {
  echo -e "${2}${1}${NC}"
}

echo_color "=========================================" "${BLUE}"
echo_color "      运行电报社区后端测试" "${BLUE}"
echo_color "=========================================" "${BLUE}"
echo ""

# 检查测试类型参数
TEST_TYPE=$1

# 安装依赖
echo_color "正在安装依赖..." "${YELLOW}"
npm install
echo_color "依赖安装完成！" "${GREEN}"
echo ""

# 创建.env文件(如果不存在)
if [ ! -f ".env" ]; then
  echo_color "创建.env文件..." "${YELLOW}"
  cat > .env << EOL
# 环境配置
NODE_ENV=test
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://tg_admin:tg_password@localhost:5432/tg_empire_test

# Telegram Bot配置
TELEGRAM_BOT_TOKEN=test_token

# Redis配置
REDIS_URL=redis://localhost:6379
EOL
  echo_color ".env文件创建成功！" "${GREEN}"
  echo ""
fi

# 运行单元测试
run_unit_tests() {
  echo_color "正在运行单元测试..." "${YELLOW}"
  echo ""
  
  npx mocha tests/userService.test.js tests/checkInService.test.js tests/reputationService.test.js
  
  if [ $? -eq 0 ]; then
    echo ""
    echo_color "单元测试通过！" "${GREEN}"
  else
    echo ""
    echo_color "单元测试失败！" "${RED}"
    exit 1
  fi
  echo ""
}

# 运行集成测试
run_integration_tests() {
  echo_color "正在运行集成测试..." "${YELLOW}"
  echo ""
  
  npx mocha tests/api-integration.test.js
  
  if [ $? -eq 0 ]; then
    echo ""
    echo_color "集成测试通过！" "${GREEN}"
  else
    echo ""
    echo_color "集成测试失败！" "${RED}"
    exit 1
  fi
  echo ""
}

# 运行性能测试
run_performance_tests() {
  echo_color "正在运行性能测试..." "${YELLOW}"
  echo ""
  
  npx mocha tests/performance.test.js
  
  if [ $? -eq 0 ]; then
    echo ""
    echo_color "性能测试通过！" "${GREEN}"
  else
    echo ""
    echo_color "性能测试失败！" "${RED}"
    exit 1
  fi
  echo ""
}

# 运行模拟用户测试
run_user_simulation() {
  echo_color "正在运行模拟用户测试..." "${YELLOW}"
  echo ""
  
  node tests/telegram-user-sim.js
  
  if [ $? -eq 0 ]; then
    echo ""
    echo_color "模拟用户测试通过！" "${GREEN}"
  else
    echo ""
    echo_color "模拟用户测试失败！" "${RED}"
    exit 1
  fi
  echo ""
}

# 运行Redis缓存测试
run_redis_cache_tests() {
  echo_color "正在运行Redis缓存测试..." "${YELLOW}"
  echo ""
  
  npx mocha tests/redis-cache-test.js
  
  if [ $? -eq 0 ]; then
    echo ""
    echo_color "Redis缓存测试通过！" "${GREEN}"
  else
    echo ""
    echo_color "Redis缓存测试失败！" "${RED}"
    exit 1
  fi
  echo ""
}

# 根据参数运行不同的测试
case $TEST_TYPE in
  "unit")
    run_unit_tests
    ;;
  "integration")
    run_integration_tests
    ;;
  "performance")
    run_performance_tests
    ;;
  "simulation")
    run_user_simulation
    ;;
  "redis")
    run_redis_cache_tests
    ;;
  "all")
    run_unit_tests
    run_integration_tests
    run_performance_tests
    run_user_simulation
    run_redis_cache_tests
    ;;
  *)
    echo_color "使用方法: $0 [unit|integration|performance|simulation|redis|all]" "${YELLOW}"
    echo ""
    echo_color "  unit        - 运行单元测试" "${BLUE}"
    echo_color "  integration - 运行集成测试" "${BLUE}"
    echo_color "  performance - 运行性能测试" "${BLUE}"
    echo_color "  simulation  - 运行模拟用户测试" "${BLUE}"
    echo_color "  redis       - 运行Redis缓存测试" "${BLUE}"
    echo_color "  all         - 运行所有测试" "${BLUE}"
    echo ""
    exit 1
    ;;
esac

echo_color "=========================================" "${BLUE}"
echo_color "      测试完成" "${BLUE}"
echo_color "=========================================" "${BLUE}" 