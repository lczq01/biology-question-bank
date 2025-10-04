// 考试会话权限验证中间件
import { Request, Response, NextFunction } from 'express';
import { 
  ExamManagementPermission, 
  ROLE_PERMISSIONS,
  ExamManagementErrorCode,
  IApiResponse
} from '../types/exam-management.types';



// 检查用户是否有指定权限
export const checkPermission = (requiredPermission: ExamManagementPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证',
          error: {
            code: ExamManagementErrorCode.UNAUTHORIZED,
            details: '需要登录才能访问此资源'
          }
        } as IApiResponse<null>);
      }

      const { role } = req.user;

      // 获取用户角色的权限列表
      const userPermissions = ROLE_PERMISSIONS[role] || [];

      // 检查用户是否有所需权限
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: '权限不足',
          error: {
            code: ExamManagementErrorCode.INSUFFICIENT_PERMISSIONS,
            details: `需要权限: ${requiredPermission}`
          }
        } as IApiResponse<null>);
      }

      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      return res.status(500).json({
        success: false,
        message: '权限验证失败',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: error instanceof Error ? error.message : '未知错误'
        }
      } as IApiResponse<null>);
    }
  };
};

// 检查用户是否为考试会话的创建者
export const checkSessionOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        error: {
          code: ExamManagementErrorCode.UNAUTHORIZED,
          details: '需要登录才能访问此资源'
        }
      } as IApiResponse<null>);
    }

    // 管理员有访问所有会话的权限
    if (req.user?.role === 'admin') {
      return next();
    }

    // 动态导入ExamSession模型以避免循环依赖
    const { ExamSession } = await import('../models/ExamSession');
    const session = await ExamSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '考试会话不存在',
        error: {
          code: ExamManagementErrorCode.SESSION_NOT_FOUND,
          details: `会话ID ${id} 不存在`
        }
      } as IApiResponse<null>);
    }

    // 检查是否为创建者
    if (session.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有创建者可以访问此会话',
        error: {
          code: ExamManagementErrorCode.CREATOR_ONLY_ACCESS,
          details: '您没有权限访问他人创建的考试会话'
        }
      } as IApiResponse<null>);
    }

    next();
  } catch (error) {
    console.error('会话所有权检查错误:', error);
    return res.status(500).json({
      success: false,
      message: '权限验证失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

// 验证考试会话状态转换
export const validateStatusTransition = (allowedFromStatuses: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // 动态导入ExamSession模型
      const { ExamSession } = await import('../models/ExamSession');
      const session = await ExamSession.findById(id);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: '考试会话不存在',
          error: {
            code: ExamManagementErrorCode.SESSION_NOT_FOUND,
            details: `会话ID ${id} 不存在`
          }
        } as IApiResponse<null>);
      }

      // 检查当前状态是否允许转换
      if (!allowedFromStatuses.includes(session.status)) {
        return res.status(400).json({
          success: false,
          message: '不允许的状态转换',
          error: {
            code: ExamManagementErrorCode.INVALID_STATUS_TRANSITION,
            details: `当前状态 ${session.status} 不允许此操作`
          }
        } as IApiResponse<null>);
      }

      next();
    } catch (error) {
      console.error('状态转换验证错误:', error);
      return res.status(500).json({
        success: false,
        message: '状态验证失败',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: error instanceof Error ? error.message : '未知错误'
        }
      } as IApiResponse<null>);
    }
  };
};