const mongoose = require('mongoose');

async function debugCollections() {
  try {
    console.log('🔍 检查数据库集合...\n');
    
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    const db = mongoose.connection.db;
    
    // 获取所有集合名称
    const collections = await db.listCollections().toArray();
    console.log('\n📚 数据库中的所有集合:');
    collections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name}`);
    });
    
    // 查找包含试卷的集合
    const paperId = '68e13cacdda597c5eaa89b29';
    console.log(`\n🔍 查找试卷ID: ${paperId}`);
    
    for (const col of collections) {
      const collection = db.collection(col.name);
      try {
        const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(paperId) });
        if (doc) {
          console.log(`✅ 在集合 "${col.name}" 中找到试卷`);
          console.log('试卷标题:', doc.title);
          console.log('questions字段存在:', !!doc.questions);
          console.log('questions长度:', doc.questions ? doc.questions.length : 0);
          
          if (doc.questions && doc.questions.length > 0) {
            const firstQ = doc.questions[0];
            console.log('\n第一题字段:', Object.keys(firstQ));
            console.log('第一题有content:', !!firstQ.content);
            console.log('第一题有type:', !!firstQ.type);
            console.log('第一题有options:', !!firstQ.options);
          }
          break;
        }
      } catch (err) {
        // 忽略类型转换错误，继续查找
      }
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugCollections();