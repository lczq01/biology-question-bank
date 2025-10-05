const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank');
    console.log('📊 数据库统计信息：');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('  ❌ 数据库为空，没有任何集合');
    } else {
      for (let col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`  📁 ${col.name}: ${count} 条记录`);
      }
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ 连接错误:', err);
  }
}

checkDatabase();