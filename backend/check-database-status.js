const mongoose = require('mongoose');

async function checkDatabaseStatus() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('数据库连接成功');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n数据库中的集合:');
    collections.forEach(col => console.log('  -', col.name));
    
    console.log('\n各集合记录数量:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} 条记录`);
    }
    
    // 检查examSessions集合的具体内容
    if (collections.find(col => col.name === 'examsessions')) {
      console.log('\n=== ExamSessions 集合详情 ===');
      const sessions = await mongoose.connection.db.collection('examsessions').find({}).toArray();
      sessions.forEach((session, index) => {
        console.log(`会话 ${index + 1}:`);
        console.log(`  名称: ${session.name}`);
        console.log(`  试卷ID: ${session.paperId}`);
        console.log(`  状态: ${session.status}`);
        console.log(`  创建时间: ${session.createdAt}`);
      });
    }
    
    // 检查papers集合的具体内容
    if (collections.find(col => col.name === 'papers')) {
      console.log('\n=== Papers 集合详情 ===');
      const papers = await mongoose.connection.db.collection('papers').find({}).toArray();
      papers.forEach((paper, index) => {
        console.log(`试卷 ${index + 1}:`);
        console.log(`  标题: ${paper.title}`);
        console.log(`  ID: ${paper._id}`);
        console.log(`  状态: ${paper.status}`);
        console.log(`  题目数量: ${paper.totalQuestions || 0}`);
      });
    }
    
  } catch (error) {
    console.error('检查数据库状态失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

checkDatabaseStatus();