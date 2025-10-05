import axios from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/auth';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// 考试相关API
export const examAPI = {
  // 获取考试会话列表
  getExamSessions: async (params?: { limit?: number; page?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const response = await api.get(`/exam-sessions?${queryParams.toString()}`);
    return response.data;
  },

  // 获取学生可参与的考试会话列表
  getAvailableExamSessions: async (params?: { limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const response = await api.get(`/exam-sessions/available?${queryParams.toString()}`);
    return response.data;
  },

  // 获取考试会话详情
  getExamSessionDetails: async (sessionId: string) => {
    const response = await api.get(`/exam-sessions/${sessionId}`);
    return response.data;
  },

  // 获取学生视角的考试会话详情
  getStudentExamSessionDetails: async (sessionId: string) => {
    const response = await api.get(`/exam-sessions/${sessionId}/student-view`);
    return response.data;
  },

  // 学生加入考试会话
  joinExamSession: async (sessionId: string) => {
    const response = await api.post(`/exam-sessions/${sessionId}/join`);
    return response.data;
  },

  // 开始考试
  startExam: async (sessionId: string) => {
    const response = await api.post(`/exam-sessions/${sessionId}/start`);
    return response.data;
  },

  // 获取考试进度
  getExamProgress: async (sessionId: string) => {
    const response = await api.get(`/exam-sessions/${sessionId}/progress`);
    return response.data;
  },

  // 提交答案
  submitAnswer: async (examId: string, questionId: string, answer: string | string[]) => {
    const response = await api.post('/exam-sessions/answer', {
      examId,
      questionId,
      answer
    });
    return response.data;
  },

  // 提交考试
  submitExam: async (examId: string) => {
    const response = await api.post('/exam-sessions/submit', {
      examId
    });
    return response.data;
  },

  // 完成考试
  completeExam: async (recordId: string) => {
    const response = await api.post('/exam/complete', {
      recordId
    });
    return response.data;
  },

  // 获取考试结果
  getExamResult: async (recordId: string) => {
    const response = await api.get(`/exam/result/${recordId}`);
    return response.data;
  },

  // 获取考试历史
  getExamHistory: async (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const response = await api.get(`/exam/history?${queryParams.toString()}`);
    return response.data;
  },

  // 获取考试统计
  getExamStatistics: async (params?: { period?: string; examType?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.examType) queryParams.append('examType', params.examType);
    
    const response = await api.get(`/exam/statistics?${queryParams.toString()}`);
    return response.data;
  },

  // 重新评分
  regradeExam: async (recordId: string) => {
    const response = await api.post(`/exam/regrade/${recordId}`);
    return response.data;
  }
};

export default api;