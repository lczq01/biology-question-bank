// 修复考试会话数据一致性问题
const mongoose = require('mongoose');

// 由于模型是TypeScript文件，我们需要直接定义Schema
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

const PaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    points: { type: Number, default: 1 }
  }],
  config: {
    timeLimit: Number,
    allowReview: Boolean,
    shuffleQuestions: Boolean,
    shuffleOptions: Boolean
  },
  totalQuestions: Number,
  totalPoints: Number,
  status: { type: String, default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ExamSession = mongoose.model('ExamSession', ExamSessionSchema);
const Paper = mongoose.model('Paper', PaperSchema);

async function fixDataConsistency() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/biology-question-bank');
    console.log('数据库连接成功');

    // 1. 检查当前的考试会话和试卷数据
    console.log('\n=== 当前数据状态 ===');
    
    const sessions = await ExamSession.find({}).lean();
    console.log(`找到 ${sessions.length} 个考试会话`);
    
    const papers = await Paper.find({}).lean();
    console.log(`找到 ${papers.length} 个数据库试卷`);
    
    // 检查内存中的试卷数据
    const examPapers = global.examPapers || [];
    console.log(`找到 ${examPapers.length} 个内存试卷`);
    
    // 2. 分析数据不一致的问题
    console.log('\n=== 数据一致性分析 ===');
    
    for (const session of sessions) {
      console.log(`\n考试会话: ${session.name}`);
      console.log(`  试卷ID: ${session.paperId}`);
      console.log(`  状态: ${session.status}`);
      
      // 检查试卷是否存在
      const dbPaper = await Paper.findById(session.paperId);
      if (dbPaper) {
        console.log(`  ✓ 数据库试卷存在: ${dbPaper.title}`);
      } else {
        console.log(`  ✗ 数据库试卷不存在`);
        
        // 尝试在内存试卷中查找
        const memoryPaper = examPapers.find(p => p.id === session.paperId.toString());
        if (memoryPaper) {
          console.log(`  ⚠ 找到对应的内存试卷: ${memoryPaper.title}`);
          console.log(`    需要创建数据库试卷记录`);
        }
      }
    }
    
    // 3. 修复数据一致性
    console.log('\n=== 开始修复数据一致性 ===');
    
    let fixedCount = 0;
    
    for (const session of sessions) {
      const dbPaper = await Paper.findById(session.paperId);
      
      if (!dbPaper) {
        // 尝试在内存试卷中查找对应的试卷
        const memoryPaper = examPapers.find(p => p.id === session.paperId.toString());
        
        if (memoryPaper) {
          console.log(`\n修复考试会话: ${session.name}`);
          console.log(`  创建数据库试卷记录...`);
          
          // 创建对应的数据库试卷记录
          const newPaper = new Paper({
            _id: session.paperId, // 使用相同的ID
            title: memoryPaper.title,
            description: memoryPaper.description || '从内存试卷同步',
            questions: memoryPaper.questions.map(q => ({
              questionId: new mongoose.Types.ObjectId(), // 创建新的问题ID
              points: q.points || 1
            })),
            config: {
              timeLimit: memoryPaper.timeLimit || 60,
              allowReview: false,
              shuffleQuestions: false,
              shuffleOptions: false
            },
            totalQuestions: memoryPaper.questions.length,
            totalPoints: memoryPaper.questions.reduce((sum, q) => sum + (q.points || 1), 0),
            status: 'published',
            createdBy: session.creatorId,
            createdAt: session.createdAt || new Date(),
            updatedAt: new Date()
          });
          
          await newPaper.save();
          console.log(`  ✓ 数据库试卷创建成功`);
          fixedCount++;
        } else {
          console.log(`\n⚠ 无法修复考试会话: ${session.name}`);
          console.log(`  原因: 找不到对应的内存试卷 (ID: ${session.paperId})`);
        }
      }
    }
    
    // 4. 验证修复结果
    console.log('\n=== 修复结果验证 ===');
    
    const updatedSessions = await ExamSession.find({}).populate({
      path: 'paperId',
      select: 'title description questions totalQuestions totalPoints'
    }).lean();
    
    console.log(`\n修复完成，共修复了 ${fixedCount} 个考试会话`);
    
    for (const session of updatedSessions) {
      console.log(`\n考试会话: ${session.name}`);
      if (session.paperId) {
        console.log(`  ✓ 试卷: ${session.paperId.title}`);
        console.log(`  ✓ 题目数量: ${session.paperId.totalQuestions || 0}`);
        console.log(`  ✓ 总分: ${session.paperId.totalPoints || 0}`);
      } else {
        console.log(`  ✗ 试卷数据仍然缺失`);
      }
    }
    
    console.log('\n=== 数据一致性修复完成 ===');
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 运行修复脚本
fixDataConsistency();