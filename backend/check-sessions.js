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

async function checkSessions() {
  try {
    console.log('🔍 检查现有考试会话...');
    
    // 获取所有考试会话
    const response = await api.get('/exam-sessions?limit=100');
    
    if (response.data.success && response.data.data.sessions) {
      const sessions = response.data.data.sessions;
      console.log(`\n📋 找到 ${sessions.length} 个考试会话:`);
      
      sessions.forEach((session, index) => {
        console.log(`\n${index + 1}. ${session.name}`);
        console.log(`   ID: ${session._id}`);
        console.log(`   状态: ${session.status}`);
        console.log(`   开始时间: ${session.startTime}`);
        console.log(`   结束时间: ${session.endTime}`);
        console.log(`   创建者: ${session.creatorId?.username || session.creatorId?._id || session.creatorId}`);
        
        // 检查是否是active或published状态
        if (['active', 'published'].includes(session.status)) {
          console.log(`   ⚠️  这是一个活跃的考试会话！`);
        }
      });
      
      // 显示当前时间
      console.log(`\n⏰ 当前时间: ${new Date().toISOString()}`);
      
    } else {
      console.log('❌ 获取考试会话失败:', response.data.message);
    }
    
  } catch (error) {
    console.log('❌ 检查过程中发生错误:', error.response?.data?.message || error.message);
  }
}

// 运行检查
checkSessions().catch(console.error);