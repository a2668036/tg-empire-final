import WebApp from '@twa-dev/sdk';

// WebApp SDK实例
export const webAppSdk = {
  /**
   * 获取Telegram WebApp实例
   * @returns {Object} Telegram WebApp实例
   */
  get instance() {
    return WebApp;
  },
  
  /**
   * 获取初始化数据
   * @returns {Object|null} 解析后的initData或null
   */
  getInitData() {
    try {
      if (!WebApp.initData) {
        console.warn('WebApp initData为空，使用测试数据');
        // 在开发环境返回真实用户数据
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          return {
            user: {
              id: 2033514198,
              first_name: '达Younger brother',
              last_name: '飞',
              username: 'Luxury1994'
            }
          };
        }
        return null;
      }

      return WebApp.initDataUnsafe || null;
    } catch (error) {
      console.error('获取initData失败:', error);
      // 在开发环境返回测试数据
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        return {
          user: {
            id: 999888777,
            first_name: 'Test',
            last_name: 'User',
            username: 'test_user'
          }
        };
      }
      return null;
    }
  },
  
  /**
   * 显示弹窗
   * @param {Object} options 弹窗选项
   * @param {string} options.message 弹窗消息
   * @param {Array} options.buttons 弹窗按钮配置
   */
  showPopup(options) {
    WebApp.showPopup(options);
  },
  
  /**
   * 显示消息通知
   * @param {string} message 通知消息
   */
  showAlert(message) {
    WebApp.showAlert(message);
  }
};

/**
 * 初始化WebApp SDK
 */
export function initWebAppSdk() {
  try {
    // 通知Telegram WebApp已就绪
    WebApp.ready();
    
    // 设置主题参数
    WebApp.setHeaderColor('secondary_bg_color');
    
    console.log('Telegram WebApp SDK初始化成功');
  } catch (error) {
    console.error('Telegram WebApp SDK初始化失败:', error);
  }
} 