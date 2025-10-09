const mongoose = require('mongoose');
require('dotenv').config();

async function debugQuestionStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    // 获取模型
    const Question = require('./dist/models/Question').default;
    const UnifiedExam = require('./dist/models/UnifiedExam').UnifiedExam;
    
    console.log('\n🔍 调试题目数据结构');
    console.log('==================\n');
    
    // 检查一个具体的UnifiedExam文档
    const exam = await UnifiedExam.findOne({ 
      'questions.0': { $exists: true } 
    }).lean();
    
    if (exam) {
      console.log(`📄 文档标题: ${exam.title}`);
      console.log(`题目数量: ${exam.questions.length}`);
      console.log(`总分: ${exam.totalPoints}`);
      console.log(`配置: ${JSON.stringify(exam.config, null, 2)}`);
      
      console.log('\n📋 题目数据结构:');
      console.log('================');
      
      exam.questions.slice(0, 2).forEach((question, index) => {
        console.log(`\n题目 ${index + 1}:`);
        console.log('完整对象:', JSON.stringify(question, null, 2));
        
        // 检查每个字段
        const fields = ['title', 'content', 'type', 'difficulty', 'points', 'options', 'correctAnswer'];
        fields.forEach(field => {
          console.log(`  ${field}: ${question[field] !== undefined ? '✅' : '❌'} ${question[field]}`);
        });
      });
    }
    
    // 检查Question集合中的题目
    console.log('\n📋 Question集合中的题目:');
    console.log('====================');
    
    const questions = await Question.find({}).limit(2).lean();
    questions.forEach((q, index) => {
      console.log(`\n题目 ${index + 1}:`);
      console.log(`标题: ${q.title}`);
      console.log(`类型: ${q.type}`);
      console.log(`难度: ${q.difficulty}`);
      console.log(`分值: ${q.points}`);
      console.log(`选项数量: ${q.options?.length || 0}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugQuestionStructure();