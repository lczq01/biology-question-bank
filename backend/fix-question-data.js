const mongoose = require('mongoose');
require('dotenv').config();

async function fixQuestionData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    // 获取模型
    const Question = require('./dist/models/Question').default;
    const UnifiedExam = require('./dist/models/UnifiedExam').UnifiedExam;
    
    console.log('开始修复题目数据完整性...');
    
    // 获取所有需要修复的UnifiedExam文档
    const exams = await UnifiedExam.find({
      'questions.0': { $exists: true }
    });
    
    console.log(`需要修复的文档数: ${exams.length}`);
    
    let fixedCount = 0;
    
    for (const exam of exams) {
      console.log(`\n修复文档: ${exam.title}`);
      
      let hasChanges = false;
      
      // 检查每个题目，如果只有questionId，则填充完整数据
      for (let i = 0; i < exam.questions.length; i++) {
        const questionRef = exam.questions[i];
        
        // 如果题目只有引用信息，没有完整数据
        if (questionRef.questionId && !questionRef.title) {
          try {
            // 从Question集合获取完整题目数据
            const fullQuestion = await Question.findById(questionRef.questionId);
            
            if (fullQuestion) {
              // 合并引用信息和完整题目数据
              exam.questions[i] = {
                ...fullQuestion.toObject(), // 完整的题目数据
                order: questionRef.order,
                points: questionRef.points
              };
              hasChanges = true;
              console.log(`  ✅ 修复题目 ${i + 1}: ${fullQuestion.title}`);
            } else {
              console.log(`  ⚠️ 题目 ${i + 1}: 未找到对应的Question文档`);
            }
          } catch (error) {
            console.log(`  ❌ 题目 ${i + 1}: 获取失败 - ${error.message}`);
          }
        }
      }
      
      // 如果题目数据有变化，重新计算总分和题目数量
      if (hasChanges) {
        exam.totalQuestions = exam.questions.length;
        exam.totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 0), 0);
        
        await exam.save();
        fixedCount++;
        console.log(`  ✅ 文档修复完成: ${exam.totalQuestions}题, ${exam.totalPoints}分`);
      } else {
        console.log(`  ⚠️ 无需修复`);
      }
    }
    
    console.log(`\n=== 修复完成 ===`);
    console.log(`成功修复: ${fixedCount} 个文档`);
    console.log(`总文档数: ${exams.length}`);
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

fixQuestionData();