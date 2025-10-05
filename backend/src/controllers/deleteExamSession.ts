// 考试会话删除控制器
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ExamSession } from '../models/ExamSession';
import { 
  ExamManagementErrorCode,
  IApiResponse
} from '../types/exam-management.types';

/**
 * 删除考试会话
 * @param req - Express请求对象
 * @param res - Express响应对象
 */
export const deleteExamSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // 验证ID格式
    if (!Types.ObjectId.isValid(id)) {
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

    // 查找考试会话
    const session = await ExamSession.findById(id);
    if (!session) {
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

    // 权限检查：只有管理员可以删除考试会话
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权删除该考试会话',
        error: {
          code: ExamManagementErrorCode.UNAUTHORIZED,
          details: '只有管理员可以删除考试会话'
        }
      } as IApiResponse<null>);
      return;
    }

    // 管理员可以删除任何状态的考试（包括进行中、已完成、有参与者的考试）
    // 删除前记录操作日志
    console.log(`管理员 ${userId} 删除考试会话: ${session.name} (ID: ${id}, 状态: ${session.status}, 参与者数量: ${session.participants?.length || 0})`);

    // 执行删除操作
    await ExamSession.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: '考试会话删除成功',
      data: {
        deletedId: id,
        deletedTitle: session.name
      }
    } as IApiResponse<{ deletedId: string; deletedTitle: string }>);

  } catch (error) {
    console.error('删除考试会话错误:', error);
    res.status(500).json({
      success: false,
      message: '删除考试会话失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};