import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { config } from './utils/config';
import { ExamSession } from './models/ExamSession';
import { Paper } from './models/Paper';
import Question from './models/Question';

async function debugPopulateIssue() {
  try {
    await connectDatabase(config.database);
    console.log('数据库连接成功');

    const sessionId = '68e36efcba065db07af27d2f';
    
    // 检查考试会话
    const session = await ExamSession.findById(sessionId).lean();
    console.log('考试会话paperId:', session?.paperId);

    // 检查试卷数据
    const paper = await Paper.findById(session?.paperId).lean();
    if (paper?.questions) {
      console.log('试卷题目数组:');
      paper.questions.forEach((q: any, i: number) => {
        console.log(`题目${i+1}: questionId=${q.questionId}, type=${typeof q.questionId}`);
      });
    }

    // 检查题目是否存在
    const questionCount = await Question.countDocuments();
    console.log('题目总数:', questionCount);

    // 测试populate
    const result = await ExamSession.findById(sessionId)
      .populate({
        path: 'paperId',
        populate: {
          path: 'questions.questionId',
          model: 'Question'
        }
      }).lean();
    
    if (result?.paperId) {
      const questions = (result.paperId as any).questions;
      console.log('populate后的题目:');
      questions?.forEach((q: any, i: number) => {
        console.log(`题目${i+1}: questionId=${q.questionId}, hasContent=${!!q.questionId?.content}`);
      });
    }

  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugPopulateIssue();