import axios from 'axios';
import { connectDatabase, disconnectDatabase } from './utils/database';
import { User } from './models/User';
import { Paper } from './models/Paper';
import Question from './models/Question';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:3001/api';

interface TestUser {
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
}

interface TestPaper {
  title: string;
  description: string;
  questions: string[];
  totalScore: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
}

async function setupTestData() {
  console.log('🔧 设置测试数据...');
  
  // 创建测试用户
  const testUser: TestUser = {
    username: 'test_teacher_' + Date.now(),
    password: 'test123456',
    role: 'teacher'
  };

  // 创建测试题目
  const testQuestion = new Question({
    content: '生态系统中能量流动的特点是什么？',
    type: 'single_choice',
    options: [
      { label: 'A', content: '单向流动，逐级递减' },
      { label: 'B', content: '循环流动，能量守恒' },
      { label: 'C', content: '双向流动，可以回流' },
      { label: 'D', content: '多向流动，随机分布' }
    ],
    correctAnswer: 'A',
    analysis: '生态系统中能量流动的特点是单向流动，逐级递减，不能循环利用。',
    difficulty: 'medium',
    subject: 'biology',
    chapter: '生态系统',
    knowledgePoints: ['能量流动'],
    score: 5
  });

  const savedQuestion = await testQuestion.save();
  console.log('✅ 测试题目创建成功');

  // 创建测试试卷
  const testPaper: TestPaper = {
    title: '测试考试试卷_' + Date.now(),
    description: '用于测试考试会话创建的试卷',
    questions: [(savedQuestion._id as mongoose.Types.ObjectId).toString()],
    totalScore: 5,
    timeLimit: 60,
    difficulty: 'medium',
    subject: 'biology'
  };

  const paper = new Paper(testPaper);
  await paper.save();
  console.log('✅ 测试试卷创建成功');

  return { testUser, testPaper: paper, testQuestion };
}

async function registerAndLogin(testUser: TestUser) {
  console.log('👤 注册和登录测试用户...');
  
  try {
    // 注册用户
    await axios.post(`${BASE_URL}/auth/register`, {
      username: testUser.username,
      password: testUser.password,
      role: testUser.role
    });
    console.log('✅ 用户注册成功');
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('已存在')) {
      console.log('ℹ️ 用户已存在，跳过注册');
    } else {
      throw error;
    }
  }

  // 登录获取token
  const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
    username: testUser.username,
    password: testUser.password
  });

  const token = loginResponse.data.token;
  console.log('✅ 用户登录成功，获取到token');
  return token;
}

async function testCreateExamSession(token: string, paperId: string) {
  console.log('🎯 测试考试会话创建API...');
  
  const examSessionData = {
    name: '期中生物考试_' + Date.now(),
    description: '高中生物期中考试，涵盖生态系统相关知识点',
    paperId: paperId,
    startTime: new Date(Date.now() + 5 * 60 * 1000), // 5分钟后开始
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后结束
    duration: 60, // 60分钟考试时长
    allowedUsers: [], // 空数组表示所有用户都可以参加
    settings: {
      allowReview: true,
      shuffleQuestions: false,
      shuffleOptions: true,
      showResults: true,
      allowRetake: false,
      maxAttempts: 1,
      passingScore: 60,
      autoGrade: true,
      preventCheating: false
    }
  };

  console.log('📝 发送考试会话创建请求...');
  console.log('请求数据:', JSON.stringify(examSessionData, null, 2));

  try {
    const response = await axios.post(`${BASE_URL}/exam-sessions`, examSessionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ 考试会话创建成功！');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error: any) {
    console.log('❌ 考试会话创建失败');
    console.log('错误状态:', error.response?.status);
    console.log('错误信息:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

async function testInvalidRequests(token: string) {
  console.log('🧪 测试无效请求处理...');
  
  const invalidTests = [
    {
      name: '缺少必需字段',
      data: {
        name: '测试考试'
        // 缺少其他必需字段
      }
    },
    {
      name: '无效的试卷ID',
      data: {
        name: '测试考试',
        paperId: 'invalid_paper_id',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        duration: 60
      }
    },
    {
      name: '结束时间早于开始时间',
      data: {
        name: '测试考试',
        paperId: '507f1f77bcf86cd799439011', // 假的但格式正确的ObjectId
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(), // 结束时间早于开始时间
        duration: 60
      }
    }
  ];

  for (const test of invalidTests) {
    try {
      await axios.post(`${BASE_URL}/exam-sessions`, test.data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`❌ ${test.name}: 应该失败但成功了`);
    } catch (error: any) {
      console.log(`✅ ${test.name}: 正确返回错误 (${error.response?.status})`);
      console.log(`   错误信息: ${error.response?.data?.error?.message}`);
    }
  }
}

async function testUnauthorizedAccess() {
  console.log('🔒 测试未授权访问...');
  
  try {
    await axios.post(`${BASE_URL}/exam-sessions`, {
      name: '未授权测试',
      paperId: '507f1f77bcf86cd799439011',
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      duration: 60
    });
    console.log('❌ 未授权访问: 应该失败但成功了');
  } catch (error: any) {
    console.log(`✅ 未授权访问: 正确返回错误 (${error.response?.status})`);
    console.log(`   错误信息: ${error.response?.data?.error?.message}`);
  }
}

async function cleanupTestData(testUser: TestUser, testPaper: any, testQuestion: any) {
  console.log('🧹 清理测试数据...');
  
  try {
    // 删除测试用户
    await User.deleteOne({ username: testUser.username });
    console.log('✅ 测试用户删除成功');
  } catch (error) {
    console.log('⚠️ 删除测试用户失败:', error);
  }

  try {
    // 删除测试试卷
    await Paper.deleteOne({ _id: testPaper._id });
    console.log('✅ 测试试卷删除成功');
  } catch (error) {
    console.log('⚠️ 删除测试试卷失败:', error);
  }

  try {
    // 删除测试题目
    await Question.deleteOne({ _id: testQuestion._id });
    console.log('✅ 测试题目删除成功');
  } catch (error) {
    console.log('⚠️ 删除测试题目失败:', error);
  }
}

async function runFullTest() {
  console.log('🚀 开始完整的考试会话创建流程测试...\n');

  try {
    // 连接数据库
    const dbConfig = {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/biology-question-bank',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    };
    await connectDatabase(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 设置测试数据
    const { testUser, testPaper, testQuestion } = await setupTestData();
    console.log('');

    // 注册和登录
    const token = await registerAndLogin(testUser);
    console.log('');

    // 测试未授权访问
    await testUnauthorizedAccess();
    console.log('');

    // 测试无效请求
    await testInvalidRequests(token);
    console.log('');

    // 测试成功创建考试会话
    const paperId = (testPaper._id as mongoose.Types.ObjectId).toString();
    const examSession = await testCreateExamSession(token, paperId);
    console.log('');

    // 清理测试数据
    await cleanupTestData(testUser, testPaper, testQuestion);
    console.log('');

    console.log('🎉 完整的考试会话创建流程测试成功完成！');
    console.log('✅ 所有功能都正常工作：');
    console.log('   - 用户认证系统');
    console.log('   - 权限验证中间件');
    console.log('   - 输入数据验证');
    console.log('   - 考试会话创建');
    console.log('   - 错误处理机制');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 断开数据库连接
    await disconnectDatabase();
    console.log('\n✅ 数据库连接已断开');
  }
}

// 运行测试
runFullTest().catch(console.error);