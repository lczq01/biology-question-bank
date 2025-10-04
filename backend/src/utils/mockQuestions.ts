// 模拟题目数据服务
export interface MockQuestion {
  id: string;
  content: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: '简单' | '中等' | '困难';
  chapter: string;
  type: '选择题' | '填空题';
  createdAt: string;
  updatedAt: string;
}

// 模拟题目数据
export const mockQuestions: MockQuestion[] = [
  {
    id: '1',
    content: '细胞膜的主要成分是什么？',
    options: {
      A: '蛋白质',
      B: '磷脂双分子层',
      C: '糖类',
      D: '核酸'
    },
    correctAnswer: 'B',
    difficulty: '中等',
    chapter: '细胞的结构和功能',
    type: '选择题',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    content: 'DNA的双螺旋结构是由哪两位科学家提出的？',
    options: {
      A: '达尔文和孟德尔',
      B: '沃森和克里克',
      C: '巴斯德和科赫',
      D: '施莱登和施旺'
    },
    correctAnswer: 'B',
    difficulty: '简单',
    chapter: '遗传的分子基础',
    type: '选择题',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  },
  {
    id: '3',
    content: '光合作用的光反应阶段主要发生在叶绿体的哪个部位？',
    options: {
      A: '基质',
      B: '类囊体膜',
      C: '外膜',
      D: '内膜'
    },
    correctAnswer: 'B',
    difficulty: '中等',
    chapter: '光合作用',
    type: '选择题',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z'
  },
  {
    id: '4',
    content: '酶的催化特点不包括以下哪一项？',
    options: {
      A: '高效性',
      B: '专一性',
      C: '不可逆性',
      D: '受温度影响'
    },
    correctAnswer: 'C',
    difficulty: '困难',
    chapter: '酶与ATP',
    type: '选择题',
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z'
  },
  {
    id: '5',
    content: '细胞呼吸的第三阶段是什么？',
    options: {
      A: '糖酵解',
      B: '柠檬酸循环',
      C: '电子传递链',
      D: '乳酸发酵'
    },
    correctAnswer: 'C',
    difficulty: '中等',
    chapter: '细胞呼吸',
    type: '选择题',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z'
  }
];

export class MockQuestionService {
  private questions: MockQuestion[] = [...mockQuestions];
  private nextId = 6;

  // 获取题目列表
  async getQuestions(page: number = 1, limit: number = 10, filters?: {
    difficulty?: string;
    chapter?: string;
    type?: string;
    search?: string;
  }) {
    let filteredQuestions = [...this.questions];

    // 应用筛选条件
    if (filters) {
      if (filters.difficulty) {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
      }
      if (filters.chapter) {
        filteredQuestions = filteredQuestions.filter(q => q.chapter === filters.chapter);
      }
      if (filters.type) {
        filteredQuestions = filteredQuestions.filter(q => q.type === filters.type);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredQuestions = filteredQuestions.filter(q => 
          q.content.toLowerCase().includes(searchLower) ||
          Object.values(q.options).some(option => option.toLowerCase().includes(searchLower))
        );
      }
    }

    // 分页
    const total = filteredQuestions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        questions: paginatedQuestions,
        pagination: {
          current: page,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  // 根据ID获取题目
  async getQuestionById(id: string) {
    const question = this.questions.find(q => q.id === id);
    if (!question) {
      return {
        success: false,
        message: '题目不存在'
      };
    }
    return {
      success: true,
      data: question
    };
  }

  // 创建题目
  async createQuestion(questionData: Omit<MockQuestion, 'id' | 'createdAt' | 'updatedAt'>) {
    const newQuestion: MockQuestion = {
      ...questionData,
      id: this.nextId.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.questions.push(newQuestion);
    this.nextId++;
    
    return {
      success: true,
      data: newQuestion,
      message: '题目创建成功'
    };
  }

  // 更新题目
  async updateQuestion(id: string, updateData: Partial<Omit<MockQuestion, 'id' | 'createdAt' | 'updatedAt'>>) {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) {
      return {
        success: false,
        message: '题目不存在'
      };
    }

    this.questions[questionIndex] = {
      ...this.questions[questionIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      data: this.questions[questionIndex],
      message: '题目更新成功'
    };
  }

  // 删除题目
  async deleteQuestion(id: string) {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) {
      return {
        success: false,
        message: '题目不存在'
      };
    }

    this.questions.splice(questionIndex, 1);
    return {
      success: true,
      message: '题目删除成功'
    };
  }

  // 获取统计信息
  async getStats() {
    const total = this.questions.length;
    const byDifficulty = {
      简单: this.questions.filter(q => q.difficulty === '简单').length,
      中等: this.questions.filter(q => q.difficulty === '中等').length,
      困难: this.questions.filter(q => q.difficulty === '困难').length
    };
    const byType = {
      选择题: this.questions.filter(q => q.type === '选择题').length,
      填空题: this.questions.filter(q => q.type === '填空题').length
    };

    return {
      success: true,
      data: {
        total,
        byDifficulty,
        byType
      }
    };
  }
}

export const mockQuestionService = new MockQuestionService();