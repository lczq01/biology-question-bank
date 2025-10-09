const mongoose = require('mongoose');

async function listAllExams() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    
    // 列出所有考试会话
    const examSessions = await db.collection('examsessions').find({}).toArray();
    
    console.log(`📋 找到 ${examSessions.length} 个考试会话:`);
    examSessions.forEach((exam, index) => {
      console.log(`\n${index + 1}. 考试信息:`);
      console.log('  ID:', exam._id);
      console.log('  名称:', exam.name);
      console.log('  试卷ID:', exam.paperId);
      console.log('  考试类型:', exam.examType);
      console.log('  状态:', exam.status);
    });

    // 如果有包含"发大水"的考试，详细查看
    const targetExam = examSessions.find(exam => exam.name && exam.name.includes('发大水'));
    if (targetExam) {
      console.log('\n🎯 找到目标考试:', targetExam.name);
      console.log('   考试ID:', targetExam._id);
      console.log('   试卷ID:', targetExam.paperId);
      
      // 查看对应试卷
      const paper = await db.collection('papers').findOne({
        _id: targetExam.paperId
      });
      
      if (paper) {
        console.log('\n📄 对应试卷信息:');
        console.log('   试卷ID:', paper._id);
        console.log('   试卷标题:', paper.title);
        console.log('   题目数量:', paper.questions ? paper.questions.length : 0);
        
        if (paper.questions && paper.questions.length > 0) {
          console.log('\n📝 前3个题目的结构:');
          paper.questions.slice(0, 3).forEach((q, index) => {
            console.log(`   题目 ${index + 1}:`, {
              hasQuestionId: !!q.questionId,
              questionId: q.questionId,
              hasContent: !!q.content,
              contentPreview: q.content ? q.content.substring(0, 50) + '...' : 'null',
              type: q.type,
              hasOptions: !!q.options,
              optionsCount: q.options ? q.options.length : 0,
              points: q.points
            });
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ 查找失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllExams();