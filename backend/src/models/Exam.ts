import mongoose, { Schema, Document } from 'mongoose';
import { IExam, ExamStatus } from '../types/exam.types';

// 扩展Document接口
export interface IExamDocument extends IExam, Document {}

// 答题记录Schema
const AnswerRecordSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, '题目ID不能为空']
  },
  answer: {
    type: Schema.Types.Mixed,
    required: [true, '答案不能为空']
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  timeSpent: {
    type: Number,
    required: [true, '答题用时不能为空'],
    min: [0, '答题用时不能为负数']
  }
}, { _id: false });

import { ExamResultSchema } from './ExamResult';

// 考试Schema定义
const ExamSchema = new Schema<IExamDocument>({
  paperId: {
    type: Schema.Types.ObjectId,
    ref: 'Paper',
    required: [true, '试卷ID不能为空']
  },
  
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '学生ID不能为空']
  },
  
  status: {
    type: String,
    enum: Object.values(ExamStatus),
    default: ExamStatus.NOT_STARTED,
    required: true
  },
  
  config: {
    type: ExamConfigSchema,
    required: [true, '考试配置不能为空']
  },
  
  answers: {
    type: [AnswerRecordSchema],
    default: []
  },
  
  result: {
    type: ExamResultSchema,
    default: () => ({
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      accuracy: 0,
      timeUsed: 0,
      isPassed: false
    })
  },
  
  startTime: {
    type: Date,
    default: Date.now
  },
  
  endTime: {
    type: Date,
    default: null
  },
  
  submitTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// 创建索引
ExamSchema.index({ paperId: 1 });
ExamSchema.index({ studentId: 1 });
ExamSchema.index({ status: 1 });
ExamSchema.index({ startTime: -1 });
ExamSchema.index({ studentId: 1, paperId: 1 });

// 创建模型
export const Exam = mongoose.model<IExamDocument>('Exam', ExamSchema);

// 考试配置Schema
const ExamConfigSchema = new Schema({
  timeLimit: {
    type: Number,
    required: [true, '考试时长不能为空'],
    min: [1, '考试时长至少为1分钟']
  },
  totalQuestions: {
    type: Number,
    required: [true, '总题数不能为空'],
    min: [1, '总题数至少为1']
  },
  totalPoints: {
    type: Number,
    required: [true, '总分不能为空'],
    min: [1, '总分至少为1']
  }
}, { _id: false });