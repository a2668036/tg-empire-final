#!/usr/bin/env node

/**
 * API问题调试脚本
 * 详细调试API错误，获取具体错误信息
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_TELEGRAM_ID = '999888777';

// 创建API客户端
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-telegram-id': TEST_TELEGRAM_ID
  }
});

async function debugAPIs() {
  console.log('🔍 开始API问题调试...\n');
  
  // 1. 调试用户更新API
  console.log('🔧 调试用户更新API...');
  try {
    const updateData = { profile_bio: '测试用户简介' };
    const response = await api.put('/users/me', updateData);
    console.log('✅ 用户更新成功:', response.data);
  } catch (error) {
    console.log('❌ 用户更新失败:');
    console.log('  状态码:', error.response?.status);
    console.log('  错误信息:', error.response?.data);
    console.log('  完整错误:', error.message);
  }
  
  // 2. 调试签到API
  console.log('\n🔧 调试签到API...');
  try {
    const response = await api.post('/users/check-in');
    console.log('✅ 签到成功:', response.data);
  } catch (error) {
    console.log('❌ 签到失败:');
    console.log('  状态码:', error.response?.status);
    console.log('  错误信息:', error.response?.data);
    console.log('  完整错误:', error.message);
  }
  
  // 3. 检查用户是否存在
  console.log('\n🔧 检查用户信息...');
  try {
    const response = await api.get('/users/me');
    console.log('✅ 用户信息:', {
      id: response.data.id,
      telegram_id: response.data.telegram_id,
      username: response.data.username,
      last_check_in_date: response.data.last_check_in_date,
      consecutive_check_ins: response.data.consecutive_check_ins
    });
  } catch (error) {
    console.log('❌ 获取用户信息失败:');
    console.log('  状态码:', error.response?.status);
    console.log('  错误信息:', error.response?.data);
  }
  
  // 4. 测试直接数据库查询（通过API）
  console.log('\n🔧 测试其他API...');
  
  // 测试签到状态
  try {
    const response = await api.get('/check-in/status');
    console.log('✅ 签到状态:', response.data);
  } catch (error) {
    console.log('❌ 签到状态查询失败:', error.response?.data || error.message);
  }
  
  // 测试声望统计
  try {
    const response = await api.get('/reputation/stats');
    console.log('✅ 声望统计:', response.data);
  } catch (error) {
    console.log('❌ 声望统计查询失败:', error.response?.data || error.message);
  }
}

// 运行调试
debugAPIs().catch(console.error);
