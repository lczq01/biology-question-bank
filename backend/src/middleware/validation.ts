import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

// 验证请求体字段
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];
    
    for (const field of fields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      errorResponse(res, `缺少必填字段: ${missingFields.join(', ')}`, 400);
      return;
    }
    
    next();
  };
};

// 验证邮箱格式
export const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errorResponse(res, '邮箱格式不正确', 400);
      return;
    }
  }
  
  next();
};

// 验证密码强度
export const validatePassword = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;
  
  if (password) {
    if (password.length < 6) {
      errorResponse(res, '密码长度至少6个字符', 400);
      return;
    }
    
    if (password.length > 50) {
      errorResponse(res, '密码长度不能超过50个字符', 400);
      return;
    }
  }
  
  next();
};

// 验证用户名格式
export const validateUsername = (req: Request, res: Response, next: NextFunction): void => {
  const { username } = req.body;
  
  if (username) {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      errorResponse(res, '用户名只能包含字母、数字和下划线', 400);
      return;
    }
    
    if (username.length < 3 || username.length > 20) {
      errorResponse(res, '用户名长度必须在3-20个字符之间', 400);
      return;
    }
  }
  
  next();
};