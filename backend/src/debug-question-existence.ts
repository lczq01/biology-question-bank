import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { config } from './utils/config';
import { Paper } from './models/Paper';
import Question from './models/Question';

async function debugQuestionExistence() {
  try {
    await connectDatabase(config.database);
    console.log('数据库连接成功');

    const paperId = '68e1cede675d964d69c3e2e7';
    
    // 获取试卷数据
    const paper = await Paper.findById(paperId).lean();
    if (!paper) {
      console.log('试卷不存在');
      return;
    }

    console.log('\n=== 检查试卷中的questionId是否存在于Question集合 ===');
    
    if (paper.questions && Array.isArray(paper.questions)) {
      for (let i = 0; i < paper.questions.length; i++) {
        const questionItem = paper.questions[i];
        console.log(`\n题目 ${i + 1}:`);
        console.log('  questionId:', questionItem.questionId);
        console.log('  questionId类型:', typeof questionItem.questionId);
        
        // 检查这个ID是否存在于Question集合中
        const question = await Question.findById(questionItem.questionId).lean();
        if (question) {
          console.log('  ✅ 题目存在于Question集合');
          console.log('  题目内容:', question.content?.substring(0, 50) + '...');
        } else {
          console.log('  ❌ 题目不存在于Question集合中');
          
          // 尝试查找所有题目看看有哪些
          const allQuestions = await Question.find({}).select('_id content').limit(3).lean();
          console.log('  Question集合中的前3个题目:');
          allQuestions.forEach((q, idx) => {
            console.log(`    ${idx + 1}. ${q._id}: ${q.content?.substring(0, 30)}...`);
          });
        }
      }
    }

    // 创建测试题目
    console.log('\n=== 创建测试题目 ===');
    const testQuestion1 = new Question({
      title: '测试题目1',
      content: '这是一个测试的单选题，用于调试populate功能',
      type: 'single_choice',
      difficulty: 'easy',
      subject: '生物',
      chapter: '测试章节',
      options: [
        { id: 'A', text: '选项A', isCorrect: true },
        { id: 'B', text: '选项B', isCorrect: false },
        { id: 'C', text: '选项C', isCorrect: false },
        { id: 'D', text: '选项D', isCorrect: false }
      ],
      correctAnswer: 'A',
      explanation: '正确答案是A',
      points: 2,
      createdBy: new mongoose.Types.ObjectId('68e1cede675d964d69c3e2e0') // 假设的用户ID
    });

    const testQuestion2 = new Question({
      title: '测试题目2',
      content: '这是第二个测试的单选题，用于调试populate功能',
      type: 'single_choice',
      difficulty: 'medium',
      subject: '生物',
      chapter: '测试章节',
      options: [
        { id: 'A', text: '选项A', isCorrect: false },
        { id: 'B', text: '选项B', isCorrect: true },
        { id: 'C', text: '选项C', isCorrect: false },
        { id: 'D', text: '选项D', isCorrect: false }
      ],
      correctAnswer: 'B',
      explanation: '正确答案是B',
      points: 2,
      createdBy: new mongoose.Types.ObjectId('68e1cede675d964d69c3e2e0')
    });

    const savedQ1 = await testQuestion1.save();
    const savedQ2 = await testQuestion2.save();
    
    console.log('创建的测试题目:');
    console.log('  题目1 ID:', savedQ1._id);
    console.log('  题目2 ID:', savedQ2._id);

    // 更新试卷的questions数组
    console.log('\n=== 更新试卷题目 ===');
    await Paper.findByIdAndUpdate(paperId, {
      questions: [
        { questionId: savedQ1._id, order: 1, points: 2 },
        { questionId: savedQ2._id, order: 2, points: 2 }
      ]
    });
    console.log('试卷题目已更新');

  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已断开');
  }
}

debugQuestionExistence();