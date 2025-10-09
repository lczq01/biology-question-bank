import { Request, Response } from 'express';
import { ExamSession } from '../models/ExamSession';
import { PreviewExamRecord, PreviewExamRecordStatus } from '../models/previewExamRecord';
import { Paper } from '../models/Paper';
import { AuthenticatedRequest } from '../types/common.types';
import { PreviewGradingService } from '../services/previewGradingService';

/**
 * 开始预览考试API
 * POST /api/exam-sessions/:id/preview-start
 */
export const startPreviewExam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // 1. 验证考试会话存在
    const examSession = await ExamSession.findById(sessionId);
    if (!examSession) {
      res.status(404).json({
        success: false,
        message: '考试会话不存在'
      });
      return;
    }

    // 2. 获取试卷信息
    const paper = await Paper.findById(examSession.paperId);
    if (!paper) {
      res.status(400).json({
        success: false,
        message: '试卷不存在'
      });
      return;
    }

    // 3. 检查是否已有进行中的预览记录
    const existingPreview = await PreviewExamRecord.findOne({
      sessionId: sessionId,
      status: PreviewExamRecordStatus.IN_PROGRESS
    });

    if (existingPreview) {
      // 检查预览记录是否过期
      if (existingPreview.isExpired()) {
        // 过期则标记为放弃
        await existingPreview.abandonPreviewExam();
      } else {
        // 继续现有的预览
        const now = new Date();
        const startTime = existingPreview.startTime!;
        const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
        const remainingMinutes = examSession.duration - elapsedMinutes;

        if (remainingMinutes <= 0) {
          // 时间已到，自动结束预览
          await existingPreview.timeoutPreviewExam();

          res.status(400).json({
            success: false,
            message: '预览考试时间已到，预览已自动结束'
          });
          return;
        }

        res.json({
          success: true,
          message: '预览考试继续进行中',
          data: {
            previewRecord: {
              id: existingPreview._id,
              previewId: existingPreview.previewId,
              status: existingPreview.status,
              startTime: existingPreview.startTime,
              remainingMinutes: remainingMinutes,
              totalQuestions: existingPreview.totalQuestions,
              answeredQuestions: existingPreview.answers.filter((a: any) => a.userAnswer && a.userAnswer !== '').length,
              isPreview: true
            }
          }
        });
        return;
      }
    }

    // 4. 创建新的预览记录
    const previewRecord = await PreviewExamRecord.createPreviewRecord(
      examSession._id as any,
      paper.questions.length,
      examSession.duration
    );

    // 5. 开始预览考试
    const now = new Date();
    await previewRecord.startPreviewExam();

    // 6. 初始化预览答案数组
    previewRecord.answers = paper.questions.map((q: any) => ({
      questionId: q.questionId,
      userAnswer: '',
      isCorrect: false,
      score: 0,
      timeSpent: 0,
      submittedAt: new Date()
    }));

    await previewRecord.save();

    // 7. 返回预览开始信息
    res.json({
      success: true,
      message: '预览考试开始成功',
      data: {
        previewRecord: {
          id: previewRecord._id,
          previewId: previewRecord.previewId,
          status: previewRecord.status,
          startTime: previewRecord.startTime,
          remainingMinutes: examSession.duration,
          totalQuestions: previewRecord.totalQuestions,
          answeredQuestions: 0,
          isPreview: true,
          expiresAt: previewRecord.expiresAt
        },
        examSession: {
          id: examSession._id,
          name: examSession.name,
          duration: examSession.duration,
          // type字段已移除，使用固定值
          type: 'exam'
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
    console.error('开始预览考试失败:', error);
    res.status(500).json({
      success: false,
      message: '开始预览考试失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 预览答题API
 * POST /api/exam-sessions/:id/preview-answer
 */
export const submitPreviewAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const { previewId, questionId, answer, timeSpent = 0 } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    if (!previewId || !questionId || answer === undefined) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
      return;
    }

    // 1. 查找预览记录
    const previewRecord = await PreviewExamRecord.findByPreviewId(previewId);
    if (!previewRecord) {
      res.status(404).json({
        success: false,
        message: '预览记录不存在'
      });
      return;
    }

    // 2. 检查预览记录是否过期
    if (previewRecord.isExpired()) {
      res.status(400).json({
        success: false,
        message: '预览会话已过期'
      });
      return;
    }

    // 3. 检查预览状态
    if (previewRecord.status !== PreviewExamRecordStatus.IN_PROGRESS) {
      res.status(400).json({
        success: false,
        message: '预览考试未在进行中'
      });
      return;
    }

    // 4. 检查是否超时
    if (previewRecord.isTimeout()) {
      await previewRecord.timeoutPreviewExam();
      res.status(400).json({
        success: false,
        message: '预览考试时间已到'
      });
      return;
    }

    // 5. 使用评分服务进行真实评分
    const gradedAnswer = await PreviewGradingService.gradeAnswer(
      questionId,
      answer,
      timeSpent
    );

    // 6. 添加或更新答案
    await previewRecord.addPreviewAnswer(gradedAnswer);

    res.json({
      success: true,
      message: '预览答案提交成功',
      data: {
        questionId: questionId,
        isCorrect: gradedAnswer.isCorrect,
        score: gradedAnswer.score,
        totalScore: previewRecord.score,
        answeredQuestions: previewRecord.answers.filter((a: any) => a.userAnswer && a.userAnswer !== '').length,
        totalQuestions: previewRecord.totalQuestions,
        feedback: {
          isCorrect: gradedAnswer.isCorrect,
          explanation: gradedAnswer.isCorrect ? '答案正确！' : '答案不正确，请再次检查。'
        }
      }
    });

  } catch (error) {
    console.error('提交预览答案失败:', error);
    res.status(500).json({
      success: false,
      message: '提交预览答案失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 批量预览答题API
 * POST /api/exam-sessions/:id/preview-batch-answer
 */
export const submitPreviewBatchAnswers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const { previewId, answers } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    if (!previewId || !answers || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数或答案格式错误'
      });
      return;
    }

    // 1. 查找预览记录
    const previewRecord = await PreviewExamRecord.findByPreviewId(previewId);
    if (!previewRecord) {
      res.status(404).json({
        success: false,
        message: '预览记录不存在'
      });
      return;
    }

    // 2. 检查预览记录状态
    if (previewRecord.status !== PreviewExamRecordStatus.IN_PROGRESS) {
      res.status(400).json({
        success: false,
        message: '预览考试未在进行中'
      });
      return;
    }

    // 3. 检查是否过期或超时
    if (previewRecord.isExpired() || previewRecord.isTimeout()) {
      await previewRecord.timeoutPreviewExam();
      res.status(400).json({
        success: false,
        message: '预览考试已过期或超时'
      });
      return;
    }

    // 4. 批量评分答案
    const gradedAnswers = await PreviewGradingService.gradeAnswers(answers);

    // 5. 批量添加答案
    for (const gradedAnswer of gradedAnswers) {
      await previewRecord.addPreviewAnswer(gradedAnswer);
    }

    // 6. 重新查询预览记录以获取最新数据
    const updatedPreviewRecord = await PreviewExamRecord.findByPreviewId(previewId);
    if (!updatedPreviewRecord) {
      res.status(500).json({
        success: false,
        message: '获取更新后的预览记录失败'
      });
      return;
    }

    res.json({
      success: true,
      message: '批量答案提交成功',
      data: {
        processedAnswers: gradedAnswers.length,
        totalScore: updatedPreviewRecord.score,
        answeredQuestions: updatedPreviewRecord.answers.filter((a: any) => a.userAnswer && a.userAnswer !== '').length,
        totalQuestions: updatedPreviewRecord.totalQuestions,
        correctAnswers: updatedPreviewRecord.correctAnswers
      }
    });

  } catch (error) {
    console.error('批量提交预览答案失败:', error);
    res.status(500).json({
      success: false,
      message: '批量提交预览答案失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 预览提交考试API
 * POST /api/exam-sessions/:id/preview-submit
 */
export const submitPreviewExam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const { previewId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    if (!previewId) {
      res.status(400).json({
        success: false,
        message: '缺少预览ID'
      });
      return;
    }

    // 1. 查找预览记录
    const previewRecord = await PreviewExamRecord.findByPreviewId(previewId);
    if (!previewRecord) {
      res.status(404).json({
        success: false,
        message: '预览记录不存在'
      });
      return;
    }

    // 2. 检查预览状态
    if (previewRecord.status !== PreviewExamRecordStatus.IN_PROGRESS) {
      res.status(400).json({
        success: false,
        message: '预览考试未在进行中'
      });
      return;
    }

    // 3. 完成预览考试
    await previewRecord.completePreviewExam();

    // 4. 计算最终统计信息
    const duration = previewRecord.getDuration();
    const statistics = PreviewGradingService.calculateStatistics(
      previewRecord.answers,
      previewRecord.totalQuestions
    );

    res.json({
      success: true,
      message: '预览考试提交成功',
      data: {
        previewRecord: {
          id: previewRecord._id,
          previewId: previewRecord.previewId,
          status: previewRecord.status,
          startTime: previewRecord.startTime,
          endTime: previewRecord.endTime,
          duration: duration,
          isPreview: true,
          ...statistics
        }
      }
    });

  } catch (error) {
    console.error('提交预览考试失败:', error);
    res.status(500).json({
      success: false,
      message: '提交预览考试失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 获取预览考试结果API
 * GET /api/exam-sessions/:id/preview-result
 */
export const getPreviewExamResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const { previewId } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    if (!previewId) {
      res.status(400).json({
        success: false,
        message: '缺少预览ID'
      });
      return;
    }

    // 1. 查找预览记录
    const previewRecord = await PreviewExamRecord.findByPreviewId(previewId as string);
    if (!previewRecord) {
      res.status(404).json({
        success: false,
        message: '预览记录不存在'
      });
      return;
    }

    // 2. 检查预览记录是否已完成
    if (previewRecord.status !== PreviewExamRecordStatus.COMPLETED && 
        previewRecord.status !== PreviewExamRecordStatus.TIMEOUT) {
      res.status(400).json({
        success: false,
        message: '预览考试尚未完成，无法查看结果'
      });
      return;
    }

    // 3. 获取考试会话和试卷信息
    const examSession = await ExamSession.findById(sessionId).populate('paperId');
    if (!examSession || !examSession.paperId) {
      res.status(404).json({
        success: false,
        message: '考试会话或试卷不存在'
      });
      return;
    }

    const paper = examSession.paperId as any;

    // 4. 计算详细统计信息
    const statistics = PreviewGradingService.calculateStatistics(
      previewRecord.answers,
      previewRecord.totalQuestions
    );

    // 5. 构建详细的答题结果
    const detailedAnswers = paper.questions.map((paperQuestion: any, index: number) => {
      const userAnswer = previewRecord.answers.find((a: any) => 
        a.questionId.toString() === paperQuestion.questionId.toString()
      );

      return {
        questionIndex: index + 1,
        questionId: paperQuestion.questionId,
        questionType: paperQuestion.type,
        questionContent: paperQuestion.content || paperQuestion.title,
        questionPoints: paperQuestion.points || 5,
        userAnswer: userAnswer?.userAnswer || '',
        correctAnswer: paperQuestion.correctAnswer,
        isCorrect: userAnswer?.isCorrect || false,
        score: userAnswer?.score || 0,
        timeSpent: userAnswer?.timeSpent || 0,
        explanation: paperQuestion.explanation || '',
        difficulty: paperQuestion.difficulty || 'medium',
        isAnswered: userAnswer && userAnswer.userAnswer && userAnswer.userAnswer !== ''
      };
    });

    // 6. 计算考试时长
    const duration = previewRecord.getDuration();
    const startTime = previewRecord.startTime;
    const endTime = previewRecord.endTime;

    // 7. 生成考试报告
    const examReport = {
      // 基本信息
      previewInfo: {
        previewId: previewRecord.previewId,
        sessionId: examSession._id,
        sessionName: examSession.name,
        paperTitle: paper.title,
        status: previewRecord.status,
        isPreview: true
      },

      // 时间信息
      timeInfo: {
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        timeLimit: examSession.duration,
        isTimeout: previewRecord.status === PreviewExamRecordStatus.TIMEOUT
      },

      // 分数统计
      scoreInfo: {
        totalScore: statistics.totalScore,
        totalPossibleScore: paper.questions.reduce((sum: number, q: any) => sum + (q.points || 5), 0),
        accuracy: statistics.accuracy,
        grade: statistics.grade,
        isPassed: statistics.accuracy >= 60
      },

      // 答题统计
      answerInfo: {
        totalQuestions: statistics.totalQuestions,
        answeredQuestions: statistics.answeredQuestions,
        correctAnswers: statistics.correctAnswers,
        wrongAnswers: statistics.answeredQuestions - statistics.correctAnswers,
        skippedQuestions: statistics.timeStatistics.skippedQuestions,
        completionRate: statistics.completionRate
      },

      // 时间统计
      timeStatistics: statistics.timeStatistics,

      // 详细答题结果
      detailedAnswers: detailedAnswers,

      // 分析建议
      analysis: {
        strengths: [] as string[],
        weaknesses: [] as string[],
        suggestions: [] as string[]
      }
    };

    // 8. 生成分析建议
    if (statistics.accuracy >= 80) {
      examReport.analysis.strengths.push('整体答题准确率较高');
    }
    if (statistics.completionRate >= 90) {
      examReport.analysis.strengths.push('答题完成度很好');
    }
    if (statistics.timeStatistics.averageTimePerQuestion < 120) {
      examReport.analysis.strengths.push('答题速度较快');
    }

    if (statistics.accuracy < 60) {
      examReport.analysis.weaknesses.push('答题准确率需要提高');
      examReport.analysis.suggestions.push('建议加强基础知识复习');
    }
    if (statistics.completionRate < 80) {
      examReport.analysis.weaknesses.push('答题完成度不够');
      examReport.analysis.suggestions.push('建议合理分配答题时间');
    }
    if (statistics.timeStatistics.skippedQuestions > 0) {
      examReport.analysis.suggestions.push(`有${statistics.timeStatistics.skippedQuestions}道题未作答，建议检查时间管理`);
    }

    res.json({
      success: true,
      message: '获取预览考试结果成功',
      data: examReport
    });

  } catch (error) {
    console.error('获取预览考试结果失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预览考试结果失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 获取预览考试进度API
 * GET /api/exam-sessions/:id/preview-progress
 */
export const getPreviewExamProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const { previewId } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    if (!previewId) {
      res.status(400).json({
        success: false,
        message: '缺少预览ID'
      });
      return;
    }

    // 1. 查找预览记录
    const previewRecord = await PreviewExamRecord.findByPreviewId(previewId as string);
    if (!previewRecord) {
      res.status(404).json({
        success: false,
        message: '预览记录不存在'
      });
      return;
    }

    // 2. 获取考试会话信息
    const examSession = await ExamSession.findById(sessionId);
    if (!examSession) {
      res.status(404).json({
        success: false,
        message: '考试会话不存在'
      });
      return;
    }

    // 3. 计算剩余时间
    let remainingMinutes = 0;
    if (previewRecord.status === PreviewExamRecordStatus.IN_PROGRESS && previewRecord.startTime) {
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - previewRecord.startTime.getTime()) / (1000 * 60));
      remainingMinutes = Math.max(0, examSession.duration - elapsedMinutes);
    }

    res.json({
      success: true,
      data: {
        previewRecord: {
          id: previewRecord._id,
          previewId: previewRecord.previewId,
          status: previewRecord.status,
          startTime: previewRecord.startTime,
          endTime: previewRecord.endTime,
          remainingMinutes: remainingMinutes,
          totalQuestions: previewRecord.totalQuestions,
          answeredQuestions: previewRecord.answers.filter((a: any) => a.userAnswer && a.userAnswer !== '').length,
          score: previewRecord.score,
          correctAnswers: previewRecord.correctAnswers,
          isPreview: true,
          expiresAt: previewRecord.expiresAt,
          isExpired: previewRecord.isExpired()
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
    console.error('获取预览考试进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预览考试进度失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};