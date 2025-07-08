import axios from 'axios';
import { webAppSdk } from './webAppSdk';

// 创建Axios实例
const api = axios.create({
  baseURL: '/api/v1', // 使用相对路径，通过Vite代理
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加Telegram用户ID
api.interceptors.request.use(config => {
  const telegramInitData = webAppSdk.getInitData();
  
  if (telegramInitData && telegramInitData.user) {
    config.headers['x-telegram-id'] = telegramInitData.user.id;
  }
  
  return config;
});

// API服务
export const apiService = {
  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} 用户数据对象
   */
  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data.data; // 提取嵌套的用户数据
  },
  
  /**
   * 更新用户信息
   * @param {Object} userData 要更新的用户数据
   * @returns {Promise<Object>} 更新后的用户数据
   */
  async updateUser(userData) {
    const response = await api.put('/users/me', userData);
    return response.data.data; // 提取嵌套的用户数据
  },
  
  /**
   * 用户签到
   * @returns {Promise<Object>} 签到结果
   */
  async checkIn() {
    const response = await api.post('/users/check-in');
    return response.data;
  },
  
  /**
   * 获取签到历史记录
   * @param {Object} params 查询参数 {limit, page}
   * @returns {Promise<Object>} 签到历史记录
   */
  async getCheckInHistory(params = { limit: 30, page: 1 }) {
    const response = await api.get('/check-in/history', { params });
    return response.data;
  },
  
  /**
   * 获取签到状态
   * @returns {Promise<Object>} 签到状态信息
   */
  async getCheckInStatus() {
    const response = await api.get('/check-in/status');
    return response.data;
  },
  
  /**
   * 获取签到统计数据
   * @returns {Promise<Object>} 签到统计数据
   */
  async getCheckInStats() {
    const response = await api.get('/check-in/stats');
    return response.data;
  },
  
  /**
   * 获取声誉历史记录
   * @param {Object} params 查询参数 {limit, page}
   * @returns {Promise<Object>} 声誉历史记录
   */
  async getReputationHistory(params = { limit: 20, page: 1 }) {
    const response = await api.get('/reputation/history', { params });
    return response.data;
  },
  
  /**
   * 获取声誉统计数据
   * @returns {Promise<Object>} 声誉统计数据
   */
  async getReputationStats() {
    const response = await api.get('/reputation/stats');
    return response.data;
  }
}; 