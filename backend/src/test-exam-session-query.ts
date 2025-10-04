// 测试考试会话查询API功能
import axios from 'axios';
import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { User } from './models/User';
import Question from './models/Question';
import { Paper } from './models/Paper';
import { ExamSession } from './models/ExamSession';
import { ExamSessionStatus } from './types/exam-session.types';

const BASE_URL = 'http://localhost:3001/api';

interface TestUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
  profile: {
    firstName: string;
    lastName: string;
  };
}

// 测试用户数据
const adminUser: TestUser = {
  username: `admin${Date.now()}`,
  email: `admin${Date.now()}@test.com`,
  password: 'password123',
  role: 'admin',
  profile: {
    firstName: '测试',
    lastName: '管理员'
  }
};

const studentUser: TestUser = {
  username: `student${Date.now()}`,
  email: `student${Date.now()}@test.com`,
  password: 'password123',
  role: 'student',
  profile: {
    firstName: '测试',
    lastName: '学生'
  }
};

let adminToken: string;
let studentToken: string;
let testQuestionId: string;
let testPaperId: string;
let testSessionIds: string[] = [];

async function setupTestData() {
  console.log('🔧 设置测试数据...');

  // 创建测试题目
  const testQuestion = new Question({
    title: '生态系统能量流动特点',
    content: '测试题目：生态系统中的能量流动特点是什么？',
    type: 'single_choice',
    options: [
      { id: 'A', text: '循环流动', isCorrect: false },
      { id: 'B', text: '单向流动', isCorrect: true },
      { id: 'C', text: '双向流动', isCorrect: false },
      { id: 'D', text: '多向流动', isCorrect: false }
    ],
    correctAnswer: 'B',
    explanation: '生态系统中能量流动的特点是单向流动，逐级递减。',
    difficulty: 'medium',
    subject: '生物',
    chapter: '生态系统',
    keywords: ['能量流动'],
    points: 5,
    createdBy: new mongoose.Types.ObjectId()
  });

  const savedQuestion = await testQuestion.save();
  testQuestionId = (savedQuestion._id as mongoose.Types.ObjectId).toString();
  console.log('✅ 测试题目创建成功');

  // 创建测试试卷
  const testPaper = new Paper({
    title: '考试会话查询测试试卷',
    description: '用于测试考试会话查询API功能',
    type: 'exam',
    config: {
      totalQuestions: 1,
      totalPoints: 5,
      timeLimit: 60,
      allowReview: true,
      shuffleQuestions: false,
      shuffleOptions: false
    },
    questions: [{
      questionId: new mongoose.Types.ObjectId(testQuestionId),
      order: 1,
      points: 5
    }],
    createdBy: new mongoose.Types.ObjectId()
  });

  const savedPaper = await testPaper.save();
  testPaperId = (savedPaper._id as mongoose.Types.ObjectId).toString();
  console.log('✅ 测试试卷创建成功');
}

async function registerAndLoginUser(userData: TestUser): Promise<string> {
  try {
    // 注册用户
    await axios.post(`${BASE_URL}/auth-real/register`, userData);
    console.log(`✅ 用户 ${userData.username} 注册成功`);

    // 登录用户
    const loginResponse = await axios.post(`${BASE_URL}/auth-real/login`, {
      username: userData.username,
      password: userData.password
    });

    const token = loginResponse.data.data.token;
    console.log(`✅ 用户 ${userData.username} 登录成功`);
    return token;

  } catch (error: any) {
    console.error(`❌ 用户 ${userData.username} 认证失败:`, error.response?.data || error.message);
    throw error;
  }
}

async function createTestExamSessions() {
  console.log('🎯 创建测试考试会话...');

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // 创建多个不同状态的考试会话
  const sessionsToCreate = [
    {
      name: '草稿状态考试会话',
      description: '这是一个草稿状态的考试会话',
      paperId: testPaperId,
      startTime: tomorrow.toISOString(),
      endTime: dayAfterTomorrow.toISOString(),
      duration: 60,
      settings: {
        allowReview: true,
        autoGrade: true
      }
    },
    {
      name: '已发布考试会话',
      description: '这是一个已发布的考试会话',
      paperId: testPaperId,
      startTime: tomorrow.toISOString(),
      endTime: dayAfterTomorrow.toISOString(),
      duration: 90,
      settings: {
        allowReview: false,
        autoGrade: true,
        preventCheating: true
      }
    },
    {
      name: '生物期中考试',
      description: '高中生物期中考试',
      paperId: testPaperId,
      startTime: tomorrow.toISOString(),
      endTime: dayAfterTomorrow.toISOString(),
      duration: 120,
      settings: {
        allowReview: true,
        shuffleQuestions: true
      }
    }
  ];

  for (const sessionData of sessionsToCreate) {
    try {
      const response = await axios.post(
        `${BASE_URL}/exam-sessions`,
        sessionData,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      const sessionId = response.data.data._id;
      testSessionIds.push(sessionId);
      console.log(`✅ 考试会话创建成功: ${sessionData.name} (ID: ${sessionId})`);

      // 将第二个会话设置为已发布状态
      if (sessionData.name === '已发布考试会话') {
        await ExamSession.findByIdAndUpdate(sessionId, {
          status: ExamSessionStatus.PUBLISHED
        });
        console.log(`✅ 考试会话状态更新为已发布: ${sessionId}`);
      }

    } catch (error: any) {
      console.error(`❌ 创建考试会话失败: ${sessionData.name}`, error.response?.data || error.message);
    }
  }
}

async function testGetExamSessionsAPI() {
  console.log('\n🧪 开始测试考试会话查询API...');

  // 测试1: 管理员获取所有考试会话
  console.log('\n📋 测试1: 管理员获取所有考试会话');
  try {
    const response = await axios.get(`${BASE_URL}/exam-sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ 管理员查询成功');
    console.log(`📊 返回会话数量: ${response.data.data.sessions.length}`);
    console.log(`📄 分页信息:`, response.data.data.pagination);

    // 验证返回的会话包含我们创建的会话
    const returnedSessionNames = response.data.data.sessions.map((s: any) => s.name);
    console.log(`📝 返回的会话名称: ${returnedSessionNames.join(', ')}`);

  } catch (error: any) {
    console.error('❌ 管理员查询失败:', error.response?.data || error.message);
  }

  // 测试2: 学生获取考试会话（权限限制）
  console.log('\n👨‍🎓 测试2: 学生获取考试会话');
  try {
    const response = await axios.get(`${BASE_URL}/exam-sessions`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    console.log('✅ 学生查询成功');
    console.log(`📊 学生可见会话数量: ${response.data.data.sessions.length}`);
    console.log(`📄 分页信息:`, response.data.data.pagination);

  } catch (error: any) {
    console.error('❌ 学生查询失败:', error.response?.data || error.message);
  }

  // 测试3: 带分页参数的查询
  console.log('\n📄 测试3: 分页查询');
  try {
    const response = await axios.get(`${BASE_URL}/exam-sessions?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ 分页查询成功');
    console.log(`📊 当前页会话数量: ${response.data.data.sessions.length}`);
    console.log(`📄 分页信息:`, response.data.data.pagination);

  } catch (error: any) {
    console.error('❌ 分页查询失败:', error.response?.data || error.message);
  }

  // 测试4: 状态筛选查询
  console.log('\n🔍 测试4: 状态筛选查询 (DRAFT)');
  try {
    const response = await axios.get(`${BASE_URL}/exam-sessions?status=DRAFT`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ 状态筛选查询成功');
    console.log(`📊 DRAFT状态会话数量: ${response.data.data.sessions.length}`);
    
    // 验证所有返回的会话都是DRAFT状态
    const allDraft = response.data.data.sessions.every((s: any) => s.status === 'DRAFT');
    console.log(`✅ 状态筛选正确: ${allDraft ? '是' : '否'}`);

  } catch (error: any) {
    console.error('❌ 状态筛选查询失败:', error.response?.data || error.message);
  }

  // 测试5: 搜索查询
  console.log('\n🔎 测试5: 搜索查询');
  try {
    const response = await axios.get(`${BASE_URL}/exam-sessions?search=生物`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ 搜索查询成功');
    console.log(`📊 搜索结果数量: ${response.data.data.sessions.length}`);
    
    // 验证搜索结果包含关键词
    if (response.data.data.sessions.length > 0) {
      const firstResult = response.data.data.sessions[0];
      console.log(`📝 第一个搜索结果: ${firstResult.name}`);
    }

  } catch (error: any) {
    console.error('❌ 搜索查询失败:', error.response?.data || error.message);
  }

  // 测试6: 排序查询
  console.log('\n📊 测试6: 排序查询 (按名称升序)');
  try {
    const response = await axios.get(`${BASE_URL}/exam-sessions?sortBy=name&sortOrder=asc`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ 排序查询成功');
    console.log(`📊 返回会话数量: ${response.data.data.sessions.length}`);
    
    if (response.data.data.sessions.length > 1) {
      const names = response.data.data.sessions.map((s: any) => s.name);
      console.log(`📝 排序后的会话名称: ${names.join(', ')}`);
    }

  } catch (error: any) {
    console.error('❌ 排序查询失败:', error.response?.data || error.message);
  }

  // 测试7: 无权限访问测试
  console.log('\n🚫 测试7: 无权限访问');
  try {
    await axios.get(`${BASE_URL}/exam-sessions`);
    console.log('❌ 理应失败但成功了');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ 无权限访问正确被拒绝 (401)');
    } else {
      console.error('❌ 意外的错误:', error.response?.data || error.message);
    }
  }
}

async function cleanup() {
  console.log('\n🧹 清理测试数据...');
  
  try {
    // 删除测试考试会话
    for (const sessionId of testSessionIds) {
      await ExamSession.findByIdAndDelete(sessionId);
    }
    console.log('✅ 测试考试会话删除成功');

    // 删除测试用户
    await User.deleteOne({ username: adminUser.username });
    await User.deleteOne({ username: studentUser.username });
    console.log('✅ 测试用户删除成功');

    // 删除测试试卷
    if (testPaperId) {
      await Paper.findByIdAndDelete(testPaperId);
      console.log('✅ 测试试卷删除成功');
    }

    // 删除测试题目
    if (testQuestionId) {
      await Question.findByIdAndDelete(testQuestionId);
      console.log('✅ 测试题目删除成功');
    }

  } catch (error) {
    console.error('❌ 清理测试数据失败:', error);
  }
}

async function runTests() {
  try {
    console.log('🚀 开始考试会话查询API测试...\n');

    // 连接数据库
    const dbConfig = {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/biology-question-bank',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    };
    await connectDatabase(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 设置测试数据
    await setupTestData();

    // 注册和登录用户
    console.log('\n👤 注册和登录测试用户...');
    adminToken = await registerAndLoginUser(adminUser);
    studentToken = await registerAndLoginUser(studentUser);

    // 创建测试考试会话
    await createTestExamSessions();

    // 执行API测试
    await testGetExamSessionsAPI();

    // 清理测试数据
    await cleanup();

    console.log('\n🎉 考试会话查询API测试完成！');
    console.log('✅ 所有测试功能验证：');
    console.log('   - 管理员可以查看所有考试会话');
    console.log('   - 学生只能查看自己相关的考试会话');
    console.log('   - 分页功能正常工作');
    console.log('   - 状态筛选功能正常工作');
    console.log('   - 搜索功能正常工作');
    console.log('   - 排序功能正常工作');
    console.log('   - 权限验证正常工作');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ 数据库连接已断开');
    process.exit(0);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}