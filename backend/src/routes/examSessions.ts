// 考试会话路由
import { Router } from 'express';
import { 
  createExamSession, 
  getExamSessions, 
  getExamSessionById, 
  updateExamSession,
  updateExamSessionStatus,
  batchUpdateExamSessionStatus,
  getStatusTransitionRules,
  deleteExamSession
} from '../controllers/examSessionController';
import {
  getExamSessionStatistics,
  getSystemStatistics,
  getParticipantsStatistics
} from '../controllers/examStatisticsController';
import {
  addParticipants,
  removeParticipants,
  getParticipants,
  batchAddParticipants,
  batchRemoveParticipants
} from '../controllers/examParticipantController';
import {
  joinExamSession,
  getAvailableExamSessions,
  getExamSessionStudentView
} from '../controllers/examSessionJoinController';
import {
  startExam,
  getExamProgress
} from '../controllers/examStartController';
import { checkPermission } from '../middleware/examSessionAuth';
import { ExamManagementPermission } from '../types/exam-management.types';
import { mockAuthenticate } from '../middleware/mockAuth';

const router = Router();

// 所有路由都需要身份验证 - 使用mock认证用于前端测试
router.use(mockAuthenticate);

/**
 * @route GET /api/exam-sessions
 * @desc 获取考试会话列表
 * @access 需要 exam:session:read 权限 (admin, teacher, student)
 */
router.get(
  '/',
  checkPermission(ExamManagementPermission.READ_SESSION),
  getExamSessions
);

/**
 * @route GET /api/exam-sessions/available
 * @desc 获取用户可参与的考试会话列表
 * @access 学生权限
 */
router.get(
  '/available',
  getAvailableExamSessions
);

/**
 * @route GET /api/exam-sessions/status-rules
 * @desc 获取状态转换规则
 * @access 公共接口
 */
router.get(
  '/status-rules',
  getStatusTransitionRules
);

/**
 * @route GET /api/exam-sessions/statistics/system
 * @desc 获取系统整体统计数据
 * @access 需要管理员权限
 */
router.get(
  '/statistics/system',
  checkPermission(ExamManagementPermission.READ_SESSION),
  getSystemStatistics
);

/**
 * @route PATCH /api/exam-sessions/batch-status
 * @desc 批量更新考试会话状态
 * @access 需要 exam:session:update 权限 (admin, teacher)
 */
router.patch(
  '/batch-status',
  checkPermission(ExamManagementPermission.UPDATE_SESSION),
  batchUpdateExamSessionStatus
);

/**
 * @route GET /api/exam-sessions/:id/statistics
 * @desc 获取考试会话统计数据
 * @access 需要 exam:session:read 权限 (admin, teacher)
 */
router.get(
  '/:id/statistics',
  checkPermission(ExamManagementPermission.READ_SESSION),
  getExamSessionStatistics
);

/**
 * @route GET /api/exam-sessions/:id/participants-statistics
 * @desc 获取考试参与者统计数据
 * @access 需要 exam:session:read 权限 (admin, teacher)
 */
router.get(
  '/:id/participants-statistics',
  checkPermission(ExamManagementPermission.READ_SESSION),
  getParticipantsStatistics
);

/**
 * @route GET /api/exam-sessions/:id/participants
 * @desc 获取考试参与者列表
 * @access 需要 exam:session:read 权限 (admin, teacher, 参与者本人)
 */
router.get(
  '/:id/participants',
  checkPermission(ExamManagementPermission.READ_SESSION),
  getParticipants
);

/**
 * @route POST /api/exam-sessions/:id/participants
 * @desc 添加考试参与者
 * @access 需要 exam:session:update 权限 (admin, teacher)
 */
router.post(
  '/:id/participants',
  checkPermission(ExamManagementPermission.UPDATE_SESSION),
  addParticipants
);

/**
 * @route DELETE /api/exam-sessions/:id/participants
 * @desc 移除考试参与者
 * @access 需要 exam:session:update 权限 (admin, teacher)
 */
router.delete(
  '/:id/participants',
  checkPermission(ExamManagementPermission.UPDATE_SESSION),
  removeParticipants
);

/**
 * @route POST /api/exam-sessions/:id/participants/batch-add
 * @desc 批量添加参与者
 * @access 需要 exam:session:update 权限 (admin, teacher)
 */
router.post(
  '/:id/participants/batch-add',
  checkPermission(ExamManagementPermission.UPDATE_SESSION),
  batchAddParticipants
);

/**
 * @route POST /api/exam-sessions/:id/participants/batch-remove
 * @desc 批量移除参与者
 * @access 需要 exam:session:update 权限 (admin, teacher)
 */
router.post(
  '/:id/participants/batch-remove',
  checkPermission(ExamManagementPermission.UPDATE_SESSION),
  batchRemoveParticipants
);

/**
 * @route GET /api/exam-sessions/:id/student-view
 * @desc 获取考试会话详情（学生视角）
 * @access 学生权限
 */
router.get(
  '/:id/student-view',
  getExamSessionStudentView
);

/**
 * @route POST /api/exam-sessions/:id/join
 * @desc 学生加入考试会话
 * @access 学生权限
 */
router.post(
  '/:id/join',
  joinExamSession
);

/**
 * @route POST /api/exam-sessions/:id/start
 * @desc 开始考试
 * @access 学生权限
 */
router.post(
  '/:id/start',
  startExam
);

/**
 * @route GET /api/exam-sessions/:id/progress
 * @desc 获取考试进度
 * @access 学生权限
 */
router.get(
  '/:id/progress',
  getExamProgress
);

/**
 * @route GET /api/exam-sessions/:id
 * @desc 获取单个考试会话详情
 * @access 需要 exam:session:read 权限 (admin, teacher, student)
 */
router.get(
  '/:id',
  checkPermission(ExamManagementPermission.READ_SESSION),
  getExamSessionById
);

/**
 * @route POST /api/exam-sessions
 * @desc 创建新的考试会话
 * @access 需要 exam:session:create 权限 (admin, teacher)
 */
router.post(
  '/',
  checkPermission(ExamManagementPermission.CREATE_SESSION),
  createExamSession
);

/**
 * @route PUT /api/exam-sessions/:id
 * @desc 更新考试会话
 * @access 需要 exam:session:update 权限 (admin, teacher)
 */
router.put(
  '/:id',
  checkPermission(ExamManagementPermission.UPDATE_SESSION),
  updateExamSession
);

/**
 * @route PATCH /api/exam-sessions/:id/status
 * @desc 更新考试会话状态
 * @access 需要 exam:session:update 权限 (admin, teacher)
 */
router.patch(
  '/:id/status',
  checkPermission(ExamManagementPermission.UPDATE_SESSION),
  updateExamSessionStatus
);

/**
 * @route DELETE /api/exam-sessions/:id
 * @desc 删除考试会话
 * @access 需要 exam:session:delete 权限 (admin, teacher)
 */
router.delete(
  '/:id',
  checkPermission(ExamManagementPermission.DELETE_SESSION),
  deleteExamSession
);

export default router;