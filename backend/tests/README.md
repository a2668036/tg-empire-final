# 电报社区测试指南

本文档提供了电报社区后端服务的测试指南，包括如何配置测试环境、运行测试以及如何模拟用户行为进行测试。

## 目录

- [测试环境配置](#测试环境配置)
- [测试类型](#测试类型)
- [运行测试](#运行测试)
- [模拟用户行为测试](#模拟用户行为测试)
- [性能测试](#性能测试)
- [缓存优化测试](#缓存优化测试)
- [故障排除](#故障排除)

## 测试环境配置

### 依赖项

运行测试需要以下依赖：

- Node.js (>= 14.0.0)
- PostgreSQL (>= 12)
- Redis (可选，用于缓存测试)

### 数据库配置

1. 创建测试数据库：

```sql
CREATE DATABASE tg_empire_test;
CREATE USER tg_admin WITH PASSWORD 'tg_password';
GRANT ALL PRIVILEGES ON DATABASE tg_empire_test TO tg_admin;
```

2. 初始化测试数据库：

```bash
psql -U tg_admin -d tg_empire_test -f ./scripts/init_database.sql
```

### 环境变量

测试时会自动创建 `.env` 文件，也可以手动创建包含以下配置的 `.env` 文件：

```
NODE_ENV=test
PORT=3000
DATABASE_URL=postgresql://tg_admin:tg_password@localhost:5432/tg_empire_test
TELEGRAM_BOT_TOKEN=test_token
REDIS_URL=redis://localhost:6379
```

## 测试类型

本项目包含以下类型的测试：

1. **单元测试** - 测试单个服务和函数的功能
2. **集成测试** - 测试API端点和组件之间的交互
3. **性能测试** - 测试API的响应时间和并发能力
4. **模拟用户测试** - 模拟真实用户的行为序列
5. **缓存优化测试** - 测试Redis缓存提升性能的效果

## 运行测试

我们提供了一个脚本来运行各种测试：

```bash
# 运行全部测试
./run-tests.sh all

# 运行单元测试
./run-tests.sh unit

# 运行集成测试
./run-tests.sh integration

# 运行性能测试
./run-tests.sh performance

# 运行模拟用户测试
./run-tests.sh simulation

# 运行Redis缓存测试
./run-tests.sh redis
```

也可以使用npm命令运行测试：

```bash
# 运行所有测试
npm test

# 运行指定测试文件
npx mocha tests/userService.test.js
```

## 模拟用户行为测试

模拟用户测试通过模拟真实用户在系统中的一系列行为来测试系统的各个功能。要运行这些测试：

```bash
node tests/telegram-user-sim.js
```

或使用测试脚本：

```bash
./run-tests.sh simulation
```

这将模拟多个用户执行以下操作序列：

1. 注册新用户
2. 更新个人资料
3. 查看签到状态
4. 执行每日签到
5. 查看声望历史
6. 查看声望统计

模拟的结果会显示在控制台，包括每个用户的操作和最终获得的声望点数。

## 性能测试

性能测试检查系统在各种条件下的响应时间和并发处理能力。这些测试包括：

1. 检查用户API的响应时间
2. 检查签到API的响应时间
3. 检查声望历史API的响应时间
4. 测试系统处理并发请求的能力

要运行性能测试：

```bash
./run-tests.sh performance
```

## 缓存优化测试

这些测试演示了如何使用Redis缓存来提高系统性能，尤其是签到和声望相关的API。

要运行缓存测试：

```bash
./run-tests.sh redis
```

这些测试会比较使用缓存和不使用缓存时的性能差异。

## 故障排除

如果遇到测试失败，请检查以下问题：

1. **数据库连接问题**：
   - 确保PostgreSQL服务正在运行
   - 检查数据库连接配置和权限

2. **Redis连接问题**：
   - 确保Redis服务正在运行（如果使用缓存测试）
   - 检查Redis连接URL

3. **测试失败**：
   - 检查控制台错误信息
   - 修复失败的测试后重新运行

如有任何问题，请联系技术负责人。 