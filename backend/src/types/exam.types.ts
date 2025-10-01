// 考试状态枚举
export enum ExamStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  TIMEOUT = 'timeout',
  SUBMITTED = 'submitted'
}

// 答题记录接口
export interface IAnswerRecord {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  points?: number;
  timeSpent: number; // 答题用时（秒）
}

// 考试记录接口定义
export interface IExam {
  _id?: string;
  paperId: string;
  studentId: string;
  status: ExamStatus;
  
  // 考试配置（从试卷复制）
  config: {
    timeLimit: number;
    totalQuestions: number;
    totalPoints: number;
  };
  
  // 答题记录
  answers: IAnswerRecord[];
  
  // 考试结果
  result: {
    score: number;
    correctCount: number;
    totalQuestions: number;
    accuracy: number; // 正确率
    timeUsed: number; // 总用时（秒）
    isPassed: boolean;
  };
  
  // 时间记录
  startTime: Date;
  endTime?: Date;
  submitTime?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// 开始考试请求接口
export interface IStartExamRequest {
  paperId: string;
}

// 提交答案请求接口
export interface ISubmitAnswerRequest {
  examId: string;
  questionId: string;
  answer: string | string[];
}

// 提交考试请求接口
export interface ISubmitExamRequest {
  examId: string;
}

// 考试结果响应接口
export interface IExamResultResponse {
  exam: IExam;
  paper: {
    title: string;
    type: string;
  };
  questions: Array<{
    questionId: string;
    title: string;
    type: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
    explanation?: string;
  }>;
}

// 考试查询接口
export interface IExamQuery {
  studentId?: string;
  paperId?: string;
  status?: ExamStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}