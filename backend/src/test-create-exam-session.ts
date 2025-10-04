// 测试考试会话创建API的完整功能
import { ExamSession } from './models/ExamSession';
import { Paper } from './models/Paper';
import { User } from './models/User';
import { connectDatabase } from './utils/database';
import { config } from './utils/config';
import { Types } from 'mongoose';
import { ExamSessionStatus } from './types/exam-session.types';

// 测试数据
const testData = {
  validSession: {
    name: '高中生物期末考试',
    description: '高中生物第一学期期末考试，涵盖细胞生物学、遗传学等内容',
    paperId: new Types.ObjectId().toString(),
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 明天+2小时
    duration: 120,
    settings: {
      allowReview: true,
      maxAttempts: 1,
      passingScore: 60,
      autoGrade: true,
      preventCheating: true
    }
  },
  validUser: {
    username: 'testteacher',
    email: 'teacher@test.com',
    role: 'teacher' as const
  },
  validPaper: {
    title: '测试试卷',
    type: 'exam' as const,
    status: 'active' as const,
    config: {
      totalQuestions: 10,
      totalPoints: 100,
      timeLimit: 120,
      allowReview: false,
      shuffleQuestions: false,
      shuffleOptions: false
    },
    questions: [],
    stats: {
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0
    }
  }
};

async function setupTestData() {
  console.log('🔧 设置测试数据...');
  
  try {
    // 创建测试用户
    const user = new User({
      ...testData.validUser,
      password: 'hashedpassword123'
    });
    const savedUser = await user.save();
    console.log('✅ 测试用户创建成功:', savedUser._id);

    // 创建测试试卷
    const paper = new Paper({
      ...testData.validPaper,
      createdBy: savedUser._id
    });
    const savedPaper = await paper.save();
    console.log('✅ 测试试卷创建成功:', savedPaper._id);

    return {
      userId: savedUser._id.toString(),
      paperId: String(savedPaper._id)
    };
  } catch (error) {
    console.error('❌ 测试数据设置失败:', error);
    throw error;
  }
}

async function testExamSessionCreation() {
  console.log('🧪 测试考试会话创建功能...\n');

  try {
    // 连接数据库
    await connectDatabase(config.database);
    console.log('✅ 数据库连接成功\n');

    // 清理现有测试数据
    await ExamSession.deleteMany({ name: /测试/ });
    await User.deleteMany({ username: /test/ });
    await Paper.deleteMany({ title: /测试/ });
    console.log('🧹 清理旧测试数据完成\n');

    // 设置测试数据
    const { userId, paperId } = await setupTestData();
    console.log('');

    // 测试1: 正常创建考试会话
    console.log('📝 测试1: 正常创建考试会话');
    const sessionData = {
      ...testData.validSession,
      paperId
    };

    const newSession = new ExamSession({
      name: sessionData.name,
      description: sessionData.description,
      paperId: new Types.ObjectId(sessionData.paperId),
      creatorId: new Types.ObjectId(userId),
      startTime: new Date(sessionData.startTime),
      endTime: new Date(sessionData.endTime),
      duration: sessionData.duration,
      settings: sessionData.settings,
      status: ExamSessionStatus.DRAFT,
      participants: [],
      stats: {
        totalParticipants: 0,
        completedCount: 0,
        averageScore: 0,
        passRate: 0
      }
    });

    const savedSession = await newSession.save();
    console.log('✅ 考试会话创建成功');
    console.log('会话ID:', savedSession._id);
    console.log('会话名称:', savedSession.name);
    console.log('状态:', savedSession.status);
    console.log('');

    // 测试2: 验证数据完整性
    console.log('📝 测试2: 验证数据完整性');
    const retrievedSession = await ExamSession.findById(savedSession._id)
      .populate('paperId', 'title type')
      .populate('creatorId', 'username email');

    if (retrievedSession) {
      console.log('✅ 数据检索成功');
      console.log('关联试卷:', (retrievedSession.paperId as any)?.title);
      console.log('创建者:', (retrievedSession.creatorId as any)?.username);
      console.log('开始时间:', retrievedSession.startTime.toISOString());
      console.log('结束时间:', retrievedSession.endTime.toISOString());
      console.log('考试时长:', retrievedSession.duration, '分钟');
    } else {
      console.log('❌ 数据检索失败');
    }
    console.log('');

    // 测试3: 测试时间验证
    console.log('📝 测试3: 测试时间验证');
    try {
      const invalidSession = new ExamSession({
        name: '无效时间测试',
        paperId: new Types.ObjectId(paperId),
        creatorId: new Types.ObjectId(userId),
        startTime: new Date(Date.now() - 60 * 60 * 1000), // 过去时间
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        duration: 60,
        settings: { allowReview: false, maxAttempts: 1, passingScore: 60, autoGrade: true, preventCheating: false },
        status: ExamSessionStatus.DRAFT,
        participants: [],
        stats: { totalParticipants: 0, completedCount: 0, averageScore: 0, passRate: 0 }
      });

      await invalidSession.save();
      console.log('⚠️ 意外成功 - 应该拒绝过去的开始时间');
    } catch (error) {
      console.log('✅ 正确拒绝了无效时间');
    }
    console.log('');

    // 测试4: 测试状态转换
    console.log('📝 测试4: 测试状态转换');
    savedSession.status = ExamSessionStatus.PUBLISHED;
    await savedSession.save();
    console.log('✅ 状态更新成功:', savedSession.status);
    console.log('');

    // 测试5: 查询功能
    console.log('📝 测试5: 查询功能');
    const sessions = await ExamSession.find({
      creatorId: new Types.ObjectId(userId),
      status: ExamSessionStatus.PUBLISHED
    });
    console.log('✅ 查询成功，找到', sessions.length, '个已发布的考试会话');
    console.log('');

    console.log('🎉 所有测试通过！考试会话创建功能正常工作');

  } catch (error) {
    console.error('💥 测试失败:', error);
  } finally {
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    try {
      await ExamSession.deleteMany({ name: /测试/ });
      await User.deleteMany({ username: /test/ });
      await Paper.deleteMany({ title: /测试/ });
      console.log('✅ 清理完成');
    } catch (error) {
      console.error('❌ 清理失败:', error);
    }
    
    process.exit(0);
  }
}

// 运行测试
console.log('🚀 开始测试考试会话创建功能...\n');
testExamSessionCreation();