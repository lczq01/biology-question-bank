const mongoose = require('mongoose');

async function checkExamRecords() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    
    // 查找考试记录
    const examRecords = await db.collection('examrecords').find({}).toArray();
    console.log(`📋 找到 ${examRecords.length} 条考试记录:`);
    
    if (examRecords.length > 0) {
      examRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. 考试记录:`);
        console.log('  记录ID:', record._id);
        console.log('  用户ID:', record.userId);
        console.log('  会话ID:', record.sessionId);
        console.log('  状态:', record.status);
        console.log('  开始时间:', record.startTime);
      });
    } else {
      console.log('❌ 没有找到任何考试记录');
      
      // 创建一个测试考试记录
      console.log('\n🔧 创建测试考试记录...');
      const testUserId = new mongoose.Types.ObjectId('68e0c8a6b5110614871452d2'); // mock学生用户ID
      const sessionId = new mongoose.Types.ObjectId('68e3b784487814dee6872774e'); // 考试会话ID
      
      const newRecord = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        sessionId: sessionId,
        status: 'in_progress',
        startTime: new Date(),
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('examrecords').insertOne(newRecord);
      console.log('✅ 创建考试记录成功:', newRecord._id);
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkExamRecords();