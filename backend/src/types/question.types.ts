// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',    // 单选题
  MULTIPLE_CHOICE = 'multiple_choice', // 多选题
  TRUE_FALSE = 'true_false',          // 判断题
  FILL_BLANK = 'fill_blank',          // 填空题
  SHORT_ANSWER = 'short_answer',      // 简答题
  ESSAY = 'essay'                     // 论述题
}

// 难度等级枚举
export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// 题目状态枚举
export enum QuestionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// 选择题选项接口
export interface IQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// 题目接口定义
export interface IQuestion {
  _id?: string;
  title: string;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  
  // 知识点标签
  knowledgePoints: string[];
  
  // 选择题选项（仅选择题和判断题使用）
  options?: IQuestionOption[];
  
  // 正确答案
  correctAnswer: string | string[];
  
  // 解析说明
  explanation?: string;
  
  // 图片附件
  images?: string[];
  
  // 分值
  points: number;
  
  // 创建者
  createdBy: string;
  
  // 统计信息
  stats: {
    totalAttempts: number;
    correctAttempts: number;
    averageScore: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 题目创建请求接口
export interface ICreateQuestionRequest {
  title: string;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  knowledgePoints: string[];
  options?: Omit<IQuestionOption, 'id'>[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

// 题目筛选查询接口
export interface IQuestionQuery {
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  status?: QuestionStatus;
  knowledgePoints?: string[];
  keyword?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}