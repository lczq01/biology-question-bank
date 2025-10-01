import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { 
  validateRequired, 
  validateEmail, 
  validatePassword, 
  validateUsername 
} from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 * @body    { username, email, password, role, profile: { firstName, lastName, grade?, class? } }
 */
router.post('/register', [
  validateRequired(['username', 'email', 'password', 'role', 'profile']),
  validateUsername,
  validateEmail,
  validatePassword,
  (req, res, next) => {
    // 验证profile字段
    const { profile } = req.body;
    if (!profile || !profile.firstName || !profile.lastName) {
      return res.status(400).json({
        success: false,
        message: '姓名信息不能为空'
      });
    }
    next();
  }
], register);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 * @body    { username, password }
 */
router.post('/login', [
  validateRequired(['username', 'password'])
], login);

export default router;