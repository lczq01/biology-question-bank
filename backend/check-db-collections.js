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

async function checkCollections() {
  console.log('🔍 检查数据库集合...\n');
  
  try {
    await connectDB();
    
    // 列出所有集合
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📋 数据库中的所有集合:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    console.log('');
    
    // 检查每个集合的文档数量
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`📊 ${collection.name}: ${count} 个文档`);
      
      // 如果集合名称包含exam或session，显示前几个文档
      if (collection.name.toLowerCase().includes('exam') || 
          collection.name.toLowerCase().includes('session')) {
        console.log(`  🔍 ${collection.name} 的前3个文档:`);
        const docs = await db.collection(collection.name).find({}).limit(3).toArray();
        docs.forEach((doc, index) => {
          console.log(`    ${index + 1}. ID: ${doc._id}`);
          if (doc.name) console.log(`       名称: ${doc.name}`);
          if (doc.examType) console.log(`       类型: ${doc.examType}`);
        });
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 数据库连接已关闭');
  }
}

checkCollections();