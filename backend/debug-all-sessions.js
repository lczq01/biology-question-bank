const mongoose = require('mongoose');
const { ExamSession } = require('./dist/models/ExamSession');
const { Paper } = require('./dist/models/Paper');
const Question = require('./dist/models/Question');

async function debugAllSessions() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('数据库连接成功');

    // 获取所有考试会话（不限制状态）
    console.log('\n=== 所有考试会话 ===');
    const allSessions = await ExamSession.find({})
      .populate({
        path: 'paperId',
        select: 'title description questions',
        populate: {
          path: 'questions.questionId',
          select: 'content type'
        }
      })
      .lean();

    console.log('总共找到考试会话数量:', allSessions.length);

    allSessions.forEach((session, index) => {
      console.log(`\n考试会话 ${index + 1}:`);
      console.log('ID:', session._id);
      console.log('名称:', session.name);
      console.log('状态:', session.status);
      console.log('试卷ID:', session.paperId?._id);
      console.log('试卷标题:', session.paperId?.title);
      console.log('题目数量:', session.paperId?.questions?.length || 0);
      
      if (session.paperId?.questions && session.paperId.questions.length > 0) {
        console.log('前3个题目:');
        session.paperId.questions.slice(0, 3).forEach((q, qIndex) => {
          console.log(`  题目 ${qIndex + 1}:`, q.questionId?.content || '题目内容未找到');
        });
      }
    });

    // 如果有考试会话，检查第一个的详细信息
    if (allSessions.length > 0) {
      const firstSession = allSessions[0];
      console.log(`\n=== 详细检查第一个考试会话 ===`);
      
      const detailedSession = await ExamSession.findById(firstSession._id)
        .populate({
          path: 'paperId',
          select: 'title description questions config totalQuestions totalPoints createdAt',
          populate: {
            path: 'questions.questionId',
            select: 'content type difficulty chapter options correctAnswer explanation points'
          }
        })
        .lean();

      console.log('试卷详情:');
      console.log('- 标题:', detailedSession.paperId?.title);
      console.log('- 描述:', detailedSession.paperId?.description);
      console.log('- 题目数量:', detailedSession.paperId?.questions?.length);
      
      if (detailedSession.paperId?.questions) {
        console.log('\n所有题目内容:');
        detailedSession.paperId.questions.forEach((q, index) => {
          console.log(`题目 ${index + 1}:`);
          console.log('  ID:', q.questionId?._id);
          console.log('  内容:', q.questionId?.content || '题目内容未找到');
          console.log('  类型:', q.questionId?.type);
          console.log('  分值:', q.points || q.questionId?.points);
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

debugAllSessions();