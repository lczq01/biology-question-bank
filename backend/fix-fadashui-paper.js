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

async function fixFadashuiPaper() {
  console.log('🔧 修复"发大水发大水"考试的试卷数据...\n');
  
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // 获取数据库中实际存在的前3个题目
    const existingQuestions = await db.collection('questions').find({}).limit(3).toArray();
    
    if (existingQuestions.length < 3) {
      console.log('❌ 数据库中可用题目不足3个');
      return;
    }
    
    console.log('📚 将使用以下题目:');
    existingQuestions.forEach((q, index) => {
      console.log(`${index + 1}. ID: ${q._id.toString()}`);
      console.log(`   内容: ${q.content.substring(0, 80)}...`);
      console.log('');
    });
    
    // 找到"发大水发大水"考试的试卷
    const fadashuiSession = await db.collection('examsessions').findOne({
      name: '发大水发大水'
    });
    
    if (!fadashuiSession || !fadashuiSession.paperId) {
      console.log('❌ 没有找到"发大水发大水"考试或其试卷ID');
      return;
    }
    
    const paperId = fadashuiSession.paperId;
    console.log('🎯 目标试卷ID:', paperId.toString());
    
    // 构建新的题目数组
    const newQuestions = existingQuestions.map((q, index) => ({
      questionId: q._id,
      order: index + 1,
      points: index === 0 ? 30 : 35  // 保持原有分数分配
    }));
    
    console.log('🔄 更新试卷题目...');
    
    // 更新试卷
    const updateResult = await db.collection('paper').updateOne(
      { _id: paperId },
      { 
        $set: { 
          questions: newQuestions,
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log('✅ 试卷更新成功!');
      console.log('');
      
      // 验证更新结果
      const updatedPaper = await db.collection('paper').findOne({ _id: paperId });
      console.log('📄 更新后的试卷信息:');
      console.log('  试卷标题:', updatedPaper.title);
      console.log('  题目数量:', updatedPaper.questions.length);
      console.log('');
      
      console.log('📝 更新后的题目列表:');
      updatedPaper.questions.forEach((q, index) => {
        console.log(`题目 ${index + 1}:`);
        console.log('  questionId:', q.questionId.toString());
        console.log('  order:', q.order);
        console.log('  points:', q.points);
        console.log('');
      });
      
      console.log('🎉 修复完成！现在"发大水发大水"考试应该可以正常显示题目了。');
      
    } else {
      console.log('❌ 试卷更新失败');
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 数据库连接已关闭');
  }
}

fixFadashuiPaper();