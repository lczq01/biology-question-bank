// 考试API配置
const API_BASE_URL = 'http://localhost:3001/api';
const MOCK_TOKEN = 'mock-token-admin'; // 后端mock认证系统要求的固定token

// Exam API端点
export const examApi = {
  // 获取考试列表
  getExams: (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    return fetch(`${API_BASE_URL}/exam-sessions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`
      }
    });
  },

  // 获取考试详情
  getExam: (examId: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${examId}`, {
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`
      }
    });
  },

  // 创建考试
  createExam: (examData: any) => {
    return fetch(`${API_BASE_URL}/exam-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOCK_TOKEN}`
      },
      body: JSON.stringify(examData)
    });
  },

  // 更新考试
  updateExam: (examId: string, examData: any) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${examId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(examData)
    });
  },

  // 删除考试
  deleteExam: (examId: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${examId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`
      }
    });
  },

  // 更新考试状态
  updateExamStatus: (examId: string, status: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${examId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
  },

  // 批量更新考试状态
  batchUpdateExamStatus: (examIds: string[], status: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/batch-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ examIds, status })
    });
  },

  // 获取可用考试（学生端）
  getAvailableExams: () => {
    return fetch(`${API_BASE_URL}/exam-sessions/available`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 验证学生参与权限
  validateParticipation: (examId: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${examId}/validate-participation`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 开始考试
  startExam: (examId: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${examId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 提交答案
  submitAnswer: (sessionId: string, questionId: string, answer: any) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${sessionId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ questionId, answer })
    });
  },

  // 获取考试进度
  getExamProgress: (sessionId: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${sessionId}/progress`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 提交考试
  submitExam: (sessionId: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 获取考试结果
  getExamResult: (sessionId: string) => {
    return fetch(`${API_BASE_URL}/exam-sessions/${sessionId}/result`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
};

// 试卷生成API（保持原有功能）
export const paperGenerationApi = {
  // 生成自定义试卷
  generateCustomPaper: (config: any) => {
    return fetch(`${API_BASE_URL}/exams/generate/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(config)
    });
  },

  // 快速生成试卷
  generateQuickPaper: (config: any) => {
    return fetch(`${API_BASE_URL}/exams/generate/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(config)
    });
  }
};

// 题目管理API
export const questionApi = {
  // 获取题目列表
  getQuestions: (params?: { page?: number; limit?: number; type?: string; difficulty?: string; chapter?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.chapter) queryParams.append('chapter', params.chapter);
    if (params?.search) queryParams.append('search', params.search);
    
    return fetch(`${API_BASE_URL}/questions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 获取题目详情
  getQuestion: (questionId: string) => {
    return fetch(`${API_BASE_URL}/questions/${questionId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 创建题目
  createQuestion: (questionData: any) => {
    return fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(questionData)
    });
  },

  // 更新题目
  updateQuestion: (questionId: string, questionData: any) => {
    return fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(questionData)
    });
  },

  // 删除题目
  deleteQuestion: (questionId: string) => {
    return fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 获取题目章节列表
  getQuestionChapters: () => {
    return fetch(`${API_BASE_URL}/questions/chapters`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 获取题目筛选选项
  getQuestionFilterOptions: () => {
    return fetch(`${API_BASE_URL}/questions/filter-options`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // 批量导入题目
  importQuestions: (questionsData: any[]) => {
    return fetch(`${API_BASE_URL}/questions/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ questions: questionsData })
    });
  }
};