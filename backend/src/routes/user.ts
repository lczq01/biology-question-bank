import { Router } from 'express';
import { getCurrentUser, updateProfile, changePassword } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateRequired, validatePassword } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/user/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', authenticate, getCurrentUser);

/**
 * @route   PUT /api/user/profile
 * @desc    更新用户个人信息
 * @access  Private
 * @body    { profile: { firstName?, lastName?, grade?, class?, avatar? } }
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PUT /api/user/password
 * @desc    修改密码
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/password', [
  authenticate,
  validateRequired(['currentPassword', 'newPassword']),
  validatePassword
], changePassword);

export default router;