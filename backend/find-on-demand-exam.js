const mongoose = require('mongoose');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

async function findOnDemandExam() {
  console.log('🔍 查找随时考试类型的会话...\n');
  
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // 查找所有考试会话
    const allSessions = await db.collection('examsessions').find({}).toArray();
    console.log('📋 所有考试会话:');
    console.log('总数量:', allSessions.length);
    console.log('');
    
    allSessions.forEach((session, index) => {
      const id = session._id.toString();
      console.log(`会话 ${index + 1}:`);
      console.log('  ID:', id, `(${id.length}字符)`);
      console.log('  名称:', session.name);
      console.log('  类型:', session.type || session.examType || '未知');
      console.log('  开始时间:', session.startTime);
      console.log('  结束时间:', session.endTime);
      
      // 检查是否包含"发大水"
      if (session.name && session.name.includes('发大水')) {
        console.log('  🎯 这是用户提到的"发大水发大水"考试！');
      }
      
      console.log('');
    });
    
    // 查找on_demand类型的考试
    const onDemandSessions = await db.collection('examsessions').find({ 
      $or: [
        { type: 'on_demand' },
        { examType: 'on_demand' }
      ]
    }).toArray();
    
    console.log('🎯 随时考试类型会话:');
    console.log('数量:', onDemandSessions.length);
    console.log('');
    
    if (onDemandSessions.length > 0) {
      onDemandSessions.forEach((session, index) => {
        const id = session._id.toString();
        console.log(`随时考试 ${index + 1}:`);
        console.log('  ID:', id);
        console.log('  名称:', session.name);
        console.log('  类型:', session.type || session.examType);
        console.log('  开始时间:', session.startTime);
        console.log('  结束时间:', session.endTime);
        console.log('');
      });
    } else {
      console.log('❌ 没有找到随时考试类型的会话');
      console.log('💡 让我们检查是否有其他可用的考试...');
      
      // 查找最近的考试
      const recentSessions = await db.collection('examsessions').find({}).sort({ createdAt: -1 }).limit(3).toArray();
      console.log('\n📅 最近创建的3个考试:');
      recentSessions.forEach((session, index) => {
        const id = session._id.toString();
        console.log(`  ${index + 1}. ID: ${id}`);
        console.log(`     名称: ${session.name}`);
        console.log(`     类型: ${session.type || session.examType || '未知'}`);
        if (id.length === 24) {
          console.log(`     ✅ 24字符ID，可以测试`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 数据库连接已关闭');
  }
}

findOnDemandExam();