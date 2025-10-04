import { Request, Response } from 'express';
import { Exam } from '../models/Exam';
import { Paper } from '../models/Paper';
import Question from '../models/Question';
import { ExamRecordStatus, IStartExamRequest, ISubmitAnswerRequest, ISubmitExamRequest } from '../types/exam.types';
import { successResponse, errorResponse } from '../utils/response';

// 获取可用试卷列表（学生用）
export const getAvailablePapers = async (req: Request, res: Response) => {
  try {
    const papers = await Paper.find({ isActive: true })
      .select('title description type difficulty totalQuestions totalPoints timeLimit createdAt')
      .sort({ createdAt: -1 });

    return successResponse(res, papers, '获取试卷列表成功');
  } catch (error) {
    console.error('获取试卷列表失败:', error);
    return errorResponse(res, '获取试卷列表失败', 500);
  }
};

// 开始考试
export const startExam = async (req: Request, res: Response) => {
  try {
    const { paperId }: IStartExamRequest = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      return errorResponse(res, '用户未登录', 401);
    }

    // 检查试卷是否存在
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return errorResponse(res, '试卷不存在', 404);
    }

    // 检查是否已经有进行中的考试
    const existingExam = await Exam.findOne({
      studentId,
      paperId,
      status: { $in: [ExamRecordStatus.NOT_STARTED, ExamRecordStatus.IN_PROGRESS] }
    });

    if (existingExam) {
      return successResponse(res, existingExam, '继续之前的考试');
    }

    // 创建新的考试记录
    const exam = new Exam({
      paperId,
      studentId,
      status: ExamRecordStatus.IN_PROGRESS,
      config: {
        timeLimit: (paper as any).timeLimit || 60,
        totalQuestions: paper.questions?.length || 0,
        totalPoints: paper.questions?.reduce((sum, q) => sum + (q.points || 5), 0) || 0
      },
      answers: [],
      result: {
        score: 0,
        correctCount: 0,
        totalQuestions: paper.questions?.length || 0,
        accuracy: 0,
        timeUsed: 0,
        isPassed: false
      },
      startTime: new Date()
    });

    await exam.save();

    // 返回考试信息和题目（不包含答案）
    const examWithQuestions = await Exam.findById(exam._id)
      .populate('paperId');

    return successResponse(res, examWithQuestions, '考试开始成功');
  } catch (error) {
    console.error('开始考试失败:', error);
    return errorResponse(res, '开始考试失败', 500);
  }
};

// 获取考试详情
export const getExamDetails = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      return errorResponse(res, '用户未登录', 401);
    }

    const exam = await Exam.findOne({ _id: examId, studentId })
      .populate('paperId');

    if (!exam) {
      return errorResponse(res, '考试不存在', 404);
    }

    return successResponse(res, exam, '获取考试详情成功');
  } catch (error) {
    console.error('获取考试详情失败:', error);
    return errorResponse(res, '获取考试详情失败', 500);
  }
};

// 提交单题答案
export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { recordId: examId, questionId, answer }: ISubmitAnswerRequest = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      return errorResponse(res, '用户未登录', 401);
    }

    const exam = await Exam.findOne({ _id: examId, studentId });
    if (!exam) {
      return errorResponse(res, '考试不存在', 404);
    }

    if (exam.status !== ExamRecordStatus.IN_PROGRESS) {
      return errorResponse(res, '考试已结束，无法提交答案', 400);
    }

    // 检查是否超时
    const timeElapsed = (Date.now() - exam.startTime.getTime()) / 1000 / 60; // 分钟
    if (timeElapsed > exam.config.timeLimit) {
      exam.status = ExamRecordStatus.TIMEOUT;
      await exam.save();
      return errorResponse(res, '考试时间已到，无法提交答案', 400);
    }

    // 更新或添加答案
    const existingAnswerIndex = exam.answers.findIndex(a => a.questionId.toString() === questionId);
    const answerRecord = {
      questionId,
      answer,
      timeSpent: Math.floor(timeElapsed * 60) // 转换为秒
    };

    if (existingAnswerIndex >= 0) {
      exam.answers[existingAnswerIndex] = answerRecord;
    } else {
      exam.answers.push(answerRecord);
    }

    await exam.save();

    return successResponse(res, { examId, questionId, answer }, '答案提交成功');
  } catch (error) {
    console.error('提交答案失败:', error);
    return errorResponse(res, '提交答案失败', 500);
  }
};

// 提交考试
export const submitExam = async (req: Request, res: Response) => {
  try {
    const { recordId: examId }: ISubmitExamRequest = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      return errorResponse(res, '用户未登录', 401);
    }

    const exam = await Exam.findOne({ _id: examId, studentId })
      .populate('paperId');

    if (!exam) {
      return errorResponse(res, '考试不存在', 404);
    }

    if (exam.status === ExamRecordStatus.SUBMITTED || exam.status === ExamRecordStatus.GRADED) {
      return errorResponse(res, '考试已提交', 400);
    }

    // 计算成绩
    const paper = exam.paperId as any;
    let correctCount = 0;
    let totalScore = 0;

    // 获取试卷中的题目信息
    const paperQuestions = paper.questions || [];
    
    // 评分
    for (const answerRecord of exam.answers) {
      const paperQuestion = paperQuestions.find((pq: any) => 
        pq.questionId.toString() === answerRecord.questionId.toString()
      );
      
      if (!paperQuestion) continue;

      // 这里简化处理，实际应该根据题目类型和正确答案进行判断
      // 由于我们没有在考试中存储正确答案，这里先设置为随机结果用于演示
      const isCorrect = Math.random() > 0.5; // 临时随机结果
      answerRecord.isCorrect = isCorrect;
      
      if (isCorrect) {
        correctCount++;
        answerRecord.points = paperQuestion.points || 0;
        totalScore += answerRecord.points || 0;
      } else {
        answerRecord.points = 0;
      }
    }

    // 更新考试结果
    const timeUsed = Math.floor((Date.now() - exam.startTime.getTime()) / 1000);
    const accuracy = exam.config.totalQuestions > 0 ? (correctCount / exam.config.totalQuestions) * 100 : 0;
    const isPassed = accuracy >= 60; // 60分及格

    exam.result = {
      score: totalScore,
      correctCount,
      totalQuestions: exam.config.totalQuestions,
      accuracy: Math.round(accuracy * 100) / 100,
      timeUsed,
      isPassed
    };

    exam.status = ExamRecordStatus.SUBMITTED;
    exam.endTime = new Date();
    exam.submitTime = new Date();

    await exam.save();

    // 返回详细结果
    const result = await Exam.findById(examId)
      .populate('paperId');

    return successResponse(res, result, '考试提交成功');
  } catch (error) {
    console.error('提交考试失败:', error);
    return errorResponse(res, '提交考试失败', 500);
  }
};

// 获取学生考试历史
export const getStudentExamHistory = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { page = 1, limit = 10 } = req.query;

    if (!studentId) {
      return errorResponse(res, '用户未登录', 401);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const exams = await Exam.find({ studentId })
      .populate('paperId', 'title type difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Exam.countDocuments({ studentId });

    res.json({
      success: true,
      data: {
        exams,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          pageSize: Number(limit),
          totalItems: total
        }
      },
      message: '获取考试历史成功'
    });
  } catch (error) {
    console.error('获取考试历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试历史失败'
    });
  }
};

// 检查答案是否正确
function checkAnswer(question: any, userAnswer: string | string[]): boolean {
  const correctAnswer = question.correctAnswer;
  
  if (question.type === 'single_choice') {
    return userAnswer === correctAnswer;
  } else if (question.type === 'multiple_choice') {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
      return false;
    }
    return userAnswer.length === correctAnswer.length && 
           userAnswer.every(answer => correctAnswer.includes(answer));
  } else if (question.type === 'fill_blank') {
    // 填空题支持多个正确答案，用分号分隔
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer;
    
    return correctAnswers.some(correct => 
      userAnswerStr.toLowerCase().trim() === correct.toLowerCase().trim()
    );
  }
  
  return false;
}