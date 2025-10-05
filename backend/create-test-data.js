const mongoose = require('mongoose');

// 连接数据库
async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank');
    console.log('📊 开始创建测试数据...');

    // 获取现有数据
    const examSessions = await mongoose.connection.db.collection('examsessions').find({}).toArray();
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log(`找到 ${examSessions.length} 个考试会话`);
    console.log(`找到 ${users.length} 个用户`);

    // 创建测试考试记录
    const examRecords = [];
    
    if (examSessions.length > 0 && users.length > 0) {
      // 为每个考试会话创建一些考试记录
      for (let i = 0; i < Math.min(3, examSessions.length); i++) {
        const session = examSessions[i];
        
        for (let j = 0; j < users.length; j++) {
          const user = users[j];
          
          // 创建不同状态的考试记录
          const statuses = ['not_started', 'in_progress', 'completed'];
          const status = statuses[j % statuses.length];
          
          const examRecord = {
            _id: new mongoose.Types.ObjectId(),
            examSessionId: new mongoose.Types.ObjectId(session._id),
            userId: new mongoose.Types.ObjectId(user._id),
            status: status,
            startTime: status !== 'not_started' ? new Date(Date.now() - Math.random() * 86400000) : null,
            endTime: status === 'completed' ? new Date(Date.now() - Math.random() * 3600000) : null,
            answers: status !== 'not_started' ? [
              {
                questionId: new mongoose.Types.ObjectId(),
                answer: status === 'completed' ? 'A' : null, 
                isCorrect: status === 'completed' ? Math.random() > 0.5 : null,
                timeSpent: status === 'completed' ? Math.floor(Math.random() * 120) + 30 : null
              }
            ] : [],
            score: status === 'completed' ? Math.floor(Math.random() * 40) + 60 : null,
            totalQuestions: 20,
            correctAnswers: status === 'completed' ? Math.floor(Math.random() * 15) + 10 : null,
            attemptCount: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          examRecords.push(examRecord);
        }
      }
      
      // 插入考试记录
      if (examRecords.length > 0) {
        await mongoose.connection.db.collection('examrecords').insertMany(examRecords);
        console.log(`✅ 创建了 ${examRecords.length} 条考试记录`);
      }
    }

    // 更新考试会话状态
    const now = new Date();
    const pastTime = new Date(now.getTime() - 3600000); // 1小时前
    const futureTime = new Date(now.getTime() + 3600000); // 1小时后
    
    // 设置一些考试会话为不同状态
    if (examSessions.length >= 3) {
      // 设置第一个为进行中
      await mongoose.connection.db.collection('examsessions').updateOne(
        { _id: examSessions[0]._id },
        { 
          $set: { 
            status: 'active',
            startTime: pastTime,
            endTime: futureTime
          }
        }
      );
      
      // 设置第二个为即将开始
      await mongoose.connection.db.collection('examsessions').updateOne(
        { _id: examSessions[1]._id },
        { 
          $set: { 
            status: 'scheduled',
            startTime: new Date(now.getTime() + 1800000), // 30分钟后
            endTime: new Date(now.getTime() + 5400000)    // 1.5小时后
          }
        }
      );
      
      // 设置第三个为已结束
      await mongoose.connection.db.collection('examsessions').updateOne(
        { _id: examSessions[2]._id },
        { 
          $set: { 
            status: 'ended',
            startTime: new Date(now.getTime() - 7200000), // 2小时前
            endTime: new Date(now.getTime() - 3600000)    // 1小时前
          }
        }
      );
      
      console.log('✅ 更新了考试会话状态');
    }

    // 显示最终统计
    const finalStats = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 更新后的数据库统计：');
    for (let col of finalStats) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  📁 ${col.name}: ${count} 条记录`);
    }
    
    await mongoose.connection.close();
    console.log('\n🎉 测试数据创建完成！');
    
  } catch (err) {
    console.error('❌ 创建测试数据失败:', err);
  }
}

createTestData();