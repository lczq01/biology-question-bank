import mongoose, { Schema, Document } from 'mongoose';

/**
 * 考试记录状态枚举
 */
export enum ExamRecordStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  TIMEOUT = 'timeout'
}

/**
 * 答案记录接口
 */
export interface IAnswerRecord {
  questionId: mongoose.Types.ObjectId;
  userAnswer: string | string[]; // 支持单选、多选、填空等
  isCorrect: boolean;
  score: number;
  timeSpent: number; // 秒
  submittedAt: Date;
}

/**
 * 考试记录接口
 */
export interface IExamRecord extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId; // 关联考试会话
  userId: mongoose.Types.ObjectId; // 参与考试的用户
  status: ExamRecordStatus;
  
  // 时间记录
  startTime?: Date; // 开始答题时间
  endTime?: Date; // 结束答题时间
  lastActiveTime?: Date; // 最后活跃时间
  
  // 答题记录
  answers: IAnswerRecord[];
  currentQuestionIndex: number; // 当前题目索引
  
  // 分数统计
  score: number; // 总分
  totalQuestions: number; // 总题数
  correctAnswers: number; // 正确答案数
  
  // 考试设置
  attempts: number; // 尝试次数
  maxAttempts: number; // 最大尝试次数
  timeLimit?: number; // 时间限制（分钟）
  
  // 额外信息
  ipAddress?: string; // IP地址
  userAgent?: string; // 用户代理
  browserInfo?: {
    name: string;
    version: string;
    os: string;
  };
  
  // 防作弊相关
  suspiciousActivities: {
    type: string; // 'tab_switch', 'window_blur', 'copy_paste', 'right_click'
    timestamp: Date;
    details?: string;
  }[];
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 答案记录Schema
 */
const AnswerRecordSchema = new Schema<IAnswerRecord>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  userAnswer: {
    type: Schema.Types.Mixed, // 支持字符串或字符串数组
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false
  },
  score: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  timeSpent: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

/**
 * 可疑活动Schema
 */
const SuspiciousActivitySchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['tab_switch', 'window_blur', 'copy_paste', 'right_click', 'fullscreen_exit', 'dev_tools']
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  details: {
    type: String,
    default: ''
  }
}, { _id: false });

/**
 * 浏览器信息Schema
 */
const BrowserInfoSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  os: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * 考试记录Schema
 */
const ExamRecordSchema = new Schema<IExamRecord>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(ExamRecordStatus),
    default: ExamRecordStatus.NOT_STARTED,
    required: true,
    index: true
  },
  
  // 时间记录
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  lastActiveTime: {
    type: Date,
    default: Date.now
  },
  
  // 答题记录
  answers: {
    type: [AnswerRecordSchema],
    default: []
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 分数统计
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 0
  },
  correctAnswers: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 考试设置
  attempts: {
    type: Number,
    default: 1,
    min: 1
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1
  },
  timeLimit: {
    type: Number, // 分钟
    default: null
  },
  
  // 额外信息
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  browserInfo: {
    type: BrowserInfoSchema,
    default: null
  },
  
  // 防作弊相关
  suspiciousActivities: {
    type: [SuspiciousActivitySchema],
    default: []
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  collection: 'examrecords'
});

// 复合索引
ExamRecordSchema.index({ sessionId: 1, userId: 1 }, { unique: true }); // 每个用户在每个考试会话中只能有一条记录
ExamRecordSchema.index({ sessionId: 1, status: 1 }); // 按会话和状态查询
ExamRecordSchema.index({ userId: 1, status: 1 }); // 按用户和状态查询
ExamRecordSchema.index({ createdAt: -1 }); // 按创建时间排序
ExamRecordSchema.index({ score: -1 }); // 按分数排序

// 实例方法

/**
 * 开始考试
 */
ExamRecordSchema.methods.startExam = function() {
  this.status = ExamRecordStatus.IN_PROGRESS;
  this.startTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 完成考试
 */
ExamRecordSchema.methods.completeExam = function() {
  this.status = ExamRecordStatus.COMPLETED;
  this.endTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 放弃考试
 */
ExamRecordSchema.methods.abandonExam = function() {
  this.status = ExamRecordStatus.ABANDONED;
  this.endTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 考试超时
 */
ExamRecordSchema.methods.timeoutExam = function() {
  this.status = ExamRecordStatus.TIMEOUT;
  this.endTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 更新最后活跃时间
 */
ExamRecordSchema.methods.updateLastActive = function() {
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 添加答案
 */
ExamRecordSchema.methods.addAnswer = function(answerRecord: IAnswerRecord) {
  // 检查是否已经回答过这个问题
  const existingIndex = this.answers.findIndex(
    (answer: IAnswerRecord) => answer.questionId.toString() === answerRecord.questionId.toString()
  );
  
  if (existingIndex >= 0) {
    // 更新现有答案
    this.answers[existingIndex] = answerRecord;
  } else {
    // 添加新答案
    this.answers.push(answerRecord);
  }
  
  // 更新统计信息
  this.correctAnswers = this.answers.filter((answer: IAnswerRecord) => answer.isCorrect).length;
  this.score = this.answers.reduce((total: number, answer: IAnswerRecord) => total + answer.score, 0);
  this.lastActiveTime = new Date();
  
  return this.save();
};

/**
 * 添加可疑活动
 */
ExamRecordSchema.methods.addSuspiciousActivity = function(type: string, details?: string) {
  this.suspiciousActivities.push({
    type,
    timestamp: new Date(),
    details: details || ''
  });
  return this.save();
};

/**
 * 计算考试时长（分钟）
 */
ExamRecordSchema.methods.getDuration = function(): number {
  if (!this.startTime || !this.endTime) {
    return 0;
  }
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
};

/**
 * 检查是否超时
 */
ExamRecordSchema.methods.isTimeout = function(): boolean {
  if (!this.timeLimit || !this.startTime) {
    return false;
  }
  const now = new Date();
  const elapsed = (now.getTime() - this.startTime.getTime()) / (1000 * 60); // 分钟
  return elapsed > this.timeLimit;
};

/**
 * 获取剩余时间（分钟）
 */
ExamRecordSchema.methods.getRemainingTime = function(): number {
  if (!this.timeLimit || !this.startTime) {
    return -1; // 无时间限制
  }
  const now = new Date();
  const elapsed = (now.getTime() - this.startTime.getTime()) / (1000 * 60); // 分钟
  return Math.max(0, this.timeLimit - elapsed);
};

// 静态方法

/**
 * 根据会话ID获取统计信息
 */
ExamRecordSchema.statics.getSessionStatistics = async function(sessionId: mongoose.Types.ObjectId) {
  const stats = await this.aggregate([
    { $match: { sessionId } },
    {
      $group: {
        _id: null,
        totalParticipants: { $sum: 1 },
        completedCount: { 
          $sum: { 
            $cond: [{ $eq: ['$status', ExamRecordStatus.COMPLETED] }, 1, 0] 
          } 
        },
        averageScore: { 
          $avg: { 
            $cond: [{ $eq: ['$status', ExamRecordStatus.COMPLETED] }, '$score', null] 
          } 
        },
        highestScore: { 
          $max: { 
            $cond: [{ $eq: ['$status', ExamRecordStatus.COMPLETED] }, '$score', null] 
          } 
        },
        lowestScore: { 
          $min: { 
            $cond: [{ $eq: ['$status', ExamRecordStatus.COMPLETED] }, '$score', null] 
          } 
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalParticipants: 0,
    completedCount: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0
  };
};

/**
 * 根据用户ID获取考试历史
 */
ExamRecordSchema.statics.getUserExamHistory = async function(
  userId: mongoose.Types.ObjectId, 
  limit: number = 10
) {
  return this.find({ userId })
    .populate('sessionId', 'name startTime endTime')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// 中间件

/**
 * 保存前验证
 */
ExamRecordSchema.pre('save', function(next) {
  // 验证分数不能超过总分
  if (this.score < 0) {
    this.score = 0;
  }
  
  // 验证正确答案数不能超过总题数
  if (this.correctAnswers > this.totalQuestions) {
    this.correctAnswers = this.totalQuestions;
  }
  
  // 验证当前题目索引
  if (this.currentQuestionIndex < 0) {
    this.currentQuestionIndex = 0;
  }
  
  next();
});

/**
 * 删除前清理
 */
ExamRecordSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  // 这里可以添加删除前的清理逻辑
  console.log(`删除考试记录: ${this._id}`);
  next();
});

export const ExamRecord = mongoose.model<IExamRecord>('ExamRecord', ExamRecordSchema);