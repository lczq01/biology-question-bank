import { Types } from 'mongoose';

// 考试场次状态枚举
export enum ExamSessionStatus {
  DRAFT = 'draft',           // 草稿
  PUBLISHED = 'published',   // 已发布
  ACTIVE = 'active',         // 进行中
  COMPLETED = 'completed',   // 已结束
  CANCELLED = 'cancelled'    // 已取消
}

// 考试场次设置接口
export interface IExamSessionSettings {
  allowReview: boolean;        // 允许查看答案
  showScore: boolean;          // 显示分数
  randomOrder: boolean;        // 题目随机顺序
  timeLimit: boolean;          // 启用时间限制
  maxAttempts: number;         // 最大尝试次数
  passingScore: number;        // 及格分数
  autoGrade: boolean;          // 自动评分
  preventCheating: boolean;    // 防作弊模式
}

// 考试场次统计信息
export interface IExamSessionStats {
  totalParticipants: number;   // 总参与人数
  completedCount: number;      // 完成人数
  averageScore: number;        // 平均分
  passRate: number;           // 通过率
  averageTime: number;        // 平均用时
}

// 考试场次接口定义
export interface IExamSession {
  _id?: string;
  name: string;                // 考试名称
  description?: string;        // 考试描述
  paperId: string | Types.ObjectId; // 关联试卷ID
  creatorId: string | Types.ObjectId; // 创建者ID
  
  // 时间设置
  startTime: Date;             // 考试开始时间
  endTime: Date;               // 考试结束时间
  duration: number;            // 考试时长（分钟）
  
  // 考试状态和设置
  status: ExamSessionStatus;
  settings: IExamSessionSettings;
  
  // 参与者管理
  participants: string[];      // 允许参与的学生ID列表（空数组表示所有人可参与）
  
  // 统计信息
  stats: IExamSessionStats;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

// 创建考试场次请求接口
export interface ICreateExamSessionRequest {
  name: string;
  description?: string;
  paperId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  settings: IExamSessionSettings;
  participants?: string[];
}

// 更新考试场次请求接口
export interface IUpdateExamSessionRequest {
  name?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  settings?: Partial<IExamSessionSettings>;
  participants?: string[];
}

// 考试场次查询接口
export interface IExamSessionQuery {
  creatorId?: string;
  status?: ExamSessionStatus;
  paperId?: string;
  startDate?: Date;
  endDate?: Date;
  keyword?: string;           // 关键字搜索
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'startTime' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// 考试场次详情响应接口
export interface IExamSessionDetailResponse {
  session: IExamSession;
  paper: {
    _id: string;
    title: string;
    type: string;
    config: {
      totalQuestions: number;
      totalPoints: number;
    };
  };
  creator: {
    _id: string;
    username: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  participantCount: number;
  recordCount: number;
}

// 参与考试请求接口
export interface IJoinExamSessionRequest {
  sessionId: string;
}

// 考试场次参与者状态
export interface IParticipantStatus {
  userId: string;
  username: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  attempts: number;           // 尝试次数
  bestScore?: number;         // 最佳分数
  lastAttemptTime?: Date;     // 最后尝试时间
  status: 'not_started' | 'in_progress' | 'completed';
}