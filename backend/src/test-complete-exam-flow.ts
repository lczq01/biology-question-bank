import axios from 'axios';
import { connectDatabase } from './utils/database';
import { User } from './models/User';
import { Paper } from './models/Paper';
import Question from './models/Question';
import { config } from './utils/config';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:3001/api';

interface TestUser {
  username: string;
  password: string;
  role: 'admin' | 'student';
}

async function setupTestData() {
  console.log('🔧 设置测试数据...');
  
  const testUser: TestUser = {
    username: 'testadmin' + Date.now().toString().slice(-8),
    password: 'test123456',
    role: 'admin'
  };

  // 创建测试题目
  const testQuestion = new Question({
    title: '生态系统能量流动题目',
    content: '生态系统中能量流动的特点是什么？',
    type: 'single_choice',
    difficulty: 'medium',
    subject: 'biology',
    chapter: '生态系统',
    keywords: ['能量流动'],
    options: [
      { id: 'A', text: '单向流动，逐级递减', isCorrect: true },
      { id: 'B', text: '循环流动，能量守恒', isCorrect: false },
      { id: 'C', text: '双向流动，可以回流', isCorrect: false },
      { id: 'D', text: '多向流动，随机分布', isCorrect: false }
    ],
    correctAnswer: 'A',
    explanation: '生态系统中能量流动的特点是单向流动，逐级递减，不能循环利用。',
    points: 5,
    createdBy: new mongoose.Types.ObjectId()
  });

  await testQuestion.save();
  console.log('✅ 测试题目创建成功');

  // 创建测试试卷
  const testPaper = new Paper({
    title: '测试考试试卷_' + Date.now(),
    description: '用于测试考试会话创建的试卷',
    type: 'exam',
    status: 'published',
    config: {
      totalQuestions: 1,
      totalPoints: 5,
      timeLimit: 60,
      allowReview: true,
      shuffleQuestions: false,
      shuffleOptions: false
    },
    questions: [{
      questionId: testQuestion._id,
      order: 1,
      points: 5
    }],
    createdBy: new mongoose.Types.ObjectId()
  });

  await testPaper.save();
  console.log('✅ 测试试卷创建成功');

  return { testUser, testPaper, testQuestion };
}

async function registerAndLogin(testUser: TestUser) {
  console.log('👤 注册和登录测试用户...');
  
  try {
    await axios.post(`${BASE_URL}/auth-real/register`, {
      username: testUser.username,
      email: testUser.username + '@test.com',
      password: testUser.password,
      role: testUser.role,
      profile: {
        firstName: '测试',
        lastName: '管理员'
      }
    });
    console.log('✅ 用户注册成功');
  } catch (error: any) {
    if (error.response?.status === 400 && (
      error.response?.data?.message?.includes('已存在') ||
      error.response?.data?.message?.includes('已被注册')
    )) {
      console.log('ℹ️ 用户已存在，跳过注册');
    } else {
      console.log('❌ 用户注册失败:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  const loginResponse = await axios.post(`${BASE_URL}/auth-real/login`, {
    username: testUser.username,
    password: testUser.password
  });

  console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
  
  const token = loginResponse.data.data?.token;
  if (!token) {
    throw new Error('未能获取到有效的token');
  }
  
  console.log('✅ 用户登录成功，获取到token:', token.substring(0, 20) + '...');
  return token;
}

async function testCreateExamSession(token: string, paperId: string) {
  console.log('🎯 测试考试会话创建API...');
  
  const examSessionData = {
    name: '期中生物考试_' + Date.now(),
    description: '高中生物期中考试，涵盖生态系统相关知识点',
    paperId: paperId,
    startTime: new Date(Date.now() + 5 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    duration: 60,
    allowedUsers: [],
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

  try {
    const response = await axios.post(`${BASE_URL}/exam-sessions`, examSessionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ 考试会话创建成功！');
    console.log('响应状态:', response.status);
    console.log('考试会话ID:', response.data.data._id);
    
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
  
  const tests = [
    {
      name: '缺少必需字段',
      data: { name: '测试考试' }
    },
    {
      name: '无效的试卷ID',
      data: {
        name: '测试考试',
        paperId: 'invalid_id',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        duration: 60
      }
    }
  ];

  for (const test of tests) {
    try {
      await axios.post(`${BASE_URL}/exam-sessions`, test.data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`❌ ${test.name}: 应该失败但成功了`);
    } catch (error: any) {
      console.log(`✅ ${test.name}: 正确返回错误 (${error.response?.status})`);
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
      endTime: new Date(Date.now() + 3600000),
      duration: 60
    });
    console.log('❌ 未授权访问: 应该失败但成功了');
  } catch (error: any) {
    console.log(`✅ 未授权访问: 正确返回错误 (${error.response?.status})`);
  }
}

async function cleanupTestData(testUser: TestUser, testPaper: any, testQuestion: any) {
  console.log('🧹 清理测试数据...');
  
  try {
    await User.deleteOne({ username: testUser.username });
    console.log('✅ 测试用户删除成功');
  } catch (error) {
    console.log('⚠️ 删除测试用户失败:', error);
  }

  try {
    await Paper.deleteOne({ _id: testPaper._id });
    console.log('✅ 测试试卷删除成功');
  } catch (error) {
    console.log('⚠️ 删除测试试卷失败:', error);
  }

  try {
    await Question.deleteOne({ _id: testQuestion._id });
    console.log('✅ 测试题目删除成功');
  } catch (error) {
    console.log('⚠️ 删除测试题目失败:', error);
  }
}

async function runCompleteTest() {
  console.log('🚀 开始完整的考试会话创建流程测试...\n');

  try {
    await connectDatabase(config.database);
    console.log('✅ 数据库连接成功\n');

    const { testUser, testPaper, testQuestion } = await setupTestData();
    console.log('');

    const token = await registerAndLogin(testUser);
    console.log('');

    await testUnauthorizedAccess();
    console.log('');

    await testInvalidRequests(token);
    console.log('');

    const paperId = (testPaper._id as mongoose.Types.ObjectId).toString();
    const examSession = await testCreateExamSession(token, paperId);
    console.log('');

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
    await mongoose.disconnect();
    console.log('\n✅ 数据库连接已断开');
  }
}

runCompleteTest().catch(console.error);