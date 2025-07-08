// 动态加载Vue和组件
async function initApp() {
  try {
    // 加载Vue CDN
    if (!window.Vue) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/vue@3/dist/vue.global.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // 初始化Telegram WebApp SDK
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
      Telegram.WebApp.ready();
      Telegram.WebApp.setHeaderColor('#007bff');
    }

    // 创建Vue应用（内联组件定义）
    const { createApp } = Vue;

    const ProfileApp = {
      data() {
        return {
          loading: true,
          error: null,
          user: null,
          telegramId: null
        }
      },
      async mounted() {
        await this.initializeApp();
      },
      methods: {
        async initializeApp() {
          try {
            // 获取Telegram用户ID
            this.telegramId = this.getTelegramUserId();

            // 获取用户数据
            await this.fetchUserData();

          } catch (error) {
            console.error('初始化失败:', error);
            this.error = error.message;
          } finally {
            this.loading = false;
          }
        },

        getTelegramUserId() {
          try {
            if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
              return Telegram.WebApp.initDataUnsafe.user.id;
            }
            // 开发环境使用真实用户ID
            return 2033514198;
          } catch (error) {
            console.error('获取Telegram用户ID失败:', error);
            return 2033514198;
          }
        },

        async fetchUserData() {
          try {
            const response = await fetch('/api/v1/users/me', {
              headers: {
                'x-telegram-id': this.telegramId.toString()
              }
            });

            if (response.ok) {
              const responseData = await response.json();
              this.user = responseData.data || responseData;
            } else if (response.status === 404) {
              // 用户不存在，尝试注册
              await this.registerUser();
            } else {
              throw new Error(`API请求失败: ${response.status}`);
            }
          } catch (error) {
            console.error('获取用户数据失败:', error);
            throw error;
          }
        },

        async registerUser() {
          try {
            const userData = {
              telegram_id: this.telegramId,
              username: 'Luxury1994',
              first_name: '达Younger brother',
              last_name: '飞'
            };

            const response = await fetch('/api/v1/users/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData)
            });

            if (response.ok) {
              const responseData = await response.json();
              this.user = responseData.data || responseData;
            } else {
              throw new Error(`注册失败: ${response.status}`);
            }
          } catch (error) {
            console.error('用户注册失败:', error);
            throw error;
          }
        },

        async checkIn() {
          try {
            const response = await fetch('/api/v1/users/check-in', {
              method: 'POST',
              headers: {
                'x-telegram-id': this.telegramId.toString()
              }
            });

            if (response.ok) {
              const result = await response.json();
              this.user = result.user;
              alert('签到成功！获得 ' + result.rewards.totalPoints + ' 点声望');
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || '签到失败');
            }
          } catch (error) {
            console.error('签到失败:', error);
            alert('签到失败: ' + error.message);
          }
        },

        formatDisplayName() {
          if (!this.user) return 'TG用户';
          const firstName = this.user.first_name || '';
          const lastName = this.user.last_name || '';
          return `${firstName} ${lastName}`.trim() || 'TG用户';
        },

        formatDisplayHandle() {
          if (!this.user) return 'TG用户';
          const username = this.user.username || '';
          const firstName = this.user.first_name || '';
          return username ? `@${username}` : (firstName || 'TG用户');
        },

        isCheckedInToday() {
          if (!this.user || !this.user.last_check_in_date) return false;
          const today = new Date();
          const lastCheckIn = new Date(this.user.last_check_in_date);
          return lastCheckIn.getDate() === today.getDate() &&
                 lastCheckIn.getMonth() === today.getMonth() &&
                 lastCheckIn.getFullYear() === today.getFullYear();
        }
      },
      template: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <!-- 加载状态 -->
          <div v-if="loading" style="text-align: center; padding: 40px; color: #6c757d;">
            正在加载用户数据...
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            加载失败: {{ error }}
          </div>

          <!-- 主要内容 -->
          <div v-else-if="user">
            <!-- 用户信息头部 -->
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: var(--tg-theme-secondary-bg-color, #f8f9fa); border-radius: 12px;">
              <h1 style="margin: 0 0 10px 0; color: var(--tg-theme-text-color, #000000);">{{ formatDisplayName() }}</h1>
              <p style="margin: 0; color: var(--tg-theme-hint-color, #6c757d);">{{ formatDisplayHandle() }}</p>
            </div>

            <!-- 统计数据 -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
              <div style="background: var(--tg-theme-secondary-bg-color, #f8f9fa); padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: var(--tg-theme-button-color, #007bff);">{{ user.reputation_points || 0 }}</div>
                <div style="font-size: 14px; color: var(--tg-theme-hint-color, #6c757d); margin-top: 5px;">声望点数</div>
              </div>
              <div style="background: var(--tg-theme-secondary-bg-color, #f8f9fa); padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: var(--tg-theme-button-color, #007bff);">{{ user.empire_stars || 0 }}</div>
                <div style="font-size: 14px; color: var(--tg-theme-hint-color, #6c757d); margin-top: 5px;">帝国之星</div>
              </div>
              <div style="background: var(--tg-theme-secondary-bg-color, #f8f9fa); padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: var(--tg-theme-button-color, #007bff);">{{ user.consecutive_check_ins || 0 }}</div>
                <div style="font-size: 14px; color: var(--tg-theme-hint-color, #6c757d); margin-top: 5px;">连续签到</div>
              </div>
            </div>

            <!-- 签到按钮 -->
            <button
              @click="checkIn"
              :disabled="isCheckedInToday()"
              style="width: 100%; padding: 15px; background: var(--tg-theme-button-color, #007bff); color: var(--tg-theme-button-text-color, white); border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: opacity 0.3s;"
              :style="{ opacity: isCheckedInToday() ? 0.5 : 1, cursor: isCheckedInToday() ? 'not-allowed' : 'pointer' }"
            >
              {{ isCheckedInToday() ? '今日已签到' : '每日签到' }}
            </button>
          </div>
        </div>
      `
    };

    // 创建并挂载Vue应用
    const app = createApp(ProfileApp);
    app.mount('#app');

  } catch (error) {
    console.error('应用初始化失败:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 20px; text-align: center; color: #721c24; background: #f8d7da; border-radius: 8px; margin: 20px;">
        <h2>应用加载失败</h2>
        <p>错误: ${error.message}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">重新加载</button>
      </div>
    `;
  }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);