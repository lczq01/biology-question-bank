import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ExamRecord, ExamRecordStatus, IAnswerRecord } from '../models/ExamRecord';
import { ExamSession } from '../models/ExamSession';
import { Paper } from '../models/Paper';
import Question from '../models/Question';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 考试结果计算接口
 */
export interface IExamResult {
  examRecordId: string;
  sessionId: string;
  userId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  totalPoints: number;
  accuracy: number;
  timeUsed: number; // 秒
  isPassed: boolean;
  grade: string;
  answers: IAnswerRecord[];
  statistics: {
    averageTimePerQuestion: number;
    fastestQuestion: number;
    slowestQuestion: number;
    skippedQuestions: number;
  };
}

/**
 * 自动评分算法
 */
class AutoGradingService {
  /**
   * 检查答案是否正确
   */
  static checkAnswer(question: any, userAnswer: string | string[]): boolean {
    if (!question || !question.correctAnswer) {
      return false;
    }

    const correctAnswer = question.correctAnswer;
    
    switch (question.type) {
      case 'single_choice':
        return userAnswer === correctAnswer;
        
      case 'multiple_choice':
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
          return false;
        }
        // 多选题需要选项完全匹配
        const userSet = new Set(userAnswer.sort());
        const correctSet = new Set(correctAnswer.sort());
        return userSet.size === correctSet.size && 
               [...userSet].every(answer => correctSet.has(answer));
        
      case 'fill_blank':
        // 填空题支持多个正确答案，不区分大小写
        const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
        const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer;
        
        return correctAnswers.some(correct => 
          userAnswerStr.toLowerCase().trim() === correct.toLowerCase().trim()
        );
        
      default:
        return false;
    }
  }

  /**
   * 计算题目得分
   */
  static calculateQuestionScore(question: any, userAnswer: string | string[], isCorrect: boolean): number {
    if (!isCorrect) {
      return 0;
    }
    
    // 根据题目类型和难度调整分数
    const basePoints = question.points || 5;
    let multiplier = 1;
    
    // 难度系数
    switch (question.difficulty) {
      case 'easy':
        multiplier = 1;
        break;
      case 'medium':
        multiplier = 1.2;
        break;
      case 'hard':
        multiplier = 1.5;
        break;
    }
    
    return Math.round(basePoints * multiplier);
  }

  /**
   * 计算等级
   */
  static calculateGrade(accuracy: number): string {
    if (accuracy >= 90) return 'A';
    if (accuracy >= 80) return 'B';
    if (accuracy >= 70) return 'C';
    if (accuracy >= 60) return 'D';
    return 'F';
  }
}

/**
 * 完成考试并计算结果
 */
export const completeExam = async (req: Request, res: Response) => {
  try {
    const { recordId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return errorResponse(res, '用户未登录', 401);
    }

    if (!recordId) {
      return errorResponse(res, '考试记录ID不能为空', 400);
    }

    // 查找考试记录
    const examRecord = await ExamRecord.findOne({
      _id: recordId,
      userId: new mongoose.Types.ObjectId(userId)
    }).populate('sessionId');

    if (!examRecord) {
      return errorResponse(res, '考试记录不存在', 404);
    }

    if (examRecord.status === ExamRecordStatus.COMPLETED) {
      return errorResponse(res, '考试已完成，无法重复提交', 400);
    }

    if (examRecord.status !== ExamRecordStatus.IN_PROGRESS) {
      return errorResponse(res, '考试状态异常，无法完成', 400);
    }

    // 获取考试会话和试卷信息
    const session = examRecord.sessionId as any;
    if (!session || !session.paperId) {
      return errorResponse(res, '考试会话或试卷信息不存在', 404);
    }

    const paper = await Paper.findById(session.paperId).populate('questions.questionId');
    if (!paper) {
      return errorResponse(res, '试卷不存在', 404);
    }

    // 自动评分
    const result = await calculateExamResult(examRecord, paper);

    // 更新考试记录
    examRecord.status = ExamRecordStatus.COMPLETED;
    examRecord.endTime = new Date();
    examRecord.score = result.score;
    examRecord.correctAnswers = result.correctAnswers;

    // 更新答案记录的评分信息
    for (let i = 0; i < examRecord.answers.length; i++) {
      const answerRecord = examRecord.answers[i];
      const resultAnswer = result.answers.find(a => 
        a.questionId.toString() === answerRecord.questionId.toString()
      );
      if (resultAnswer) {
        examRecord.answers[i].isCorrect = resultAnswer.isCorrect;
        examRecord.answers[i].score = resultAnswer.score;
      }
    }

    await examRecord.save();

    return successResponse(res, result, '考试完成，成绩计算成功');
  } catch (error) {
    console.error('完成考试失败:', error);
    return errorResponse(res, '完成考试失败', 500);
  }
};

/**
 * 计算考试结果
 */
async function calculateExamResult(examRecord: any, paper: any): Promise<IExamResult> {
  const paperQuestions = paper.questions || [];
  const userAnswers = examRecord.answers || [];
  
  let correctAnswers = 0;
  let totalScore = 0;
  let totalPoints = 0;
  const processedAnswers: IAnswerRecord[] = [];
  
  // 获取所有题目的详细信息
  const questionIds = paperQuestions.map((pq: any) => pq.questionId._id || pq.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  
  // 计算总分
  for (const pq of paperQuestions) {
    const question = questions.find((q: any) => q._id.toString() === (pq.questionId._id || pq.questionId).toString());
    if (question) {
      totalPoints += pq.points || question.points || 5;
    }
  }
  
  // 评分每个答案
  for (const pq of paperQuestions) {
    const question = questions.find((q: any) => q._id.toString() === (pq.questionId._id || pq.questionId).toString());
    if (!question) continue;
    
    const userAnswer = userAnswers.find((ua: any) => ua.questionId.toString() === (question._id as mongoose.Types.ObjectId).toString());
    
    if (userAnswer) {
      // 用户已回答
      const isCorrect = AutoGradingService.checkAnswer(question, userAnswer.userAnswer);
      const score = isCorrect ? (pq.points || question.points || 5) : 0;
      
      if (isCorrect) {
        correctAnswers++;
      }
      totalScore += score;
      
      processedAnswers.push({
        questionId: question._id as mongoose.Types.ObjectId,
        userAnswer: userAnswer.userAnswer,
        isCorrect,
        score,
        timeSpent: userAnswer.timeSpent || 0,
        submittedAt: userAnswer.submittedAt || new Date()
      });
    } else {
      // 用户未回答
      processedAnswers.push({
        questionId: question._id as mongoose.Types.ObjectId,
        userAnswer: '',
        isCorrect: false,
        score: 0,
        timeSpent: 0,
        submittedAt: new Date()
      });
    }
  }
  
  // 计算统计信息
  const answeredQuestions = userAnswers.length;
  const accuracy = paperQuestions.length > 0 ? (correctAnswers / paperQuestions.length) * 100 : 0;
  const timeUsed = examRecord.startTime && examRecord.endTime ? 
    Math.floor((examRecord.endTime.getTime() - examRecord.startTime.getTime()) / 1000) : 0;
  
  // 计算答题统计
  const answerTimes = userAnswers.map((ua: any) => ua.timeSpent || 0).filter((t: number) => t > 0);
  const averageTimePerQuestion = answerTimes.length > 0 ? 
    answerTimes.reduce((sum: number, time: number) => sum + time, 0) / answerTimes.length : 0;
  const fastestQuestion = answerTimes.length > 0 ? Math.min(...answerTimes) : 0;
  const slowestQuestion = answerTimes.length > 0 ? Math.max(...answerTimes) : 0;
  const skippedQuestions = paperQuestions.length - answeredQuestions;
  
  const result: IExamResult = {
    examRecordId: examRecord._id.toString(),
    sessionId: examRecord.sessionId.toString(),
    userId: examRecord.userId.toString(),
    totalQuestions: paperQuestions.length,
    answeredQuestions,
    correctAnswers,
    score: totalScore,
    totalPoints,
    accuracy: Math.round(accuracy * 100) / 100,
    timeUsed,
    isPassed: accuracy >= 60, // 60分及格
    grade: AutoGradingService.calculateGrade(accuracy),
    answers: processedAnswers,
    statistics: {
      averageTimePerQuestion: Math.round(averageTimePerQuestion),
      fastestQuestion,
      slowestQuestion,
      skippedQuestions
    }
  };
  
  return result;
}

/**
 * 获取考试结果
 */
export const getExamResult = async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return errorResponse(res, '用户未登录', 401);
    }

    // 查找考试记录
    const examRecord = await ExamRecord.findOne({
      _id: recordId,
      userId: new mongoose.Types.ObjectId(userId)
    }).populate('sessionId');

    if (!examRecord) {
      return errorResponse(res, '考试记录不存在', 404);
    }

    if (examRecord.status !== ExamRecordStatus.COMPLETED) {
      return errorResponse(res, '考试尚未完成', 400);
    }

    // 获取试卷信息
    const session = examRecord.sessionId as any;
    const paper = await Paper.findById(session.paperId).populate('questions.questionId');
    
    if (!paper) {
      return errorResponse(res, '试卷不存在', 404);
    }

    // 重新计算结果（确保数据一致性）
    const result = await calculateExamResult(examRecord, paper);

    return successResponse(res, result, '获取考试结果成功');
  } catch (error) {
    console.error('获取考试结果失败:', error);
    return errorResponse(res, '获取考试结果失败', 500);
  }
};

/**
 * 获取考试历史记录
 */
export const getExamHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, status, sessionId } = req.query;

    if (!userId) {
      return errorResponse(res, '用户未登录', 401);
    }

    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (status) {
      query.status = status;
    }
    
    if (sessionId) {
      query.sessionId = new mongoose.Types.ObjectId(sessionId as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      ExamRecord.find(query)
        .populate({
          path: 'sessionId',
          select: 'name description startTime endTime',
          populate: {
            path: 'paperId',
            select: 'title description totalQuestions totalPoints'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ExamRecord.countDocuments(query)
    ]);

    const pagination = {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      itemsPerPage: Number(limit),
      hasNextPage: skip + Number(limit) < total,
      hasPrevPage: Number(page) > 1
    };

    return successResponse(res, { records, pagination }, '获取考试历史成功');
  } catch (error) {
    console.error('获取考试历史失败:', error);
    return errorResponse(res, '获取考试历史失败', 500);
  }
};

/**
 * 获取考试统计信息
 */
export const getExamStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return errorResponse(res, '用户未登录', 401);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 聚合查询统计信息
    const stats = await ExamRecord.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          completedExams: {
            $sum: { $cond: [{ $eq: ['$status', ExamRecordStatus.COMPLETED] }, 1, 0] }
          },
          averageScore: {
            $avg: { $cond: [{ $eq: ['$status', ExamRecordStatus.COMPLETED] }, '$score', null] }
          },
          highestScore: {
            $max: { $cond: [{ $eq: ['$status', ExamRecordStatus.COMPLETED] }, '$score', null] }
          },
          totalTimeSpent: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$startTime', null] }, { $ne: ['$endTime', null] }] },
                { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 1000] },
                0
              ]
            }
          }
        }
      }
    ]);

    // 获取最近的考试记录
    const recentExams = await ExamRecord.find({ userId: userObjectId })
      .populate({
        path: 'sessionId',
        select: 'name startTime',
        populate: {
          path: 'paperId',
          select: 'title'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const result = {
      overview: stats[0] || {
        totalExams: 0,
        completedExams: 0,
        averageScore: 0,
        highestScore: 0,
        totalTimeSpent: 0
      },
      recentExams: recentExams.map(exam => ({
        id: exam._id,
        sessionName: (exam.sessionId as any)?.name || '未知考试',
        paperTitle: (exam.sessionId as any)?.paperId?.title || '未知试卷',
        status: exam.status,
        score: exam.score,
        createdAt: exam.createdAt
      }))
    };

    return successResponse(res, result, '获取考试统计成功');
  } catch (error) {
    console.error('获取考试统计失败:', error);
    return errorResponse(res, '获取考试统计失败', 500);
  }
};

/**
 * 重新评分（管理员功能）
 */
export const reGradeExam = async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return errorResponse(res, '权限不足', 403);
    }

    // 查找考试记录
    const examRecord = await ExamRecord.findById(recordId).populate('sessionId');

    if (!examRecord) {
      return errorResponse(res, '考试记录不存在', 404);
    }

    // 获取试卷信息
    const session = examRecord.sessionId as any;
    const paper = await Paper.findById(session.paperId).populate('questions.questionId');
    
    if (!paper) {
      return errorResponse(res, '试卷不存在', 404);
    }

    // 重新计算结果
    const result = await calculateExamResult(examRecord, paper);

    // 更新考试记录
    examRecord.score = result.score;
    examRecord.correctAnswers = result.correctAnswers;

    // 更新答案记录的评分信息
    for (let i = 0; i < examRecord.answers.length; i++) {
      const answerRecord = examRecord.answers[i];
      const resultAnswer = result.answers.find(a => 
        a.questionId.toString() === answerRecord.questionId.toString()
      );
      if (resultAnswer) {
        examRecord.answers[i].isCorrect = resultAnswer.isCorrect;
        examRecord.answers[i].score = resultAnswer.score;
      }
    }

    await examRecord.save();

    return successResponse(res, result, '重新评分成功');
  } catch (error) {
    console.error('重新评分失败:', error);
    return errorResponse(res, '重新评分失败', 500);
  }
};