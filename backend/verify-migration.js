const mongoose = require('mongoose');
require('dotenv').config();

async function verifyMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    // 获取UnifiedExam模型
    const UnifiedExam = require('./dist/models/UnifiedExam').UnifiedExam;
    
    // 检查UnifiedExam集合中的文档
    const unifiedExams = await UnifiedExam.find({}).limit(5).lean();
    console.log('\n📊 UnifiedExam集合前5个文档:');
    console.log('================================');
    
    unifiedExams.forEach((exam, index) => {
      console.log(`\n📄 文档 ${index + 1}:`);
      console.log(`标题: ${exam.title}`);
      console.log(`类型: ${exam.type}`);
      console.log(`状态: ${exam.status}`);
      console.log(`题目数量: ${exam.totalQuestions || 0}`);
      console.log(`总分: ${exam.totalPoints || 0}`);
      console.log(`创建时间: ${exam.createdAt}`);
      console.log(`配置:`, exam.config);
      console.log('---');
    });
    
    // 检查总数
    const totalCount = await UnifiedExam.countDocuments();
    console.log(`\n📊 UnifiedExam集合总文档数: ${totalCount}`);
    
    // 检查Paper集合是否还有数据
    const Paper = require('./dist/models/Paper').Paper;
    const paperCount = await Paper.countDocuments();
    console.log(`📊 Paper集合剩余文档数: ${paperCount}`);
    
    // 检查Exam集合是否还有数据
    const Exam = require('./dist/models/Exam').Exam;
    const examCount = await Exam.countDocuments();
    console.log(`📊 Exam集合剩余文档数: ${examCount}`);
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 验证迁移失败:', error.message);
  }
}

verifyMigration();