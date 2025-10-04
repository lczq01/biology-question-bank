import mongoose, { Document, Schema } from 'mongoose';

// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',    // 单选题
  MULTIPLE_CHOICE = 'multiple_choice', // 多选题
  FILL_BLANK = 'fill_blank'           // 填空题
}

// 难度等级枚举
export enum DifficultyLevel {
  EASY = 'easy',       // 简单
  MEDIUM = 'medium',   // 中等
  HARD = 'hard'        // 困难
}

// 选项接口
export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

// 题目接口
export interface IQuestion extends Document {
  title: string;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  subject: string;
  chapter: string;
  section?: string;
  keywords: string[];
  options?: Option[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  imageUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  usageCount: number;
}

// 题目Schema
const QuestionSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, '题目标题不能为空'],
    trim: true,
    maxlength: [200, '题目标题不能超过200个字符']
  },
  content: {
    type: String,
    required: [true, '题目内容不能为空'],
    trim: true,
    maxlength: [2000, '题目内容不能超过2000个字符']
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
  subject: {
    type: String,
    required: [true, '学科不能为空'],
    default: '生物'
  },
  chapter: {
    type: String,
    required: [true, '章节不能为空'],
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  options: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    }
  }],
  correctAnswer: {
    type: String,
    trim: true
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, '答案解析不能超过1000个字符']
  },
  points: {
    type: Number,
    required: [true, '分值不能为空'],
    min: [1, '分值不能小于1'],
    max: [100, '分值不能大于100'],
    default: 5
  },
  imageUrl: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建者不能为空']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引优化
QuestionSchema.index({ type: 1, difficulty: 1 });
QuestionSchema.index({ chapter: 1, section: 1 });
QuestionSchema.index({ keywords: 1 });
QuestionSchema.index({ createdBy: 1 });
QuestionSchema.index({ isActive: 1 });
QuestionSchema.index({ createdAt: -1 });

// 虚拟字段：格式化创建时间
QuestionSchema.virtual('formattedCreatedAt').get(function(this: IQuestion & Document) {
  return this.createdAt.toLocaleDateString('zh-CN');
});

// 静态方法：按条件查询题目
QuestionSchema.statics.findByFilters = function(filters: any) {
  const query: any = { isActive: true };
  
  if (filters.type) query.type = filters.type;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.chapter) query.chapter = filters.chapter;
  if (filters.section) query.section = filters.section;
  if (filters.keywords && filters.keywords.length > 0) {
    query.keywords = { $in: filters.keywords };
  }
  
  return this.find(query);
};

export default mongoose.model<IQuestion>('Question', QuestionSchema);