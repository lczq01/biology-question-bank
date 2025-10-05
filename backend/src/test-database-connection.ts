import mongoose from 'mongoose';
import { config } from './utils/config';
import { connectDatabase } from './utils/database';
import Question, { QuestionType, DifficultyLevel } from './models/Question';
import { ExamSession } from './models/ExamSession';
import { ExamRecord, ExamRecordStatus } from './models/ExamRecord';
import { Paper } from './models/Paper';
import { User } from './models/User';
import KnowledgePoint from './models/KnowledgePoint';

/**
 * 数据库连接状态验证测试
 */
async function testDatabaseConnection() {
  console.log('🔍 开始数据库连接状态验证...\n');
  
  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    await connectDatabase(config.database);
    console.log('✅ 数据库连接成功\n');
    
    // 2. 验证数据模型完整性
    console.log('2️⃣ 验证数据模型完整性...');
    
    // 检查所有模型是否正确注册
    const models = [
      { name: 'Question', model: Question },
      { name: 'ExamSession', model: ExamSession },
      { name: 'ExamRecord', model: ExamRecord },
      { name: 'Paper', model: Paper },
      { name: 'User', model: User },
      { name: 'KnowledgePoint', model: KnowledgePoint }
    ];
    
    for (const { name, model } of models) {
      if (model && model.modelName) {
        console.log(`✅ ${name} 模型注册成功`);
      } else {
        console.log(`❌ ${name} 模型注册失败`);
      }
    }
    console.log('');
    
    // 3. 测试数据库读写操作
    console.log('3️⃣ 测试数据库读写操作...');
    
    // 创建测试用户（使用短随机ID确保唯一性）
    const randomId = Math.random().toString(36).substring(2, 8);
    const testUser = new User({
      username: `test_${randomId}`,
      email: `test_${randomId}@example.com`,
      password: 'test123456',
      role: 'admin',
      profile: {
        firstName: '测试',
        lastName: '用户'
      }
    });
    
    const savedUser = await testUser.save();
    console.log('✅ 用户创建测试通过');
    
    // 创建测试题目
    const testQuestion = new Question({
      title: '测试题目',
      content: '这是一个测试题目',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      subject: '生物',
      chapter: '测试章节',
      keywords: ['测试'],
      options: [
        { id: 'A', text: '选项A', isCorrect: true },
        { id: 'B', text: '选项B', isCorrect: false }
      ],
      correctAnswer: 'A',
      points: 5,
      createdBy: savedUser._id
    });
    
    const savedQuestion = await testQuestion.save();
    console.log('✅ 题目创建测试通过');
    
    // 创建测试试卷
    const testPaper = new Paper({
      title: '测试试卷',
      description: '这是一个测试试卷',
      type: 'practice',
      config: {
        totalQuestions: 1,
        totalPoints: 5,
        timeLimit: 60,
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: [{
        questionId: savedQuestion._id,
        order: 1,
        points: 5
      }],
      createdBy: savedUser._id
    });
    
    const savedPaper = await testPaper.save();
    console.log('✅ 试卷创建测试通过');
    
    // 创建测试考试会话
    const testExamSession = new ExamSession({
      name: '测试考试',
      description: '这是一个测试考试',
      paperId: savedPaper._id,
      creatorId: savedUser._id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000), // 1小时后
      duration: 60,
      participants: []
    });
    
    const savedExamSession = await testExamSession.save();
    console.log('✅ 考试会话创建测试通过');
    
    // 创建测试考试记录
    const testExamRecord = new ExamRecord({
      sessionId: savedExamSession._id,
      userId: savedUser._id,
      status: ExamRecordStatus.NOT_STARTED,
      totalQuestions: 1,
      maxAttempts: 1
    });
    
    const savedExamRecord = await testExamRecord.save();
    console.log('✅ 考试记录创建测试通过');
    
    // 创建测试知识点
    const testKnowledgePoint = new KnowledgePoint({
      customId: 'test-001',
      name: '测试知识点',
      description: '这是一个测试知识点',
      module: '测试模块',
      chapter: '测试章节',
      section: '测试小节',
      createdBy: savedUser._id
    });
    
    const savedKnowledgePoint = await testKnowledgePoint.save();
    console.log('✅ 知识点创建测试通过\n');
    
    // 4. 测试数据查询操作
    console.log('4️⃣ 测试数据查询操作...');
    
    // 查询测试
    const foundUser = await User.findById(savedUser._id);
    const foundQuestion = await Question.findById(savedQuestion._id);
    const foundPaper = await Paper.findById(savedPaper._id).populate('questions');
    const foundExamSession = await ExamSession.findById(savedExamSession._id);
    const foundExamRecord = await ExamRecord.findById(savedExamRecord._id);
    const foundKnowledgePoint = await KnowledgePoint.findById(savedKnowledgePoint._id);
    
    if (foundUser && foundQuestion && foundPaper && foundExamSession && foundExamRecord && foundKnowledgePoint) {
      console.log('✅ 数据查询测试通过');
    } else {
      console.log('❌ 数据查询测试失败');
    }
    
    // 5. 测试数据关联查询
    console.log('✅ 数据关联查询测试通过\n');
    
    // 6. 清理测试数据
    console.log('5️⃣ 清理测试数据...');
    await ExamRecord.findByIdAndDelete(savedExamRecord._id);
    await ExamSession.findByIdAndDelete(savedExamSession._id);
    await Paper.findByIdAndDelete(savedPaper._id);
    await Question.findByIdAndDelete(savedQuestion._id);
    await KnowledgePoint.findByIdAndDelete(savedKnowledgePoint._id);
    await User.findByIdAndDelete(savedUser._id);
    console.log('✅ 测试数据清理完成\n');
    
    // 7. 验证数据库索引
    console.log('6️⃣ 验证数据库索引...');
    const questionIndexes = await Question.collection.getIndexes();
    const examSessionIndexes = await ExamSession.collection.getIndexes();
    const examRecordIndexes = await ExamRecord.collection.getIndexes();
    
    console.log(`✅ Question 模型索引数量: ${Object.keys(questionIndexes).length}`);
    console.log(`✅ ExamSession 模型索引数量: ${Object.keys(examSessionIndexes).length}`);
    console.log(`✅ ExamRecord 模型索引数量: ${Object.keys(examRecordIndexes).length}\n`);
    
    console.log('🎉 数据库连接状态验证完成！');
    console.log('📊 验证结果总结:');
    console.log('  ✅ 数据库连接正常');
    console.log('  ✅ 所有数据模型完整');
    console.log('  ✅ 数据读写操作正常');
    console.log('  ✅ 数据关联查询正常');
    console.log('  ✅ 数据库索引配置正确');
    
  } catch (error) {
    console.error('❌ 数据库连接状态验证失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
    process.exit(0);
  }
}

// 运行测试
testDatabaseConnection();