const mongoose = require('mongoose');

async function findCorrectPaper() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    
    // 先找到"发大水发大水"考试
    const examSession = await db.collection('examsessions').findOne({
      name: '发大水发大水'
    });
    
    if (examSession) {
      console.log('✅ 找到考试会话:');
      console.log('考试名称:', examSession.name);
      console.log('考试ID:', examSession._id);
      console.log('试卷ID:', examSession.paperId);
      
      // 查找对应的试卷
      const paper = await db.collection('papers').findOne({
        _id: examSession.paperId
      });
      
      if (paper) {
        console.log('\n📄 试卷信息:');
        console.log('试卷ID:', paper._id);
        console.log('试卷标题:', paper.title);
        console.log('题目数量:', paper.questions ? paper.questions.length : 0);
        
        if (paper.questions && paper.questions.length > 0) {
          console.log('\n📝 题目结构分析:');
          paper.questions.forEach((q, index) => {
            console.log(`题目 ${index + 1}:`, {
              questionId: q.questionId,
              hasQuestionId: !!q.questionId,
              order: q.order,
              points: q.points,
              hasContent: !!q.content,
              content: q.content ? (q.content.length > 50 ? q.content.substring(0, 50) + '...' : q.content) : '无内容',
              type: q.type,
              hasOptions: !!q.options,
              optionsCount: q.options ? q.options.length : 0
            });
            
            if (q.options && q.options.length > 0) {
              console.log(`  选项:`, q.options.map(opt => ({ id: opt.id, text: opt.text ? opt.text.substring(0, 30) + '...' : '无文本' })));
            }
          });
        }
      } else {
        console.log('❌ 未找到对应的试卷');
      }
    } else {
      console.log('❌ 未找到"发大水发大水"考试');
    }

  } catch (error) {
    console.error('❌ 查找失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findCorrectPaper();