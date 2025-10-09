const mongoose = require('mongoose');

async function debugPaperQuestions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    // 查找特定试卷
    const db = mongoose.connection.db;
    const paper = await db.collection('papers').findOne({
      _id: new mongoose.Types.ObjectId('68e13cacdda597c5eaa89b29')
    });

    if (paper) {
      console.log('📄 试卷基本信息:');
      console.log('ID:', paper._id);
      console.log('标题:', paper.title);
      console.log('题目数量:', paper.questions ? paper.questions.length : 0);
      
      console.log('\n📝 题目详细信息:');
      if (paper.questions && paper.questions.length > 0) {
        paper.questions.forEach((q, index) => {
          console.log(`题目 ${index + 1}:`, {
            questionId: q.questionId,
            order: q.order,
            points: q.points,
            hasContent: !!q.content,
            content: q.content ? q.content.substring(0, 50) + '...' : '无内容',
            type: q.type,
            optionsCount: q.options ? q.options.length : 0
          });
        });
      } else {
        console.log('❌ 试卷中没有题目数据');
      }

      // 检查是否有独立的题目集合
      console.log('\n🔍 检查题目集合...');
      const questionsCollection = await db.collection('questions').find({}).limit(5).toArray();
      console.log('题目集合中的数据数量:', await db.collection('questions').countDocuments());
      if (questionsCollection.length > 0) {
        console.log('题目集合示例:', questionsCollection[0]);
      }

    } else {
      console.log('❌ 未找到指定试卷');
    }

  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugPaperQuestions();