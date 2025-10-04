import express from 'express';
import { 
  getAvailablePapers, 
  startExam, 
  getExamDetails, 
  submitAnswer, 
  submitExam, 
  getStudentExamHistory 
} from '../controllers/examController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 所有考试相关路由都需要认证
router.use(authenticate);

// 获取可用试卷列表（学生用）
router.get('/papers', getAvailablePapers);

// 开始考试
router.post('/start', startExam);

// 获取考试详情
router.get('/:examId', getExamDetails);

// 提交单题答案
router.post('/answer', submitAnswer);

// 提交考试
router.post('/submit', submitExam);

// 获取学生考试历史
router.get('/history/student', getStudentExamHistory);

export default router;