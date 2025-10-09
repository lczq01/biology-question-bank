const mongoose = require('mongoose');
require('dotenv').config();

async function debugMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    // 获取Paper模型
    const Paper = require('./dist/models/Paper').Paper;
    const UnifiedExam = require('./dist/models/UnifiedExam').UnifiedExam;
    
    // 检查一个Paper文档的完整结构
    const paperSample = await Paper.findOne().lean();
    console.log('\n📊 Paper文档完整结构:');
    console.log('================================');
    console.log('标题:', paperSample.title);
    console.log('描述:', paperSample.description);
    console.log('题目数量:', paperSample.totalQuestions);
    console.log('总分:', paperSample.totalPoints);
    console.log('题目字段:', paperSample.questions ? paperSample.questions.length : 0);
    console.log('题目详情:', paperSample.questions ? paperSample.questions.slice(0, 2) : '无题目');
    
    // 检查对应的UnifiedExam文档
    const unifiedExam = await UnifiedExam.findOne({ title: paperSample.title }).lean();
    console.log('\n📊 对应的UnifiedExam文档:');
    console.log('================================');
    if (unifiedExam) {
      console.log('标题:', unifiedExam.title);
      console.log('题目数量:', unifiedExam.totalQuestions);
      console.log('总分:', unifiedExam.totalPoints);
      console.log('题目字段:', unifiedExam.questions ? unifiedExam.questions.length : 0);
      console.log('配置:', unifiedExam.config);
    } else {
      console.log('未找到对应的UnifiedExam文档');
    }
    
    // 检查所有UnifiedExam文档的题目数量统计
    const unifiedExams = await UnifiedExam.find({}).lean();
    const examsWithQuestions = unifiedExams.filter(exam => exam.questions && exam.questions.length > 0);
    const examsWithoutQuestions = unifiedExams.filter(exam => !exam.questions || exam.questions.length === 0);
    
    console.log('\n📊 UnifiedExam题目统计:');
    console.log('================================');
    console.log('有题目的文档数:', examsWithQuestions.length);
    console.log('无题目的文档数:', examsWithoutQuestions.length);
    console.log('总文档数:', unifiedExams.length);
    
    if (examsWithQuestions.length > 0) {
      console.log('\n有题目的文档标题:');
      examsWithQuestions.slice(0, 3).forEach(exam => {
        console.log(`- ${exam.title}: ${exam.questions.length}题`);
      });
    }
    
    if (examsWithoutQuestions.length > 0) {
      console.log('\n无题目的文档标题:');
      examsWithoutQuestions.slice(0, 3).forEach(exam => {
        console.log(`- ${exam.title}: 0题`);
      });
    }
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 调试迁移失败:', error.message);
  }
}

debugMigration();