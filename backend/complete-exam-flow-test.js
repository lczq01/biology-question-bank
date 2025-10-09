const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function completeExamFlowTest() {
  console.log('🎯 完整考试流程测试 - 开始考试然后获取题目...\n');
  
  // 使用数据库中实际存在的24字符ID
  const validExamId = '68e138eddda597c5eaa89a7f';  // 调试考试会话
  const token = 'mock-token-student';
  
  console.log('考试ID:', validExamId);
  console.log('使用的Token:', token);
  console.log('');
  
  try {
    // 步骤1: 开始考试
    console.log('🚀 步骤1: 开始考试...');
    const startResponse = await axios.post(
      `${BASE_URL}/api/exam-sessions/${validExamId}/start`,
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
    console.log('');
    
    // 步骤2: 获取题目
    console.log('📝 步骤2: 获取考试题目...');
    const questionsResponse = await axios.get(
      `${BASE_URL}/api/exam-sessions/${validExamId}/questions`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ 获取题目成功!');
    console.log('响应状态:', questionsResponse.status);
    console.log('响应数据:', JSON.stringify(questionsResponse.data, null, 2));
    
    if (questionsResponse.data.success && questionsResponse.data.data.questions) {
      const questions = questionsResponse.data.data.questions;
      console.log('\n🎉 完整流程测试成功！');
      console.log('📊 题目统计:');
      console.log('  题目数量:', questions.length);
      
      if (questions.length > 0) {
        console.log('\n✅ 成功解决了用户报告的空白题目问题！');
        console.log('现在学生可以：');
        console.log('  1. 正常开始考试');
        console.log('  2. 看到完整的题目内容');
        console.log('  3. 进行正常的考试答题');
        
        console.log('\n📝 题目预览:');
        questions.forEach((q, index) => {
          console.log(`\n题目 ${index + 1}:`);
          console.log('  内容:', q.content.substring(0, 80) + (q.content.length > 80 ? '...' : ''));
          console.log('  类型:', q.type);
          console.log('  分数:', q.points);
          if (q.options && q.options.length > 0) {
            console.log('  选项数量:', q.options.length);
          }
        });
      } else {
        console.log('⚠️  题目数量为0');
      }
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
      
      // 如果开始考试失败，可能是因为考试已经开始过了
      if (error.response.status === 400 && error.response.data.message && 
          error.response.data.message.includes('已经开始')) {
        console.log('\n💡 考试可能已经开始过了，直接尝试获取题目...');
        
        try {
          const questionsResponse = await axios.get(
            `${BASE_URL}/api/exam-sessions/${validExamId}/questions`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('✅ 直接获取题目成功!');
          console.log('响应数据:', JSON.stringify(questionsResponse.data, null, 2));
          
        } catch (questionsError) {
          console.log('❌ 获取题目也失败:', questionsError.message);
          if (questionsError.response) {
            console.log('题目API响应:', questionsError.response.data);
          }
        }
      }
    }
  }
}

completeExamFlowTest();