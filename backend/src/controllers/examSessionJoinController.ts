import { Request, Response } from 'express';
import { ExamSession } from '../models/ExamSession';
import { ExamRecord, ExamRecordStatus } from '../models/ExamRecord';
import { Paper } from '../models/Paper';
import mongoose from 'mongoose';

/**
 * 学生加入考试会话
 * @route POST /api/exam-sessions/:id/join
 */
export const joinExamSession = async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 验证会话ID格式
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: '无效的考试会话ID'
      });
    }

    // 查找考试会话
    const session = await ExamSession.findById(sessionId).populate('paperId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '考试会话不存在'
      });
    }

    // 检查考试状态
    if (session.status !== 'published' && session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '考试尚未开放或已结束'
      });
    }

    // 检查考试时间
    const now = new Date();
    if (now < session.startTime) {
      return res.status(400).json({
        success: false,
        message: '考试尚未开始',
        data: {
          startTime: session.startTime
        }
      });
    }

    if (now > session.endTime) {
      return res.status(400).json({
        success: false,
        message: '考试已结束',
        data: {
          endTime: session.endTime
        }
      });
    }

    // 检查用户是否有权限参与考试
    const canParticipate = (session as any).canUserParticipate(userId);
    if (!canParticipate) {
      return res.status(403).json({
        success: false,
        message: '您没有权限参与此考试'
      });
    }

    // 检查是否已经存在考试记录
    const existingRecord = await ExamRecord.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (existingRecord) {
      // 如果已经完成考试，不允许重新加入
      if (existingRecord.status === ExamRecordStatus.COMPLETED) {
        return res.status(400).json({
          success: false,
          message: '您已经完成了此考试',
          data: {
            record: {
              id: existingRecord._id,
              status: existingRecord.status,
              score: existingRecord.score,
              completedAt: existingRecord.endTime
            }
          }
        });
      }

      // 如果考试正在进行中，返回现有记录
      if (existingRecord.status === ExamRecordStatus.IN_PROGRESS) {
        return res.status(200).json({
          success: true,
          message: '继续进行考试',
          data: {
            record: {
              id: existingRecord._id,
              status: existingRecord.status,
              currentQuestionIndex: existingRecord.currentQuestionIndex,
              startTime: existingRecord.startTime,
              remainingTime: (existingRecord as any).getRemainingTime()
            },
            session: {
              id: session._id,
              name: session.name,
              duration: session.duration,
              settings: session.settings
            }
          }
        });
      }

      // 检查尝试次数
      if (existingRecord.attempts >= existingRecord.maxAttempts) {
        return res.status(400).json({
          success: false,
          message: '您已达到最大尝试次数',
          data: {
            attempts: existingRecord.attempts,
            maxAttempts: existingRecord.maxAttempts
          }
        });
      }
    }

    // 获取试卷信息
    const paper = await Paper.findById(session.paperId);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '试卷不存在'
      });
    }

    // 创建或更新考试记录
    let examRecord;
    if (existingRecord) {
      // 更新现有记录，增加尝试次数
      existingRecord.attempts += 1;
      existingRecord.status = ExamRecordStatus.NOT_STARTED;
      existingRecord.startTime = undefined;
      existingRecord.endTime = undefined;
      existingRecord.currentQuestionIndex = 0;
      existingRecord.answers = [];
      existingRecord.score = 0;
      existingRecord.correctAnswers = 0;
      existingRecord.lastActiveTime = new Date();
      examRecord = await existingRecord.save();
    } else {
      // 创建新的考试记录
      examRecord = new ExamRecord({
        sessionId: new mongoose.Types.ObjectId(sessionId),
        userId: new mongoose.Types.ObjectId(userId),
        status: ExamRecordStatus.NOT_STARTED,
        totalQuestions: paper.questions.length,
        attempts: 1,
        maxAttempts: session.settings.maxAttempts || 1,
        timeLimit: session.settings.timeLimit ? session.duration : undefined,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || ''
      });
      await examRecord.save();
    }

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '成功加入考试',
      data: {
        record: {
          id: examRecord._id,
          status: examRecord.status,
          attempts: examRecord.attempts,
          maxAttempts: examRecord.maxAttempts,
          totalQuestions: examRecord.totalQuestions,
          timeLimit: examRecord.timeLimit
        },
        session: {
          id: session._id,
          name: session.name,
          description: session.description,
          duration: session.duration,
          settings: session.settings,
          startTime: session.startTime,
          endTime: session.endTime
        },
        paper: {
          id: paper._id,
          title: paper.title,
          description: paper.description,
          totalQuestions: paper.questions.length
        }
      }
    });

  } catch (error: any) {
    console.error('加入考试会话失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取用户可参与的考试会话列表
 * @route GET /api/exam-sessions/available
 */
export const getAvailableExamSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    const now = new Date();

    // 查找用户可参与的考试会话
    const sessions = await ExamSession.find({
      $or: [
        { participants: { $size: 0 } },  // 无限制
        { participants: userId }         // 在参与者列表中
      ],
      status: { $in: ['published', 'active'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
    .populate('paperId', 'title description questions')
    .populate('creatorId', 'username')
    .sort({ startTime: 1 });

    // 获取用户的考试记录
    const userRecords = await ExamRecord.find({
      userId: new mongoose.Types.ObjectId(userId),
      sessionId: { $in: sessions.map(s => s._id) }
    });

    // 创建记录映射
    const recordMap = new Map();
    userRecords.forEach(record => {
      recordMap.set(record.sessionId.toString(), record);
    });

    // 组装响应数据
    const availableSessions = sessions.map(session => {
      const record = recordMap.get((session._id as any).toString());
      const paper = session.paperId as any;

      return {
        id: session._id,
        name: session.name,
        description: session.description,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        settings: session.settings,
        creator: (session.creatorId as any)?.username,
        paper: {
          id: paper?._id,
          title: paper?.title,
          description: paper?.description,
          totalQuestions: paper?.questions?.length || 0
        },
        userRecord: record ? {
          id: record._id,
          status: record.status,
          attempts: record.attempts,
          maxAttempts: record.maxAttempts,
          score: record.score,
          completedAt: record.endTime
        } : null
      };
    });

    res.status(200).json({
      success: true,
      message: '获取可参与考试列表成功',
      data: {
        sessions: availableSessions,
        total: availableSessions.length
      }
    });

  } catch (error: any) {
    console.error('获取可参与考试列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取考试会话详情（学生视角）
 * @route GET /api/exam-sessions/:id/student-view
 */
export const getExamSessionStudentView = async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 验证会话ID格式
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: '无效的考试会话ID'
      });
    }

    // 查找考试会话
    const session = await ExamSession.findById(sessionId)
      .populate('paperId', 'title description questions')
      .populate('creatorId', 'username');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '考试会话不存在'
      });
    }

    // 检查用户是否有权限查看
    const canParticipate = (session as any).canUserParticipate(userId);
    if (!canParticipate) {
      return res.status(403).json({
        success: false,
        message: '您没有权限查看此考试'
      });
    }

    // 获取用户的考试记录
    const userRecord = await ExamRecord.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    const paper = session.paperId as any;

    // 组装响应数据
    const sessionData = {
      id: session._id,
      name: session.name,
      description: session.description,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status,
      settings: session.settings,
      creator: (session.creatorId as any)?.username,
      paper: {
        id: paper?._id,
        title: paper?.title,
        description: paper?.description,
        totalQuestions: paper?.questions?.length || 0
      },
      userRecord: userRecord ? {
        id: userRecord._id,
        status: userRecord.status,
        attempts: userRecord.attempts,
        maxAttempts: userRecord.maxAttempts,
        score: userRecord.score,
        currentQuestionIndex: userRecord.currentQuestionIndex,
        startTime: userRecord.startTime,
        endTime: userRecord.endTime,
        remainingTime: (userRecord as any).getRemainingTime(),
        completedAt: userRecord.endTime
      } : null
    };

    res.status(200).json({
      success: true,
      message: '获取考试详情成功',
      data: sessionData
    });

  } catch (error: any) {
    console.error('获取考试详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};