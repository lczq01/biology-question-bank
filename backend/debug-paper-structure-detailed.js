const mongoose = require('mongoose');

async function debugPaperStructure() {
  try {
    console.log('🔍 详细检查试卷数据结构...\n');
    
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank');
    console.log('✅ 数据库连接成功');
    
    const paperId = '68e13cacdda597c5eaa89b29'; // "发大水发大水"考试对应的试卷ID
    
    // 直接查询试卷集合
    const db = mongoose.connection.db;
    const papersCollection = db.collection('papers');
    
    const paper = await papersCollection.findOne({ _id: new mongoose.Types.ObjectId(paperId) });
    
    if (!paper) {
      console.log('❌ 未找到试卷');
      return;
    }
    
    console.log('📄 试卷基本信息:');
    console.log('ID:', paper._id);
    console.log('标题:', paper.title);
    console.log('类型:', paper.type);
    console.log('');
    
    console.log('📝 questions字段结构:');
    console.log('questions类型:', typeof paper.questions);
    console.log('questions是否为数组:', Array.isArray(paper.questions));
    console.log('questions长度:', paper.questions ? paper.questions.length : 0);
    console.log('');
    
    if (paper.questions && paper.questions.length > 0) {
      console.log('📋 第一个question的所有字段:');
      const firstQuestion = paper.questions[0];
      console.log('字段列表:', Object.keys(firstQuestion));
      
      console.log('\n详细内容:');
      console.log('_id:', firstQuestion._id);
      console.log('content:', firstQuestion.content ? '有内容' : '无内容');
      console.log('type:', firstQuestion.type);
      console.log('options数量:', firstQuestion.options ? firstQuestion.options.length : 0);
      console.log('points:', firstQuestion.points);
      
      if (firstQuestion.content) {
        console.log('\n完整内容预览:');
        console.log('content:', firstQuestion.content.substring(0, 100) + '...');
      }
      
      if (firstQuestion.options && firstQuestion.options.length > 0) {
        console.log('\n选项预览:');
        firstQuestion.options.forEach((opt, index) => {
          console.log(`选项${index + 1}:`, opt.text ? opt.text.substring(0, 50) : '无文本');
        });
      }
    }
    
    console.log('\n🔧 使用Paper模型查询:');
    const Paper = mongoose.model('Paper', new mongoose.Schema({}, { strict: false }));
    const paperModel = await Paper.findById(paperId);
    
    if (paperModel) {
      console.log('Paper模型查询结果:');
      console.log('questions长度:', paperModel.questions ? paperModel.questions.length : 0);
      
      if (paperModel.questions && paperModel.questions.length > 0) {
        const firstQ = paperModel.questions[0];
        console.log('第一题字段:', Object.keys(firstQ.toObject ? firstQ.toObject() : firstQ));
        console.log('第一题内容:', firstQ.content ? '有内容' : '无内容');
      }
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugPaperStructure();