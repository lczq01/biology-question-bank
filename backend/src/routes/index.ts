import { Router } from 'express';
import authRoutes from './auth';
import authRealRoutes from './authReal';
import userRoutes from './user';
import questionRoutes from './questions';
import uploadRoutes from './upload';
import examPaperRoutes from './examPaper';
import examRoutes from './exam';
import knowledgePointRoutes from './knowledgePoint';
import examSessionRoutes from './examSessions';


const router = Router();

// 路由配置
router.use('/auth', authRoutes);
router.use('/auth-real', authRealRoutes);
router.use('/user', userRoutes);
router.use('/questions', questionRoutes);
router.use('/upload', uploadRoutes);
router.use('/exam-paper', examPaperRoutes);
router.use('/exam', examRoutes);
router.use('/knowledge-points', knowledgePointRoutes);
router.use('/exam-sessions', examSessionRoutes);


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