const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testCorrectExamId() {
  console.log('🔍 使用正确的考试ID测试题目API...\n');
  
  // 使用数据库中实际存在的第一个会话ID
  const correctExamId = '68e0b5492c3112379f677ab96';
  const token = 'mock-token-student';
  
  console.log('考试ID:', correctExamId);
  console.log('使用的Token:', token);
  console.log('');
  
  try {
    // 测试题目API
    const response = await axios.get(
      `${BASE_URL}/api/exam-sessions/${correctExamId}/questions`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API调用成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.questions) {
      const questions = response.data.data.questions;
      console.log('\n📝 题目详情:');
      console.log('题目数量:', questions.length);
      
      questions.forEach((q, index) => {
        console.log(`\n题目 ${index + 1}:`);
        console.log('  ID:', q.id);
        console.log('  内容:', q.content);
        console.log('  类型:', q.type);
        console.log('  分数:', q.points);
        if (q.options && q.options.length > 0) {
          console.log('  选项:', q.options);
        }
      });
    }
    
  } catch (error) {
    console.log('❌ API调用失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
  }
}

testCorrectExamId();