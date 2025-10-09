const mongoose = require('mongoose');

async function createExamRecord() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    
    // 获取实际的考试会话
    const examSession = await db.collection('examsessions').findOne({});
    if (!examSession) {
      console.log('❌ 找不到考试会话');
      return;
    }
    
    console.log('✅ 找到考试会话:', examSession.name);
    console.log('会话ID:', examSession._id);
    
    // 创建测试考试记录
    const testUserId = '68e0c8a6b5110614871452d2'; // mock学生用户ID字符串
    
    const newRecord = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(testUserId),
      sessionId: examSession._id,
      status: 'in_progress',
      startTime: new Date(),
      answers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('examrecords').insertOne(newRecord);
    console.log('✅ 创建考试记录成功');
    console.log('记录ID:', newRecord._id);
    console.log('用户ID:', newRecord.userId);
    console.log('会话ID:', newRecord.sessionId);
    console.log('状态:', newRecord.status);

  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createExamRecord();