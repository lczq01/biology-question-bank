import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { config } from './utils/config';
import { ExamSession } from './models/ExamSession';
import { Paper } from './models/Paper';
import Question from './models/Question';

async function debugExamData() {
  try {
    await connectDatabase(config.database);
    console.log('数据库连接成功');

    const examSessionId = '68e36efcba065db07af27d2f';
    
    // 查询考试会话
    console.log('\n=== 1. 查询考试会话基本信息 ===');
    const session = await ExamSession.findById(examSessionId).lean();
    if (!session) {
      console.log('考试会话不存在');
      return;
    }
    
    console.log('考试会话ID:', session._id);
    console.log('考试名称:', session.name);
    console.log('试卷ID:', session.paperId);
    console.log('考试状态:', session.status);

    // 查询试卷信息
    console.log('\n=== 2. 查询试卷基本信息 ===');
    const paper = await Paper.findById(session.paperId).lean();
    if (!paper) {
      console.log('试卷不存在');
      return;
    }
    
    console.log('试卷ID:', paper._id);
    console.log('试卷标题:', paper.title);
    console.log('试卷题目ID列表:', paper.questions);
    console.log('题目数量:', paper.questions?.length || 0);

    // 查询题目详细信息
    if (paper.questions && paper.questions.length > 0) {
      console.log('\n=== 3. 查询题目详细信息 ===');
      
      for (let i = 0; i < paper.questions.length; i++) {
        const questionId = paper.questions[i];
        console.log(`\n--- 题目 ${i + 1} (ID: ${questionId}) ---`);
        
        const question = await Question.findById(questionId).lean();
        if (question) {
          console.log('题目内容:', question.content);
          console.log('题目类型:', question.type);
          console.log('题目难度:', question.difficulty);
          console.log('题目章节:', question.chapter);
          console.log('题目选项:', question.options);
          console.log('题目分值:', question.points);
          console.log('正确答案:', question.correctAnswer);
        } else {
          console.log('题目不存在或已删除');
        }
      }
    }

    // 测试populate查询
    console.log('\n=== 4. 测试populate查询 ===');
    const populatedSession = await ExamSession.findById(examSessionId)
      .populate({
        path: 'paperId',
        select: 'title description questions config totalQuestions totalPoints createdAt',
        populate: {
          path: 'questions',
          select: 'content type difficulty chapter options correctAnswer explanation points'
        }
      })
      .lean();
    
    if (populatedSession) {
      console.log('Populate结果 - 试卷标题:', (populatedSession.paperId as any)?.title);
      console.log('Populate结果 - 题目数量:', (populatedSession.paperId as any)?.questions?.length);
      
      if ((populatedSession.paperId as any)?.questions) {
        console.log('\nPopulate结果 - 题目详情:');
        (populatedSession.paperId as any).questions.forEach((q: any, index: number) => {
          console.log(`题目 ${index + 1}:`, {
            _id: q._id,
            content: q.content,
            type: q.type,
            difficulty: q.difficulty,
            points: q.points,
            options: q.options
          });
        });
      }
    }

  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

debugExamData();