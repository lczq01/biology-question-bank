// 考试管理API类型定义
import { Types } from 'mongoose';
import { ExamSessionStatus } from './exam-session.types';

// ============ 请求类型定义 ============

// 创建考试会话请求
export interface ICreateExamSessionRequest {
  name: string;                    // 考试名称
  description?: string;            // 考试描述
  paperId: string;                // 试卷ID
  startTime: string;              // 开始时间 (ISO string)
  endTime: string;                // 结束时间 (ISO string)
  duration: number;               // 考试时长（分钟）
  status?: ExamSessionStatus;     // 考试状态（可选，默认为draft）
  settings?: {                    // 考试设置
    allowReview?: boolean;        // 允许查看答案
    shuffleQuestions?: boolean;   // 随机题目顺序
    shuffleOptions?: boolean;     // 随机选项顺序
    showResults?: boolean;        // 显示结果
    allowRetake?: boolean;        // 允许重考
    maxAttempts?: number;         // 最大尝试次数
    passingScore?: number;        // 及格分数
    autoGrade?: boolean;          // 自动评分
    preventCheating?: boolean;    // 防作弊
  };
}

// 更新考试会话请求
export interface IUpdateExamSessionRequest {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  settings?: ICreateExamSessionRequest['settings'];
}

// 更新考试状态请求
export interface IUpdateExamStatusRequest {
  status: ExamSessionStatus;
  reason?: string;                // 状态变更原因
}

// 考试会话查询参数
export interface IExamSessionQueryParams {
  page?: number;                  // 页码
  limit?: number;                 // 每页数量
  status?: ExamSessionStatus;     // 状态筛选
  creatorId?: string;            // 创建者筛选
  paperId?: string;              // 试卷筛选
  startDate?: string;            // 开始日期筛选
  endDate?: string;              // 结束日期筛选
  keyword?: string;              // 关键词搜索
  sortBy?: 'createdAt' | 'startTime' | 'name';  // 排序字段
  sortOrder?: 'asc' | 'desc';    // 排序方向
}

// ============ 响应类型定义 ============

// 考试会话响应数据
export interface IExamSessionResponse {
  _id: string;
  name: string;
  description?: string;
  paperId: {
    _id: string;
    title: string;
    type: string;
    totalQuestions: number;
    totalPoints: number;
  };
  creatorId: {
    _id: string;
    username: string;
    email: string;
  };
  status: ExamSessionStatus;
  startTime: string;
  endTime: string;
  duration: number;
  settings: {
    allowReview: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    allowRetake: boolean;
    maxAttempts: number;
    passingScore: number;
    autoGrade: boolean;
    preventCheating: boolean;
  };
  statistics?: {
    totalParticipants: number;
    completedCount: number;
    averageScore: number;
    passingRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 考试会话列表响应
export interface IExamSessionListResponse {
  sessions: IExamSessionResponse[];
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalItems: number;
  };
}

// 考试统计响应
export interface IExamStatisticsResponse {
  sessionId: string;
  sessionName: string;
  totalParticipants: number;      // 总参与人数
  completedCount: number;         // 完成人数
  inProgressCount: number;        // 进行中人数
  notStartedCount: number;        // 未开始人数
  averageScore: number;           // 平均分
  highestScore: number;           // 最高分
  lowestScore: number;            // 最低分
  passingRate: number;            // 通过率
  averageTimeUsed: number;        // 平均用时（分钟）
  questionStatistics: Array<{     // 题目统计
    questionId: string;
    questionText: string;
    correctRate: number;          // 正确率
    averageTimeSpent: number;     // 平均答题时间
  }>;
  scoreDistribution: Array<{      // 分数分布
    range: string;                // 分数区间
    count: number;                // 人数
    percentage: number;           // 百分比
  }>;
}

// 考试参与者响应
export interface IExamParticipantResponse {
  _id: string;
  studentId: {
    _id: string;
    username: string;
    email: string;
  };
  status: string;
  score: number;
  accuracy: number;
  timeUsed: number;
  startTime: string;
  endTime?: string;
  submitTime?: string;
  createdAt: string;
}

// 考试参与者列表响应
export interface IExamParticipantListResponse {
  participants: IExamParticipantResponse[];
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalItems: number;
  };
}

// ============ API响应格式 ============

// 标准API响应格式
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
}

// 分页响应格式
export interface IPaginatedResponse<T> extends IApiResponse<T> {
  data: T & {
    pagination: {
      current: number;
      total: number;
      pageSize: number;
      totalItems: number;
    };
  };
}

// ============ 错误类型定义 ============

// API错误代码
export enum ExamManagementErrorCode {
  // 通用错误
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  
  // 考试会话相关错误
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_ALREADY_EXISTS = 'SESSION_ALREADY_EXISTS',
  INVALID_SESSION_STATUS = 'INVALID_SESSION_STATUS',
  SESSION_TIME_CONFLICT = 'SESSION_TIME_CONFLICT',
  
  // 试卷相关错误
  PAPER_NOT_FOUND = 'PAPER_NOT_FOUND',
  PAPER_NOT_ACTIVE = 'PAPER_NOT_ACTIVE',
  
  // 用户相关错误
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // 权限相关错误
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  CREATOR_ONLY_ACCESS = 'CREATOR_ONLY_ACCESS',
  
  // 状态转换错误
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  SESSION_ALREADY_STARTED = 'SESSION_ALREADY_STARTED',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',
}

// API错误响应
export interface IExamManagementError {
  code: ExamManagementErrorCode;
  message: string;
  details?: any;
}

// ============ 验证模式 ============

// 输入验证规则
export interface IValidationRules {
  name: {
    required: true;
    minLength: 2;
    maxLength: 100;
  };
  description: {
    maxLength: 500;
  };
  duration: {
    required: true;
    min: 5;        // 最少5分钟
    max: 480;      // 最多8小时
  };
  startTime: {
    required: true;
    format: 'ISO8601';
  };
  endTime: {
    required: true;
    format: 'ISO8601';
    afterStartTime: true;
  };
}

// ============ 权限定义 ============

// 考试管理权限
export enum ExamManagementPermission {
  // 考试会话权限
  CREATE_SESSION = 'exam:session:create',
  READ_SESSION = 'exam:session:read',
  UPDATE_SESSION = 'exam:session:update',
  DELETE_SESSION = 'exam:session:delete',
  
  // 考试状态权限
  PUBLISH_SESSION = 'exam:session:publish',
  ACTIVATE_SESSION = 'exam:session:activate',
  CANCEL_SESSION = 'exam:session:cancel',
  
  // 统计权限
  VIEW_STATISTICS = 'exam:statistics:view',
  VIEW_PARTICIPANTS = 'exam:participants:view',
  
  // 管理权限
  MANAGE_ALL_SESSIONS = 'exam:session:manage_all',
}

// 角色权限映射
export interface IRolePermissions {
  admin: ExamManagementPermission[];
  teacher: ExamManagementPermission[];
  student: ExamManagementPermission[];
}

export const ROLE_PERMISSIONS: IRolePermissions = {
  admin: [
    ExamManagementPermission.CREATE_SESSION,
    ExamManagementPermission.READ_SESSION,
    ExamManagementPermission.UPDATE_SESSION,
    ExamManagementPermission.DELETE_SESSION,
    ExamManagementPermission.PUBLISH_SESSION,
    ExamManagementPermission.ACTIVATE_SESSION,
    ExamManagementPermission.CANCEL_SESSION,
    ExamManagementPermission.VIEW_STATISTICS,
    ExamManagementPermission.VIEW_PARTICIPANTS,
    ExamManagementPermission.MANAGE_ALL_SESSIONS,
  ],
  teacher: [
    ExamManagementPermission.CREATE_SESSION,
    ExamManagementPermission.READ_SESSION,
    ExamManagementPermission.UPDATE_SESSION,
    ExamManagementPermission.DELETE_SESSION,
    ExamManagementPermission.PUBLISH_SESSION,
    ExamManagementPermission.ACTIVATE_SESSION,
    ExamManagementPermission.CANCEL_SESSION,
    ExamManagementPermission.VIEW_STATISTICS,
    ExamManagementPermission.VIEW_PARTICIPANTS,
  ],
  student: [
    ExamManagementPermission.READ_SESSION,
  ],
};