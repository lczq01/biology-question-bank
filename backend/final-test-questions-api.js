const axios = require('axios');

async function finalTestQuestionsAPI() {
  try {
    console.log('🔍 最终测试题目API...\n');
    
    // 使用确认有效的考试ID
    const examId = '68e3b78487814dee6872774e';
    const mockStudentToken = 'mock-token-student';
    
    console.log('考试ID:', examId);
    console.log('使用的Token:', mockStudentToken);
    console.log('');
    
    // 调用题目API
    const response = await axios.get(`http://localhost:3001/api/exam-sessions/${examId}/questions`, {
      headers: {
        'Authorization': `Bearer ${mockStudentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API调用成功!');
    console.log('响应状态:', response.status);
    
    const data = response.data;
    console.log('\n📊 考试信息:');
    console.log('考试名称:', data.data?.sessionInfo?.name);
    console.log('考试时长:', data.data?.sessionInfo?.duration, '分钟');
    console.log('剩余时间:', data.data?.sessionInfo?.remainingMinutes, '分钟');
    
    console.log('\n📄 试卷信息:');
    console.log('试卷标题:', data.data?.paperInfo?.title);
    console.log('总题目数:', data.data?.paperInfo?.totalQuestions);
    console.log('总分:', data.data?.paperInfo?.totalPoints);
    
    console.log('\n📝 题目详情:');
    const questions = data.data?.questions || [];
    questions.forEach((question, index) => {
      console.log(`\n题目 ${index + 1}:`);
      console.log('  ID:', question.id);
      console.log('  内容:', question.content ? question.content.substring(0, 100) + '...' : '无内容');
      console.log('  类型:', question.type);
      console.log('  选项数量:', question.options ? question.options.length : 0);
      console.log('  分值:', question.points);
      console.log('  难度:', question.difficulty);
      console.log('  章节:', question.chapter);
      
      if (question.options && question.options.length > 0) {
        console.log('  选项:');
        question.options.forEach((option, idx) => {
          console.log(`    ${String.fromCharCode(65 + idx)}. ${option.text}`);
        });
      }
    });
    
    console.log('\n📈 考试进度:');
    console.log('当前题目索引:', data.data?.examProgress?.currentQuestionIndex);
    console.log('已答题数:', data.data?.examProgress?.answeredCount);
    console.log('总题目数:', data.data?.examProgress?.totalQuestions);
    
    // 检查是否解决了空白题目问题
    const hasValidQuestions = questions.some(q => q.content && q.content !== '题目数据缺失' && q.content.trim() !== '');
    console.log('\n🎯 问题解决状态:');
    console.log('是否有有效题目内容:', hasValidQuestions ? '✅ 是' : '❌ 否');
    console.log('空白题目问题已解决:', hasValidQuestions ? '✅ 是' : '❌ 否');
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

finalTestQuestionsAPI();