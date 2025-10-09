// 专门测试"发大水发大水"考试的问题
const axios = require('axios');

async function testFaDaShuiExam() {
  try {
    console.log('🔍 专门检查"发大水发大水"考试问题...\n');
    
    // 1. 获取考试列表，找到"发大水发大水"考试
    const examListResponse = await axios.get('http://localhost:3001/api/exam-sessions/available', {
      headers: { 'Authorization': 'Bearer mock-token-student' }
    });
    
    const examList = examListResponse.data.data.sessions;
    const targetExam = examList.find(exam => exam.name.includes('发大水发大水'));
    
    if (!targetExam) {
      console.log('❌ 未找到"发大水发大水"考试');
      return;
    }
    
    console.log('📋 "发大水发大水"考试基本信息:');
    console.log('   ID:', targetExam.id);
    console.log('   名称:', targetExam.name);
    console.log('   类型:', targetExam.examType);
    console.log('   状态:', targetExam.status);
    console.log('   开始时间:', targetExam.startTime);
    console.log('   结束时间:', targetExam.endTime);
    console.log('   当前时间:', new Date().toISOString());
    console.log('   试卷ID:', targetExam.paper?.id);
    console.log('   试卷标题:', targetExam.paper?.title);
    console.log('   题目数量:', targetExam.paper?.totalQuestions);
    console.log('   用户记录状态:', targetExam.userRecord?.status);
    console.log('   已尝试次数:', targetExam.userRecord?.attempts);
    console.log('   最大尝试次数:', targetExam.userRecord?.maxAttempts);
    
    // 2. 检查试卷详细内容
    if (targetExam.paper?.id) {
      console.log('\n📝 检查试卷详细内容...');
      try {
        const paperResponse = await axios.get(`http://localhost:3001/api/exam-paper/${targetExam.paper.id}`, {
          headers: { 'Authorization': 'Bearer mock-token-admin' }
        });
        
        console.log('✅ 试卷详情获取成功:');
        console.log('   试卷ID:', paperResponse.data.id);
        console.log('   试卷标题:', paperResponse.data.title);
        console.log('   试卷描述:', paperResponse.data.description);
        console.log('   试卷类型:', paperResponse.data.type);
        console.log('   题目数量:', paperResponse.data.questions?.length || 0);
        
        if (paperResponse.data.questions && paperResponse.data.questions.length > 0) {
          console.log('\n📖 试卷题目列表:');
          paperResponse.data.questions.forEach((question, index) => {
            console.log(`   题目 ${index + 1}:`);
            console.log(`     ID: ${question.id}`);
            console.log(`     内容: ${question.content?.substring(0, 100)}...`);
            console.log(`     类型: ${question.type}`);
            console.log(`     分值: ${question.points}`);
          });
        } else {
          console.log('❌ 试卷中没有题目！这就是题目空白的原因！');
        }
        
      } catch (paperError) {
        console.log('❌ 获取试卷详情失败:', paperError.response?.data?.message || paperError.message);
      }
    }
    
    // 3. 检查用户记录状态问题
    console.log('\n🔍 分析用户记录状态问题:');
    if (targetExam.userRecord?.status === 'in_progress') {
      console.log('⚠️  发现问题：考试记录状态为"in_progress"，这可能导致：');
      console.log('   1. 系统认为考试正在进行中');
      console.log('   2. 但可能由于某种原因考试实际已结束');
      console.log('   3. 导致"考试已结束"的错误提示');
      
      // 检查考试记录的详细信息
      try {
        const recordResponse = await axios.get(`http://localhost:3001/api/exam-sessions/${targetExam.id}/student-view`, {
          headers: { 'Authorization': 'Bearer mock-token-student' }
        });
        
        console.log('✅ 考试记录详情:');
        console.log(JSON.stringify(recordResponse.data, null, 2));
        
      } catch (recordError) {
        console.log('❌ 获取考试记录详情失败:', recordError.response?.data?.message || recordError.message);
      }
    }
    
    // 4. 尝试开始考试（模拟多次点击）
    console.log('\n🚀 模拟多次点击开始考试...');
    for (let i = 1; i <= 3; i++) {
      console.log(`\n第 ${i} 次尝试开始考试:`);
      try {
        const startResponse = await axios.post(`http://localhost:3001/api/exam-sessions/${targetExam.id}/start`, {}, {
          headers: { 'Authorization': 'Bearer mock-token-student' }
        });
        
        console.log(`✅ 第 ${i} 次开始考试成功!`);
        console.log('返回数据:', JSON.stringify(startResponse.data, null, 2));
        break; // 成功就退出循环
        
      } catch (startError) {
        console.log(`❌ 第 ${i} 次开始考试失败:`);
        console.log('   错误信息:', startError.response?.data?.message || startError.message);
        console.log('   状态码:', startError.response?.status);
        
        if (i < 3) {
          console.log('   等待1秒后重试...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.response?.data || error.message);
  }
}

// 运行测试
testFaDaShuiExam();