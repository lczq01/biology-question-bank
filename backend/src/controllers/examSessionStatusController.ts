import { Request, Response } from 'express';
import { ExamSession } from '../models/ExamSession';
import { ExamSessionStatus } from '../types/exam-session.types';
import { errorResponse } from '../utils/response';

/**
 * 状态转换规则定义
 */
const STATUS_TRANSITIONS: Record<ExamSessionStatus, ExamSessionStatus[]> = {
  [ExamSessionStatus.DRAFT]: [ExamSessionStatus.PUBLISHED, ExamSessionStatus.CANCELLED],
  [ExamSessionStatus.PUBLISHED]: [ExamSessionStatus.ACTIVE, ExamSessionStatus.CANCELLED],
  [ExamSessionStatus.ACTIVE]: [ExamSessionStatus.COMPLETED, ExamSessionStatus.CANCELLED],
  [ExamSessionStatus.COMPLETED]: [], // 已完成的考试不能再转换
  [ExamSessionStatus.CANCELLED]: []  // 已取消的考试不能再转换
};

/**
 * 状态转换描述
 */
const STATUS_DESCRIPTIONS: Record<ExamSessionStatus, string> = {
  [ExamSessionStatus.DRAFT]: '草稿',
  [ExamSessionStatus.PUBLISHED]: '已发布',
  [ExamSessionStatus.ACTIVE]: '进行中',
  [ExamSessionStatus.COMPLETED]: '已结束',
  [ExamSessionStatus.CANCELLED]: '已取消'
};

/**
 * 验证状态转换是否合法
 */
const isValidStatusTransition = (currentStatus: ExamSessionStatus, targetStatus: ExamSessionStatus): boolean => {
  return STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
};

/**
 * 验证时间约束
 */
const validateTimeConstraints = (session: any, targetStatus: ExamSessionStatus): string | null => {
  const now = new Date();
  
  switch (targetStatus) {
    case ExamSessionStatus.PUBLISHED:
      // 发布时检查开始时间是否在未来
      if (session.startTime <= now) {
        return '考试开始时间必须在当前时间之后才能发布';
      }
      break;
      
    case ExamSessionStatus.ACTIVE:
      // 启动时检查是否在考试时间范围内
      if (now < session.startTime) {
        return '考试尚未到开始时间，无法启动';
      }
      if (now > session.endTime) {
        return '考试已超过结束时间，无法启动';
      }
      break;
      
    case ExamSessionStatus.COMPLETED:
      // 结束考试没有特殊时间约束
      break;
      
    case ExamSessionStatus.CANCELLED:
      // 取消考试没有特殊时间约束
      break;
  }
  
  return null;
};

/**
 * 更新考试状态API
 * @route PATCH /api/exam-sessions/:id/status
 * @desc 更新考试会话状态
 * @access 需要管理员权限
 */
export const updateExamSessionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    // 验证目标状态
    if (!targetStatus || !Object.values(ExamSessionStatus).includes(targetStatus)) {
      return errorResponse(res, '无效的目标状态', 400);
    }

    const targetStatusEnum = targetStatus as ExamSessionStatus;

    // 查找考试会话
    const session = await ExamSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '考试会话不存在',
        error: {
          code: 'SESSION_NOT_FOUND',
          details: `考试会话ID ${id} 不存在`
        }
      });
    }

    const currentStatus = session.status;

    // 检查状态是否需要改变
    if (currentStatus === targetStatusEnum) {
      return res.json({
        success: true,
        data: session,
        message: `考试状态已经是${STATUS_DESCRIPTIONS[targetStatusEnum]}`
      });
    }

    // 验证状态转换是否合法
    if (!isValidStatusTransition(currentStatus, targetStatusEnum)) {
      return errorResponse(res, 
        `无法从${STATUS_DESCRIPTIONS[currentStatus]}转换为${STATUS_DESCRIPTIONS[targetStatusEnum]}`, 
        400
      );
    }

    // 验证时间约束
    const timeError = validateTimeConstraints(session, targetStatusEnum);
    if (timeError) {
      return errorResponse(res, timeError, 400);
    }

    // 特殊处理：启动考试时的额外验证
    if (targetStatusEnum === ExamSessionStatus.ACTIVE) {
      // 检查是否有关联的试卷
      if (!session.paperId) {
        return errorResponse(res, '考试必须关联试卷才能启动', 400);
      }
    }

    // 更新状态
    session.status = targetStatusEnum;
    session.updatedAt = new Date();
    
    // 根据状态更新统计信息
    if (targetStatusEnum === ExamSessionStatus.ACTIVE) {
      // 启动考试时重置统计信息
      session.stats = {
        totalParticipants: 0,
        completedCount: 0,
        averageScore: 0,
        passRate: 0,
        averageTime: 0
      };
    }

    await session.save();

    // 返回更新后的数据
    const updatedSession = await ExamSession.findById(id)
      .populate('creatorId')
      .populate('paperId');

    res.json({
      success: true,
      data: updatedSession,
      message: `考试状态已更新为${STATUS_DESCRIPTIONS[targetStatusEnum]}`
    });

  } catch (error) {
    console.error('更新考试状态错误:', error);
    errorResponse(res, '服务器内部错误', 500);
  }
};

/**
 * 批量更新考试状态API
 * @route PATCH /api/exam-sessions/batch-status
 * @desc 批量更新考试会话状态
 * @access 需要管理员权限
 */
export const batchUpdateExamSessionStatus = async (req: Request, res: Response) => {
  try {
    const { sessionIds, status: targetStatus } = req.body;

    // 验证输入
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return errorResponse(res, '会话ID列表不能为空', 400);
    }

    if (!targetStatus || !Object.values(ExamSessionStatus).includes(targetStatus)) {
      return errorResponse(res, '无效的目标状态', 400);
    }

    const targetStatusEnum = targetStatus as ExamSessionStatus;

    interface BatchResult {
      sessionId: string;
      message?: string;
      error?: string;
    }

    const results: {
      success: BatchResult[];
      failed: BatchResult[];
    } = {
      success: [],
      failed: []
    };

    // 逐个处理每个会话
    for (const sessionId of sessionIds) {
      try {
        const session = await ExamSession.findById(sessionId);
        if (!session) {
          results.failed.push({
            sessionId,
            error: '考试会话不存在'
          });
          continue;
        }

        const currentStatus = session.status;

        // 跳过已经是目标状态的会话
        if (currentStatus === targetStatusEnum) {
          results.success.push({
            sessionId,
            message: `状态已经是${STATUS_DESCRIPTIONS[targetStatusEnum]}`
          });
          continue;
        }

        // 验证状态转换
        if (!isValidStatusTransition(currentStatus, targetStatusEnum)) {
          results.failed.push({
            sessionId,
            error: `无法从${STATUS_DESCRIPTIONS[currentStatus]}转换为${STATUS_DESCRIPTIONS[targetStatusEnum]}`
          });
          continue;
        }

        // 验证时间约束
        const timeError = validateTimeConstraints(session, targetStatusEnum);
        if (timeError) {
          results.failed.push({
            sessionId,
            error: timeError
          });
          continue;
        }

        // 更新状态
        session.status = targetStatusEnum;
        session.updatedAt = new Date();
        
        if (targetStatusEnum === ExamSessionStatus.ACTIVE) {
          session.stats = {
            totalParticipants: 0,
            completedCount: 0,
            averageScore: 0,
            passRate: 0,
            averageTime: 0
          };
        }

        await session.save();
        
        results.success.push({
          sessionId,
          message: `状态已更新为${STATUS_DESCRIPTIONS[targetStatusEnum]}`
        });

      } catch (error) {
        results.failed.push({
          sessionId,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `批量更新完成：成功${results.success.length}个，失败${results.failed.length}个`
    });

  } catch (error) {
    console.error('批量更新考试状态错误:', error);
    errorResponse(res, '服务器内部错误', 500);
  }
};

/**
 * 获取状态转换规则API
 * @route GET /api/exam-sessions/status-rules
 * @desc 获取考试状态转换规则
 * @access 公共接口
 */
export const getStatusTransitionRules = async (req: Request, res: Response) => {
  try {
    const rules = Object.entries(STATUS_TRANSITIONS).map(([currentStatus, allowedTransitions]) => ({
      currentStatus,
      currentStatusName: STATUS_DESCRIPTIONS[currentStatus as ExamSessionStatus],
      allowedTransitions: allowedTransitions.map(status => ({
        status,
        statusName: STATUS_DESCRIPTIONS[status]
      }))
    }));

    res.json({
      success: true,
      data: {
        rules,
        statusDescriptions: STATUS_DESCRIPTIONS
      },
      message: '状态转换规则获取成功'
    });

  } catch (error) {
    console.error('获取状态转换规则错误:', error);
    errorResponse(res, '服务器内部错误', 500);
  }
};