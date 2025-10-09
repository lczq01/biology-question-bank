const mongoose = require('mongoose');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

async function checkPaperData() {
  console.log('🔍 检查"发大水发大水"考试的试卷数据...\n');
  
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // 先找到"发大水发大水"考试会话
    const fadashuiSession = await db.collection('examsessions').findOne({
      name: '发大水发大水'
    });
    
    if (!fadashuiSession) {
      console.log('❌ 没有找到"发大水发大水"考试会话');
      return;
    }
    
    console.log('📋 "发大水发大水"考试会话信息:');
    console.log('  会话ID:', fadashuiSession._id.toString());
    console.log('  会话名称:', fadashuiSession.name);
    console.log('  试卷ID:', fadashuiSession.paperId ? fadashuiSession.paperId.toString() : '未设置');
    console.log('');
    
    if (!fadashuiSession.paperId) {
      console.log('❌ 考试会话没有关联试卷ID');
      return;
    }
    
    // 查找对应的试卷
    const paper = await db.collection('paper').findOne({
      _id: fadashuiSession.paperId
    });
    
    if (!paper) {
      console.log('❌ 没有找到对应的试卷');
      return;
    }
    
    console.log('📄 试卷信息:');
    console.log('  试卷ID:', paper._id.toString());
    console.log('  试卷标题:', paper.title);
    console.log('  试卷描述:', paper.description);
    console.log('  题目数量:', paper.questions ? paper.questions.length : 0);
    console.log('');
    
    if (paper.questions && paper.questions.length > 0) {
      console.log('📝 试卷中的题目信息:');
      paper.questions.forEach((q, index) => {
        console.log(`\n题目 ${index + 1}:`);
        console.log('  questionId:', q.questionId);
        console.log('  order:', q.order);
        console.log('  points:', q.points);
        console.log('  questionId类型:', typeof q.questionId);
        console.log('  questionId是否为null:', q.questionId === null);
        
        if (q.questionId) {
          console.log('  questionId字符串:', q.questionId.toString());
        }
      });
      
      // 检查实际的题目数据
      console.log('\n🔍 检查实际题目数据:');
      for (let i = 0; i < paper.questions.length; i++) {
        const paperQuestion = paper.questions[i];
        if (paperQuestion.questionId) {
          const actualQuestion = await db.collection('questions').findOne({
            _id: paperQuestion.questionId
          });
          
          console.log(`\n题目 ${i + 1} 实际数据:`);
          if (actualQuestion) {
            console.log('  ✅ 题目存在');
            console.log('  内容:', actualQuestion.content.substring(0, 100) + '...');
            console.log('  类型:', actualQuestion.type);
            console.log('  选项数量:', actualQuestion.options ? actualQuestion.options.length : 0);
          } else {
            console.log('  ❌ 题目不存在');
          }
        } else {
          console.log(`\n题目 ${i + 1}: ❌ questionId为null`);
        }
      }
    } else {
      console.log('❌ 试卷中没有题目');
    }
    
    // 检查所有可用的题目
    console.log('\n📚 数据库中所有可用题目:');
    const allQuestions = await db.collection('questions').find({}).limit(5).toArray();
    console.log('总题目数量:', await db.collection('questions').countDocuments());
    
    if (allQuestions.length > 0) {
      console.log('\n前5个题目:');
      allQuestions.forEach((q, index) => {
        console.log(`${index + 1}. ID: ${q._id.toString()}`);
        console.log(`   内容: ${q.content.substring(0, 80)}...`);
        console.log(`   类型: ${q.type}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 数据库连接已关闭');
  }
}

checkPaperData();