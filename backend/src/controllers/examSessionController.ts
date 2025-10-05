// 考试会话管理控制器
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ExamSession } from '../models/ExamSession';
import { Paper } from '../models/Paper';
import { User } from '../models/User';
import { 
  ICreateExamSessionRequest,
  IUpdateExamSessionRequest,
  IUpdateExamStatusRequest,
  IExamSessionQueryParams,
  ExamManagementErrorCode,
  IApiResponse,
  IExamSessionResponse
} from '../types/exam-management.types';
import { ExamSessionStatus } from '../types/exam-session.types';
import { updateExamSession } from './updateExamSession';
import { 
  updateExamSessionStatus, 
  batchUpdateExamSessionStatus, 
  getStatusTransitionRules 
} from './examSessionStatusController';
import { deleteExamSession } from './deleteExamSession';

// 获取考试会话列表
export const getExamSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      createdBy,
      startTimeFrom,
      startTimeTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query: any = {};

    // 权限过滤：学生只能查看自己参与的考试会话
    if (req.user?.role === 'student') {
      query.$or = [
        { creatorId: req.user.userId },
        { 'allowedUsers': req.user.userId },
        { 'allowedUsers': { $size: 0 } } // 公开考试
      ];
    }

    // 状态筛选
    if (status && Object.values(ExamSessionStatus).includes(status as ExamSessionStatus)) {
      query.status = status;
    }

    // 创建者筛选（仅管理员可用）
    if (createdBy && req.user?.role === 'admin') {
      query.creatorId = createdBy;
    }

    // 时间范围筛选
    if (startTimeFrom || startTimeTo) {
      query.startTime = {};
      if (startTimeFrom) {
        query.startTime.$gte = new Date(startTimeFrom as string);
      }
      if (startTimeTo) {
        query.startTime.$lte = new Date(startTimeTo as string);
      }
    }

    // 搜索筛选
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 分页参数
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // 排序参数
    const sortOptions: any = {};
    const validSortFields = ['createdAt', 'startTime', 'endTime', 'name', 'status'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortField as string] = sortDirection;

    // 执行查询
    const [sessions, total] = await Promise.all([
      ExamSession.find(query)
        .populate('paperId', 'title description questionCount totalScore')
        .populate('creatorId', 'username profile.firstName profile.lastName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ExamSession.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('获取考试会话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试会话列表失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    });
  }
};

// 获取单个考试会话详情
export const getExamSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
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
    const session = await ExamSession.findById(id)
      .populate({
        path: 'paperId',
        select: 'title description questions config totalQuestions totalPoints createdAt',
        populate: {
          path: 'questions',
          select: 'content type difficulty chapter options correctAnswer explanation points'
        }
      })
      .populate('creatorId', 'username email profile.firstName profile.lastName')
      .lean();

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

    // 权限检查：学生只能查看自己参与的考试
    if (req.user?.role === 'student') {
      const creatorId = session.creatorId?._id?.toString() || session.creatorId?.toString();
      const canAccess = creatorId === req.user.userId ||
                       session.participants?.includes(req.user.userId) ||
                       session.participants?.length === 0; // 公开考试

      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: '无权访问该考试会话',
          error: {
            code: ExamManagementErrorCode.UNAUTHORIZED,
            details: '您没有权限访问该考试会话'
          }
        } as IApiResponse<null>);
        return;
      }
    }

    // 构造详细响应数据
    const responseData = {
      _id: session._id.toString(),
      name: session.name,
      description: session.description || '',
      paperId: session.paperId ? {
        _id: (session.paperId as any)._id?.toString() || session.paperId.toString(),
        title: (session.paperId as any).title || '未知试卷',
        description: (session.paperId as any).description || '',
        totalQuestions: (session.paperId as any).totalQuestions || (session.paperId as any).questions?.length || 0,
        totalPoints: (session.paperId as any).totalPoints || 
                    (session.paperId as any).config?.totalPoints || 
                    ((session.paperId as any).questions?.reduce((sum: number, q: any) => sum + (q.points || 1), 0)) || 0,
        questions: (session.paperId as any).questions || [],
        createdAt: (session.paperId as any).createdAt
      } : null,
      creatorId: session.creatorId ? {
        _id: (session.creatorId as any)._id?.toString() || session.creatorId.toString(),
        username: (session.creatorId as any).username || '未知用户',
        email: (session.creatorId as any).email || `${(session.creatorId as any).username || 'unknown'}@example.com`,
        profile: (session.creatorId as any).profile || {}
      } : null,
      status: session.status,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      duration: session.duration,
      settings: {
        allowReview: session.settings?.allowReview ?? true,
        showScore: session.settings?.showScore ?? true,
        randomOrder: session.settings?.randomOrder ?? false,
        timeLimit: session.settings?.timeLimit ?? true,
        maxAttempts: session.settings?.maxAttempts ?? 1,
        passingScore: session.settings?.passingScore ?? 60,
        autoGrade: session.settings?.autoGrade ?? true,
        preventCheating: session.settings?.preventCheating ?? false
      },
      participants: session.participants || [],
      stats: {
        totalParticipants: session.stats?.totalParticipants || 0,
        completedCount: session.stats?.completedCount || 0,
        averageScore: session.stats?.averageScore || 0,
        passRate: session.stats?.passRate || 0,
        averageTime: session.stats?.averageTime || 0
      },
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: '获取考试会话详情成功'
    } as IApiResponse<typeof responseData>);

  } catch (error) {
    console.error('获取考试会话详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试会话详情失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

// 创建考试会话
export const createExamSession = async (req: Request, res: Response) => {
  try {
    // 类型断言请求体
    const sessionData = req.body as ICreateExamSessionRequest;
    const creatorId = req.user?.userId;

    // 验证用户身份
    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        error: {
          code: ExamManagementErrorCode.UNAUTHORIZED,
          details: '需要登录才能创建考试会话'
        }
      } as IApiResponse<null>);
    }

    // 验证必填字段
    const { name, paperId, startTime, endTime, duration } = sessionData;
    if (!name || !paperId || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: '考试名称、试卷ID、开始时间、结束时间和考试时长为必填项'
        }
      } as IApiResponse<null>);
    }

    // 验证时间格式和逻辑
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '时间格式无效',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: '请提供有效的ISO时间格式'
        }
      } as IApiResponse<null>);
    }

    if (startDate <= now) {
      return res.status(400).json({
        success: false,
        message: '开始时间不能早于当前时间',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: '考试开始时间必须在未来'
        }
      } as IApiResponse<null>);
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: '结束时间必须晚于开始时间',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: '考试结束时间必须晚于开始时间'
        }
      } as IApiResponse<null>);
    }

    // 验证考试时长（分钟）
    if (duration <= 0 || duration > 480) { // 最长8小时
      return res.status(400).json({
        success: false,
        message: '考试时长无效',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: '考试时长必须在1-480分钟之间'
        }
      } as IApiResponse<null>);
    }

    // 验证试卷是否存在
    let paper: any = null;
    
    // 首先尝试作为MongoDB ObjectId查找
    if (Types.ObjectId.isValid(paperId)) {
      paper = await Paper.findById(paperId);
    } else {
      // 如果不是ObjectId格式，尝试从内存存储中查找（试卷API使用的时间戳格式）
      try {
        // 导入试卷API的内存存储
        const examPapers = (global as any).examPapers || [];
        const examPaper = examPapers.find((p: any) => p.id === paperId);
        
        if (examPaper) {
          // 如果找到内存中的试卷，创建一个临时的Paper对象
          const tempPaper = {
            _id: new Types.ObjectId(),
            title: examPaper.title,
            isActive: true
          };
          
          paper = {
            ...tempPaper,
            save: async () => tempPaper,
            toObject: () => tempPaper
          };
        }
      } catch (error) {
        console.error('查找内存试卷失败:', error);
      }
    }
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '试卷不存在',
        error: {
          code: ExamManagementErrorCode.PAPER_NOT_FOUND,
          details: `试卷ID ${paperId} 不存在`
        }
      } as IApiResponse<null>);
    }
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '试卷不存在',
        error: {
          code: ExamManagementErrorCode.PAPER_NOT_FOUND,
          details: `试卷ID ${paperId} 不存在`
        }
      } as IApiResponse<null>);
    }

    // 检查试卷是否可用（检查status字段）
    if (paper.status && paper.status !== 'published' && paper.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '试卷不可用',
        error: {
          code: ExamManagementErrorCode.PAPER_NOT_ACTIVE,
          details: '只能使用已发布或已激活的试卷创建考试'
        }
      } as IApiResponse<null>);
    }

    // 检查时间冲突（同一创建者在同一时间段不能有多个活跃考试）
    let conflictingSessions = [];
    try {
      // 尝试将creatorId转换为ObjectId，如果失败则使用字符串格式
      let creatorIdObj;
      try {
        creatorIdObj = new Types.ObjectId(creatorId);
      } catch {
        creatorIdObj = creatorId;
      }
      
      conflictingSessions = await ExamSession.find({
        creatorId: creatorIdObj,
        status: { $in: [ExamSessionStatus.PUBLISHED, ExamSessionStatus.ACTIVE] },
        $or: [
          {
            startTime: { $lte: endDate },
            endTime: { $gte: startDate }
          }
        ]
      });
    } catch (error) {
      console.error('检查时间冲突时出错:', error);
      // 如果查询失败，跳过时间冲突检查
      conflictingSessions = [];
    }

    if (conflictingSessions.length > 0) {
      return res.status(409).json({
        success: false,
        message: '时间冲突',
        error: {
          code: ExamManagementErrorCode.SESSION_TIME_CONFLICT,
          details: '该时间段内已有其他考试安排'
        }
      } as IApiResponse<null>);
    }

    // 检查考试名称是否重复（同一创建者）
    const existingSession = await ExamSession.findOne({
      creatorId: new Types.ObjectId(creatorId),
      name: name.trim(),
      status: { $ne: ExamSessionStatus.CANCELLED }
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: '考试名称已存在',
        error: {
          code: ExamManagementErrorCode.SESSION_ALREADY_EXISTS,
          details: '您已创建过同名的考试会话'
        }
      } as IApiResponse<null>);
    }

    // 设置默认的考试配置
    const defaultSettings = {
      allowReview: false,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResults: false,
      allowRetake: false,
      maxAttempts: 1,
      passingScore: 60,
      autoGrade: true,
      preventCheating: false,
      ...sessionData.settings
    };

    // 创建考试会话
    const newSession = new ExamSession({
      name: name.trim(),
      description: sessionData.description?.trim() || '',
      paperId: new Types.ObjectId(paperId),
      creatorId: new Types.ObjectId(creatorId), // 使用ObjectId格式
      startTime: startDate,
      endTime: endDate,
      duration,
      settings: defaultSettings,
      status: sessionData.status || ExamSessionStatus.DRAFT, // 允许指定状态，默认为DRAFT
      allowedUsers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedSession = await newSession.save();

    // 填充关联数据
    const populatedSession = await ExamSession.findById(savedSession._id)
      .populate('paperId', 'title type totalQuestions totalPoints')
      .exec();

    if (!populatedSession) {
      return res.status(500).json({
        success: false,
        message: '创建考试会话失败',
        error: {
          code: ExamManagementErrorCode.INVALID_INPUT,
          details: '数据保存后无法检索'
        }
      } as IApiResponse<null>);
    }

    // 构造响应数据 - 使用Mock认证中的用户信息
    const responseData: IExamSessionResponse = {
      _id: String(populatedSession._id),
      name: populatedSession.name,
      description: populatedSession.description,
      paperId: {
        _id: populatedSession.paperId._id.toString(),
        title: (populatedSession.paperId as any).title,
        type: (populatedSession.paperId as any).type,
        totalQuestions: (populatedSession.paperId as any).totalQuestions,
        totalPoints: (populatedSession.paperId as any).totalPoints
      },
      creatorId: {
        _id: creatorId,
        username: req.user?.username || '未知用户',
        email: req.user?.username ? `${req.user.username}@example.com` : 'unknown@example.com'
      },
      status: populatedSession.status,
      startTime: populatedSession.startTime.toISOString(),
      endTime: populatedSession.endTime.toISOString(),
      duration: populatedSession.duration,
      settings: {
        allowReview: populatedSession.settings?.allowReview ?? false,
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: false,
        allowRetake: false,
        maxAttempts: populatedSession.settings?.maxAttempts ?? 1,
        passingScore: populatedSession.settings?.passingScore ?? 60,
        autoGrade: populatedSession.settings?.autoGrade ?? true,
        preventCheating: populatedSession.settings?.preventCheating ?? false
      },

      createdAt: populatedSession.createdAt.toISOString(),
      updatedAt: populatedSession.updatedAt.toISOString()
    };

    return res.status(201).json({
      success: true,
      data: responseData,
      message: '考试会话创建成功'
    } as IApiResponse<IExamSessionResponse>);

  } catch (error) {
    console.error('创建考试会话错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

// 导出更新函数
export { updateExamSession };

// 导出状态管理函数
export { 
  updateExamSessionStatus, 
  batchUpdateExamSessionStatus, 
  getStatusTransitionRules,
  deleteExamSession
};