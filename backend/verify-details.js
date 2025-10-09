const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    // 获取模型
    const Paper = require('./dist/models/Paper').Paper;
    const Question = require('./dist/models/Question').default;
    const UnifiedExam = require('./dist/models/UnifiedExam').UnifiedExam;
    
    console.log('\n📊 详细验证修复后的数据');
    console.log('================================\n');
    
    // 1. 验证有题目的文档
    const examsWithQuestions = await UnifiedExam.find({ 
      'questions.0': { $exists: true } 
    }).lean();
    
    console.log('✅ 有题目的文档验证:');
    console.log('====================');
    
    for (const exam of examsWithQuestions.slice(0, 3)) {
      console.log(`\n📄 文档: ${exam.title}`);
      console.log(`题目数量: ${exam.questions.length}`);
      console.log(`总分: ${exam.totalPoints}`);
      console.log(`题目详情:`);
      
      exam.questions.slice(0, 2).forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.title || q.content?.substring(0, 50)}...`);
        console.log(`     类型: ${q.type}, 分值: ${q.points}, 难度: ${q.difficulty}`);
      });
      
      if (exam.questions.length > 2) {
        console.log(`  ... 还有 ${exam.questions.length - 2} 题`);
      }
    }
    
    // 2. 验证无题目的文档
    const examsWithoutQuestions = await UnifiedExam.find({
      $or: [
        { questions: { $size: 0 } },
        { questions: { $exists: false } }
      ]
    }).lean();
    
    console.log('\n⚠️ 无题目的文档验证:');
    console.log('==================');
    
    examsWithoutQuestions.slice(0, 3).forEach(exam => {
      console.log(`📄 ${exam.title}: 题目数 ${exam.questions?.length || 0}`);
    });
    
    // 3. 验证Paper和UnifiedExam的对应关系
    console.log('\n📊 Paper与UnifiedExam对应关系验证:');
    console.log('================================');
    
    const papers = await Paper.find({}).limit(3).lean();
    for (const paper of papers) {
      const unifiedExam = await UnifiedExam.findOne({ title: paper.title }).lean();
      console.log(`\n📄 Paper: ${paper.title}`);
      console.log(`  Paper题目数: ${paper.questions?.length || 0}`);
      console.log(`  UnifiedExam题目数: ${unifiedExam?.questions?.length || 0}`);
      console.log(`  对应关系: ${unifiedExam ? '✅ 存在' : '❌ 不存在'}`);
    }
    
    // 4. 统计信息
    console.log('\n📊 最终统计信息:');
    console.log('===============');
    
    const totalExams = await UnifiedExam.countDocuments();
    const withQuestions = await UnifiedExam.countDocuments({ 'questions.0': { $exists: true } });
    const withoutQuestions = await UnifiedExam.countDocuments({
      $or: [
        { questions: { $size: 0 } },
        { questions: { $exists: false } }
      ]
    });
    
    console.log(`总文档数: ${totalExams}`);
    console.log(`有题目的文档: ${withQuestions}`);
    console.log(`无题目的文档: ${withoutQuestions}`);
    console.log(`修复成功率: ${((withQuestions / totalExams) * 100).toFixed(1)}%`);
    
    await mongoose.disconnect();
    console.log('\n✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

verifyDetails();