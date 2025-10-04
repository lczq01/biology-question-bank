// 临时测试脚本 - 测试考试数据模型
const mongoose = require('mongoose');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 测试ExamSession模型
async function testExamSessionModel() {
  try {
    console.log('\n🧪 测试ExamSession模型...');
    
    // 动态导入ES模块
    const { ExamSession } = await import('./models/ExamSession.js');
    
    // 创建测试数据
    const testSession = new ExamSession({
      name: '测试考试会话',
      description: '这是一个测试用的考试会话',
      paperId: new mongoose.Types.ObjectId(),
      creatorId: new mongoose.Types.ObjectId(), 
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后
      duration: 120, // 120分钟
      settings: {
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        allowRetake: false,
        maxAttempts: 1
      }
    });

    // 验证模型
    const validationError = testSession.validateSync();
    if (validationError) {
      console.error('❌ ExamSession模型验证失败:', validationError.message);
    } else {
      console.log('✅ ExamSession模型验证通过');
      console.log('📋 测试数据:', {
        name: testSession.name,
        status: testSession.status,
        duration: testSession.duration,
        settings: testSession.settings
      });
    }

  } catch (error) {
    console.error('❌ ExamSession模型测试失败:', error.message);
  }
}

// 测试Exam模型（ExamRecord）
async function testExamModel() {
  try {
    console.log('\n🧪 测试Exam模型（ExamRecord）...');
    
    // 动态导入ES模块
    const { Exam } = await import('./models/Exam.js');
    
    // 创建测试数据
    const testExam = new Exam({
      paperId: new mongoose.Types.ObjectId(),
      studentId: new mongoose.Types.ObjectId(),
      config: {
        timeLimit: 60,
        totalQuestions: 10,
        totalPoints: 100
      },
      answers: [],
      result: {
        score: 0,
        correctCount: 0,
        totalQuestions: 10,
        accuracy: 0,
        timeUsed: 0,
        isPassed: false
      }
    });

    // 验证模型
    const validationError = testExam.validateSync();
    if (validationError) {
      console.error('❌ Exam模型验证失败:', validationError.message);
    } else {
      console.log('✅ Exam模型验证通过');
      console.log('📋 测试数据:', {
        status: testExam.status,
        config: testExam.config,
        result: testExam.result
      });
    }

  } catch (error) {
    console.error('❌ Exam模型测试失败:', error.message);
  }
}

// 测试模型导出
async function testModelExports() {
  try {
    console.log('\n🧪 测试模型导出...');
    
    const models = await import('./models/index.js');
    
    console.log('📦 可用的模型导出:', Object.keys(models));
    
    if (models.ExamSession) {
      console.log('✅ ExamSession模型导出正常');
    } else {
      console.log('❌ ExamSession模型导出失败');
    }
    
    if (models.Exam) {
      console.log('✅ Exam模型导出正常');
    } else {
      console.log('❌ Exam模型导出失败');
    }
    
  } catch (error) {
    console.error('❌ 模型导出测试失败:', error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试考试数据模型...');
  
  await connectDB();
  await testExamSessionModel();
  await testExamModel();
  await testModelExports();
  
  console.log('\n✨ 测试完成！');
  process.exit(0);
}

// 运行测试
runTests().catch(error => {
  console.error('💥 测试运行失败:', error);
  process.exit(1);
});