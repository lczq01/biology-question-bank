const mongoose = require('mongoose');
const { Paper } = require('./dist/models/Paper');
const { Question } = require('./dist/models/Question');

mongoose.connect('mongodb://localhost:27017/biology_question_bank').then(async () => {
  console.log('=== 检查具体试卷内容 ===');
  
  // 检查试卷 68e1cede675d964d69c3e2e7 (阿斯蒂芬)
  const paper1 = await Paper.findById('68e1cede675d964d69c3e2e7').populate('questions.questionId').lean();
  if (paper1) {
    console.log('试卷1: 阿斯蒂芬');
    console.log('试卷ID:', paper1._id);
    console.log('题目数量:', paper1.questions?.length || 0);
    if (paper1.questions && paper1.questions.length > 0) {
      paper1.questions.forEach((q, index) => {
        console.log(`题目 ${index + 1}:`, q.questionId?.content || '题目内容未找到');
        console.log(`题目类型:`, q.questionId?.type || '未知');
        if (q.questionId?.options) {
          console.log(`选项:`, q.questionId.options);
        }
      });
    }
    console.log('---');
  }
  
  // 检查试卷 68e13ccacdda597c5eaa89b29 (开始考试API最终验证)
  const paper2 = await Paper.findById('68e13ccacdda597c5eaa89b29').populate('questions.questionId').lean();
  if (paper2) {
    console.log('试卷2: 开始考试API最终验证');
    console.log('试卷ID:', paper2._id);
    console.log('题目数量:', paper2.questions?.length || 0);
    if (paper2.questions && paper2.questions.length > 0) {
      paper2.questions.forEach((q, index) => {
        console.log(`题目 ${index + 1}:`, q.questionId?.content || '题目内容未找到');
        console.log(`题目类型:`, q.questionId?.type || '未知');
        if (q.questionId?.options) {
          console.log(`选项:`, q.questionId.options);
        }
      });
    }
    console.log('---');
  }
  
  process.exit(0);
}).catch(console.error);