// TypeScript测试脚本 - 测试考试数据模型
import mongoose from 'mongoose';
import { ExamSession, IExamSessionDocument } from './models/ExamSession';
import { Exam, IExamDocument } from './models/Exam';
import { ExamSessionStatus } from './types/exam-session.types';
import { ExamRecordStatus } from './types/exam.types';

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
    
    // 创建测试数据
    const testSession = new ExamSession({
      name: '测试考试会话',
      description: '这是一个测试用的考试会话',
      paperId: new mongoose.Types.ObjectId(),
      creatorId: new mongoose.Types.ObjectId(), 
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后
      duration: 120, // 120分钟
      status: ExamSessionStatus.DRAFT,
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

    // 测试保存到数据库
    try {
      const savedSession = await testSession.save();
      console.log('✅ ExamSession保存到数据库成功, ID:', savedSession._id);
      
      // 清理测试数据
      await ExamSession.findByIdAndDelete(savedSession._id);
      console.log('🧹 测试数据已清理');
    } catch (saveError) {
      console.error('❌ ExamSession保存失败:', saveError);
    }

  } catch (error) {
    console.error('❌ ExamSession模型测试失败:', error instanceof Error ? error.message : String(error));
  }
}

// 测试Exam模型（ExamRecord）
async function testExamModel() {
  try {
    console.log('\n🧪 测试Exam模型（ExamRecord）...');
    
    // 创建测试数据
    const testExam = new Exam({
      paperId: new mongoose.Types.ObjectId(),
      studentId: new mongoose.Types.ObjectId(),
      status: ExamRecordStatus.NOT_STARTED,
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

    // 测试保存到数据库
    try {
      const savedExam = await testExam.save();
      console.log('✅ Exam保存到数据库成功, ID:', savedExam._id);
      
      // 清理测试数据
      await Exam.findByIdAndDelete(savedExam._id);
      console.log('🧹 测试数据已清理');
    } catch (saveError) {
      console.error('❌ Exam保存失败:', saveError);
    }

  } catch (error) {
    console.error('❌ Exam模型测试失败:', error instanceof Error ? error.message : String(error));
  }
}

// 测试枚举值
function testEnumValues() {
  console.log('\n🧪 测试枚举值...');
  
  console.log('📋 ExamSessionStatus枚举值:', Object.values(ExamSessionStatus));
  console.log('📋 ExamRecordStatus枚举值:', Object.values(ExamRecordStatus));
  
  // 验证枚举值是否正确
  const expectedSessionStatuses = ['draft', 'published', 'active', 'completed', 'cancelled'];
  const expectedRecordStatuses = ['not_started', 'in_progress', 'submitted', 'graded', 'timeout'];
  
  const sessionStatusesMatch = expectedSessionStatuses.every(status => 
    Object.values(ExamSessionStatus).includes(status as ExamSessionStatus)
  );
  
  const recordStatusesMatch = expectedRecordStatuses.every(status => 
    Object.values(ExamRecordStatus).includes(status as ExamRecordStatus)
  );
  
  if (sessionStatusesMatch) {
    console.log('✅ ExamSessionStatus枚举值正确');
  } else {
    console.log('❌ ExamSessionStatus枚举值不正确');
  }
  
  if (recordStatusesMatch) {
    console.log('✅ ExamRecordStatus枚举值正确');
  } else {
    console.log('❌ ExamRecordStatus枚举值不正确');
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试考试数据模型...');
  
  await connectDB();
  testEnumValues();
  await testExamSessionModel();
  await testExamModel();
  
  console.log('\n✨ 测试完成！');
  
  // 关闭数据库连接
  await mongoose.connection.close();
  console.log('🔌 数据库连接已关闭');
}

// 运行测试
runTests().catch(error => {
  console.error('💥 测试运行失败:', error);
  process.exit(1);
});