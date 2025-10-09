const mongoose = require('mongoose');

async function debugModelCollection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    
    // 列出所有集合
    const collections = await db.listCollections().toArray();
    console.log('📋 数据库中的所有集合:');
    collections.forEach(col => {
      console.log('  -', col.name);
    });
    
    // 检查ExamSession模型会查找哪个集合
    console.log('\n🔍 测试ExamSession模型查询...');
    
    // 导入编译后的模型
    const { ExamSession } = require('./dist/models/ExamSession');
    
    console.log('ExamSession模型集合名称:', ExamSession.collection.name);
    
    // 尝试查找
    const sessions = await ExamSession.find({});
    console.log('通过模型找到的会话数量:', sessions.length);
    
    if (sessions.length > 0) {
      console.log('第一个会话:', {
        id: sessions[0]._id,
        name: sessions[0].name
      });
    }
    
    // 直接查询集合
    const directSessions = await db.collection('examsessions').find({}).toArray();
    console.log('直接查询集合找到的会话数量:', directSessions.length);

  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugModelCollection();