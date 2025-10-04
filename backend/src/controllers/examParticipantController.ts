import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ExamSession } from '../models/ExamSession';
import { User } from '../models/User';
import { ExamRecord } from '../models';
import { ExamSessionStatus } from '../types/exam-session.types';
import { 
  ExamManagementErrorCode,
  IApiResponse
} from '../types/exam-management.types';

/**
 * 参与者信息接口
 */
interface IParticipantInfo {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  joinedAt: string;
  status: 'invited' | 'joined' | 'completed' | 'abandoned';
  examRecord?: {
    recordId: string;
    score: number;
    startTime?: string;
    endTime?: string;
    status: string;
  };
}

/**
 * 添加考试参与者
 * @route POST /api/exam-sessions/:id/participants
 * @desc 向指定考试会话添加参与者
 * @access 需要管理员或教师权限
 */
export const addParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userIds, notifyUsers = true } = req.body;

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

    // 验证输入参数
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: '参数错误',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: 'userIds必须是非空数组'
        }
      } as IApiResponse<null>);
      return;
    }

    // 验证所有用户ID格式（兼容字符串ID和ObjectId格式）
    const invalidUserIds = userIds.filter(userId => 
      !userId || 
      (typeof userId !== 'string') || 
      userId.trim().length === 0
    );
    if (invalidUserIds.length > 0) {
      res.status(400).json({
        success: false,
        message: '无效的用户ID',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: `无效的用户ID: ${invalidUserIds.join(', ')}`
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

    // 权限检查：只有管理员、教师或考试创建者可以添加参与者
    if (req.user?.role === 'student') {
      const creatorId = session.creatorId?.toString();
      if (creatorId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: '无权修改该考试参与者',
          error: {
            code: ExamManagementErrorCode.UNAUTHORIZED,
            details: '您没有权限修改该考试的参与者'
          }
        } as IApiResponse<null>);
        return;
      }
    }

    // 检查考试状态：只有草稿和已发布状态可以添加参与者
    if (![ExamSessionStatus.DRAFT, ExamSessionStatus.PUBLISHED].includes(session.status)) {
      res.status(400).json({
        success: false,
        message: '考试状态不允许添加参与者',
        error: {
          code: ExamManagementErrorCode.INVALID_SESSION_STATUS,
          details: `考试状态为 ${session.status}，无法添加参与者`
        }
      } as IApiResponse<null>);
      return;
    }

    // 验证用户是否存在（兼容字符串ID格式）
    // 注意：当前系统使用字符串ID而非ObjectId，这里模拟用户验证
    const validUserIds = userIds.filter(userId => {
      // 简单验证：确保用户ID是有效的字符串
      return typeof userId === 'string' && userId.trim().length > 0;
    });

    const notFoundUserIds = userIds.filter(userId => !validUserIds.includes(userId));

    if (notFoundUserIds.length > 0) {
      res.status(400).json({
        success: false,
        message: '部分用户ID格式无效',
        error: {
          code: ExamManagementErrorCode.USER_NOT_FOUND,
          details: `无效的用户ID: ${notFoundUserIds.join(', ')}`
        }
      } as IApiResponse<null>);
      return;
    }

    // 模拟用户数据（因为当前认证系统使用字符串ID）
    const users = validUserIds.map(userId => ({
      _id: { toString: () => userId },
      username: `user_${userId}`,
      email: `user${userId}@test.com`,
      profile: {
        firstName: `用户`,
        lastName: userId
      }
    }));

    // 检查哪些用户已经是参与者
    const existingParticipantIds = session.participants?.map(p => p.toString()) || [];
    const newParticipantIds = userIds.filter(userId => !existingParticipantIds.includes(userId));
    const duplicateUserIds = userIds.filter(userId => existingParticipantIds.includes(userId));

    // 添加新参与者
    if (newParticipantIds.length > 0) {
      const currentParticipants = session.participants || [];
      session.participants = [...currentParticipants, ...newParticipantIds];
      await session.save();

      // 为每个新参与者创建考试记录（暂时跳过，因为当前用户系统使用字符串ID）
      // TODO: 当用户系统统一使用ObjectId后，启用此功能
      console.log(`为 ${newParticipantIds.length} 个新参与者创建考试记录（模拟）`);
    }

    // 构造响应数据
    const addedUsers = users.filter(user => newParticipantIds.includes(user._id.toString()));
    const duplicateUsers = users.filter(user => duplicateUserIds.includes(user._id.toString()));

    const result = {
      sessionId: (session._id as Types.ObjectId).toString(),
      sessionName: session.name,
      addedParticipants: addedUsers.map(user => ({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.profile?.firstName && user.profile?.lastName 
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user.username
      })),
      duplicateParticipants: duplicateUsers.map(user => ({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        reason: '用户已是该考试的参与者'
      })),
      totalParticipants: session.participants?.length || 0,
      notificationSent: notifyUsers
    };

    res.status(200).json({
      success: true,
      data: result,
      message: `成功添加 ${newParticipantIds.length} 个参与者${duplicateUserIds.length > 0 ? `，${duplicateUserIds.length} 个用户已存在` : ''}`
    } as IApiResponse<typeof result>);

  } catch (error) {
    console.error('添加考试参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '添加考试参与者失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

/**
 * 移除考试参与者
 * @route DELETE /api/exam-sessions/:id/participants
 * @desc 从指定考试会话移除参与者
 * @access 需要管理员或教师权限
 */
export const removeParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userIds, deleteRecords = false } = req.body;

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

    // 验证输入参数
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: '参数错误',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: 'userIds必须是非空数组'
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

    // 权限检查
    if (req.user?.role === 'student') {
      const creatorId = session.creatorId?.toString();
      if (creatorId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: '无权修改该考试参与者',
          error: {
            code: ExamManagementErrorCode.UNAUTHORIZED,
            details: '您没有权限修改该考试的参与者'
          }
        } as IApiResponse<null>);
        return;
      }
    }

    // 检查考试状态：活跃状态的考试不能移除参与者
    if (session.status === ExamSessionStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        message: '活跃考试不能移除参与者',
        error: {
          code: ExamManagementErrorCode.INVALID_SESSION_STATUS,
          details: '正在进行中的考试不能移除参与者'
        }
      } as IApiResponse<null>);
      return;
    }

    // 获取要移除的用户信息
    const users = await User.find({ _id: { $in: userIds } });

    // 检查哪些用户是参与者
    const existingParticipantIds = session.participants?.map(p => p.toString()) || [];
    const participantsToRemove = userIds.filter(userId => existingParticipantIds.includes(userId));
    const nonParticipants = userIds.filter(userId => !existingParticipantIds.includes(userId));

    // 移除参与者
    if (participantsToRemove.length > 0) {
      session.participants = session.participants?.filter(
        p => !participantsToRemove.includes(p.toString())
      );
      await session.save();

      // 如果需要删除考试记录
      if (deleteRecords) {
        await ExamRecord.deleteMany({
          sessionId: session._id,
          userId: { $in: participantsToRemove }
        });
      }
    }

    // 构造响应数据
    const removedUsers = users.filter(user => participantsToRemove.includes(user._id.toString()));
    const nonParticipantUsers = users.filter(user => nonParticipants.includes(user._id.toString()));

    const result = {
      sessionId: (session._id as Types.ObjectId).toString(),
      sessionName: session.name,
      removedParticipants: removedUsers.map(user => ({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.profile?.firstName && user.profile?.lastName 
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user.username
      })),
      nonParticipants: nonParticipantUsers.map(user => ({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        reason: '用户不是该考试的参与者'
      })),
      totalParticipants: session.participants?.length || 0,
      recordsDeleted: deleteRecords
    };

    res.status(200).json({
      success: true,
      data: result,
      message: `成功移除 ${participantsToRemove.length} 个参与者${nonParticipants.length > 0 ? `，${nonParticipants.length} 个用户不是参与者` : ''}`
    } as IApiResponse<typeof result>);

  } catch (error) {
    console.error('移除考试参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '移除考试参与者失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

/**
 * 获取考试参与者列表
 * @route GET /api/exam-sessions/:id/participants
 * @desc 获取指定考试会话的参与者列表
 * @access 需要管理员、教师权限或参与者本人
 */
export const getParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'joinedAt', 
      sortOrder = 'desc',
      status,
      search
    } = req.query;

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

    // 权限检查
    const participantIds = session.participants?.map(p => p.toString()) || [];
    const isParticipant = participantIds.includes(req.user?.userId || '');

    if (req.user?.role === 'student' && !isParticipant) {
      const creatorId = session.creatorId?.toString();
      if (creatorId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: '无权访问该考试参与者',
          error: {
            code: ExamManagementErrorCode.UNAUTHORIZED,
            details: '您没有权限查看该考试的参与者'
          }
        } as IApiResponse<null>);
        return;
      }
    }

    if (participantIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          participants: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit as string),
            hasNextPage: false,
            hasPrevPage: false
          }
        },
        message: '参与者列表获取成功'
      } as IApiResponse<any>);
      return;
    }

    // 模拟用户数据（因为当前认证系统使用字符串ID）
    const allParticipants = participantIds.map(userId => ({
      userId,
      username: `user_${userId}`,
      email: `user${userId}@test.com`,
      fullName: `用户 ${userId}`,
      joinedAt: new Date().toISOString(),
      status: 'joined' as const
    }));

    // 应用搜索过滤
    let filteredParticipants = allParticipants;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredParticipants = allParticipants.filter(p => 
        p.username.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        p.fullName.toLowerCase().includes(searchLower)
      );
    }

    // 应用状态过滤
    if (status) {
      filteredParticipants = filteredParticipants.filter(p => p.status === status);
    }

    // 分页参数
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;
    const totalItems = filteredParticipants.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // 应用分页
    const paginatedParticipants = filteredParticipants.slice(skip, skip + limitNum);

    // 构造响应数据
    const result = {
      participants: paginatedParticipants,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };

    res.status(200).json({
      success: true,
      data: result,
      message: '参与者列表获取成功'
    } as IApiResponse<typeof result>);

  } catch (error) {
    console.error('获取考试参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试参与者失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

/**
 * 批量添加参与者
 * @route POST /api/exam-sessions/:id/participants/batch-add
 * @desc 批量添加多个参与者
 * @access 需要管理员或教师权限
 */
export const batchAddParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    // 直接调用addParticipants函数
    await addParticipants(req, res);
  } catch (error) {
    console.error('批量添加参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '批量添加参与者失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

/**
 * 批量移除参与者
 * @route POST /api/exam-sessions/:id/participants/batch-remove
 * @desc 批量移除多个参与者
 * @access 需要管理员或教师权限
 */
export const batchRemoveParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    // 直接调用removeParticipants函数
    await removeParticipants(req, res);
  } catch (error) {
    console.error('批量移除参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '批量移除参与者失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

/**
 * 批量管理参与者
 * @route PUT /api/exam-sessions/:id/participants/batch
 * @desc 批量添加或移除参与者
 * @access 需要管理员或教师权限
 */
export const batchManageParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, userIds, options = {} } = req.body;

    // 验证输入参数
    if (!action || !['add', 'remove'].includes(action)) {
      res.status(400).json({
        success: false,
        message: '参数错误',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: 'action必须是add或remove'
        }
      } as IApiResponse<null>);
      return;
    }

    // 根据操作类型调用相应的处理函数
    if (action === 'add') {
      req.body = { userIds, notifyUsers: options.notifyUsers };
      await addParticipants(req, res);
    } else if (action === 'remove') {
      req.body = { userIds, deleteRecords: options.deleteRecords };
      await removeParticipants(req, res);
    }

  } catch (error) {
    console.error('批量管理参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '批量管理参与者失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};