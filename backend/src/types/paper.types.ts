// 题型类型定义
type QuestionType = 'single_choice' | 'multiple_choice' | 'fill_blank';

// 试卷状态枚举
export enum PaperStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// 试卷类型枚举
export enum PaperType {
  PRACTICE = 'practice',      // 练习卷
  EXAM = 'exam',             // 考试卷
  MOCK = 'mock'              // 模拟卷
}

// 试卷题目配置接口
export interface IPaperQuestionConfig {
  questionId: string;
  order: number;
  points: number;
}

// 自动组卷配置接口
export interface IAutoPaperConfig {
  totalQuestions: number;
  totalPoints: number;
  
  // 题型分布
  typeDistribution: {
    [key in QuestionType]?: {
      count: number;
      points: number;
    };
  };
  
  // 难度分布
  difficultyDistribution: {
    easy: number;    // 百分比
    medium: number;  // 百分比
    hard: number;    // 百分比
  };
  
  // 知识点要求
  knowledgePoints?: string[];
}

// 试卷接口定义
export interface IPaper {
  _id?: string;
  title: string;
  description?: string;
  type: PaperType;
  status: PaperStatus;
  
  // 试卷配置
  config: {
    totalQuestions: number;
    totalPoints: number;
    timeLimit: number; // 考试时长（分钟）
    allowReview: boolean; // 是否允许查看答案
    shuffleQuestions: boolean; // 是否打乱题目顺序
    shuffleOptions: boolean; // 是否打乱选项顺序
  };
  
  // 题目列表
  questions: IPaperQuestionConfig[];
  
  // 创建者
  createdBy: string;
  
  // 统计信息
  stats: {
    totalAttempts: number;
    averageScore: number;
    passRate: number; // 通过率
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 试卷创建请求接口
export interface ICreatePaperRequest {
  title: string;
  description?: string;
  type: PaperType;
  config: IPaper['config'];
  questions?: IPaperQuestionConfig[];
  autoPaperConfig?: IAutoPaperConfig;
}

// 试卷查询接口
export interface IPaperQuery {
  type?: PaperType;
  status?: PaperStatus;
  createdBy?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}