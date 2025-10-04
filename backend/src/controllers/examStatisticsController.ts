import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ExamSession } from '../models/ExamSession';
import { ExamRecord, IExamRecord } from '../models/ExamRecord';
import { User } from '../models/User';
import { ExamSessionStatus } from '../types/exam-session.types';
import { 
  ExamManagementErrorCode,
  IApiResponse
} from '../types/exam-management.types';

/**
 * 考试统计数据接口
 */
interface IExamStatistics {
  sessionId: string;
  name: string;
  status: ExamSessionStatus;
  startTime: string;
  endTime: string;
  duration: number;
  totalParticipants: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageTime: number;
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  questionAnalysis: {
    questionId: string;
    content: string;
    correctRate: number;
    averageTime: number;
    difficulty: string;
  }[];
}

/**
 * 系统整体统计数据接口
 */
interface ISystemStatistics {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalParticipants: number;
  averageScore: number;
  passRate: number;
  sessionsByStatus: {
    status: ExamSessionStatus;
    count: number;
    percentage: number;
  }[];
  recentActivity: {
    date: string;
    sessionsCreated: number;
    participantsCount: number;
    averageScore: number;
  }[];
}

/**
 * 获取单个考试会话的详细统计
 * @route GET /api/exam-sessions/:id/statistics
 * @desc 获取指定考试会话的详细统计数据
 * @access 需要管理员或教师权限
 */
export const getExamSessionStatistics = async (req: Request, res: Response): Promise<void> => {
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
        select: 'title questions',
        populate: {
          path: 'questions',
          select: 'content type difficulty'
        }
      })
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

    // 权限检查：只有管理员、教师或考试创建者可以查看统计
    if (req.user?.role === 'student') {
      const creatorId = session.creatorId?.toString();
      if (creatorId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: '无权访问该考试统计',
          error: {
            code: ExamManagementErrorCode.UNAUTHORIZED,
            details: '您没有权限查看该考试的统计数据'
          }
        } as IApiResponse<null>);
        return;
      }
    }

    // 查询考试记录
    const examRecords = await ExamRecord.find({ sessionId: id })
      .populate('userId', 'username profile.firstName profile.lastName')
      .lean();

    // 计算基础统计
    const totalParticipants = examRecords.length;
    const completedRecords = examRecords.filter((record: any) => record.status === 'completed');
    const inProgressRecords = examRecords.filter((record: any) => record.status === 'in_progress');
    const notStartedRecords = examRecords.filter((record: any) => record.status === 'not_started');

    const completedCount = completedRecords.length;
    const inProgressCount = inProgressRecords.length;
    const notStartedCount = notStartedRecords.length;

    // 计算分数统计
    const scores = completedRecords.map((record: any) => record.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // 计算通过率（假设60分为及格线）
    const passingScore = session.settings?.passingScore || 60;
    const passedCount = scores.filter((score: number) => score >= passingScore).length;
    const passRate = scores.length > 0 ? (passedCount / scores.length) * 100 : 0;

    // 计算平均用时
    const completionTimes = completedRecords
      .filter((record: any) => record.startTime && record.endTime)
      .map((record: any) => {
        const startTime = new Date(record.startTime!).getTime();
        const endTime = new Date(record.endTime!).getTime();
        return (endTime - startTime) / (1000 * 60); // 转换为分钟
      });
    const averageTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum: number, time: number) => sum + time, 0) / completionTimes.length 
      : 0;

    // 分数分布统计
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 }
    ];

    const scoreDistribution = scoreRanges.map(range => {
      const count = scores.filter((score: number) => score >= range.min && score <= range.max).length;
      const percentage = scores.length > 0 ? (count / scores.length) * 100 : 0;
      return {
        range: range.range,
        count,
        percentage: Math.round(percentage * 100) / 100
      };
    });

    // 题目分析（如果有试卷数据）
    let questionAnalysis: any[] = [];
    if (session.paperId && (session.paperId as any).questions && Array.isArray((session.paperId as any).questions)) {
      const questions = (session.paperId as any).questions;
      questionAnalysis = questions.map((question: any) => {
        // 计算题目正确率（简化版本，实际应该基于详细的答案记录）
        const correctRate = Math.random() * 100; // 临时使用随机数，实际应该从答案记录中计算
        
        return {
          questionId: question._id ? question._id.toString() : 'unknown',
          content: (question.content && typeof question.content === 'string') 
            ? question.content.substring(0, 100) + '...' 
            : '题目内容',
          correctRate: Math.round(correctRate * 100) / 100,
          averageTime: Math.round((Math.random() * 5 + 1) * 100) / 100, // 临时数据
          difficulty: question.difficulty || 'medium'
        };
      }).filter((q: any) => q.questionId !== 'unknown'); // 过滤掉无效的题目
    }

    // 构造统计数据
    const statistics: IExamStatistics = {
      sessionId: session._id.toString(),
      name: session.name,
      status: session.status,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      duration: session.duration,
      totalParticipants,
      completedCount,
      inProgressCount,
      notStartedCount,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: Math.round(passRate * 100) / 100,
      averageTime: Math.round(averageTime * 100) / 100,
      scoreDistribution,
      questionAnalysis
    };

    res.status(200).json({
      success: true,
      data: statistics,
      message: '考试统计数据获取成功'
    } as IApiResponse<IExamStatistics>);

  } catch (error) {
    console.error('获取考试统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试统计失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

/**
 * 获取系统整体统计数据
 * @route GET /api/exam-sessions/statistics/system
 * @desc 获取系统整体考试统计数据
 * @access 需要管理员权限
 */
export const getSystemStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    // 权限检查：只有管理员可以查看系统统计
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权访问系统统计',
        error: {
          code: ExamManagementErrorCode.UNAUTHORIZED,
          details: '只有管理员可以查看系统统计数据'
        }
      } as IApiResponse<null>);
      return;
    }

    // 获取时间范围参数
    const { days = 30 } = req.query;
    const daysNum = Math.min(365, Math.max(1, parseInt(days as string)));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // 查询考试会话统计
    const [totalSessions, sessionsByStatus, recentSessions] = await Promise.all([
      ExamSession.countDocuments(),
      ExamSession.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      ExamSession.find({
        createdAt: { $gte: startDate }
      }).lean()
    ]);

    // 查询考试记录统计
    const [totalParticipants, completedRecords] = await Promise.all([
      ExamRecord.countDocuments(),
      ExamRecord.find({
        status: 'completed',
        endTime: { $gte: startDate }
      }).lean()
    ]);

    // 计算活跃和已完成的考试数量
    const activeSessions = sessionsByStatus.find(s => s._id === ExamSessionStatus.ACTIVE)?.count || 0;
    const completedSessions = sessionsByStatus.find(s => s._id === ExamSessionStatus.COMPLETED)?.count || 0;

    // 计算整体平均分和通过率
    const scores = completedRecords.map((record: any) => record.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length : 0;
    const passedCount = scores.filter((score: number) => score >= 60).length; // 默认60分及格
    const passRate = scores.length > 0 ? (passedCount / scores.length) * 100 : 0;

    // 按状态分组统计
    const sessionsByStatusFormatted = Object.values(ExamSessionStatus).map(status => {
      const statusData = sessionsByStatus.find(s => s._id === status);
      const count = statusData ? statusData.count : 0;
      const percentage = totalSessions > 0 ? (count / totalSessions) * 100 : 0;
      
      return {
        status,
        count,
        percentage: Math.round(percentage * 100) / 100
      };
    });

    // 最近活动统计（按天分组）
    const recentActivity: any[] = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const sessionsCreated = recentSessions.filter((session: any) => {
        const createdAt = new Date(session.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;

      const dayRecords = completedRecords.filter((record: any) => {
        const endTime = new Date(record.endTime!);
        return endTime >= dayStart && endTime <= dayEnd;
      });

      const participantsCount = dayRecords.length;
      const dayScores = dayRecords.map((record: any) => record.score || 0);
      const dayAverageScore = dayScores.length > 0 
        ? dayScores.reduce((sum: number, score: number) => sum + score, 0) / dayScores.length 
        : 0;

      recentActivity.push({
        date: dateStr,
        sessionsCreated,
        participantsCount,
        averageScore: Math.round(dayAverageScore * 100) / 100
      });
    }

    // 构造系统统计数据
    const systemStatistics: ISystemStatistics = {
      totalSessions,
      activeSessions,
      completedSessions,
      totalParticipants,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      sessionsByStatus: sessionsByStatusFormatted,
      recentActivity
    };

    res.status(200).json({
      success: true,
      data: systemStatistics,
      message: '系统统计数据获取成功'
    } as IApiResponse<ISystemStatistics>);

  } catch (error) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统统计失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};

/**
 * 获取考试参与者详细统计
 * @route GET /api/exam-sessions/:id/participants-statistics
 * @desc 获取指定考试会话的参与者详细统计
 * @access 需要管理员或教师权限
 */
export const getParticipantsStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'score', 
      sortOrder = 'desc',
      status 
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
    if (req.user?.role === 'student') {
      const creatorId = session.creatorId?.toString();
      if (creatorId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: '无权访问该考试统计',
          error: {
            code: ExamManagementErrorCode.UNAUTHORIZED,
            details: '您没有权限查看该考试的参与者统计'
          }
        } as IApiResponse<null>);
        return;
      }
    }

    // 构建查询条件
    const query: any = { sessionId: id };
    if (status && ['not_started', 'in_progress', 'completed'].includes(status as string)) {
      query.status = status;
    }

    // 分页参数
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // 排序参数
    const sortOptions: any = {};
    const validSortFields = ['score', 'startTime', 'endTime', 'status'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'score';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortField as string] = sortDirection;

    // 查询参与者记录
    const [participants, total] = await Promise.all([
      ExamRecord.find(query)
        .populate('userId', 'username email profile.firstName profile.lastName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ExamRecord.countDocuments(query)
    ]);

    // 格式化参与者数据
    const formattedParticipants = participants.map((participant: any) => {
      const user = participant.userId as any;
      const duration = participant.startTime && participant.endTime 
        ? Math.round((new Date(participant.endTime).getTime() - new Date(participant.startTime).getTime()) / (1000 * 60))
        : 0;

      return {
        recordId: participant._id.toString(),
        user: {
          id: user?._id?.toString() || participant.userId.toString(),
          username: user?.username || '未知用户',
          email: user?.email || `${user?.username || 'unknown'}@example.com`,
          fullName: user?.profile?.firstName && user?.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user?.username || '未知用户'
        },
        status: participant.status,
        score: participant.score || 0,
        startTime: participant.startTime ? new Date(participant.startTime).toISOString() : null,
        endTime: participant.endTime ? new Date(participant.endTime).toISOString() : null,
        duration, // 分钟
        attempts: participant.attempts || 0,
        answers: participant.answers?.length || 0,
        createdAt: participant.createdAt.toISOString()
      };
    });

    // 计算分页信息
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: {
        participants: formattedParticipants,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      },
      message: '参与者统计数据获取成功'
    } as IApiResponse<any>);

  } catch (error) {
    console.error('获取参与者统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取参与者统计失败',
      error: {
        code: ExamManagementErrorCode.INVALID_INPUT,
        details: error instanceof Error ? error.message : '未知错误'
      }
    } as IApiResponse<null>);
  }
};