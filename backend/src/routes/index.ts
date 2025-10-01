import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';

const router = Router();

// 路由配置
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '高中生物题库系统API运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;