import jwt from 'jsonwebtoken';
import { config } from './config';
import { IJwtPayload } from '../types/common.types';

// 生成JWT令牌
export const generateToken = (payload: Omit<IJwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// 验证JWT令牌
export const verifyToken = (token: string): IJwtPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as IJwtPayload;
  } catch (error) {
    throw new Error('无效的令牌');
  }
};

// 从请求头中提取令牌
export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new Error('缺少授权头');
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('授权头格式错误');
  }
  
  return authHeader.substring(7);
};