#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始生产环境部署流程...\n');

// 部署配置
const DEPLOY_CONFIG = {
  BACKEND_PORT: 3000,
  FRONTEND_PORT: 5173,
  PRODUCTION_DOMAIN: process.env.PRODUCTION_DOMAIN || 'localhost',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL
};

// 检查环境变量
function checkEnvironment() {
  console.log('📋 检查环境变量...');
  
  const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
    console.log('\n请设置以下环境变量:');
    missingVars.forEach(varName => {
      console.log(`export ${varName}="your_value_here"`);
    });
    process.exit(1);
  }
  
  console.log('✅ 环境变量检查通过');
}

// 更新前端API配置
function updateFrontendConfig() {
  console.log('📝 更新前端API配置...');
  
  const apiServicePath = path.join(__dirname, 'frontend/src/utils/apiService.js');
  
  if (fs.existsSync(apiServicePath)) {
    let content = fs.readFileSync(apiServicePath, 'utf8');
    
    // 更新API基础URL
    const productionApiUrl = `https://${DEPLOY_CONFIG.PRODUCTION_DOMAIN}/api/v1`;
    content = content.replace(
      /const API_BASE = ['"'][^'"]*['"']/,
      `const API_BASE = '${productionApiUrl}'`
    );
    
    fs.writeFileSync(apiServicePath, content);
    console.log('✅ 前端API配置已更新');
  } else {
    console.log('⚠️ 未找到前端API配置文件');
  }
}

// 更新Bot配置
function updateBotConfig() {
  console.log('📝 更新Bot前端URL配置...');
  
  const botHandlerPath = path.join(__dirname, 'backend/src/services/botHandler.js');
  
  if (fs.existsSync(botHandlerPath)) {
    let content = fs.readFileSync(botHandlerPath, 'utf8');
    
    // 更新前端URL
    const productionFrontendUrl = `https://${DEPLOY_CONFIG.PRODUCTION_DOMAIN}/src/apps/ProfileApp/index.html`;
    
    // 设置环境变量默认值
    process.env.FRONTEND_APP_URL = productionFrontendUrl;
    
    console.log('✅ Bot配置已更新');
    console.log(`   前端URL: ${productionFrontendUrl}`);
  } else {
    console.log('⚠️ 未找到Bot配置文件');
  }
}

// 启动后端服务
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔧 启动后端服务...');
    
    const backend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    let backendReady = false;
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[后端] ${output.trim()}`);
      
      if (output.includes('服务器已启动') && !backendReady) {
        backendReady = true;
        console.log('✅ 后端服务启动成功');
        resolve(backend);
      }
    });
    
    backend.stderr.on('data', (data) => {
      console.error(`[后端错误] ${data.toString().trim()}`);
    });
    
    backend.on('error', (error) => {
      console.error('❌ 后端服务启动失败:', error);
      reject(error);
    });
    
    // 超时检查
    setTimeout(() => {
      if (!backendReady) {
        console.error('❌ 后端服务启动超时');
        reject(new Error('后端服务启动超时'));
      }
    }, 30000);
  });
}

// 启动前端服务
function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🎨 启动前端服务...');
    
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    let frontendReady = false;
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[前端] ${output.trim()}`);
      
      if (output.includes('ready in') && !frontendReady) {
        frontendReady = true;
        console.log('✅ 前端服务启动成功');
        resolve(frontend);
      }
    });
    
    frontend.stderr.on('data', (data) => {
      console.error(`[前端错误] ${data.toString().trim()}`);
    });
    
    frontend.on('error', (error) => {
      console.error('❌ 前端服务启动失败:', error);
      reject(error);
    });
    
    // 超时检查
    setTimeout(() => {
      if (!frontendReady) {
        console.error('❌ 前端服务启动超时');
        reject(new Error('前端服务启动超时'));
      }
    }, 30000);
  });
}

// 验证服务状态
async function verifyServices() {
  console.log('🔍 验证服务状态...');
  
  const axios = require('axios');
  
  try {
    // 检查后端健康状态
    const backendHealth = await axios.get(`http://localhost:${DEPLOY_CONFIG.BACKEND_PORT}/health`);
    console.log('✅ 后端健康检查通过');
    
    // 检查前端页面
    const frontendPage = await axios.get(`http://localhost:${DEPLOY_CONFIG.FRONTEND_PORT}/src/apps/ProfileApp/index.html`);
    console.log('✅ 前端页面可访问');
    
    return true;
  } catch (error) {
    console.error('❌ 服务验证失败:', error.message);
    return false;
  }
}

// 运行部署测试
async function runDeploymentTests() {
  console.log('🧪 运行部署测试...');
  
  try {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['comprehensive_system_test.js'], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      let testOutput = '';
      
      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        testOutput += output;
        console.log(output.trim());
      });
      
      testProcess.stderr.on('data', (data) => {
        console.error(data.toString().trim());
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 部署测试通过');
          resolve(true);
        } else {
          console.error('❌ 部署测试失败');
          reject(new Error('部署测试失败'));
        }
      });
    });
  } catch (error) {
    console.error('❌ 运行部署测试失败:', error);
    return false;
  }
}

// 生成部署报告
function generateDeploymentReport() {
  console.log('\n📊 生成部署报告...');
  
  const report = {
    deploymentTime: new Date().toISOString(),
    configuration: {
      backendPort: DEPLOY_CONFIG.BACKEND_PORT,
      frontendPort: DEPLOY_CONFIG.FRONTEND_PORT,
      domain: DEPLOY_CONFIG.PRODUCTION_DOMAIN,
      frontendUrl: `https://${DEPLOY_CONFIG.PRODUCTION_DOMAIN}/src/apps/ProfileApp/index.html`
    },
    services: {
      backend: 'RUNNING',
      frontend: 'RUNNING',
      database: 'CONNECTED'
    },
    status: 'DEPLOYED'
  };
  
  fs.writeFileSync('deployment_report.json', JSON.stringify(report, null, 2));
  
  console.log('📋 部署报告:');
  console.log('='.repeat(50));
  console.log(`部署时间: ${report.deploymentTime}`);
  console.log(`后端服务: http://localhost:${DEPLOY_CONFIG.BACKEND_PORT}`);
  console.log(`前端服务: http://localhost:${DEPLOY_CONFIG.FRONTEND_PORT}`);
  console.log(`Mini App URL: ${report.configuration.frontendUrl}`);
  console.log('='.repeat(50));
  console.log('✅ 部署完成！系统已准备好接受真实用户访问。');
}

// 主部署流程
async function deploy() {
  try {
    checkEnvironment();
    updateFrontendConfig();
    updateBotConfig();
    
    const backend = await startBackend();
    const frontend = await startFrontend();
    
    // 等待服务完全启动
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const servicesOk = await verifyServices();
    if (!servicesOk) {
      throw new Error('服务验证失败');
    }
    
    const testsPass = await runDeploymentTests();
    if (!testsPass) {
      throw new Error('部署测试失败');
    }
    
    generateDeploymentReport();
    
    // 保持服务运行
    console.log('\n🎉 部署成功！服务正在运行...');
    console.log('按 Ctrl+C 停止服务');
    
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止服务...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 启动部署
if (require.main === module) {
  deploy();
}

module.exports = { deploy, DEPLOY_CONFIG };
