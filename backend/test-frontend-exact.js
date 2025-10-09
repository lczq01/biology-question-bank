const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token-student'
  },
});

async function testExactFrontendFlow() {
  const sessionId = '68e376e35f2886d322130dd2';
  
  try {
    console.log('1. 加入考试...');
    const joinResponse = await api.post(`/exam-sessions/${sessionId}/join`);
    console.log('✅ 加入成功:', joinResponse.data);
    
    console.log('\n2. 开始考试...');
    const startResponse = await api.post(`/exam-sessions/${sessionId}/start`);
    console.log('✅ 开始成功:', startResponse.data);
    
  } catch (error) {
    console.error('❌ 错误:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
  }
}

testExactFrontendFlow();