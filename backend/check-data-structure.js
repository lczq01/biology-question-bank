const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    // 检查Paper集合
    const Paper = require('./dist/models/Paper').Paper;
    const paperCount = await Paper.countDocuments();
    console.log('📊 Paper集合文档数量:', paperCount);
    
    if (paperCount > 0) {
      const samplePaper = await Paper.findOne().lean();
      console.log('📄 Paper样本数据字段:');
      console.log(Object.keys(samplePaper));
    }
    
    // 检查Exam集合
    const Exam = require('./dist/models/Exam').Exam;
    const examCount = await Exam.countDocuments();
    console.log('📊 Exam集合文档数量:', examCount);
    
    if (examCount > 0) {
      const sampleExam = await Exam.findOne().lean();
      console.log('📄 Exam样本数据字段:');
      console.log(Object.keys(sampleExam));
    }
    
    // 检查UnifiedExam集合
    const UnifiedExam = require('./dist/models/UnifiedExam').UnifiedExam;
    const unifiedExamCount = await UnifiedExam.countDocuments();
    console.log('📊 UnifiedExam集合文档数量:', unifiedExamCount);
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 检查数据失败:', error.message);
  }
}

checkData();