import express from 'express';
import {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionStats,
  batchImportQuestions
} from '../controllers/questionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 获取题目统计信息（公开）
router.get('/stats', getQuestionStats);

// 获取题目列表（公开）
router.get('/', getQuestions);

// 获取单个题目（公开）
router.get('/:id', getQuestion);

// 以下路由需要认证
router.use(authenticate);

// 创建题目
router.post('/', createQuestion);

// 更新题目
router.put('/:id', updateQuestion);

// 删除题目
router.delete('/:id', deleteQuestion);

// 批量导入题目
router.post('/batch-import', batchImportQuestions);

export default router;