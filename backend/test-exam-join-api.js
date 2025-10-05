/**
 * 测试学生加入考试会话API功能
 * 运行方式: node test-exam-join-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试用户信息
const testUsers = {
  student: {
    userId: '60f1b2b2b2b2b2b2b2b2b2b2',
    username: 'student1',
    role: 'student'
  },
  teacher: {
    userId: '60f1b2b2b2b2b2b2b2b2b2b1',
    username: 'teacher1', 
    role: 'teacher'
  }
};

// 模拟认证token（实际项目中会从登录获取）
const createMockToken = (user) => {
  // 根据用户角色返回对应的mock token
  if (user.role === 'student') {
    return 'mock-token-student';
  } else if (user.role === 'teacher' || user.role === 'admin') {
    return 'mock-token-admin';
  }
  return 'mock-token-student'; // 默认返回学生token
};

// 创建HTTP客户端
const createClient = (user) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${createMockToken(user)}`,
      'Content-Type': 'application/json'
    }
  });
};

// 测试函数
async function runTests() {
  console.log('🚀 开始测试学生加入考试会话API...\n');

  const studentClient = createClient(testUsers.student);
  const teacherClient = createClient(testUsers.teacher);

  let testSessionId = null;
  let testPaperId = null;

  try {
    // 1. 首先创建一个测试试卷（使用教师权限）
    console.log('📝 1. 创建测试试卷...');
    const paperResponse = await teacherClient.post('/exam-papers', {
      title: '测试生物试卷',
      description: '用于测试学生加入考试功能',
      questions: [
        '60f1b2b2b2b2b2b2b2b2b2b3',
        '60f1b2b2b2b2b2b2b2b2b2b4'
      ],
      totalScore: 100,
      difficulty: 'medium',
      tags: ['测试']
    });
    
    testPaperId = paperResponse.data.data._id;
    console.log('✅ 试卷创建成功，ID:', testPaperId);

  } catch (error) {
    console.log('⚠️  试卷创建失败，使用现有试卷继续测试');
    // 尝试获取现有试卷
    try {
      const papersResponse = await teacherClient.get('/exam-papers?limit=1');
      if (papersResponse.data.data.papers.length > 0) {
        testPaperId = papersResponse.data.data.papers[0]._id;
        console.log('✅ 使用现有试卷，ID:', testPaperId);
      }
    } catch (err) {
      console.error('❌ 无法获取试卷，跳过试卷相关测试');
    }
  }

  try {
    // 2. 创建一个测试考试会话（使用教师权限）
    console.log('\n📅 2. 创建测试考试会话...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionResponse = await teacherClient.post('/exam-sessions', {
      name: '测试生物考试',
      description: '用于测试学生加入功能的考试会话',
      paperId: testPaperId || '60f1b2b2b2b2b2b2b2b2b2b5',
      startTime: new Date().toISOString(), // 立即开始
      endTime: tomorrow.toISOString(),
      duration: 60,
      settings: {
        allowReview: true,
        showScore: true,
        maxAttempts: 2,
        timeLimit: true
      },
      participants: [] // 空数组表示所有人都可以参与
    });

    testSessionId = sessionResponse.data.data._id;
    console.log('✅ 考试会话创建成功，ID:', testSessionId);

  } catch (error) {
    console.log('⚠️  考试会话创建失败，使用现有会话继续测试');
    console.log('错误信息:', error.response?.data?.message || error.message);
    
    // 尝试获取现有考试会话
    try {
      const sessionsResponse = await teacherClient.get('/exam-sessions?limit=1');
      if (sessionsResponse.data.data.sessions.length > 0) {
        testSessionId = sessionsResponse.data.data.sessions[0]._id;
        console.log('✅ 使用现有考试会话，ID:', testSessionId);
      }
    } catch (err) {
      console.error('❌ 无法获取考试会话，测试终止');
      return;
    }
  }

  // 3. 测试获取可参与的考试列表
  console.log('\n📋 3. 测试获取可参与的考试列表...');
  try {
    const availableResponse = await studentClient.get('/exam-sessions/available');
    console.log('✅ 获取可参与考试列表成功');
    console.log('可参与的考试数量:', availableResponse.data.data.total);
    
    if (availableResponse.data.data.sessions.length > 0) {
      const firstSession = availableResponse.data.data.sessions[0];
      console.log('第一个可参与的考试:', {
        name: firstSession.name,
        status: firstSession.status,
        userRecord: firstSession.userRecord?.status || '未参与'
      });
    }
  } catch (error) {
    console.error('❌ 获取可参与考试列表失败:', error.response?.data?.message || error.message);
  }

  // 4. 测试获取考试详情（学生视角）
  console.log('\n👁️  4. 测试获取考试详情（学生视角）...');
  try {
    const detailResponse = await studentClient.get(`/exam-sessions/${testSessionId}/student-view`);
    console.log('✅ 获取考试详情成功');
    console.log('考试信息:', {
      name: detailResponse.data.data.name,
      status: detailResponse.data.data.status,
      duration: detailResponse.data.data.duration,
      userRecord: detailResponse.data.data.userRecord?.status || '未参与'
    });
  } catch (error) {
    console.error('❌ 获取考试详情失败:', error.response?.data?.message || error.message);
  }

  // 5. 测试学生加入考试会话
  console.log('\n🎯 5. 测试学生加入考试会话...');
  try {
    const joinResponse = await studentClient.post(`/exam-sessions/${testSessionId}/join`);
    console.log('✅ 学生加入考试成功');
    console.log('考试记录信息:', {
      recordId: joinResponse.data.data.record.id,
      status: joinResponse.data.data.record.status,
      attempts: joinResponse.data.data.record.attempts,
      maxAttempts: joinResponse.data.data.record.maxAttempts,
      totalQuestions: joinResponse.data.data.record.totalQuestions
    });
  } catch (error) {
    console.error('❌ 学生加入考试失败:', error.response?.data?.message || error.message);
    if (error.response?.data?.data) {
      console.log('额外信息:', error.response.data.data);
    }
  }

  // 6. 测试重复加入（应该返回现有记录）
  console.log('\n🔄 6. 测试重复加入考试...');
  try {
    const rejoinResponse = await studentClient.post(`/exam-sessions/${testSessionId}/join`);
    console.log('✅ 重复加入处理正确');
    console.log('返回信息:', rejoinResponse.data.message);
    console.log('考试记录状态:', rejoinResponse.data.data.record.status);
  } catch (error) {
    console.error('❌ 重复加入测试失败:', error.response?.data?.message || error.message);
  }

  // 7. 再次获取可参与考试列表，验证状态更新
  console.log('\n🔍 7. 验证考试状态更新...');
  try {
    const updatedAvailableResponse = await studentClient.get('/exam-sessions/available');
    console.log('✅ 获取更新后的考试列表成功');
    
    const targetSession = updatedAvailableResponse.data.data.sessions.find(
      session => session.id === testSessionId
    );
    
    if (targetSession) {
      console.log('目标考试状态:', {
        name: targetSession.name,
        userRecordStatus: targetSession.userRecord?.status || '无记录'
      });
    }
  } catch (error) {
    console.error('❌ 验证考试状态更新失败:', error.response?.data?.message || error.message);
  }

  // 8. 测试无效会话ID
  console.log('\n❌ 8. 测试无效会话ID处理...');
  try {
    await studentClient.post('/exam-sessions/invalid-id/join');
    console.error('❌ 应该抛出错误但没有抛出');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ 正确处理了无效会话ID');
    } else {
      console.error('❌ 错误处理异常:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n🎉 API测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 测试过程中出现未预期的错误:', error.message);
  });
}

module.exports = { runTests };