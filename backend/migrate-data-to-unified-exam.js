const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
};

// 数据模型定义
const PaperSchema = new mongoose.Schema({
  title: String,
  description: String,
  questions: [{
    _id: mongoose.Schema.Types.ObjectId,
    content: String,
    type: String,
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    difficulty: String,
    chapter: String,
    knowledgePoint: String,
    points: Number
  }],
  totalPoints: Number,
  totalQuestions: Number,
  createdBy: String,
  createdAt: Date,
  updatedAt: Date,
  type: String
});

const ExamSchema = new mongoose.Schema({
  name: String,
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper'
  },
  startTime: Date,
  endTime: Date,
  duration: Number,
  status: String,
  type: String,
  availableFrom: Date,
  availableUntil: Date,
  participants: [{
    userId: String,
    joinedAt: Date,
    status: String
  }],
  settings: {
    maxAttempts: Number,
    allowReview: Boolean,
    shuffleQuestions: Boolean,
    showResults: Boolean,
    passingScore: Number
  },
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
});

const UnifiedExamSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: {
    type: String,
    enum: ['assessment', 'practice', 'quiz'],
    default: 'assessment'
  },
  examDuration: Number,
  startTime: Date,
  endTime: Date,
  duration: Number,
  questions: [{
    _id: mongoose.Schema.Types.ObjectId,
    content: String,
    type: String,
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    difficulty: String,
    chapter: String,
    knowledgePoint: String,
    points: Number
  }],
  totalPoints: Number,
  totalQuestions: Number,
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed', 'expired', 'cancelled'],
    default: 'draft'
  },
  config: {
    maxAttempts: {
      type: Number,
      default: 1
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    passingScore: {
      type: Number,
      default: 60
    }
  },
  participants: [{
    userId: String,
    joinedAt: Date,
    status: String,
    attempts: Number
  }],
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
});

const Paper = mongoose.model('Paper', PaperSchema);
const Exam = mongoose.model('Exam', ExamSchema);
const UnifiedExam = mongoose.model('UnifiedExam', UnifiedExamSchema);

// 数据迁移函数
const migrateData = async () => {
  try {
    console.log('开始数据迁移...');
    
    // 1. 迁移Paper数据到UnifiedExam
    console.log('迁移Paper数据...');
    const papers = await Paper.find({});
    let paperMigrationCount = 0;
    
    for (const paper of papers) {
      // 检查是否已经存在对应的UnifiedExam
      const existingUnifiedExam = await UnifiedExam.findOne({ 
        title: paper.title,
        createdAt: paper.createdAt 
      });
      
      if (!existingUnifiedExam) {
        const unifiedExam = new UnifiedExam({
          title: paper.title,
          description: paper.description || '',
          type: 'assessment',
          examDuration: 0, // Paper没有考试时长概念
          duration: 0,
          questions: paper.questions || [],
          totalPoints: paper.totalPoints || 0,
          totalQuestions: paper.totalQuestions || 0,
          status: 'draft',
          config: {
            maxAttempts: 1,
            allowReview: true,
            shuffleQuestions: false,
            showResults: true,
            passingScore: 60
          },
          participants: [],
          createdBy: paper.createdBy || 'system',
          createdAt: paper.createdAt || new Date(),
          updatedAt: paper.updatedAt || new Date()
        });
        
        await unifiedExam.save();
        paperMigrationCount++;
        console.log(`Paper迁移成功: ${paper.title}`);
      }
    }
    
    console.log(`Paper迁移完成: ${paperMigrationCount} 个Paper迁移到UnifiedExam`);
    
    // 2. 迁移Exam数据到UnifiedExam
    console.log('迁移Exam数据...');
    const exams = await Exam.find({});
    let examMigrationCount = 0;
    
    for (const exam of exams) {
      // 检查是否已经存在对应的UnifiedExam
      const existingUnifiedExam = await UnifiedExam.findOne({ 
        title: exam.name,
        createdAt: exam.createdAt 
      });
      
      if (!existingUnifiedExam) {
        // 获取对应的Paper数据
        let paperData = null;
        if (exam.paperId) {
          paperData = await Paper.findById(exam.paperId);
        }
        
        const unifiedExam = new UnifiedExam({
          title: exam.name,
          description: paperData ? paperData.description : '考试',
          type: 'assessment',
          examDuration: exam.duration || 60,
          startTime: exam.startTime,
          endTime: exam.endTime,
          duration: exam.duration || 60,
          questions: paperData ? paperData.questions : [],
          totalPoints: paperData ? paperData.totalPoints : 0,
          totalQuestions: paperData ? paperData.totalQuestions : 0,
          status: exam.status || 'draft',
          config: {
            maxAttempts: exam.settings?.maxAttempts || 1,
            allowReview: exam.settings?.allowReview !== false,
            shuffleQuestions: exam.settings?.shuffleQuestions || false,
            showResults: exam.settings?.showResults !== false,
            passingScore: exam.settings?.passingScore || 60
          },
          participants: exam.participants || [],
          createdBy: exam.createdBy || 'system',
          createdAt: exam.createdAt || new Date(),
          updatedAt: exam.updatedAt || new Date()
        });
        
        await unifiedExam.save();
        examMigrationCount++;
        console.log(`Exam迁移成功: ${exam.name}`);
      }
    }
    
    console.log(`Exam迁移完成: ${examMigrationCount} 个Exam迁移到UnifiedExam`);
    
    // 3. 统计迁移结果
    const totalUnifiedExams = await UnifiedExam.countDocuments();
    console.log('\n=== 数据迁移完成 ===');
    console.log(`Paper迁移数量: ${paperMigrationCount}`);
    console.log(`Exam迁移数量: ${examMigrationCount}`);
    console.log(`UnifiedExam总数: ${totalUnifiedExams}`);
    console.log('迁移完成！');
    
  } catch (error) {
    console.error('数据迁移失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
};

// 执行迁移
connectDB().then(() => {
  migrateData();
});