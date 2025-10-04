import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { validateRequired, validateEmail, validatePassword } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/auth-real/register
 * @desc    用户注册 - 使用真实JWT认证
 * @access  Public
 * @body    { username, email, password, role? }
 */
router.post('/register', [
  validateRequired(['username', 'email', 'password']),
  validateEmail,
  validatePassword
], register);

/**
 * @route   POST /api/auth-real/login
 * @desc    用户登录 - 使用真实JWT认证
 * @access  Public
 * @body    { username, password }
 */
router.post('/login', [
  validateRequired(['username', 'password'])
], login);

export default router;