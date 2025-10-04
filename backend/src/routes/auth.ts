import { Router } from 'express';
import { mockAuthService } from '../utils/mockAuth';

const router = Router();

// 用户登录 - 使用模拟认证
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    
    const result = await mockAuthService.login(username, password);

    
    if (result.success) {
      res.json({
        success: true,
        data: {
          token: result.token,
          user: result.user
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 用户注册 - 使用模拟认证
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    
    const result = await mockAuthService.register({ username, password, email, role });

    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
});

// 获取当前用户信息 - 使用模拟认证
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const result = await mockAuthService.verifyToken(token);

    
    if (result.success) {
      res.json({
        success: true,
        data: result.user
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(401).json({
      success: false,
      message: '认证令牌无效'
    });
  }
});

export default router;