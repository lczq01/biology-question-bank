const mongoose = require('mongoose');
require('dotenv').config();

async function fixMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    // 获取模型
    const Paper = require('./dist/models/Paper').Paper;
    const Question = require('./dist/models/Question').default;
    const UnifiedExam = require('./dist/models/UnifiedExam').UnifiedExam;
    
    console.log('开始修复迁移数据...');
    
    // 获取所有需要修复的UnifiedExam文档（题目数为0的）
    const examsToFix = await UnifiedExam.find({ 
      $or: [
        { totalQuestions: 0 },
        { totalQuestions: { $exists: false } },
        { questions: { $size: 0 } }
      ]
    }).lean();
    
    console.log(`需要修复的文档数: ${examsToFix.length}`);
    
    let fixedCount = 0;
    
    for (const exam of examsToFix) {
      try {
        // 查找对应的Paper文档
        const paper = await Paper.findOne({ title: exam.title }).lean();
        
        if (paper && paper.questions && paper.questions.length > 0) {
          console.log(`\n修复文档: ${exam.title}`);
          console.log(`Paper题目数: ${paper.questions.length}`);
          
          // 获取完整的题目数据
          const questionIds = paper.questions.map(q => q.questionId || q._id);
          const questions = await Question.find({ 
            _id: { $in: questionIds } 
          }).lean();
          
          console.log(`找到的完整题目数: ${questions.length}`);
          
          // 构建完整的题目数组（包含points信息）
          const fullQuestions = paper.questions.map(paperQuestion => {
            const questionData = questions.find(q => 
              q._id.toString() === (paperQuestion.questionId || paperQuestion._id).toString()
            );
            
            if (questionData) {
              return {
                ...questionData,
                points: paperQuestion.points || 5, // 默认5分
                _id: questionData._id
              };
            }
            return null;
          }).filter(q => q !== null);
          
          // 计算总分和题目数
          const totalPoints = fullQuestions.reduce((sum, q) => sum + (q.points || 5), 0);
          const totalQuestions = fullQuestions.length;
          
          // 更新UnifiedExam文档
          await UnifiedExam.updateOne(
            { _id: exam._id },
            {
              $set: {
                questions: fullQuestions,
                totalPoints: totalPoints,
                totalQuestions: totalQuestions,
                description: paper.description || exam.description || '',
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`✅ 修复完成: ${totalQuestions}题, ${totalPoints}分`);
          fixedCount++;
        } else {
          console.log(`⚠️ 未找到对应的Paper文档或题目为空: ${exam.title}`);
        }
      } catch (error) {
        console.error(`❌ 修复文档失败 ${exam.title}:`, error.message);
      }
    }
    
    console.log(`\n=== 修复完成 ===`);
    console.log(`成功修复: ${fixedCount} 个文档`);
    console.log(`需要修复总数: ${examsToFix.length}`);
    
    // 验证修复结果
    const fixedExams = await UnifiedExam.find({}).lean();
    const examsWithQuestions = fixedExams.filter(exam => exam.questions && exam.questions.length > 0);
    const examsWithoutQuestions = fixedExams.filter(exam => !exam.questions || exam.questions.length === 0);
    
    console.log('\n📊 修复后统计:');
    console.log(`有题目的文档数: ${examsWithQuestions.length}`);
    console.log(`无题目的文档数: ${examsWithoutQuestions.length}`);
    console.log(`总文档数: ${fixedExams.length}`);
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 修复迁移失败:', error.message);
  }
}

fixMigration();