const userService = require('./userService');

/**
 * Telegram Bot处理类
 * 处理与Telegram Bot相关的事件和命令
 */
class BotHandler {
  /**
   * 配置机器人命令
   * @param {Object} bot - Telegraf实例
   */
  setupCommands(bot) {
    // 设置命令菜单
    bot.telegram.setMyCommands([
      { command: 'start', description: '启动机器人' },
      { command: 'profile', description: '查看个人主页' }
    ]).catch(error => {
      console.error('设置命令菜单失败:', error);
    });
    
    // 处理 /start 命令
    bot.start(async (ctx) => {
      const { id, username, first_name, last_name } = ctx.from;
      
      // 注册用户
      await userService.registerUser({
        telegram_id: id,
        username,
        first_name,
        last_name
      });
      
      // 发送欢迎消息
      return ctx.reply(`欢迎来到帝国社区，${first_name}！`, {
        reply_markup: {
          keyboard: [
            [{ text: '🏛️ 我的主页' }]
          ],
          resize_keyboard: true,
          persistent: true
        }
      });
    });
    
    // 处理 /profile 命令
    bot.command('profile', (ctx) => {
      return ctx.reply('点击下方按钮打开你的个人主页', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏛️ 打开个人主页', web_app: { url: 'https://7e4b3315.r3.cpolar.cn/' } }]
          ]
        }
      });
    });
    
    // 处理文本消息
    bot.on('text', (ctx) => {
      const text = ctx.message.text;
      
      if (text === '🏛️ 我的主页') {
        return ctx.reply('点击下方按钮打开你的个人主页', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏛️ 打开个人主页', web_app: { url: 'https://7e4b3315.r3.cpolar.cn/' } }]
            ]
          }
        });
      }
      
      return ctx.reply('抱歉，我不理解这个命令。请使用 /profile 查看个人主页。');
    });
  }
  
  /**
   * 处理webhook请求
   * @param {Object} bot - Telegraf实例
   * @returns {Function} - Express中间件
   */
  handleWebhook(bot) {
    return (req, res) => {
      // 验证请求来源
      try {
        const update = req.body;
        
        // 交给bot处理
        bot.handleUpdate(update);
        
        res.sendStatus(200);
      } catch (error) {
        console.error('处理webhook请求失败:', error);
        res.sendStatus(400);
      }
    };
  }
}

module.exports = new BotHandler(); 