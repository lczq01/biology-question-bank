// 考试记录状态枚举（学生参与考试的状态）
export enum ExamRecordStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  TIMEOUT = 'timeout',
  SUBMITTED = 'submitted',
  GRADED = 'graded'
}

// 保持向后兼容
export type ExamStatus = ExamRecordStatus;

// 答题记录接口
export interface IAnswerRecord {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  points?: number;
  timeSpent: number; // 答题用时（秒）
}

// 考试记录接口定义（重命名为更准确的名称）
export interface IExamRecord {
  _id?: string;
  sessionId: string;  // 关联考试场次ID
  paperId: string;    // 冗余字段，便于查询
  studentId: string;
  status: ExamRecordStatus;
  
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

// 保持向后兼容的接口
export interface IExam extends IExamRecord {
  status: ExamRecordStatus;
}

// 参与考试请求接口（更新为使用考试场次）
export interface IJoinExamRequest {
  sessionId: string;
}

// 保持向后兼容
export interface IStartExamRequest {
  paperId?: string;
  sessionId?: string;
}

// 提交答案请求接口
export interface ISubmitAnswerRequest {
  recordId: string;  // 考试记录ID
  questionId: string;
  answer: string | string[];
}

// 提交考试请求接口
export interface ISubmitExamRequest {
  recordId: string;  // 考试记录ID
}

// 保持向后兼容
export interface ISubmitAnswerRequestLegacy {
  examId: string;
  questionId: string;
  answer: string | string[];
}

export interface ISubmitExamRequestLegacy {
  examId: string;
}

// 考试结果响应接口
export interface IExamResultResponse {
  record: IExamRecord;
  session: {
    _id: string;
    name: string;
    description?: string;
  };
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

// 保持向后兼容
export interface IExamResultResponseLegacy {
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

// 考试记录查询接口
export interface IExamRecordQuery {
  sessionId?: string;
  studentId?: string;
  paperId?: string;
  status?: ExamRecordStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// 保持向后兼容
export interface IExamQuery extends IExamRecordQuery {
  status?: ExamRecordStatus;
}