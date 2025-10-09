import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ExamSession } from '../models/ExamSession';
import { ExamRecord } from '../models/ExamRecord';
import { Paper } from '../models/Paper';

/**
 * 获取考试题目（学生视角）
 * @route GET /api/exam-sessions/:id/questions
 */
export const getExamQuestions = async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.userId;

    console.log('🔍 题目API调试信息:');
    console.log('  sessionId:', sessionId);
    console.log('  userId:', userId);
    console.log('  req.user:', req.user);

    if (!userId) {
      console.log('❌ 用户未认证');
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 验证会话ID格式
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.log('❌ 无效的会话ID格式:', sessionId);
      return res.status(400).json({
        success: false,
        message: '无效的考试会话ID'
      });
    }

    console.log('✅ 会话ID格式有效，开始查找...');

    // 先尝试查找所有会话进行调试
    const allSessions = await ExamSession.find({});
    console.log('📋 数据库中所有会话数量:', allSessions.length);
    if (allSessions.length > 0) {
      const firstSession = allSessions[0] as any;
      const firstSessionId = firstSession._id.toString();
      console.log('  第一个会话ID:', firstSessionId);
      console.log('  第一个会话ID长度:', firstSessionId.length);
      console.log('  第一个会话名称:', firstSession.name);
      console.log('  查询的会话ID:', sessionId);
      console.log('  查询的会话ID长度:', sessionId.length);
      console.log('  ID类型匹配:', firstSessionId === sessionId);
      
      // 如果查询的ID不匹配，尝试使用第一个会话ID
      if (firstSessionId === sessionId) {
        console.log('✅ ID匹配，继续处理');
      } else {
        console.log('❌ ID不匹配，建议使用:', firstSessionId);
      }
    }

    // 查找考试会话
    const session = await ExamSession.findById(sessionId);
    console.log('📋 查找结果:', session ? '找到会话' : '未找到会话');
    if (session) {
      console.log('  会话名称:', session.name);
      console.log('  会话ID:', session._id);
    }
    
    if (!session) {
      console.log('❌ 考试会话不存在');
      return res.status(404).json({
        success: false,
        message: '考试会话不存在'
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

    // 获取用户的考试记录
    const userRecord = await ExamRecord.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    // 检查考试状态
    if (!userRecord) {
      return res.status(400).json({
        success: false,
        message: '您还未开始此考试'
      });
    }

    if (userRecord.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: '考试未在进行中'
      });
    }

    // 获取试卷详情并关联查询题目
    const paper = await Paper.findById(session.paperId).populate({
      path: 'questions.questionId',
      model: 'Question'
    });
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '试卷不存在'
      });
    }

    // 处理题目数据，隐藏正确答案和解析（考试进行中不显示）
    const questions = (paper.questions || []).map((paperQuestion: any, index: number) => {
      const questionData = paperQuestion.questionId; // 这是关联查询得到的完整题目数据
      
      console.log(`处理题目 ${index + 1}:`, {
        paperQuestionId: paperQuestion.questionId,
        questionDataExists: !!questionData,
        questionDataId: questionData?._id,
        content: questionData?.content ? '有内容' : '无内容',
        type: questionData?.type,
        optionsCount: questionData?.options ? questionData.options.length : 0
      });
      
      // 如果题目数据不存在，跳过或返回占位符
      if (!questionData) {
        console.warn(`题目 ${index + 1} 数据缺失，questionId: ${paperQuestion.questionId}`);
        return {
          id: paperQuestion.questionId,
          questionNumber: index + 1,
          content: '题目数据缺失',
          type: 'single_choice',
          options: [],
          points: paperQuestion.points,
          difficulty: 'medium',
          chapter: '未知',
          userAnswer: null,
          isAnswered: false
        };
      }
      
      const userAnswer = userRecord.answers.find((a: any) => a.questionId?.toString() === questionData._id?.toString());
      
      return {
        id: questionData._id,
        questionNumber: index + 1,
        content: questionData.content,
        type: questionData.type,
        options: questionData.options ? questionData.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text
          // 不返回 isCorrect 字段
        })) : [],
        points: paperQuestion.points, // 使用试卷中配置的分值
        difficulty: questionData.difficulty,
        chapter: questionData.chapter,
        userAnswer: userAnswer?.userAnswer || null,
        isAnswered: !!(userAnswer?.userAnswer)
      };
    });

    // 计算剩余时间
    const now = new Date();
    const startTime = userRecord.startTime!;
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    const remainingMinutes = Math.max(0, session.duration - elapsedMinutes);

    res.status(200).json({
      success: true,
      message: '获取考试题目成功',
      data: {
        sessionInfo: {
          id: session._id,
          name: session.name,
          duration: session.duration,
          remainingMinutes: remainingMinutes
        },
        paperInfo: {
          id: paper._id,
          title: paper.title,
          totalQuestions: questions.length,
          totalPoints: paper.config?.totalPoints || questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)
        },
        questions: questions,
        examProgress: {
          currentQuestionIndex: userRecord.currentQuestionIndex,
          answeredCount: userRecord.answers.filter((a: any) => a.userAnswer && a.userAnswer !== '').length,
          totalQuestions: questions.length
        }
      }
    });

  } catch (error: any) {
    console.error('获取考试题目失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};