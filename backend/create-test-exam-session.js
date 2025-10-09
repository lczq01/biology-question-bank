const mongoose = require('mongoose');

// 定义Schema
const ExamSessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['scheduled', 'on_demand'], default: 'scheduled' },
  status: { type: String, default: 'draft' },
  startTime: Date,
  endTime: Date,
  availableFrom: Date,
  availableUntil: Date,
  duration: { type: Number, required: true },
  settings: {
    allowReview: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showResults: { type: Boolean, default: false },
    allowRetake: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    passingScore: { type: Number, default: 60 },
    autoGrade: { type: Boolean, default: true },
    preventCheating: { type: Boolean, default: false }
  },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ExamSession = mongoose.model('ExamSession', ExamSessionSchema);

async function createTestExamSession() {
  try {
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('数据库连接成功');
    
    // 1. 获取现有的试卷ID
    const papers = await mongoose.connection.db.collection('paper').find({}).toArray();
    console.log('\n找到的试卷:');
    papers.forEach((paper, index) => {
      console.log(`  ${index + 1}. ${paper.title} (ID: ${paper._id})`);
    });
    
    if (papers.length === 0) {
      console.log('没有找到试卷，无法创建考试会话');
      return;
    }
    
    const paper = papers[0];
    console.log(`\n使用试卷: ${paper.title}`);
    
    // 2. 创建一个测试用户ID（如果没有用户的话）
    const testUserId = new mongoose.Types.ObjectId();
    console.log(`测试用户ID: ${testUserId}`);
    
    // 3. 创建测试考试会话
    const testSession = new ExamSession({
      name: '测试考试会话',
      description: '这是一个用于测试数据一致性的考试会话',
      paperId: paper._id,
      creatorId: testUserId,
      type: 'on_demand',
      status: 'published',
      startTime: new Date('2024-01-01T00:00:00Z'),
      endTime: new Date('2099-12-31T23:59:59Z'),
      duration: 60,
      settings: {
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        allowRetake: true,
        maxAttempts: 3,
        passingScore: 60,
        autoGrade: true,
        preventCheating: false
      },
      allowedUsers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('\n创建考试会话...');
    const savedSession = await testSession.save();
    console.log('✓ 考试会话创建成功!');
    console.log(`  ID: ${savedSession._id}`);
    console.log(`  名称: ${savedSession.name}`);
    console.log(`  状态: ${savedSession.status}`);
    
    // 4. 验证创建结果 - 使用populate获取完整数据
    console.log('\n验证考试会话数据...');
    const populatedSession = await ExamSession.findById(savedSession._id)
      .populate({
        path: 'paperId',
        select: 'title description questions totalQuestions totalPoints'
      })
      .lean();
    
    if (populatedSession) {
      console.log('✓ 考试会话数据验证成功:');
      console.log(`  考试名称: ${populatedSession.name}`);
      console.log(`  试卷标题: ${populatedSession.paperId?.title || '未知'}`);
      console.log(`  考试时长: ${populatedSession.duration} 分钟`);
      console.log(`  考试状态: ${populatedSession.status}`);
      
      // 检查试卷是否有题目
      if (populatedSession.paperId) {
        console.log(`  试卷题目数: ${populatedSession.paperId.totalQuestions || 0}`);
        console.log(`  试卷总分: ${populatedSession.paperId.totalPoints || 0}`);
      }
    } else {
      console.log('✗ 无法获取考试会话数据');
    }
    
    // 5. 检查数据库中的考试会话总数
    const sessionCount = await ExamSession.countDocuments();
    console.log(`\n数据库中现在有 ${sessionCount} 个考试会话`);
    
    console.log('\n=== 测试完成 ===');
    console.log('现在学生端应该能够看到这个考试会话了');
    
  } catch (error) {
    console.error('创建测试考试会话失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

createTestExamSession();