require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Telegraf } = require('telegraf');
const botHandler = require('./services/botHandler');
const userRoutes = require('./routes/userRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const reputationRoutes = require('./routes/reputationRoutes');

// 初始化Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 初始化Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 配置机器人命令
botHandler.setupCommands(bot);

// Webhook处理（通过Cpolar内网穿透）
app.post('/webhook', (req, res) => {
  console.log('收到webhook请求:', req.method);
  try {
    bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('处理webhook请求失败:', error);
    res.status(400).send('Bad Request');
  }
});

// 优雅地关闭
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// API路由
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', checkInRoutes);
app.use('/api/v1', reputationRoutes);

// 根路由处理
app.get('/', (req, res) => {
  res.json({ 
    message: '帝国社区API服务运行中',
    version: '1.0.0',
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('应用错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;