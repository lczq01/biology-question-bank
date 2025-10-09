const axios = require('axios');
const mongoose = require('mongoose');

async function testWithCorrectId() {
  try {
    // 先连接数据库获取正确的ID
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    const examSession = await db.collection('examsessions').findOne({});
    
    if (!examSession) {
      console.log('❌ 没有找到任何考试会话');
      return;
    }

    console.log('✅ 找到考试会话:');
    console.log('考试ID:', examSession._id.toString());
    console.log('考试名称:', examSession.name);

    await mongoose.disconnect();

    // 使用服务器日志中显示的实际存在的会话ID（确保是24字符）
    const examId = examSession._id.toString(); // 使用从数据库查询到的实际ID
    const mockStudentToken = 'mock-token-student';
    
    console.log('\n🔍 测试题目API...');
    console.log('使用的考试ID:', examId);
    
    const response = await axios.get(`http://localhost:3001/api/exam-sessions/${examId}/questions`, {
      headers: {
        'Authorization': `Bearer ${mockStudentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API调用成功!');
    console.log('题目数量:', response.data.data.questions.length);
    
    // 显示前2个题目的详细信息
    response.data.data.questions.slice(0, 2).forEach((question, index) => {
      console.log(`\n题目 ${index + 1}:`);
      console.log('  ID:', question.id);
      console.log('  内容:', question.content);
      console.log('  类型:', question.type);
      console.log('  选项数量:', question.options.length);
      console.log('  分值:', question.points);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWithCorrectId();