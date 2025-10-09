const axios = require('axios');

// 使用mock认证中间件的学生token
const mockStudentToken = 'mock-token-student';

async function testQuestionsAPI() {
  try {
    console.log('🧪 测试新的题目API...\n');
    
    // 1. 首先获取可用的考试列表
    console.log('1. 获取可用考试列表...');
    const availableResponse = await axios.get('http://localhost:3001/api/exam-sessions/available', {
      headers: {
        'Authorization': `Bearer ${mockStudentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 获取可用考试成功!');
    console.log('返回数据结构:', JSON.stringify(availableResponse.data, null, 2));
    
    // 获取考试列表
    const examList = availableResponse.data.data.sessions;
    console.log('可用考试数量:', examList.length);
    
    // 找到"发大水发大水"考试
    const fadaShuiExam = examList.find(exam => 
      exam.name?.includes('发大水') || exam.description?.includes('发大水')
    );
    
    if (!fadaShuiExam) {
      console.log('❌ 未找到"发大水发大水"考试');
      console.log('可用考试列表:');
      examList.forEach((exam, index) => {
        console.log(`${index + 1}. ${exam.name} (ID: ${exam.id})`);
      });
      return;
    }
    
    console.log('✅ 找到目标考试:', fadaShuiExam.name);
    console.log('考试ID:', fadaShuiExam.id);
    console.log('考试类型:', fadaShuiExam.examType);
    console.log('');
    
    // 2. 测试获取题目内容
    console.log('2. 获取考试题目内容...');
    const questionsResponse = await axios.get(`http://localhost:3001/api/exam-sessions/${fadaShuiExam.id}/questions`, {
      headers: {
        'Authorization': `Bearer ${mockStudentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 题目API请求成功!');
    console.log('返回数据结构:', {
      success: questionsResponse.data.success,
      questionsCount: questionsResponse.data.data?.questions?.length || 0,
      paperInfo: questionsResponse.data.data?.paperInfo || null
    });
    
    if (questionsResponse.data.data?.questions) {
      console.log('\n📝 题目详情:');
      questionsResponse.data.data.questions.forEach((question, index) => {
        console.log(`\n题目 ${index + 1}:`);
        console.log('ID:', question.id);
        console.log('内容:', question.content?.replace(/<[^>]*>/g, '') || '无内容'); // 去除HTML标签显示
        console.log('类型:', question.type);
        console.log('分值:', question.points);
        console.log('选项数量:', question.options?.length || 0);
        
        if (question.options && question.options.length > 0) {
          console.log('选项:');
          question.options.forEach(option => {
            console.log(`  ${option.id}: ${option.text}`);
          });
        }
      });
      
      console.log('\n📊 试卷信息:');
      const paperInfo = questionsResponse.data.data.paperInfo;
      if (paperInfo) {
        console.log('试卷标题:', paperInfo.title);
        console.log('试卷描述:', paperInfo.description || '无描述');
        console.log('题目总数:', paperInfo.totalQuestions);
        console.log('总分:', paperInfo.totalPoints);
      }
    } else {
      console.log('❌ 未获取到题目内容');
    }
    
    console.log('\n✅ 测试完成! "发大水发大水"考试的题目内容现在应该能够正常显示了。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testQuestionsAPI();