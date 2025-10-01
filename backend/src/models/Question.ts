import mongoose, { Schema, Document } from 'mongoose';
import { IQuestion, QuestionType, DifficultyLevel, QuestionStatus } from '../types/question.types';

// 扩展Document接口
export interface IQuestionDocument extends IQuestion, Document {}

// 选项Schema
const OptionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: [true, '选项内容不能为空'],
    trim: true,
    maxlength: [500, '选项内容最多500个字符']
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false
  }
}, { _id: false });

// 题目Schema定义
const QuestionSchema = new Schema<IQuestionDocument>({
  title: {
    type: String,
    required: [true, '题目标题不能为空'],
    trim: true,
    maxlength: [200, '题目标题最多200个字符']
  },
  
  content: {
    type: String,
    required: [true, '题目内容不能为空'],
    trim: true,
    maxlength: [2000, '题目内容最多2000个字符']
  },
  
  type: {
    type: String,
    enum: Object.values(QuestionType),
    required: [true, '题目类型不能为空']
  },
  
  difficulty: {
    type: String,
    enum: Object.values(DifficultyLevel),
    required: [true, '难度等级不能为空']
  },
  
  status: {
    type: String,
    enum: Object.values(QuestionStatus),
    default: QuestionStatus.DRAFT,
    required: true
  },
  
  knowledgePoints: [{
    type: String,
    trim: true,
    maxlength: [50, '知识点名称最多50个字符']
  }],
  
  options: {
    type: [OptionSchema],
    validate: {
      validator: function(this: IQuestionDocument, options: any[]) {
        // 选择题和判断题必须有选项
        if ([QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE].includes(this.type)) {
          return options && options.length > 0;
        }
        return true;
      },
      message: '选择题和判断题必须设置选项'
    }
  },
  
  correctAnswer: {
    type: Schema.Types.Mixed,
    required: [true, '正确答案不能为空'],
    validate: {
      validator: function(this: IQuestionDocument, answer: any) {
        // 多选题答案必须是数组
        if (this.type === QuestionType.MULTIPLE_CHOICE) {
          return Array.isArray(answer) && answer.length > 0;
        }
        // 其他题型答案必须是字符串
        return typeof answer === 'string' && answer.trim().length > 0;
      },
      message: '答案格式不正确'
    }
  },
  
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, '解析最多1000个字符']
  },
  
  images: [{
    type: String,
    trim: true
  }],
  
  points: {
    type: Number,
    required: [true, '分值不能为空'],
    min: [1, '分值至少为1'],
    max: [100, '分值最多为100']
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建者不能为空']
  },
  
  stats: {
    totalAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    correctAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// 创建索引
QuestionSchema.index({ type: 1 });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ status: 1 });
QuestionSchema.index({ knowledgePoints: 1 });
QuestionSchema.index({ createdBy: 1 });
QuestionSchema.index({ createdAt: -1 });
QuestionSchema.index({ title: 'text', content: 'text' }); // 全文搜索索引

// 验证选项正确答案一致性
QuestionSchema.pre('save', function(next) {
  if (this.type === QuestionType.SINGLE_CHOICE && this.options) {
    const correctOptions = this.options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      return next(new Error('单选题必须有且仅有一个正确答案'));
    }
  }
  
  if (this.type === QuestionType.MULTIPLE_CHOICE && this.options) {
    const correctOptions = this.options.filter(opt => opt.isCorrect);
    if (correctOptions.length < 2) {
      return next(new Error('多选题至少需要两个正确答案'));
    }
  }
  
  if (this.type === QuestionType.TRUE_FALSE && this.options) {
    if (this.options.length !== 2) {
      return next(new Error('判断题必须有两个选项'));
    }
  }
  
  next();
});

// 创建模型
export const Question = mongoose.model<IQuestionDocument>('Question', QuestionSchema);