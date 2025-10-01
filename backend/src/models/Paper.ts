import mongoose, { Schema, Document } from 'mongoose';
import { IPaper, PaperType, PaperStatus } from '../types/paper.types';

// 扩展Document接口
export interface IPaperDocument extends IPaper, Document {}

// 试卷题目配置Schema
const PaperQuestionConfigSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, '题目ID不能为空']
  },
  order: {
    type: Number,
    required: [true, '题目顺序不能为空'],
    min: [1, '题目顺序至少为1']
  },
  points: {
    type: Number,
    required: [true, '题目分值不能为空'],
    min: [1, '题目分值至少为1'],
    max: [100, '题目分值最多为100']
  }
}, { _id: false });

// 试卷配置Schema
const PaperConfigSchema = new Schema({
  totalQuestions: {
    type: Number,
    required: [true, '总题数不能为空'],
    min: [1, '总题数至少为1'],
    max: [200, '总题数最多为200']
  },
  totalPoints: {
    type: Number,
    required: [true, '总分不能为空'],
    min: [1, '总分至少为1'],
    max: [1000, '总分最多为1000']
  },
  timeLimit: {
    type: Number,
    required: [true, '考试时长不能为空'],
    min: [1, '考试时长至少为1分钟'],
    max: [600, '考试时长最多为600分钟']
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// 统计信息Schema
const PaperStatsSchema = new Schema({
  totalAttempts: {
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
  }
}, { _id: false });

// 试卷Schema定义
const PaperSchema = new Schema<IPaperDocument>({
  title: {
    type: String,
    required: [true, '试卷标题不能为空'],
    trim: true,
    maxlength: [100, '试卷标题最多100个字符']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, '试卷描述最多500个字符']
  },
  
  type: {
    type: String,
    enum: Object.values(PaperType),
    required: [true, '试卷类型不能为空']
  },
  
  status: {
    type: String,
    enum: Object.values(PaperStatus),
    default: PaperStatus.DRAFT,
    required: true
  },
  
  config: {
    type: PaperConfigSchema,
    required: [true, '试卷配置不能为空']
  },
  
  questions: {
    type: [PaperQuestionConfigSchema],
    validate: {
      validator: function(this: IPaperDocument, questions: any[]) {
        return questions.length === this.config.totalQuestions;
      },
      message: '题目数量与配置不符'
    }
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建者不能为空']
  },
  
  stats: {
    type: PaperStatsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// 创建索引
PaperSchema.index({ type: 1 });
PaperSchema.index({ status: 1 });
PaperSchema.index({ createdBy: 1 });
PaperSchema.index({ createdAt: -1 });
PaperSchema.index({ title: 'text', description: 'text' }); // 全文搜索索引

// 验证题目顺序唯一性
PaperSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    const orders = this.questions.map(q => q.order);
    const uniqueOrders = new Set(orders);
    
    if (orders.length !== uniqueOrders.size) {
      return next(new Error('题目顺序不能重复'));
    }
    
    // 验证顺序连续性
    const sortedOrders = orders.sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        return next(new Error('题目顺序必须从1开始连续'));
      }
    }
  }
  
  next();
});

// 创建模型
export const Paper = mongoose.model<IPaperDocument>('Paper', PaperSchema);