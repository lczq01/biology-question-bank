const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function finalTest() {
  console.log('🎯 最终测试 - 使用正确的考试ID和集合名称...\n');
  
  // 使用数据库中实际存在的24字符ID
  const validExamId = '68e138eddda597c5eaa89a7f';  // 24字符，标准MongoDB ObjectId
  const token = 'mock-token-student';
  
  console.log('考试ID:', validExamId);
  console.log('ID长度:', validExamId.length, '(标准24字符)');
  console.log('使用的Token:', token);
  console.log('');
  
  try {
    // 测试题目API
    console.log('🔍 调用题目API...');
    const response = await axios.get(
      `${BASE_URL}/api/exam-sessions/${validExamId}/questions`,
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
      
      if (questions.length > 0) {
        console.log('\n🎉 成功解决了用户报告的空白题目问题！');
        console.log('现在学生可以正常看到考试题目内容了。');
        
        questions.forEach((q, index) => {
          console.log(`\n题目 ${index + 1}:`);
          console.log('  ID:', q.id);
          console.log('  内容:', q.content.substring(0, 50) + (q.content.length > 50 ? '...' : ''));
          console.log('  类型:', q.type);
          console.log('  分数:', q.points);
          if (q.options && q.options.length > 0) {
            console.log('  选项数量:', q.options.length);
          }
        });
      } else {
        console.log('⚠️  题目数量为0，可能需要检查数据完整性');
      }
    }
    
  } catch (error) {
    console.log('❌ API调用失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
  }
}

finalTest();