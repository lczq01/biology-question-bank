import express from 'express';
import { 
  getAvailablePapers, 
  startExam, 
  getExamDetails, 
  submitAnswer, 
  submitExam, 
  getStudentExamHistory 
} from '../controllers/examController';
import {
  completeExam,
  getExamResult,
  getExamHistory,
  getExamStatistics,
  reGradeExam
} from '../controllers/examResultController';
import { mockAuthenticate } from '../middleware/mockAuth';

const router = express.Router();

// 所有考试相关路由都需要认证
router.use(mockAuthenticate);

// 获取可用试卷列表（学生用）
router.get('/papers', getAvailablePapers);

// 开始考试
router.post('/start', startExam);

// 提交单题答案
router.post('/answer', submitAnswer);

// 提交考试
router.post('/submit', submitExam);

// 获取学生考试历史
router.get('/history/student', getStudentExamHistory);

// 考试结果相关路由
// 完成考试并计算结果
router.post('/complete', completeExam);

// 获取考试结果
router.get('/result/:recordId', getExamResult);

// 获取考试历史记录
router.get('/history', getExamHistory);

// 获取考试统计信息
router.get('/statistics', getExamStatistics);

// 重新评分（管理员功能）
router.post('/regrade/:recordId', reGradeExam);

// 获取考试详情（放在最后，避免拦截其他路由）
router.get('/:examId', getExamDetails);

export default router;