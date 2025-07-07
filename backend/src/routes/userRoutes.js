const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

/**
 * @route POST /api/v1/users/register
 * @desc 注册新用户
 * @access Public
 */
router.post('/register', userController.register);

/**
 * @route GET /api/v1/users/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me', userController.getMe);

/**
 * @route PUT /api/v1/users/me
 * @desc 更新当前用户信息
 * @access Private
 */
router.put('/me', userController.update);

/**
 * @route POST /api/v1/users/check-in
 * @desc 用户每日签到
 * @access Private
 */
router.post('/check-in', userController.checkIn);

module.exports = router; 