const mongoose = require('mongoose');

async function getValidExamId() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    
    // 查找所有考试会话，获取完整的ObjectId
    const examSessions = await db.collection('examsessions').find({}).toArray();
    
    console.log(`📋 找到 ${examSessions.length} 个考试会话:`);
    
    examSessions.forEach((session, index) => {
      console.log(`\n${index + 1}. 考试会话:`);
      console.log('  完整ID:', session._id.toString());
      console.log('  ID长度:', session._id.toString().length);
      console.log('  名称:', session.name);
      console.log('  状态:', session.status);
    });
    
    if (examSessions.length > 0) {
      const firstValidSession = examSessions[0];
      console.log('\n🎯 使用第一个会话进行测试:');
      console.log('  ID:', firstValidSession._id.toString());
      console.log('  名称:', firstValidSession.name);
      
      // 测试这个ID是否有效
      const testId = firstValidSession._id.toString();
      console.log('  ObjectId验证:', mongoose.Types.ObjectId.isValid(testId));
      
      return firstValidSession._id.toString();
    }

  } catch (error) {
    console.error('❌ 获取失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// 运行并导出结果
getValidExamId().then(examId => {
  if (examId) {
    console.log('\n✅ 有效的考试ID:', examId);
  }
});