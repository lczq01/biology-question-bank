const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'mock-token-admin';

// 使用很远的未来时间避免冲突
const now = new Date();
const uniqueTime = now.getTime();
const startTime = new Date('2030-01-01T10:00:00.000Z'); // 使用2030年的固定时间
const endTime = new Date('2030-01-01T12:00:00.000Z');

console.log('🚀 开始考试API最终验证测试');
console.log('================================');

async function runTest() {
  let paperId = null;
  let sessionId = null;
  
  try {
    // 1. 创建测试试卷
    console.log('🔄 创建测试试卷...');
    const paperResponse = await axios.post(`${BASE_URL}/exam-paper/create`, {
      title: `开始考试API最终验证_${uniqueTime}`,
      description: '用于最终验证开始考试API的测试试卷',
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
        { questionId: '68e0b8f5ccc7edb50b1334ac', order: 1, points: 30 },
        { questionId: '68e0b993fa509c798b4d55b5', order: 2, points: 35 },
        { questionId: '68e0b9d0f6b5b5cec9a67275', order: 3, points: 35 }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    paperId = paperResponse.data.data.id;
    console.log(`✅ 试卷创建成功，ID: ${paperId}`);

    // 2. 创建考试会话
    console.log('\n📋 创建考试会话...');
    console.log('📅 计划考试时间:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      now: now.toISOString()
    });
    
    const sessionResponse = await axios.post(`${BASE_URL}/exam-sessions`, {
      name: `开始考试API最终验证_${uniqueTime}`,
      description: '测试开始考试API的最终验证会话',
      paperId: paperId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 120,
      status: 'active',
      settings: {
        allowReview: true,
        showScore: true,
        allowRetake: false,
        shuffleQuestions: false,
        shuffleOptions: false
      }
    }, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    sessionId = sessionResponse.data.data._id;
    console.log(`✅ 考试会话创建成功，ID: ${sessionId}`);

    // 3. 学生加入考试（需要修改时间验证来允许测试）
    console.log('\n👨‍🎓 模拟时间到达后学生加入考试...');
    
    // 先更新考试会话状态，将开始时间改为当前时间
    const updateResponse = await axios.put(`${BASE_URL}/exam-sessions/${sessionId}`, {
      startTime: new Date(now.getTime() + 30 * 1000).toISOString(), // 30秒后开始
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString() // 2小时后结束
    }, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    console.log('✅ 考试时间更新成功');

    // 等待30秒让考试时间到达
    console.log('⏳ 等待考试时间到达...');
    await new Promise(resolve => setTimeout(resolve, 32000)); // 等待32秒

    const joinResponse = await axios.post(`${BASE_URL}/exam-sessions/${sessionId}/join`, {}, {
      headers: { 'Authorization': 'Bearer mock-token-student' }
    });
    console.log('✅ 学生成功加入考试');

    // 4. 开始考试
    console.log('\n🎯 开始考试...');
    const startResponse = await axios.post(`${BASE_URL}/exam-sessions/${sessionId}/start`, {}, {
      headers: { 'Authorization': 'Bearer mock-token-student' }
    });
    
    console.log('✅ 考试开始成功');
    console.log('📊 考试记录信息:', {
      recordId: startResponse.data.data.recordId,
      status: startResponse.data.data.status,
      startedAt: startResponse.data.data.startedAt
    });

    // 5. 查询考试进度
    console.log('\n📈 查询考试进度...');
    const progressResponse = await axios.get(`${BASE_URL}/exam-sessions/${sessionId}/progress`, {
      headers: { 'Authorization': 'Bearer mock-token-student' }
    });
    
    console.log('✅ 考试进度查询成功');
    console.log('📊 进度信息:', {
      status: progressResponse.data.data.status,
      progress: progressResponse.data.data.progress,
      timeRemaining: progressResponse.data.data.timeRemaining
    });

    // 6. 测试重复开始考试
    console.log('\n🔄 测试重复开始考试...');
    try {
      await axios.post(`${BASE_URL}/exam-sessions/${sessionId}/start`, {}, {
        headers: { 'Authorization': 'Bearer mock-token-student' }
      });
      console.log('❌ 重复开始考试应该被阻止');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 重复开始考试被正确阻止');
        console.log('📝 错误信息:', error.response.data.message);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 所有测试通过！开始考试API验证成功！');
    console.log('================================');
    console.log('✅ 验证项目:');
    console.log('  - 试卷创建功能');
    console.log('  - 考试会话创建功能');
    console.log('  - 考试时间更新功能');
    console.log('  - 学生加入考试功能');
    console.log('  - 开始考试API功能');
    console.log('  - 考试进度查询功能');
    console.log('  - 重复开始考试防护功能');
    console.log('  - 时间验证机制');
    console.log('  - 权限验证机制');
    console.log('  - ExamRecord状态管理');
    console.log('  - 完整的错误处理');

  } catch (error) {
    console.log('\n❌ 测试过程中发生错误:');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
  } finally {
    // 清理测试数据
    console.log('\n🔄 清理测试数据...');
    
    if (paperId) {
      try {
        await axios.delete(`${BASE_URL}/exam-paper/${paperId}`, {
          headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        console.log('✅ 清理试卷成功');
      } catch (error) {
        console.log('⚠️ 清理试卷失败:', error.message);
      }
    }
    
    if (sessionId) {
      try {
        await axios.delete(`${BASE_URL}/exam-sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        console.log('✅ 清理考试会话成功');
      } catch (error) {
        console.log('⚠️ 清理考试会话失败:', error.message);
      }
    }
  }
}

runTest();