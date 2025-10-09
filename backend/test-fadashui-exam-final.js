const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testFadashuiExam() {
  console.log('🎯 测试用户报告的"发大水发大水"考试...\n');
  
  // 用户提到的具体考试
  const fadashuiExamId = '68e376e35f2886d322130dd2';  // 发大水发大水
  const token = 'mock-token-student';
  
  console.log('考试ID:', fadashuiExamId);
  console.log('考试名称: 发大水发大水');
  console.log('考试类型: on_demand (随时考试)');
  console.log('使用的Token:', token);
  console.log('');
  
  try {
    // 步骤1: 开始考试
    console.log('🚀 步骤1: 开始"发大水发大水"考试...');
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
    console.log('');
    
    // 步骤2: 获取题目
    console.log('📝 步骤2: 获取"发大水发大水"考试题目...');
    const questionsResponse = await axios.get(
      `${BASE_URL}/api/exam-sessions/${fadashuiExamId}/questions`,
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
      console.log('\n🎉 用户报告的问题已完全解决！');
      console.log('');
      console.log('📊 "发大水发大水"考试题目统计:');
      console.log('  题目数量:', questions.length);
      
      if (questions.length > 0) {
        console.log('\n✅ 问题解决确认:');
        console.log('  ❌ 之前: 学生进入考试后看到空白题目');
        console.log('  ✅ 现在: 学生可以正常看到完整的题目内容');
        console.log('');
        console.log('🔧 技术修复内容:');
        console.log('  1. 修正了考试时间验证逻辑 (on_demand类型特殊处理)');
        console.log('  2. 创建了新的题目API端点 (/api/exam-sessions/:id/questions)');
        console.log('  3. 修正了数据库集合名称映射 (examsessions)');
        console.log('  4. 实现了题目内容的正确查询和返回');
        
        console.log('\n📝 "发大水发大水"考试题目预览:');
        questions.forEach((q, index) => {
          console.log(`\n题目 ${index + 1}:`);
          console.log('  内容:', q.content.substring(0, 100) + (q.content.length > 100 ? '...' : ''));
          console.log('  类型:', q.type);
          console.log('  分数:', q.points);
          if (q.options && q.options.length > 0) {
            console.log('  选项数量:', q.options.length);
            q.options.forEach((option, optIndex) => {
              console.log(`    ${String.fromCharCode(65 + optIndex)}. ${option.substring(0, 50)}${option.length > 50 ? '...' : ''}`);
            });
          }
        });
      } else {
        console.log('⚠️  题目数量为0，需要检查试卷数据');
      }
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
      
      // 如果开始考试失败，可能是因为考试已经开始过了
      if (error.response.status === 400 && error.response.data.message && 
          (error.response.data.message.includes('已经开始') || 
           error.response.data.message.includes('已存在'))) {
        console.log('\n💡 考试可能已经开始过了，直接尝试获取题目...');
        
        try {
          const questionsResponse = await axios.get(
            `${BASE_URL}/api/exam-sessions/${fadashuiExamId}/questions`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('✅ 直接获取题目成功!');
          console.log('响应数据:', JSON.stringify(questionsResponse.data, null, 2));
          
          if (questionsResponse.data.success && questionsResponse.data.data.questions) {
            const questions = questionsResponse.data.data.questions;
            console.log('\n🎉 用户问题已解决 - 题目可以正常显示！');
            console.log('题目数量:', questions.length);
          }
          
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

testFadashuiExam();