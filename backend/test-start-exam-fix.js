// 测试修复后的开始考试功能
const axios = require('axios');

async function testStartExamFix() {
  try {
    console.log('🧪 测试修复后的开始考试功能...\n');
    
    // 1. 获取可参加的考试列表
    console.log('1️⃣ 获取学生可参加的考试列表...');
    const examListResponse = await axios.get('http://localhost:3001/api/exam-sessions/available', {
      headers: { 'Authorization': 'Bearer mock-token-student' }
    });
    
    console.log('📋 API返回数据结构:', JSON.stringify(examListResponse.data, null, 2));
    
    // 检查数据结构
    let examList;
    if (Array.isArray(examListResponse.data)) {
      examList = examListResponse.data;
    } else if (examListResponse.data.data && examListResponse.data.data.sessions && Array.isArray(examListResponse.data.data.sessions)) {
      examList = examListResponse.data.data.sessions;
    } else if (examListResponse.data.examSessions && Array.isArray(examListResponse.data.examSessions)) {
      examList = examListResponse.data.examSessions;
    } else if (examListResponse.data.data && Array.isArray(examListResponse.data.data)) {
      examList = examListResponse.data.data;
    } else {
      console.log('❌ 无法识别的数据结构');
      return;
    }
    
    console.log(`✅ 获取到 ${examList.length} 个可参加的考试`);
    
    if (examList.length === 0) {
      console.log('❌ 没有可参加的考试');
      return;
    }
    
    // 2. 选择一个随时考试类型的考试进行测试
    const onDemandExams = examList.filter(exam => exam.examType === 'on_demand');
    
    if (onDemandExams.length === 0) {
      console.log('❌ 没有找到随时考试类型的考试');
      return;
    }
    
    const testExam = onDemandExams[0];
    console.log(`\n2️⃣ 选择考试进行测试:`);
    console.log(`   考试名称: ${testExam.name}`);
    console.log(`   考试类型: ${testExam.examType}`);
    console.log(`   考试状态: ${testExam.status}`);
    console.log(`   试卷: ${testExam.paper?.title || '未知'}`);
    
    // 3. 尝试开始考试
    console.log(`\n3️⃣ 尝试开始考试 (ID: ${testExam.id})...`);
    
    try {
      const startExamResponse = await axios.post(
        `http://localhost:3001/api/exam-sessions/${testExam.id}/start`,
        {},
        {
          headers: { 'Authorization': 'Bearer mock-token-student' }
        }
      );
      
      console.log('✅ 开始考试成功!');
      console.log('📋 返回数据:', JSON.stringify(startExamResponse.data, null, 2));
      
      if (startExamResponse.data.examRecord) {
        console.log('📋 考试记录信息:');
        console.log(`   记录ID: ${startExamResponse.data.examRecord.id}`);
        console.log(`   开始时间: ${startExamResponse.data.examRecord.startTime}`);
        console.log(`   结束时间: ${startExamResponse.data.examRecord.endTime}`);
        console.log(`   状态: ${startExamResponse.data.examRecord.status}`);
      }
      
      // 4. 获取考试题目
      console.log(`\n4️⃣ 获取考试题目...`);
      const questionsResponse = await axios.get(
        `http://localhost:3001/api/exam-sessions/${testExam.id}/questions`,
        {
          headers: { 'Authorization': 'Bearer mock-token-student' }
        }
      );
      
      console.log(`✅ 获取到 ${questionsResponse.data.questions.length} 道题目`);
      questionsResponse.data.questions.forEach((q, index) => {
        console.log(`   题目 ${index + 1}: ${q.content.substring(0, 50)}...`);
      });
      
    } catch (startError) {
      console.log('❌ 开始考试失败:');
      console.log(`   错误信息: ${startError.response?.data?.message || startError.message}`);
      console.log(`   状态码: ${startError.response?.status}`);
      
      // 如果是时间相关错误，显示详细的时间信息
      if (startError.response?.data?.message?.includes('时间')) {
        console.log('\n🕐 考试时间信息:');
        console.log(`   当前时间: ${new Date().toISOString()}`);
        console.log(`   考试开始时间: ${testExam.startTime}`);
        console.log(`   考试结束时间: ${testExam.endTime}`);
        if (testExam.availableFrom) {
          console.log(`   可用开始时间: ${testExam.availableFrom}`);
        }
        if (testExam.availableUntil) {
          console.log(`   可用结束时间: ${testExam.availableUntil}`);
        }
      }
    }
    
    // 5. 测试其他类型的考试
    const scheduledExams = examList.filter(exam => exam.examType === 'scheduled');
    if (scheduledExams.length > 0) {
      console.log(`\n5️⃣ 测试定时考试类型...`);
      const scheduledExam = scheduledExams[0];
      console.log(`   考试名称: ${scheduledExam.name}`);
      console.log(`   考试类型: ${scheduledExam.examType}`);
      
      try {
        const startScheduledResponse = await axios.post(
          `http://localhost:3001/api/exam-sessions/${scheduledExam.id}/start`,
          {},
          {
            headers: { 'Authorization': 'Bearer mock-token-student' }
          }
        );
        console.log('✅ 定时考试开始成功!');
      } catch (scheduledError) {
        console.log('❌ 定时考试开始失败:');
        console.log(`   错误信息: ${scheduledError.response?.data?.message || scheduledError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

// 运行测试
testStartExamFix();