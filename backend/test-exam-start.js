const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试配置
const testConfig = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token-admin' // 使用Mock管理员token
  }
};

// 创建axios实例
const api = axios.create(testConfig);

// 测试数据
let testData = {
  examSessionId: null,
  paperId: null,
  userId: '507f1f77bcf86cd799439011' // Mock用户ID
};

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 日志函数
const log = {
  success: (msg) => console.log(colors.green(`✅ ${msg}`)),
  error: (msg) => console.log(colors.red(`❌ ${msg}`)),
  warning: (msg) => console.log(colors.yellow(`⚠️  ${msg}`)),
  info: (msg) => console.log(colors.blue(`ℹ️  ${msg}`)),
  step: (msg) => console.log(colors.cyan(`🔄 ${msg}`))
};

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. 创建测试试卷
async function createTestPaper() {
  log.step('创建测试试卷...');
  try {
    const paperData = {
      title: '开始考试API测试试卷',
      description: '用于测试开始考试API的测试试卷',
      type: 'manual',
      config: {
        totalQuestions: 3,
        totalPoints: 100,
        timeLimit: 60,
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: [
        {
          questionId: '507f1f77bcf86cd799439012',
          order: 1,
          points: 30
        },
        {
          questionId: '507f1f77bcf86cd799439013',
          order: 2,
          points: 35
        },
        {
          questionId: '507f1f77bcf86cd799439014',
          order: 3,
          points: 35
        }
      ]
    };

    const response = await api.post('/exam-paper/create', paperData);
    if (response.data.success) {
      testData.paperId = response.data.data._id || response.data.data.id;
      log.success(`试卷创建成功，ID: ${testData.paperId}`);
      return true;
    } else {
      log.error(`试卷创建失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    log.error(`试卷创建异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 2. 创建测试考试会话
async function createTestExamSession() {
  log.step('创建测试考试会话...');
  try {
    const now = new Date();
    const startTime = new Date('2025-11-15T10:00:00.000Z'); // 使用固定的未来时间
    const endTime = new Date('2025-11-15T11:00:00.000Z'); // 1小时后结束

    const sessionData = {
      name: '开始考试API测试会话',
      description: '用于测试开始考试API的测试会话',
      paperId: testData.paperId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 60,
      status: 'active',
      settings: {
        allowReview: true,
        showScore: true,
        allowRetake: false,
        shuffleQuestions: false,
        shuffleOptions: false
      }
    };

    const response = await api.post('/exam-sessions', sessionData);
    if (response.data.success) {
      testData.examSessionId = response.data.data._id;
      log.success(`考试会话创建成功，ID: ${testData.examSessionId}`);
      return true;
    } else {
      log.error(`考试会话创建失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    log.error(`考试会话创建异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 3. 学生加入考试会话
async function joinExamSession() {
  log.step('学生加入考试会话...');
  try {
    const response = await api.post(`/exam-sessions/${testData.examSessionId}/join`);
    if (response.data.success) {
      log.success('学生成功加入考试会话');
      return true;
    } else {
      log.error(`加入考试会话失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    log.error(`加入考试会话异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 4. 测试开始考试API - 首次开始
async function testStartExamFirstTime() {
  log.step('测试首次开始考试...');
  try {
    const response = await api.post(`/exam-sessions/${testData.examSessionId}/start`);
    if (response.data.success) {
      log.success('首次开始考试成功');
      console.log('返回数据:', JSON.stringify(response.data.data, null, 2));
      
      // 验证返回数据结构
      const { examRecord, examSession, paper } = response.data.data;
      
      if (examRecord && examRecord.status === 'in_progress') {
        log.success('考试记录状态正确: in_progress');
      } else {
        log.error('考试记录状态错误');
      }
      
      if (examRecord && examRecord.remainingMinutes > 0) {
        log.success(`剩余时间正确: ${examRecord.remainingMinutes}分钟`);
      } else {
        log.error('剩余时间错误');
      }
      
      return true;
    } else {
      log.error(`首次开始考试失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    log.error(`首次开始考试异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 5. 测试开始考试API - 重复开始（应该返回继续进行）
async function testStartExamContinue() {
  log.step('测试重复开始考试（继续进行）...');
  try {
    const response = await api.post(`/exam-sessions/${testData.examSessionId}/start`);
    if (response.data.success) {
      log.success('重复开始考试成功（继续进行）');
      console.log('返回数据:', JSON.stringify(response.data.data, null, 2));
      
      // 验证返回数据
      const { examRecord } = response.data.data;
      if (examRecord && examRecord.status === 'in_progress') {
        log.success('考试记录状态正确: in_progress');
      } else {
        log.error('考试记录状态错误');
      }
      
      return true;
    } else {
      log.error(`重复开始考试失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    log.error(`重复开始考试异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 6. 测试获取考试进度API
async function testGetExamProgress() {
  log.step('测试获取考试进度...');
  try {
    const response = await api.get(`/exam-sessions/${testData.examSessionId}/progress`);
    if (response.data.success) {
      log.success('获取考试进度成功');
      console.log('进度数据:', JSON.stringify(response.data.data, null, 2));
      
      // 验证返回数据
      const { examRecord, examSession } = response.data.data;
      if (examRecord && examSession) {
        log.success('进度数据结构正确');
      } else {
        log.error('进度数据结构错误');
      }
      
      return true;
    } else {
      log.error(`获取考试进度失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    log.error(`获取考试进度异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 7. 测试错误情况 - 未加入考试的用户开始考试
async function testStartExamNotJoined() {
  log.step('测试未加入考试的用户开始考试...');
  try {
    // 创建新的考试会话但不加入
    const now = new Date();
    const startTime = new Date('2025-11-16T10:00:00.000Z'); // 使用另一个固定的未来时间
    const endTime = new Date('2025-11-16T11:00:00.000Z'); // 1小时后结束

    const sessionData = {
      name: '未加入测试会话',
      description: '用于测试未加入用户的会话',
      paperId: testData.paperId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 60,
      status: 'active',
      settings: {
        allowReview: true,
        showScore: true,
        allowRetake: false,
        shuffleQuestions: false,
        shuffleOptions: false
      }
    };

    const createResponse = await api.post('/exam-sessions', sessionData);
    if (!createResponse.data.success) {
      log.error('创建测试会话失败');
      return false;
    }

    const newSessionId = createResponse.data.data._id;
    
    // 尝试开始考试（未加入）
    const response = await api.post(`/exam-sessions/${newSessionId}/start`);
    if (!response.data.success && response.data.message.includes('还未加入此考试')) {
      log.success('正确拒绝未加入用户开始考试');
      return true;
    } else {
      log.error('应该拒绝未加入用户开始考试');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('还未加入此考试')) {
      log.success('正确拒绝未加入用户开始考试');
      return true;
    } else {
      log.error(`测试未加入用户异常: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// 8. 清理测试数据
async function cleanup() {
  log.step('清理测试数据...');
  try {
    // 删除考试会话
    if (testData.examSessionId) {
      await api.delete(`/exam-sessions/${testData.examSessionId}`);
      log.success('考试会话删除成功');
    }
    
    // 删除试卷
    if (testData.paperId) {
      await api.delete(`/exam-paper/${testData.paperId}`);
      log.success('试卷删除成功');
    }
  } catch (error) {
    log.warning(`清理数据时出现错误: ${error.message}`);
  }
}

// 主测试函数
async function runTests() {
  console.log(colors.cyan('🚀 开始考试API验证测试'));
  console.log(colors.cyan('================================'));
  
  let allTestsPassed = true;
  
  try {
    // 1. 创建测试数据
    if (!await createTestPaper()) {
      allTestsPassed = false;
      return;
    }
    
    await delay(500);
    
    if (!await createTestExamSession()) {
      allTestsPassed = false;
      return;
    }
    
    await delay(1000); // 减少等待时间，因为我们不需要等待考试开始
    
    // 2. 加入考试
    if (!await joinExamSession()) {
      allTestsPassed = false;
      return;
    }
    
    await delay(500);
    
    // 3. 测试开始考试功能
    if (!await testStartExamFirstTime()) {
      allTestsPassed = false;
    }
    
    await delay(500);
    
    if (!await testStartExamContinue()) {
      allTestsPassed = false;
    }
    
    await delay(500);
    
    // 4. 测试获取进度功能
    if (!await testGetExamProgress()) {
      allTestsPassed = false;
    }
    
    await delay(500);
    
    // 5. 测试错误情况
    if (!await testStartExamNotJoined()) {
      allTestsPassed = false;
    }
    
  } catch (error) {
    log.error(`测试过程中发生异常: ${error.message}`);
    allTestsPassed = false;
  } finally {
    // 清理测试数据
    await cleanup();
  }
  
  console.log(colors.cyan('================================'));
  if (allTestsPassed) {
    log.success('🎉 所有测试通过！开始考试API验证完成');
  } else {
    log.error('❌ 部分测试失败，请检查问题');
  }
}

// 运行测试
runTests().catch(error => {
  log.error(`测试运行失败: ${error.message}`);
  process.exit(1);
});