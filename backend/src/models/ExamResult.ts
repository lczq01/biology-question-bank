import mongoose, { Schema } from 'mongoose';

// 考试结果Schema
export const ExamResultSchema = new Schema({
  score: {
    type: Number,
    required: [true, '分数不能为空'],
    min: [0, '分数不能为负数']
  },
  correctCount: {
    type: Number,
    required: [true, '正确题数不能为空'],
    min: [0, '正确题数不能为负数']
  },
  totalQuestions: {
    type: Number,
    required: [true, '总题数不能为空'],
    min: [1, '总题数至少为1']
  },
  accuracy: {
    type: Number,
    required: [true, '正确率不能为空'],
    min: [0, '正确率不能为负数'],
    max: [100, '正确率不能超过100']
  },
  timeUsed: {
    type: Number,
    required: [true, '用时不能为空'],
    min: [0, '用时不能为负数']
  },
  isPassed: {
    type: Boolean,
    required: [true, '是否通过不能为空']
  }
}, { _id: false });