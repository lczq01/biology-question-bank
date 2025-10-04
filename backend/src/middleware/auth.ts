import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { User } from '../models/User';
import { UserRole, UserStatus } from '../types/user.types';
import { IJwtPayload } from '../types/common.types';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

// JWT认证中间件
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 提取令牌
    const token = extractTokenFromHeader(req.headers.authorization);
    
    // 验证令牌
    const payload: IJwtPayload = verifyToken(token);
    
    // 查询用户信息
    const user = await User.findById(payload.userId);
    if (!user) {
      errorResponse(res, '用户不存在', 401);
      return;
    }
    
    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      errorResponse(res, '用户账户已被禁用', 401);
      return;
    }
    
    // 将用户信息添加到请求对象
    req.user = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    };
    
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : '认证失败';
    errorResponse(res, message, 401);
  }
};

// 角色权限检查中间件
export const authorize = (...roles: UserRole[]) => {
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

// 管理员权限中间件
export const requireAdmin = authorize(UserRole.ADMIN);

// 学生权限中间件
export const requireStudent = authorize(UserRole.STUDENT);

// 管理员或学生权限中间件
export const requireUser = authorize(UserRole.ADMIN, UserRole.STUDENT);

// 默认认证中间件别名
export const auth = authenticate;

// 扩展的Request接口类型
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: UserRole;
  };
}