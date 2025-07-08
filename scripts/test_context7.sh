#!/bin/bash

# Context7 MCP 测试脚本
# 用于验证Context7 MCP服务的安装和配置

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_test() {
  echo -e "${BLUE}[TEST]${NC} $1"
}

# 检查依赖
check_dependencies() {
  log_info "检查依赖环境..."
  
  # 检查Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js未安装"
    return 1
  fi
  log_info "Node.js版本: $(node --version)"
  
  # 检查npm
  if ! command -v npm &> /dev/null; then
    log_error "npm未安装"
    return 1
  fi
  log_info "npm版本: $(npm --version)"
  
  # 检查npx
  if ! command -v npx &> /dev/null; then
    log_error "npx未安装"
    return 1
  fi
  
  return 0
}

# 测试Context7安装
test_context7_installation() {
  log_test "测试Context7 MCP安装..."
  
  # 尝试运行Context7
  if npx -y @upstash/context7-mcp --help &> /dev/null; then
    log_info "Context7 MCP安装正常"
    return 0
  else
    log_error "Context7 MCP安装失败或无法运行"
    return 1
  fi
}

# 测试项目文件索引
test_project_indexing() {
  log_test "测试项目文件索引..."
  
  local project_root="$(cd "$(dirname "$0")/.." && pwd)"
  cd "$project_root"
  
  # 检查关键文件是否存在
  local key_files=(
    "backend/src/app.js"
    "frontend/package.json"
    "docs/项目说明.md"
    "docker-compose.yml"
    ".context7rc.json"
  )
  
  local missing_files=0
  for file in "${key_files[@]}"; do
    if [[ -f "$file" ]]; then
      log_info "✓ 找到文件: $file"
    else
      log_warning "✗ 缺失文件: $file"
      ((missing_files++))
    fi
  done
  
  if [[ $missing_files -eq 0 ]]; then
    log_info "所有关键文件都存在"
    return 0
  else
    log_warning "缺失 $missing_files 个关键文件"
    return 1
  fi
}

# 测试配置文件
test_configuration() {
  log_test "测试Context7配置文件..."
  
  local config_file=".context7rc.json"
  
  if [[ -f "$config_file" ]]; then
    log_info "✓ 配置文件存在: $config_file"
    
    # 验证JSON格式
    if jq empty "$config_file" 2>/dev/null; then
      log_info "✓ 配置文件JSON格式正确"
      
      # 检查关键配置项
      local required_keys=("name" "indexing" "categories" "topics")
      local missing_keys=0
      
      for key in "${required_keys[@]}"; do
        if jq -e ".$key" "$config_file" >/dev/null 2>&1; then
          log_info "✓ 配置项存在: $key"
        else
          log_warning "✗ 配置项缺失: $key"
          ((missing_keys++))
        fi
      done
      
      if [[ $missing_keys -eq 0 ]]; then
        return 0
      else
        log_warning "缺失 $missing_keys 个必需配置项"
        return 1
      fi
    else
      log_error "✗ 配置文件JSON格式错误"
      return 1
    fi
  else
    log_warning "✗ 配置文件不存在: $config_file"
    return 1
  fi
}

# 测试文档索引
test_documentation_index() {
  log_test "测试文档索引..."
  
  local docs_dir="docs"
  local doc_files=(
    "Context7_MCP_索引手册.md"
    "Context7_快速参考指南.md"
    "项目说明.md"
    "安装与配置指南.md"
    "MVP_开发指南.md"
  )
  
  local missing_docs=0
  for doc in "${doc_files[@]}"; do
    if [[ -f "$docs_dir/$doc" ]]; then
      log_info "✓ 文档存在: $doc"
    else
      log_warning "✗ 文档缺失: $doc"
      ((missing_docs++))
    fi
  done
  
  if [[ $missing_docs -eq 0 ]]; then
    log_info "所有文档都存在"
    return 0
  else
    log_warning "缺失 $missing_docs 个文档文件"
    return 1
  fi
}

# 生成测试报告
generate_test_report() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local report_file="logs/context7_test_report_$(date '+%Y%m%d_%H%M%S').txt"
  
  # 确保logs目录存在
  mkdir -p logs
  
  cat > "$report_file" << EOF
Context7 MCP 测试报告
=====================

测试时间: $timestamp
项目路径: $(pwd)

测试结果:
--------
依赖检查: $([[ $dep_check -eq 0 ]] && echo "通过" || echo "失败")
Context7安装: $([[ $install_check -eq 0 ]] && echo "通过" || echo "失败")
项目索引: $([[ $index_check -eq 0 ]] && echo "通过" || echo "失败")
配置文件: $([[ $config_check -eq 0 ]] && echo "通过" || echo "失败")
文档索引: $([[ $docs_check -eq 0 ]] && echo "通过" || echo "失败")

总体状态: $([[ $overall_status -eq 0 ]] && echo "所有测试通过" || echo "部分测试失败")

建议:
----
EOF

  if [[ $dep_check -ne 0 ]]; then
    echo "- 请安装Node.js和npm" >> "$report_file"
  fi
  
  if [[ $install_check -ne 0 ]]; then
    echo "- 请重新安装Context7 MCP: npm install -g @upstash/context7-mcp" >> "$report_file"
  fi
  
  if [[ $config_check -ne 0 ]]; then
    echo "- 请检查.context7rc.json配置文件" >> "$report_file"
  fi
  
  if [[ $docs_check -ne 0 ]]; then
    echo "- 请补充缺失的文档文件" >> "$report_file"
  fi
  
  echo "" >> "$report_file"
  echo "详细日志请查看终端输出" >> "$report_file"
  
  log_info "测试报告已生成: $report_file"
}

# 主函数
main() {
  echo "========================================"
  echo "    Context7 MCP 测试脚本"
  echo "========================================"
  echo ""
  
  # 进入项目根目录
  cd "$(dirname "$0")/.."
  
  # 运行测试
  check_dependencies
  dep_check=$?
  
  test_context7_installation
  install_check=$?
  
  test_project_indexing
  index_check=$?
  
  test_configuration
  config_check=$?
  
  test_documentation_index
  docs_check=$?
  
  # 计算总体状态
  overall_status=$((dep_check + install_check + index_check + config_check + docs_check))
  
  echo ""
  echo "========================================"
  echo "           测试结果汇总"
  echo "========================================"
  
  if [[ $overall_status -eq 0 ]]; then
    log_info "🎉 所有测试都通过了！Context7 MCP已正确配置"
  else
    log_warning "⚠️  部分测试失败，请查看上述错误信息"
  fi
  
  # 生成测试报告
  generate_test_report
  
  echo ""
  echo "下一步:"
  echo "1. 在支持MCP的编辑器中配置Context7"
  echo "2. 使用 'use context7' 开始查询项目文档"
  echo "3. 参考 docs/Context7_快速参考指南.md 获取使用技巧"
  
  return $overall_status
}

# 运行主函数
main "$@"
