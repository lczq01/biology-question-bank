import { Request, Response } from 'express';
import { ExamSession } from '../models/ExamSession';
import { ExamRecord, ExamRecordStatus } from '../models/ExamRecord';
import { Paper } from '../models/Paper';
import { AuthenticatedRequest } from '../types/common.types';

/**
 * 开始考试API
 * POST /api/exam-sessions/:id/start
 */
export const startExam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    // 1. 验证考试会话存在且可以开始
    const examSession = await ExamSession.findById(sessionId);
    if (!examSession) {
      res.status(404).json({
        success: false,
        message: '考试会话不存在'
      });
      return;
    }

    // 2. 检查考试状态
    if (examSession.status !== 'active') {
      res.status(400).json({
        success: false,
        message: '考试尚未开放或已结束'
      });
      return;
    }

    // 3. 检查考试时间
    const now = new Date();
    if (now < examSession.startTime || now > examSession.endTime) {
      res.status(400).json({
        success: false,
        message: '当前时间不在考试时间范围内'
      });
      return;
    }

    // 4. 查找用户的考试记录
    let examRecord = await ExamRecord.findOne({
      sessionId: sessionId,
      userId: userId
    });

    if (!examRecord) {
      res.status(400).json({
        success: false,
        message: '您还未加入此考试，请先加入考试'
      });
      return;
    }

    // 5. 检查考试记录状态
    if (examRecord.status === 'completed') {
      res.status(400).json({
        success: false,
        message: '您已完成此考试，不能重复开始'
      });
      return;
    }

    if (examRecord.status === 'in_progress') {
      // 如果已经在进行中，计算剩余时间
      const startTime = examRecord.startTime!;
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      const remainingMinutes = examSession.duration - elapsedMinutes;

      if (remainingMinutes <= 0) {
        // 时间已到，自动结束考试
        examRecord.status = ExamRecordStatus.COMPLETED;
        examRecord.endTime = now;
        await examRecord.save();

        res.status(400).json({
          success: false,
          message: '考试时间已到，考试已自动结束'
        });
        return;
      }

      res.json({
        success: true,
        message: '考试继续进行中',
        data: {
          examRecord: {
            id: examRecord._id,
            status: examRecord.status,
            startTime: examRecord.startTime,
            remainingMinutes: remainingMinutes,
            totalQuestions: examRecord.totalQuestions,
            answeredQuestions: examRecord.answers.filter((a: any) => a.userAnswer && a.userAnswer !== '').length
          }
        }
      });
      return;
    }

    // 6. 获取试卷信息
    const paper = await Paper.findById(examSession.paperId);
    if (!paper) {
      res.status(400).json({
        success: false,
        message: '试卷不存在'
      });
      return;
    }

    // 7. 开始考试 - 更新考试记录状态
    examRecord.status = ExamRecordStatus.IN_PROGRESS;
    examRecord.startTime = now;
    examRecord.totalQuestions = paper.questions.length;
    
    // 初始化答案数组（如果还没有的话）
    if (!examRecord.answers || examRecord.answers.length === 0) {
      examRecord.answers = paper.questions.map((q: any) => ({
        questionId: q.questionId,
        userAnswer: '',
        isCorrect: false,
        score: 0,
        timeSpent: 0,
        submittedAt: new Date()
      }));
    }

    await examRecord.save();

    // 8. 返回考试开始信息
    res.json({
      success: true,
      message: '考试开始成功',
      data: {
        examRecord: {
          id: examRecord._id,
          status: examRecord.status,
          startTime: examRecord.startTime,
          remainingMinutes: examSession.duration,
          totalQuestions: examRecord.totalQuestions,
          answeredQuestions: 0
        },
        examSession: {
          id: examSession._id,
          name: examSession.name,
          duration: examSession.duration,
          endTime: examSession.endTime
        },
        paper: {
          id: paper._id,
          title: paper.title,
          description: paper.description,
          totalQuestions: paper.questions.length
        }
      }
    });

  } catch (error) {
    console.error('开始考试失败:', error);
    res.status(500).json({
      success: false,
      message: '开始考试失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 获取考试进度API
 * GET /api/exam-sessions/:id/progress
 */
export const getExamProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    // 查找用户的考试记录
    const examRecord = await ExamRecord.findOne({
      sessionId: sessionId,
      userId: userId
    });

    if (!examRecord) {
      res.status(404).json({
        success: false,
        message: '考试记录不存在'
      });
      return;
    }

    // 获取考试会话信息
    const examSession = await ExamSession.findById(sessionId);
    if (!examSession) {
      res.status(404).json({
        success: false,
        message: '考试会话不存在'
      });
      return;
    }

    let remainingMinutes = 0;
    if (examRecord.status === 'in_progress' && examRecord.startTime) {
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - examRecord.startTime.getTime()) / (1000 * 60));
      remainingMinutes = Math.max(0, examSession.duration - elapsedMinutes);
    }

    res.json({
      success: true,
      data: {
        examRecord: {
          id: examRecord._id,
          status: examRecord.status,
          startTime: examRecord.startTime,
          endTime: examRecord.endTime,
          remainingMinutes: remainingMinutes,
          totalQuestions: examRecord.totalQuestions,
          answeredQuestions: examRecord.answers.filter((a: any) => a.userAnswer && a.userAnswer !== '').length,
          score: examRecord.score,
          correctAnswers: examRecord.correctAnswers
        },
        examSession: {
          id: examSession._id,
          name: examSession.name,
          duration: examSession.duration,
          status: examSession.status
        }
      }
    });

  } catch (error) {
    console.error('获取考试进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试进度失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};