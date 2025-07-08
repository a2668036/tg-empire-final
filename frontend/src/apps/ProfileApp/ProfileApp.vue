<template>
  <div class="profile-app">
    <div v-if="loading" class="loading">
      加载中...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="profile-container">
      <div class="profile-header">
        <h1>{{ user.first_name }} {{ user.last_name }}</h1>
        <div class="username" v-if="user.username">@{{ user.username }}</div>
        <div class="username" v-else>{{ user.first_name || 'TG用户' }}</div>
      </div>
      
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-value" :class="{ 'value-changing': isReputationChanging }">
            {{ animatedReputationPoints }}
          </div>
          <div class="stat-label">声望</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ user.empire_stars }}</div>
          <div class="stat-label">帝国之星</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ user.consecutive_check_ins }}</div>
          <div class="stat-label">连续签到</div>
        </div>
      </div>
      
      <div class="action-button" @click="checkIn" :class="{ disabled: checkedInToday, checking: isCheckingIn }">
        <span v-if="isCheckingIn" class="checking-text">
          <span class="spinner"></span>
          签到中...
        </span>
        <span v-else>
          {{ checkedInToday ? '今日已签到' : '每日签到' }}
        </span>
      </div>

      <!-- 签到成功动画 -->
      <div v-if="showCheckInAnimation" class="check-in-animation">
        <div class="animation-content">
          <div class="success-icon">✓</div>
          <div class="success-text">签到成功！</div>
          <div class="points-earned">+{{ lastCheckInPoints }} 声望点</div>
        </div>
      </div>
      
      <!-- 新增的标签导航栏 -->
      <div class="tabs">
        <div class="tab" 
          :class="{ active: activeTab === 'stats' }" 
          @click="activeTab = 'stats'">
          统计数据
        </div>
        <div class="tab" 
          :class="{ active: activeTab === 'checkin' }" 
          @click="switchToCheckInTab">
          签到记录
        </div>
        <div class="tab" 
          :class="{ active: activeTab === 'reputation' }" 
          @click="switchToReputationTab">
          声誉历史
        </div>
      </div>
      
      <!-- 统计数据面板 -->
      <div v-if="activeTab === 'stats'" class="panel">
        <div v-if="loadingStats" class="loading-inline">加载中...</div>
        <div v-else>
          <div class="panel-header">数据概览</div>
          
          <div class="stats-grid">
            <!-- 签到统计 -->
            <div class="stats-card">
              <div class="stats-card-title">签到统计</div>
              <div class="stats-card-content">
                <div class="stats-card-item">
                  <div class="stats-card-label">总签到天数</div>
                  <div class="stats-card-value">{{ checkInStats.totalDays }}</div>
                </div>
                <div class="stats-card-item">
                  <div class="stats-card-label">本月签到天数</div>
                  <div class="stats-card-value">{{ checkInStats.monthDays }}</div>
                </div>
                <div class="stats-card-item">
                  <div class="stats-card-label">连续签到天数</div>
                  <div class="stats-card-value">{{ user.consecutive_check_ins }}</div>
                </div>
                <div class="stats-card-item">
                  <div class="stats-card-label">累计获得声誉</div>
                  <div class="stats-card-value">{{ checkInStats.totalPoints }}</div>
                </div>
              </div>
            </div>
            
            <!-- 声誉统计 -->
            <div class="stats-card">
              <div class="stats-card-title">声誉统计</div>
              <div class="stats-card-content">
                <div class="stats-card-item">
                  <div class="stats-card-label">当前声誉点数</div>
                  <div class="stats-card-value">{{ reputationStats.currentPoints }}</div>
                </div>
                <div class="stats-card-item">
                  <div class="stats-card-label">历史总收入</div>
                  <div class="stats-card-value">{{ reputationStats.totalIncome }}</div>
                </div>
                <div class="stats-card-item">
                  <div class="stats-card-label">历史总支出</div>
                  <div class="stats-card-value">{{ reputationStats.totalExpense }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 签到历史面板 -->
      <div v-if="activeTab === 'checkin'" class="panel">
        <div v-if="loadingCheckInHistory" class="loading-inline">加载中...</div>
        <div v-else>
          <div class="panel-header">签到记录</div>
          
          <div v-if="checkInHistory.records.length === 0" class="no-data">
            暂无签到记录
          </div>
          <div v-else class="history-list">
            <div v-for="(record, index) in checkInHistory.records" :key="index" class="history-item">
              <div class="history-date">{{ formatDate(record.check_in_date) }}</div>
              <div class="history-details">
                <div class="history-points">+{{ record.reputation_earned }}</div>
                <div class="history-info">
                  {{ record.is_consecutive ? `连续第${record.consecutive_days}天` : '签到' }}
                </div>
              </div>
            </div>
            
            <!-- 分页控件 -->
            <div class="pagination">
              <div class="pagination-info">
                显示 {{ checkInHistory.records.length }} 条，共 {{ checkInHistory.total }} 条
              </div>
              <div class="pagination-buttons">
                <button 
                  class="pagination-button" 
                  :disabled="checkInPage === 1"
                  @click="loadCheckInHistory(checkInPage - 1)">
                  上一页
                </button>
                <span class="pagination-page">{{ checkInPage }}</span>
                <button 
                  class="pagination-button" 
                  :disabled="checkInPage * checkInHistory.limit >= checkInHistory.total"
                  @click="loadCheckInHistory(checkInPage + 1)">
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 声誉历史面板 -->
      <div v-if="activeTab === 'reputation'" class="panel">
        <div v-if="loadingReputationHistory" class="loading-inline">加载中...</div>
        <div v-else>
          <div class="panel-header">声誉历史</div>
          
          <div v-if="reputationHistory.records.length === 0" class="no-data">
            暂无声誉记录
          </div>
          <div v-else class="history-list">
            <div v-for="(record, index) in reputationHistory.records" :key="index" class="history-item">
              <div class="history-date">{{ formatDateTime(record.created_at) }}</div>
              <div class="history-details">
                <div class="history-points" :class="{ 'negative': record.points_change < 0 }">
                  {{ record.points_change > 0 ? '+' : '' }}{{ record.points_change }}
                </div>
                <div class="history-info">
                  {{ record.reason }}
                </div>
              </div>
            </div>
            
            <!-- 分页控件 -->
            <div class="pagination">
              <div class="pagination-info">
                显示 {{ reputationHistory.records.length }} 条，共 {{ reputationHistory.total }} 条
              </div>
              <div class="pagination-buttons">
                <button 
                  class="pagination-button" 
                  :disabled="reputationPage === 1"
                  @click="loadReputationHistory(reputationPage - 1)">
                  上一页
                </button>
                <span class="pagination-page">{{ reputationPage }}</span>
                <button 
                  class="pagination-button" 
                  :disabled="reputationPage * reputationHistory.limit >= reputationHistory.total"
                  @click="loadReputationHistory(reputationPage + 1)">
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { apiService } from '../../utils/apiService';
import { webAppSdk } from '../../utils/webAppSdk';

export default {
  name: 'ProfileApp',
  setup() {
    const user = ref({
      first_name: '',
      last_name: '',
      username: '',
      reputation_points: 0,
      empire_stars: 0,
      consecutive_check_ins: 0,
      last_check_in_date: null
    });
    const loading = ref(true);
    const error = ref(null);
    const checkedInToday = ref(false);

    // 动画相关状态
    const isCheckingIn = ref(false);
    const showCheckInAnimation = ref(false);
    const lastCheckInPoints = ref(0);
    const isReputationChanging = ref(false);
    const animatedReputationPoints = ref(0);
    
    // 新增的状态变量
    const activeTab = ref('stats');
    const loadingStats = ref(false);
    const loadingCheckInHistory = ref(false);
    const loadingReputationHistory = ref(false);
    
    const checkInHistory = ref({
      records: [],
      total: 0,
      limit: 30,
      offset: 0
    });
    
    const reputationHistory = ref({
      records: [],
      total: 0,
      limit: 20,
      offset: 0
    });
    
    const checkInStats = ref({
      totalDays: 0,
      monthDays: 0,
      totalPoints: 0
    });
    
    const reputationStats = ref({
      currentPoints: 0,
      totalIncome: 0,
      totalExpense: 0,
      incomeBySource: {},
      expenseBySource: {}
    });
    
    const checkInPage = ref(1);
    const reputationPage = ref(1);
    
    const fetchUserData = async () => {
      try {
        loading.value = true;
        console.log('开始获取用户数据...');

        // 检查Telegram WebApp数据
        const initData = webAppSdk.getInitData();
        console.log('Telegram initData:', initData);

        const userData = await apiService.getCurrentUser();
        console.log('获取到用户数据:', userData);
        console.log('用户数据类型:', typeof userData);
        console.log('用户数据字段:', Object.keys(userData || {}));
        user.value = userData;

        // 初始化动画数值
        animatedReputationPoints.value = userData.reputation_points;

        // 检查是否已经签到
        if (user.value.last_check_in_date) {
          const lastCheckIn = new Date(user.value.last_check_in_date);
          const today = new Date();
          checkedInToday.value =
            lastCheckIn.getDate() === today.getDate() &&
            lastCheckIn.getMonth() === today.getMonth() &&
            lastCheckIn.getFullYear() === today.getFullYear();
        }

        error.value = null;
      } catch (err) {
        console.error('获取用户数据失败:', err);
        error.value = '获取用户数据失败: ' + err.message;

        // 如果用户不存在，尝试注册
        if (err.response && err.response.status === 404) {
          try {
            console.log('用户不存在，尝试注册...');
            const initData = webAppSdk.getInitData();
            if (initData && initData.user) {
              const registerData = {
                telegram_id: initData.user.id,
                username: initData.user.username || '',
                first_name: initData.user.first_name || '',
                last_name: initData.user.last_name || ''
              };
              console.log('注册数据:', registerData);

              const response = await fetch('/api/v1/users/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
              });

              if (response.ok) {
                const registerResponse = await response.json();
                console.log('注册成功:', registerResponse);
                if (registerResponse.success && registerResponse.data) {
                  user.value = registerResponse.data;
                  error.value = null;
                } else {
                  throw new Error('注册响应格式错误');
                }
              } else {
                throw new Error('注册请求失败');
              }
            }
          } catch (registerErr) {
            console.error('注册失败:', registerErr);
            error.value = '用户注册失败: ' + registerErr.message;
          }
        }
      } finally {
        loading.value = false;
      }
    };
    
    const checkIn = async () => {
      if (checkedInToday.value || isCheckingIn.value) return;

      try {
        isCheckingIn.value = true;
        const oldReputationPoints = user.value.reputation_points;

        const result = await apiService.checkIn();

        // 记录获得的点数
        lastCheckInPoints.value = result.rewards?.totalPoints || 5;

        // 更新用户数据
        await fetchUserData();

        // 播放数值变化动画
        animateReputationChange(oldReputationPoints, user.value.reputation_points);

        // 显示签到成功动画
        showCheckInSuccessAnimation();

      } catch (err) {
        console.error('签到失败:', err);
        if (err.response?.data?.error === '今日已完成签到') {
          checkedInToday.value = true;
          webAppSdk.showPopup({
            message: '今日已完成签到',
            buttons: [{ type: 'ok' }]
          });
        } else {
          webAppSdk.showPopup({
            message: '签到失败，请稍后再试',
            buttons: [{ type: 'ok' }]
          });
        }
      } finally {
        isCheckingIn.value = false;
      }
    };
    
    // 加载签到历史
    const loadCheckInHistory = async (page = 1) => {
      try {
        loadingCheckInHistory.value = true;
        checkInPage.value = page;
        const result = await apiService.getCheckInHistory({ 
          limit: checkInHistory.value.limit, 
          page: page 
        });
        checkInHistory.value = result;
      } catch (err) {
        console.error('获取签到历史失败:', err);
        webAppSdk.showPopup({
          message: '获取签到历史失败，请稍后再试',
          buttons: [{ type: 'ok' }]
        });
      } finally {
        loadingCheckInHistory.value = false;
      }
    };
    
    // 加载声誉历史
    const loadReputationHistory = async (page = 1) => {
      try {
        loadingReputationHistory.value = true;
        reputationPage.value = page;
        const result = await apiService.getReputationHistory({
          limit: reputationHistory.value.limit,
          page: page
        });
        reputationHistory.value = result;
      } catch (err) {
        console.error('获取声誉历史失败:', err);
        webAppSdk.showPopup({
          message: '获取声誉历史失败，请稍后再试',
          buttons: [{ type: 'ok' }]
        });
      } finally {
        loadingReputationHistory.value = false;
      }
    };
    
    // 加载统计数据
    const loadStats = async () => {
      try {
        loadingStats.value = true;
        
        // 并行请求签到统计和声誉统计
        const [checkInStatsData, reputationStatsData] = await Promise.all([
          apiService.getCheckInStats(),
          apiService.getReputationStats()
        ]);
        
        checkInStats.value = checkInStatsData;
        reputationStats.value = reputationStatsData;
      } catch (err) {
        console.error('获取统计数据失败:', err);
        webAppSdk.showPopup({
          message: '获取统计数据失败，请稍后再试',
          buttons: [{ type: 'ok' }]
        });
      } finally {
        loadingStats.value = false;
      }
    };
    
    // 切换到签到历史标签
    const switchToCheckInTab = () => {
      activeTab.value = 'checkin';
      if (checkInHistory.value.records.length === 0) {
        loadCheckInHistory();
      }
    };
    
    // 切换到声誉历史标签
    const switchToReputationTab = () => {
      activeTab.value = 'reputation';
      if (reputationHistory.value.records.length === 0) {
        loadReputationHistory();
      }
    };

    // 动画函数
    const animateReputationChange = (fromValue, toValue) => {
      isReputationChanging.value = true;
      const duration = 1000; // 1秒动画
      const startTime = Date.now();
      const difference = toValue - fromValue;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        animatedReputationPoints.value = Math.round(fromValue + difference * easeOutQuart);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isReputationChanging.value = false;
        }
      };

      animate();
    };

    const showCheckInSuccessAnimation = () => {
      showCheckInAnimation.value = true;
      setTimeout(() => {
        showCheckInAnimation.value = false;
      }, 2000);
    };
    
    // 日期格式化函数
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // 日期时间格式化函数
    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return `${formatDate(dateString)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    onMounted(async () => {
      await fetchUserData();
      loadStats();
    });
    
    return {
      user,
      loading,
      error,
      checkedInToday,
      checkIn,
      activeTab,
      loadingStats,
      loadingCheckInHistory,
      loadingReputationHistory,
      checkInHistory,
      reputationHistory,
      checkInStats,
      reputationStats,
      checkInPage,
      reputationPage,
      loadCheckInHistory,
      loadReputationHistory,
      switchToCheckInTab,
      switchToReputationTab,
      formatDate,
      formatDateTime,
      // 动画相关
      isCheckingIn,
      showCheckInAnimation,
      lastCheckInPoints,
      isReputationChanging,
      animatedReputationPoints
    };
  }
}
</script>

<style scoped>
.profile-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  max-width: 100%;
  padding: 16px;
  color: var(--tg-theme-text-color, #000000);
  background-color: var(--tg-theme-bg-color, #ffffff);
  min-height: 100vh;
}

.loading, .error {
  text-align: center;
  padding: 40px 0;
}

.loading-inline {
  text-align: center;
  padding: 20px 0;
}

.error {
  color: #e74c3c;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header {
  text-align: center;
}

.profile-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.username {
  color: var(--tg-theme-hint-color, #999999);
  font-size: 16px;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--tg-theme-button-color, #2481cc);
  transition: all 0.3s ease;
}

.stat-value.value-changing {
  color: #4caf50;
  transform: scale(1.1);
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.stat-label {
  font-size: 14px;
  color: var(--tg-theme-hint-color, #999999);
}

.action-button {
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #ffffff);
  padding: 12px;
  text-align: center;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-button:active {
  opacity: 0.8;
}

.action-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.checking {
  background-color: #ffa726;
  cursor: not-allowed;
}

.checking-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 签到成功动画 */
.check-in-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in;
}

.animation-content {
  background: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  animation: bounceIn 0.6s ease-out;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.success-icon {
  font-size: 60px;
  color: #4caf50;
  margin-bottom: 20px;
  animation: pulse 1s ease-in-out;
}

.success-text {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.points-earned {
  font-size: 18px;
  color: #4caf50;
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 新增样式 */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--tg-theme-hint-color, #cccccc);
  margin-bottom: 15px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  color: var(--tg-theme-hint-color, #999999);
  font-weight: 500;
  transition: all 0.2s;
}

.tab.active {
  color: var(--tg-theme-button-color, #2481cc);
  border-bottom: 2px solid var(--tg-theme-button-color, #2481cc);
}

.panel {
  margin-top: 10px;
}

.panel-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stats-card {
  background-color: var(--tg-theme-secondary-bg-color, #f0f2f5);
  border-radius: 8px;
  padding: 15px;
}

.stats-card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.stats-card-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
}

.stats-card-item {
  display: flex;
  flex-direction: column;
}

.stats-card-label {
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
}

.stats-card-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--tg-theme-text-color, #000000);
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  padding: 15px 0;
  border-bottom: 1px solid var(--tg-theme-secondary-bg-color, #f0f2f5);
  display: flex;
  flex-direction: column;
}

.history-date {
  font-size: 14px;
  color: var(--tg-theme-hint-color, #999999);
  margin-bottom: 5px;
}

.history-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-points {
  font-size: 16px;
  font-weight: 600;
  color: #27ae60;
}

.history-points.negative {
  color: #e74c3c;
}

.history-info {
  font-size: 14px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.pagination-info {
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-button {
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page {
  font-size: 14px;
  font-weight: 600;
}

.no-data {
  text-align: center;
  padding: 20px 0;
  color: var(--tg-theme-hint-color, #999999);
}
</style> 