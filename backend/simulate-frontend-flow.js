const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function simulateFrontendFlow() {
  console.log('🎯 模拟前端完整流程 - "发大水发大水"考试...\n');
  
  // 发大水发大水考试ID
  const fadashuiExamId = '68e376e35f2886d322130dd2';
  const token = 'mock-token-student';
  
  console.log('考试ID:', fadashuiExamId);
  console.log('考试名称: 发大水发大水');
  console.log('使用的Token:', token);
  console.log('');
  
  try {
    // 步骤1: 加入考试 (join)
    console.log('🚀 步骤1: 加入"发大水发大水"考试...');
    const joinResponse = await axios.post(
      `${BASE_URL}/api/exam-sessions/${fadashuiExamId}/join`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ 加入考试成功!');
    console.log('响应状态:', joinResponse.status);
    console.log('响应数据:', JSON.stringify(joinResponse.data, null, 2));
    console.log('');
    
    // 步骤2: 开始考试 (start)
    console.log('🏁 步骤2: 开始"发大水发大水"考试...');
    const startResponse = await axios.post(
      `${BASE_URL}/api/exam-sessions/${fadashuiExamId}/start`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ 开始考试成功!');
    console.log('响应状态:', startResponse.status);
    console.log('响应数据:', JSON.stringify(startResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ 操作失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
      
      // 分析具体的错误原因
      if (error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;
        console.log('\n🔍 错误分析:');
        
        if (errorMessage.includes('还未加入此考试')) {
          console.log('  原因: ExamRecord不存在，需要先调用join API');
        } else if (errorMessage.includes('已完成此考试')) {
          console.log('  原因: 考试已完成，不能重复开始');
        } else if (errorMessage.includes('时间已到')) {
          console.log('  原因: 考试时间已过期');
        } else if (errorMessage.includes('时间不在考试时间范围内')) {
          console.log('  原因: 当前时间不在考试允许的时间范围内');
        } else {
          console.log('  原因: 其他未知错误 -', errorMessage);
        }
      }
    }
  }
}

simulateFrontendFlow();