import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { ICreateUserRequest, ILoginRequest, UserRole } from '../types/user.types';

// 用户注册
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: ICreateUserRequest = req.body;
    
    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username: userData.username });
    if (existingUsername) {
      errorResponse(res, '用户名已存在', 400);
      return;
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email: userData.email });
    if (existingEmail) {
      errorResponse(res, '邮箱已被注册', 400);
      return;
    }
    
    // 创建新用户
    const newUser = new User(userData);
    await newUser.save();
    
    // 生成JWT令牌
    const token = generateToken({
      userId: newUser._id.toString(),
      username: newUser.username,
      role: newUser.role
    });
    
    // 返回用户信息和令牌
    const userResponse = {
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        profile: newUser.profile,
        createdAt: newUser.createdAt
      },
      token
    };
    
    successResponse(res, userResponse, '注册成功', 201);
  } catch (error) {
    console.error('注册错误:', error);
    errorResponse(res, '注册失败', 500);
  }
};

// 用户登录
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: ILoginRequest = req.body;
    
    // 查找用户（包含密码字段）
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      errorResponse(res, '用户名或密码错误', 401);
      return;
    }
    
    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      errorResponse(res, '用户名或密码错误', 401);
      return;
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      errorResponse(res, '账户已被禁用', 401);
      return;
    }
    
    // 生成JWT令牌
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    });
    
    // 返回用户信息和令牌
    const userResponse = {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt
      },
      token
    };
    
    successResponse(res, userResponse, '登录成功');
  } catch (error) {
    console.error('登录错误:', error);
    errorResponse(res, '登录失败', 500);
  }
};