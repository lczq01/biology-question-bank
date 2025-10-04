import mongoose, { Schema, Document, Types } from 'mongoose';
import { 
  IExamSession, 
  ExamSessionStatus, 
  IExamSessionSettings, 
  IExamSessionStats 
} from '../types/exam-session.types';

// 扩展Document接口
export interface IExamSessionDocument extends Omit<IExamSession, '_id' | 'paperId' | 'creatorId'>, Document {
  paperId: Types.ObjectId;
  creatorId: Types.ObjectId;
}

// 考试场次设置Schema
const ExamSessionSettingsSchema = new Schema<IExamSessionSettings>({
  allowReview: {
    type: Boolean,
    default: true
  },
  showScore: {
    type: Boolean,
    default: true
  },
  randomOrder: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: [1, '最大尝试次数至少为1'],
    max: [10, '最大尝试次数最多为10']
  },
  passingScore: {
    type: Number,
    default: 60,
    min: [0, '及格分数不能为负数'],
    max: [100, '及格分数不能超过100']
  },
  autoGrade: {
    type: Boolean,
    default: true
  },
  preventCheating: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// 考试场次统计Schema
const ExamSessionStatsSchema = new Schema<IExamSessionStats>({
  totalParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  completedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  passRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageTime: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// 考试场次Schema定义
const ExamSessionSchema = new Schema<IExamSessionDocument>({
  name: {
    type: String,
    required: [true, '考试名称不能为空'],
    trim: true,
    maxlength: [100, '考试名称最多100个字符']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, '考试描述最多500个字符']
  },
  
  paperId: {
    type: Schema.Types.ObjectId,
    ref: 'Paper',
    required: [true, '试卷ID不能为空']
  },
  
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建者ID不能为空']
  },
  
  startTime: {
    type: Date,
    required: [true, '开始时间不能为空']
  },
  
  endTime: {
    type: Date,
    required: [true, '结束时间不能为空'],
    validate: {
      validator: function(this: IExamSessionDocument, endTime: Date) {
        return endTime > this.startTime;
      },
      message: '结束时间必须晚于开始时间'
    }
  },
  
  duration: {
    type: Number,
    required: [true, '考试时长不能为空'],
    min: [1, '考试时长至少为1分钟'],
    max: [600, '考试时长最多为600分钟']
  },
  
  status: {
    type: String,
    enum: Object.values(ExamSessionStatus),
    default: ExamSessionStatus.DRAFT,
    required: true
  },
  
  settings: {
    type: ExamSessionSettingsSchema,
    required: [true, '考试设置不能为空'],
    default: () => ({})
  },
  
  participants: {
    type: [String],
    default: []
  },
  
  stats: {
    type: ExamSessionStatsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// 创建索引
ExamSessionSchema.index({ paperId: 1 });
ExamSessionSchema.index({ creatorId: 1 });
ExamSessionSchema.index({ status: 1 });
ExamSessionSchema.index({ startTime: 1 });
ExamSessionSchema.index({ endTime: 1 });
ExamSessionSchema.index({ createdAt: -1 });
ExamSessionSchema.index({ name: 'text', description: 'text' }); // 全文搜索索引

// 复合索引
ExamSessionSchema.index({ creatorId: 1, status: 1 });
ExamSessionSchema.index({ status: 1, startTime: 1 });

// 验证参与者列表
ExamSessionSchema.pre('save', function(next) {
  // 验证参与者ID格式（兼容字符串ID和ObjectId格式）
  if (this.participants && this.participants.length > 0) {
    for (const participantId of this.participants) {
      // 允许字符串ID格式，只检查是否为有效的非空字符串
      if (!participantId || typeof participantId !== 'string' || participantId.trim().length === 0) {
        return next(new Error(`无效的参与者ID: ${participantId}`));
      }
    }
  }
  
  next();
});

// 自动更新考试状态的中间件
ExamSessionSchema.pre('find', function() {
  // 这里可以添加自动更新状态的逻辑
  // 例如：将过期的考试自动标记为已结束
});

ExamSessionSchema.pre('findOne', function() {
  // 同上
});

// 实例方法：检查用户是否可以参与考试
ExamSessionSchema.methods.canUserParticipate = function(userId: string): boolean {
  // 如果参与者列表为空，表示所有人都可以参与
  if (this.participants.length === 0) {
    return true;
  }
  
  // 检查用户是否在参与者列表中
  return this.participants.includes(userId);
};

// 实例方法：检查考试是否正在进行中
ExamSessionSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.status === ExamSessionStatus.ACTIVE &&
         now >= this.startTime &&
         now <= this.endTime;
};

// 静态方法：获取用户可参与的考试
ExamSessionSchema.statics.findAvailableForUser = function(userId: string) {
  const now = new Date();
  
  return this.find({
    $or: [
      { participants: { $size: 0 } },  // 无限制
      { participants: userId }         // 在参与者列表中
    ],
    status: { $in: [ExamSessionStatus.PUBLISHED, ExamSessionStatus.ACTIVE] },
    startTime: { $lte: now },
    endTime: { $gte: now }
  });
};

// 创建模型
export const ExamSession = mongoose.model<IExamSessionDocument>('ExamSession', ExamSessionSchema);