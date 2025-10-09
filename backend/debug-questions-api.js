const axios = require('axios');

async function debugQuestionsAPI() {
  try {
    console.log('🔍 调试题目API...\n');
    
    const examId = '68e3b784487814dee6872774e'; // "测试考试会话"的ID
    const mockStudentToken = 'mock-token-student';
    
    console.log('考试ID:', examId);
    console.log('使用的Token:', mockStudentToken);
    console.log('');
    
    // 直接调用题目API
    const response = await axios.get(`http://localhost:3001/api/exam-sessions/${examId}/questions`, {
      headers: {
        'Authorization': `Bearer ${mockStudentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API调用成功!');
    console.log('完整响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugQuestionsAPI();