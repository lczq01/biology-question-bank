import { Request, Response } from 'express';
import { User } from '../models/User';
import { successResponse, errorResponse } from '../utils/response';

// 获取当前用户信息
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, '未认证的用户', 401);
      return;
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      errorResponse(res, '用户不存在', 404);
      return;
    }
    
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    successResponse(res, userResponse, '获取用户信息成功');
  } catch (error) {
    console.error('获取用户信息错误:', error);
    errorResponse(res, '获取用户信息失败', 500);
  }
};

// 更新用户个人信息
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, '未认证的用户', 401);
      return;
    }
    
    const { profile } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      errorResponse(res, '用户不存在', 404);
      return;
    }
    
    // 更新个人信息
    if (profile) {
      user.profile = { ...user.profile, ...profile };
      await user.save();
    }
    
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
      updatedAt: user.updatedAt
    };
    
    successResponse(res, userResponse, '更新个人信息成功');
  } catch (error) {
    console.error('更新个人信息错误:', error);
    errorResponse(res, '更新个人信息失败', 500);
  }
};

// 修改密码
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, '未认证的用户', 401);
      return;
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      errorResponse(res, '当前密码和新密码不能为空', 400);
      return;
    }
    
    // 查找用户（包含密码字段）
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      errorResponse(res, '用户不存在', 404);
      return;
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      errorResponse(res, '当前密码错误', 400);
      return;
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    successResponse(res, null, '密码修改成功');
  } catch (error) {
    console.error('修改密码错误:', error);
    errorResponse(res, '修改密码失败', 500);
  }
};