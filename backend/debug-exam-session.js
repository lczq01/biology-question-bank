const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token-admin'
  }
});

async function debugExamSession() {
  try {
    console.log('🔍 调试考试会话状态...');
    
    // 1. 创建试卷
    console.log('1. 创建测试试卷...');
    const paperData = {
      title: '调试测试试卷',
      description: '用于调试的测试试卷',
      type: 'manual',
      config: {
        totalQuestions: 1,
        totalPoints: 100,
        timeLimit: 60
      },
      questions: [
        {
          questionId: '507f1f77bcf86cd799439012',
          order: 1,
          points: 100
        }
      ]
    };

    const paperResponse = await api.post('/exam-paper/create', paperData);
    if (!paperResponse.data.success) {
      console.log('❌ 试卷创建失败:', paperResponse.data.message);
      return;
    }
    
    const paperId = paperResponse.data.data._id || paperResponse.data.data.id;
    console.log('✅ 试卷创建成功，ID:', paperId);

    // 2. 创建考试会话
    console.log('2. 创建考试会话...');
    const now = new Date();
    const startTime = new Date(now.getTime() + 5000); // 5秒后开始
    const endTime = new Date(now.getTime() + 3600000); // 1小时后结束

    const sessionData = {
      name: '调试考试会话',
      description: '用于调试的考试会话',
      paperId: paperId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 60,
      status: 'active', // 明确设置为active
      settings: {
        allowReview: true,
        showScore: true,
        allowRetake: false
      }
    };

    console.log('发送的会话数据:', JSON.stringify(sessionData, null, 2));

    const sessionResponse = await api.post('/exam-sessions', sessionData);
    if (!sessionResponse.data.success) {
      console.log('❌ 考试会话创建失败:', sessionResponse.data.message);
      return;
    }

    const sessionId = sessionResponse.data.data._id;
    console.log('✅ 考试会话创建成功，ID:', sessionId);

    // 3. 查询考试会话详情
    console.log('3. 查询考试会话详情...');
    const detailResponse = await api.get(`/exam-sessions/${sessionId}`);
    if (detailResponse.data.success) {
      const session = detailResponse.data.data;
      console.log('📋 考试会话详情:');
      console.log('  - ID:', session._id);
      console.log('  - 名称:', session.name);
      console.log('  - 状态:', session.status);
      console.log('  - 开始时间:', session.startTime);
      console.log('  - 结束时间:', session.endTime);
      console.log('  - 当前时间:', new Date().toISOString());
      
      // 检查时间逻辑
      const currentTime = new Date();
      const sessionStartTime = new Date(session.startTime);
      const sessionEndTime = new Date(session.endTime);
      
      console.log('⏰ 时间检查:');
      console.log('  - 当前时间 >= 开始时间:', currentTime >= sessionStartTime);
      console.log('  - 当前时间 <= 结束时间:', currentTime <= sessionEndTime);
      console.log('  - 状态是否为published或active:', ['published', 'active'].includes(session.status));
    } else {
      console.log('❌ 查询考试会话详情失败:', detailResponse.data.message);
    }

    // 4. 等待开始时间后再次检查
    console.log('4. 等待6秒后再次检查...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const detailResponse2 = await api.get(`/exam-sessions/${sessionId}`);
    if (detailResponse2.data.success) {
      const session = detailResponse2.data.data;
      console.log('📋 6秒后的考试会话状态:');
      console.log('  - 状态:', session.status);
      console.log('  - 当前时间:', new Date().toISOString());
      
      // 再次检查时间逻辑
      const currentTime = new Date();
      const sessionStartTime = new Date(session.startTime);
      const sessionEndTime = new Date(session.endTime);
      
      console.log('⏰ 时间检查:');
      console.log('  - 当前时间 >= 开始时间:', currentTime >= sessionStartTime);
      console.log('  - 当前时间 <= 结束时间:', currentTime <= sessionEndTime);
      console.log('  - 状态是否为published或active:', ['published', 'active'].includes(session.status));
    }

    // 5. 尝试加入考试
    console.log('5. 尝试加入考试...');
    try {
      const joinResponse = await api.post(`/exam-sessions/${sessionId}/join`);
      if (joinResponse.data.success) {
        console.log('✅ 成功加入考试会话');
      } else {
        console.log('❌ 加入考试会话失败:', joinResponse.data.message);
      }
    } catch (error) {
      console.log('❌ 加入考试会话异常:', error.response?.data?.message || error.message);
    }

    // 6. 清理数据
    console.log('6. 清理测试数据...');
    await api.delete(`/exam-sessions/${sessionId}`);
    await api.delete(`/exam-paper/${paperId}`);
    console.log('✅ 清理完成');

  } catch (error) {
    console.log('❌ 调试过程中发生错误:', error.response?.data?.message || error.message);
  }
}

// 运行调试
debugExamSession().catch(console.error);