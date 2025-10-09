import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 预览考试记录状态枚举
 */
export enum PreviewExamRecordStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  TIMEOUT = 'timeout'
}

/**
 * 预览答案记录接口
 */
export interface IPreviewAnswerRecord {
  questionId: mongoose.Types.ObjectId;
  userAnswer: string | string[]; // 支持单选、多选、填空等
  isCorrect: boolean;
  score: number;
  timeSpent: number; // 秒
  submittedAt: Date;
}

/**
 * 预览考试记录实例方法接口
 */
export interface IPreviewExamRecordMethods {
  startPreviewExam(): Promise<IPreviewExamRecord>;
  completePreviewExam(): Promise<IPreviewExamRecord>;
  abandonPreviewExam(): Promise<IPreviewExamRecord>;
  timeoutPreviewExam(): Promise<IPreviewExamRecord>;
  updateLastActive(): Promise<IPreviewExamRecord>;
  addPreviewAnswer(answerRecord: IPreviewAnswerRecord): Promise<IPreviewExamRecord>;
  getDuration(): number;
  isTimeout(): boolean;
  getRemainingTime(): number;
  isExpired(): boolean;
}

/**
 * 预览考试记录静态方法接口
 */
export interface IPreviewExamRecordStatics {
  createPreviewRecord(
    sessionId: mongoose.Types.ObjectId,
    totalQuestions: number,
    timeLimit?: number
  ): Promise<IPreviewExamRecord>;
  findByPreviewId(previewId: string): Promise<IPreviewExamRecord | null>;
  cleanupExpiredRecords(): Promise<number>;
  getPreviewStatistics(): Promise<any>;
}

/**
 * 预览考试记录模型接口
 */
export interface IPreviewExamRecordModel extends Model<IPreviewExamRecord, {}, IPreviewExamRecordMethods>, IPreviewExamRecordStatics {}

/**
 * 预览考试记录接口
 */
export interface IPreviewExamRecord extends Document, IPreviewExamRecordMethods {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId; // 关联考试会话
  previewId: string; // 预览会话唯一标识符
  
  // 预览特有字段
  isPreview: boolean; // 预览标识，始终为true
  expiresAt: Date; // 过期时间，24小时后自动删除
  
  status: PreviewExamRecordStatus;
  
  // 时间记录
  startTime?: Date; // 开始答题时间
  endTime?: Date; // 结束答题时间
  lastActiveTime?: Date; // 最后活跃时间
  
  // 答题记录
  answers: IPreviewAnswerRecord[];
  currentQuestionIndex: number; // 当前题目索引
  
  // 分数统计
  score: number; // 总分
  totalQuestions: number; // 总题数
  correctAnswers: number; // 正确答案数
  
  // 考试设置
  timeLimit?: number; // 时间限制（分钟）
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 预览答案记录Schema
 */
const PreviewAnswerRecordSchema = new Schema<IPreviewAnswerRecord>({
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
 * 预览考试记录Schema
 */
const PreviewExamRecordSchema = new Schema<IPreviewExamRecord>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true,
    index: true
  },
  previewId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 预览特有字段
  isPreview: {
    type: Boolean,
    default: true,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL索引，自动删除过期文档
  },
  
  status: {
    type: String,
    enum: Object.values(PreviewExamRecordStatus),
    default: PreviewExamRecordStatus.NOT_STARTED,
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
    type: [PreviewAnswerRecordSchema],
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
  timeLimit: {
    type: Number, // 分钟
    default: null
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  collection: 'previewexamrecords'
});

// 复合索引
PreviewExamRecordSchema.index({ sessionId: 1, previewId: 1 }, { unique: true }); // 每个预览会话唯一
PreviewExamRecordSchema.index({ sessionId: 1, status: 1 }); // 按会话和状态查询
PreviewExamRecordSchema.index({ createdAt: -1 }); // 按创建时间排序
PreviewExamRecordSchema.index({ isPreview: 1, expiresAt: 1 }); // 预览和过期时间索引

// 实例方法

/**
 * 开始预览考试
 */
PreviewExamRecordSchema.methods.startPreviewExam = function() {
  this.status = PreviewExamRecordStatus.IN_PROGRESS;
  this.startTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 完成预览考试
 */
PreviewExamRecordSchema.methods.completePreviewExam = function() {
  this.status = PreviewExamRecordStatus.COMPLETED;
  this.endTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 放弃预览考试
 */
PreviewExamRecordSchema.methods.abandonPreviewExam = function() {
  this.status = PreviewExamRecordStatus.ABANDONED;
  this.endTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 预览考试超时
 */
PreviewExamRecordSchema.methods.timeoutPreviewExam = function() {
  this.status = PreviewExamRecordStatus.TIMEOUT;
  this.endTime = new Date();
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 更新最后活跃时间
 */
PreviewExamRecordSchema.methods.updateLastActive = function() {
  this.lastActiveTime = new Date();
  return this.save();
};

/**
 * 添加预览答案
 */
PreviewExamRecordSchema.methods.addPreviewAnswer = function(answerRecord: IPreviewAnswerRecord) {
  // 检查是否已经回答过这个问题
  const existingIndex = this.answers.findIndex(
    (answer: IPreviewAnswerRecord) => answer.questionId.toString() === answerRecord.questionId.toString()
  );
  
  if (existingIndex >= 0) {
    // 更新现有答案
    this.answers[existingIndex] = answerRecord;
  } else {
    // 添加新答案
    this.answers.push(answerRecord);
  }
  
  // 更新统计信息
  this.correctAnswers = this.answers.filter((answer: IPreviewAnswerRecord) => answer.isCorrect).length;
  this.score = this.answers.reduce((total: number, answer: IPreviewAnswerRecord) => total + answer.score, 0);
  this.lastActiveTime = new Date();
  
  return this.save();
};

/**
 * 计算预览考试时长（分钟）
 */
PreviewExamRecordSchema.methods.getDuration = function(): number {
  if (!this.startTime || !this.endTime) {
    return 0;
  }
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
};

/**
 * 检查是否超时
 */
PreviewExamRecordSchema.methods.isTimeout = function(): boolean {
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
PreviewExamRecordSchema.methods.getRemainingTime = function(): number {
  if (!this.timeLimit || !this.startTime) {
    return -1; // 无时间限制
  }
  const now = new Date();
  const elapsed = (now.getTime() - this.startTime.getTime()) / (1000 * 60); // 分钟
  return Math.max(0, this.timeLimit - elapsed);
};

/**
 * 检查预览记录是否过期
 */
PreviewExamRecordSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// 静态方法

/**
 * 创建新的预览记录
 */
PreviewExamRecordSchema.statics.createPreviewRecord = async function(
  sessionId: mongoose.Types.ObjectId,
  totalQuestions: number,
  timeLimit?: number
) {
  // 生成唯一的预览ID
  const previewId = `preview_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 设置24小时后过期
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  const previewRecord = new this({
    sessionId,
    previewId,
    isPreview: true,
    expiresAt,
    totalQuestions,
    timeLimit,
    status: PreviewExamRecordStatus.NOT_STARTED
  });
  
  return previewRecord.save();
};

/**
 * 根据预览ID查找记录
 */
PreviewExamRecordSchema.statics.findByPreviewId = async function(previewId: string) {
  return this.findOne({ previewId, isPreview: true });
};

/**
 * 清理过期的预览记录（手动清理，作为备份）
 */
PreviewExamRecordSchema.statics.cleanupExpiredRecords = async function() {
  const now = new Date();
  const result = await this.deleteMany({
    isPreview: true,
    expiresAt: { $lt: now }
  });
  
  console.log(`清理了 ${result.deletedCount} 条过期的预览记录`);
  return result.deletedCount;
};

/**
 * 获取预览记录统计
 */
PreviewExamRecordSchema.statics.getPreviewStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isPreview: true } },
    {
      $group: {
        _id: null,
        totalPreviewRecords: { $sum: 1 },
        completedPreviews: { 
          $sum: { 
            $cond: [{ $eq: ['$status', PreviewExamRecordStatus.COMPLETED] }, 1, 0] 
          } 
        },
        inProgressPreviews: { 
          $sum: { 
            $cond: [{ $eq: ['$status', PreviewExamRecordStatus.IN_PROGRESS] }, 1, 0] 
          } 
        },
        expiredRecords: {
          $sum: {
            $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalPreviewRecords: 0,
    completedPreviews: 0,
    inProgressPreviews: 0,
    expiredRecords: 0
  };
};

// 中间件

/**
 * 保存前验证
 */
PreviewExamRecordSchema.pre('save', function(next) {
  // 确保预览标识始终为true
  this.isPreview = true;
  
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
  
  // 如果没有设置过期时间，设置为24小时后
  if (!this.expiresAt) {
    this.expiresAt = new Date();
    this.expiresAt.setHours(this.expiresAt.getHours() + 24);
  }
  
  next();
});

/**
 * 删除前日志
 */
PreviewExamRecordSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  console.log(`删除预览考试记录: ${this._id} (预览ID: ${this.previewId})`);
  next();
});

export const PreviewExamRecord = mongoose.model<IPreviewExamRecord, IPreviewExamRecordModel>('PreviewExamRecord', PreviewExamRecordSchema);