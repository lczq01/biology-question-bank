const mongoose = require('mongoose');

async function checkQuestions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');
    
    const Question = require('./dist/models/Question.js').default;
    
    // 查找包含HTML标签的题目
    const questions = await Question.find({
      $or: [
        { explanation: { $regex: '<.*>', $options: 'i' } },
        { analysis: { $regex: '<.*>', $options: 'i' } },
        { content: { $regex: '<.*>', $options: 'i' } }
      ]
    });
    
    console.log('包含HTML标签的题目数量:', questions.length);
    
    questions.forEach((q, i) => {
      console.log(`\n题目 ${i+1}:`);
      if (q.content && q.content.includes('<')) {
        console.log('content:', JSON.stringify(q.content, null, 2));
      }
      if (q.explanation && q.explanation.includes('<')) {
        console.log('explanation:', JSON.stringify(q.explanation, null, 2));
      }
      if (q.analysis && q.analysis.includes('<')) {
        console.log('analysis:', JSON.stringify(q.analysis, null, 2));
      }
    });
    
    // 也查看最近创建的几个题目
    console.log('\n=== 最近创建的5个题目 ===');
    const recentQuestions = await Question.find({}).sort({ createdAt: -1 }).limit(5);
    recentQuestions.forEach((q, i) => {
      console.log(`\n最近题目 ${i+1}:`);
      console.log('content:', q.content ? q.content.substring(0, 100) + '...' : 'N/A');
      console.log('explanation:', q.explanation ? q.explanation.substring(0, 100) + '...' : 'N/A');
      console.log('analysis:', q.analysis ? q.analysis.substring(0, 100) + '...' : 'N/A');
    });
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ 数据库连接已关闭');
  }
}

checkQuestions();