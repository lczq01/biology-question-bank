const mongoose = require('mongoose');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology_question_bank', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

// 定义ExamSession模型
const examSessionSchema = new mongoose.Schema({
  name: String,
  examType: String,
  startTime: Date,
  endTime: Date,
  paperId: mongoose.Schema.Types.ObjectId,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ExamSession = mongoose.model('ExamSession', examSessionSchema, 'exam_sessions');

async function getValidExamIds() {
  console.log('🔍 获取有效的考试会话ID...\n');
  
  try {
    await connectDB();
    
    const sessions = await ExamSession.find({}).limit(5);
    console.log('📋 找到的考试会话:');
    console.log('总数量:', sessions.length);
    console.log('');
    
    sessions.forEach((session, index) => {
      const id = session._id.toString();
      console.log(`会话 ${index + 1}:`);
      console.log('  ID:', id);
      console.log('  ID长度:', id.length, '(应该是24)');
      console.log('  名称:', session.name);
      console.log('  类型:', session.examType);
      console.log('  是否有效ObjectId:', mongoose.Types.ObjectId.isValid(id));
      console.log('');
    });
    
    // 查找on_demand类型的考试
    const onDemandSessions = await ExamSession.find({ examType: 'on_demand' }).limit(3);
    console.log('🎯 随时考试类型会话:');
    console.log('数量:', onDemandSessions.length);
    console.log('');
    
    onDemandSessions.forEach((session, index) => {
      const id = session._id.toString();
      console.log(`随时考试 ${index + 1}:`);
      console.log('  ID:', id);
      console.log('  ID长度:', id.length);
      console.log('  名称:', session.name);
      console.log('  是否包含"发大水":', session.name.includes('发大水'));
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔄 数据库连接已关闭');
  }
}

getValidExamIds();