// 考试会话更新控制器
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ExamSession } from '../models/ExamSession';
import { Paper } from '../models/Paper';
import { 
  ExamManagementErrorCode,
  IApiResponse
} from '../types/exam-management.types';

/**
 * 更新考试会话
 */
export const updateExamSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 验证考试会话ID格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: '无效的考试会话ID',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: '考试会话ID格式不正确'
        }
      } as IApiResponse<null>);
      return;
    }

    // 查找现有考试会话
    const existingSession = await ExamSession.findById(id);
    if (!existingSession) {
      res.status(404).json({
        success: false,
        message: '考试会话不存在',
        error: {
          code: ExamManagementErrorCode.SESSION_NOT_FOUND,
          details: `考试会话ID ${id} 不存在`
        }
      } as IApiResponse<null>);
      return;
    }

    // 权限检查：只有管理员或创建者可以更新考试会话
    if (req.user?.role !== 'admin' && existingSession.creatorId?.toString() !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: '无权限更新该考试会话',
        error: {
          code: ExamManagementErrorCode.UNAUTHORIZED,
          details: '只有管理员或创建者可以更新考试会话'
        }
      } as IApiResponse<null>);
      return;
    }

    // 状态检查：已开始或已结束的考试不能修改关键信息
    if (existingSession.status === 'active' || existingSession.status === 'completed') {
      // 只允许修改描述和设置，不允许修改时间、试卷等关键信息
      const allowedFields = ['description', 'settings'];
      const hasRestrictedFields = Object.keys(updateData).some(key => 
        !allowedFields.includes(key) && key !== 'description' && key !== 'settings'
      );
      
      if (hasRestrictedFields) {
        res.status(400).json({
          success: false,
          message: '考试已开始或已结束，不能修改关键信息',
          error: {
            code: ExamManagementErrorCode.INVALID_STATUS_TRANSITION,
            details: '已开始或已结束的考试只能修改描述和设置'
          }
        } as IApiResponse<null>);
        return;
      }
    }

    // 验证更新数据
    const validationErrors: string[] = [];

    // 验证试卷ID（如果提供）
    if (updateData.paperId) {
      if (!mongoose.Types.ObjectId.isValid(updateData.paperId)) {
        validationErrors.push('试卷ID格式不正确');
      } else {
        const paper = await Paper.findById(updateData.paperId);
        if (!paper) {
          validationErrors.push('指定的试卷不存在');
        }
      }
    }

    // 验证时间设置（如果提供）
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime ? new Date(updateData.startTime) : existingSession.startTime;
      const endTime = updateData.endTime ? new Date(updateData.endTime) : existingSession.endTime;

      if (startTime >= endTime) {
        validationErrors.push('开始时间必须早于结束时间');
      }

      if (startTime < new Date() && existingSession.status === 'draft') {
        validationErrors.push('开始时间不能早于当前时间');
      }
    }

    // 验证时长（如果提供）
    if (updateData.duration !== undefined) {
      if (typeof updateData.duration !== 'number' || updateData.duration <= 0) {
        validationErrors.push('考试时长必须是正数');
      }
    }

    // 验证考试名称（如果提供）
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        validationErrors.push('考试名称不能为空');
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: '数据验证失败',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: validationErrors.join('; ')
        }
      } as IApiResponse<null>);
      return;
    }

    // 检查时间冲突（如果修改了时间）
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime ? new Date(updateData.startTime) : existingSession.startTime;
      const endTime = updateData.endTime ? new Date(updateData.endTime) : existingSession.endTime;

      const conflictingSessions = await ExamSession.find({
        _id: { $ne: id }, // 排除当前会话
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (conflictingSessions.length > 0) {
        res.status(400).json({
          success: false,
          message: '考试时间与其他考试冲突',
          error: {
            code: ExamManagementErrorCode.SESSION_TIME_CONFLICT,
            details: `与 ${conflictingSessions.length} 个其他考试时间冲突`
          }
        } as IApiResponse<null>);
        return;
      }
    }

    // 准备更新数据
    const updateFields: any = {};

    // 基本信息
    if (updateData.name !== undefined) updateFields.name = updateData.name.trim();
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.paperId !== undefined) updateFields.paperId = updateData.paperId;

    // 时间设置
    if (updateData.startTime !== undefined) updateFields.startTime = new Date(updateData.startTime);
    if (updateData.endTime !== undefined) updateFields.endTime = new Date(updateData.endTime);
    if (updateData.duration !== undefined) updateFields.duration = updateData.duration;

    // 考试设置
    if (updateData.settings) {
      updateFields.settings = {
        ...existingSession.settings,
        ...updateData.settings
      };
    }

    // 更新时间戳
    updateFields.updatedAt = new Date();

    // 执行更新
    const updatedSession = await ExamSession.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).populate({
      path: 'paperId',
      select: 'title description questions config totalQuestions totalPoints'
    }).populate('creatorId', 'username email profile.firstName profile.lastName');

    if (!updatedSession) {
      res.status(404).json({
        success: false,
        message: '更新失败，考试会话不存在',
        error: {
          code: ExamManagementErrorCode.SESSION_NOT_FOUND,
          details: '考试会话可能已被删除'
        }
      } as IApiResponse<null>);
      return;
    }

    // 构造响应数据
    const responseData = {
      _id: (updatedSession._id as any).toString(),
      name: updatedSession.name,
      description: updatedSession.description || '',
      paperId: updatedSession.paperId ? {
        _id: (updatedSession.paperId as any)._id?.toString() || updatedSession.paperId.toString(),
        title: (updatedSession.paperId as any).title || '未知试卷',
        description: (updatedSession.paperId as any).description || '',
        totalQuestions: (updatedSession.paperId as any).totalQuestions || 0,
        totalPoints: (updatedSession.paperId as any).totalPoints || 0
      } : null,
      creatorId: updatedSession.creatorId ? {
        _id: (updatedSession.creatorId as any)._id?.toString() || updatedSession.creatorId.toString(),
        username: (updatedSession.creatorId as any).username || '未知用户',
        email: (updatedSession.creatorId as any).email || ''
      } : null,
      status: updatedSession.status,
      startTime: updatedSession.startTime.toISOString(),
      endTime: updatedSession.endTime.toISOString(),
      duration: updatedSession.duration,
      settings: updatedSession.settings,
      participants: updatedSession.participants || [],
      createdAt: updatedSession.createdAt.toISOString(),
      updatedAt: updatedSession.updatedAt.toISOString()
    };

    res.json({
      success: true,
      data: responseData,
      message: '考试会话更新成功'
    } as IApiResponse<any>);

  } catch (error) {
    console.error('更新考试会话失败:', error);
    res.status(500).json({
      success: false,
      message: '更新考试会话失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: (error as Error).message
      }
    } as IApiResponse<null>);
  }
};