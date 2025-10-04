import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { errorResponse } from '../utils/response';
import { UserRole } from '../types/user.types';

// Mock认证中间件 - 用于前端开发测试
export const mockAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 提取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      errorResponse(res, '缺少认证令牌', 401);
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Mock token验证
    if (token === 'mock-token-admin') {
      // Mock管理员用户 - 使用有效的MongoDB ObjectId
      req.user = {
        userId: new Types.ObjectId('68e0c8a6b5110614871452d1').toString(),
        username: 'admin',
        role: UserRole.ADMIN
      };
    } else if (token === 'mock-token-student') {
      // Mock学生用户 - 使用有效的MongoDB ObjectId
      req.user = {
        userId: new Types.ObjectId('68e0c8a6b5110614871452d2').toString(),
        username: 'student',
        role: UserRole.STUDENT
      };
    } else {
      errorResponse(res, '无效的认证令牌', 401);
      return;
    }
    
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : '认证失败';
    errorResponse(res, message, 401);
  }
};

// Mock角色权限检查中间件
export const mockAuthorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, '未认证的用户', 401);
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      errorResponse(res, '权限不足', 403);
      return;
    }
    
    next();
  };
};

// Mock管理员权限中间件
export const mockRequireAdmin = mockAuthorize(UserRole.ADMIN);

// Mock学生权限中间件
export const mockRequireStudent = mockAuthorize(UserRole.STUDENT);

// Mock管理员或学生权限中间件
export const mockRequireUser = mockAuthorize(UserRole.ADMIN, UserRole.STUDENT);

// Mock认证中间件别名
export const mockAuth = mockAuthenticate;