import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟用户数据
let mockUsers = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'student',
    password: 'student123',
    email: 'student@example.com',
    role: 'student',
    createdAt: new Date().toISOString()
  }
];

// 生成用户ID
const generateUserId = () => {
  return (mockUsers.length + 1).toString();
};

// 模拟题目数据
const mockQuestions = [
  {
    id: '1',
    title: '细胞膜的主要成分是什么？',
    content: '细胞膜的主要成分包括磷脂分子和蛋白质，其中磷脂分子构成膜的基本骨架。',
    type: 'single_choice',
    difficulty: 'easy',
    subject: '生物',
    chapter: '细胞的分子组成',
    keywords: ['细胞膜', '磷脂', '蛋白质'],
    options: [
      { id: 'A', text: '磷脂和蛋白质', isCorrect: true },
      { id: 'B', text: '糖类和脂类', isCorrect: false },
      { id: 'C', text: '核酸和蛋白质', isCorrect: false },
      { id: 'D', text: '纤维素和木质素', isCorrect: false }
    ],
    explanation: '细胞膜主要由磷脂双分子层构成，其中镶嵌着各种蛋白质分子。',
    points: 5,
    createdBy: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    usageCount: 0
  },
  {
    id: '2',
    title: 'DNA的双螺旋结构是由谁发现的？',
    content: 'DNA双螺旋结构的发现是分子生物学史上的重要里程碑。',
    type: 'single_choice',
    difficulty: 'medium',
    subject: '生物',
    chapter: '遗传的分子基础',
    keywords: ['DNA', '双螺旋', '沃森', '克里克'],
    options: [
      { id: 'A', text: '孟德尔', isCorrect: false },
      { id: 'B', text: '沃森和克里克', isCorrect: true },
      { id: 'C', text: '达尔文', isCorrect: false },
      { id: 'D', text: '摩尔根', isCorrect: false }
    ],
    explanation: '1953年，沃森和克里克根据X射线衍射数据提出了DNA的双螺旋结构模型。',
    points: 5,
    createdBy: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    usageCount: 0
  }
];

// 认证相关API

// 用户注册API
app.post('/api/auth/register', (req, res) => {
  const { username, password, email, role } = req.body;
  
  console.log('注册请求:', { username, email, role });
  
  // 验证必填字段
  if (!username || !password || !email || !role) {
    return res.status(400).json({
      success: false,
      message: '用户名、密码、邮箱和角色为必填项'
    });
  }
  
  // 验证用户名是否已存在
  const existingUser = mockUsers.find(u => u.username === username);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: '用户名已存在'
    });
  }
  
  // 验证邮箱是否已存在
  const existingEmail = mockUsers.find(u => u.email === email);
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: '邮箱已被注册'
    });
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: '邮箱格式不正确'
    });
  }
  
  // 验证密码长度
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: '密码长度至少6位'
    });
  }
  
  // 验证角色
  if (!['admin', 'student'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: '角色必须是admin或student'
    });
  }
  
  // 创建新用户
  const newUser = {
    id: generateUserId(),
    username,
    password, // 实际项目中应该加密存储
    email,
    role,
    createdAt: new Date().toISOString()
  };
  
  mockUsers.push(newUser);
  
  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    }
  });
});

// 用户登录API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('登录请求:', { username, password });
  
  // 查找用户
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  // 模拟JWT token
  const token = `mock_token_${user.id}_${Date.now()}`;
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  });
});

// 题目相关API

// 获取题目列表
app.get('/api/questions', (req, res) => {
  const { page = 1, limit = 10, type, difficulty, chapter, search } = req.query;
  
  let filteredQuestions = mockQuestions.filter(q => q.isActive);
  
  // 应用筛选条件
  if (type) {
    filteredQuestions = filteredQuestions.filter(q => q.type === type);
  }
  if (difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
  }
  if (chapter) {
    filteredQuestions = filteredQuestions.filter(q => q.chapter === chapter);
  }
  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filteredQuestions = filteredQuestions.filter(q => 
      q.title.toLowerCase().includes(searchTerm) || 
      q.content.toLowerCase().includes(searchTerm)
    );
  }
  
  // 分页
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      questions: paginatedQuestions,
      pagination: {
        current: pageNum,
        pageSize: limitNum,
        total: filteredQuestions.length,
        pages: Math.ceil(filteredQuestions.length / limitNum)
      }
    }
  });
});

// 获取单个题目
app.get('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const question = mockQuestions.find(q => q.id === id && q.isActive);
  
  if (!question) {
    return res.status(404).json({
      success: false,
      message: '题目不存在'
    });
  }
  
  res.json({
    success: true,
    data: question
  });
});

// 创建题目
app.post('/api/questions', (req, res) => {
  const {
    title,
    content,
    type,
    difficulty,
    chapter,
    keywords,
    options,
    correctAnswer,
    explanation,
    points
  } = req.body;
  
  // 简单验证
  if (!title || !content || !type || !difficulty || !chapter) {
    return res.status(400).json({
      success: false,
      message: '标题、内容、类型、难度和章节为必填项'
    });
  }
  
  const newQuestion = {
    id: (mockQuestions.length + 1).toString(),
    title,
    content,
    type,
    difficulty,
    subject: '生物',
    chapter,
    keywords: keywords || [],
    options: options || [],
    correctAnswer: correctAnswer || '',
    explanation: explanation || '',
    points: points || 5,
    createdBy: '1', // 模拟当前用户
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    usageCount: 0
  };
  
  mockQuestions.push(newQuestion);
  
  res.status(201).json({
    success: true,
    message: '题目创建成功',
    data: newQuestion
  });
});

// 更新题目
app.put('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const questionIndex = mockQuestions.findIndex(q => q.id === id);
  
  if (questionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '题目不存在'
    });
  }
  
  const updatedQuestion = {
    ...mockQuestions[questionIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  mockQuestions[questionIndex] = updatedQuestion;
  
  res.json({
    success: true,
    message: '题目更新成功',
    data: updatedQuestion
  });
});

// 删除题目（软删除）
app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const questionIndex = mockQuestions.findIndex(q => q.id === id);
  
  if (questionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '题目不存在'
    });
  }
  
  mockQuestions[questionIndex].isActive = false;
  
  res.json({
    success: true,
    message: '题目删除成功'
  });
});

// 获取题目统计信息
app.get('/api/questions/stats', (req, res) => {
  const activeQuestions = mockQuestions.filter(q => q.isActive);
  
  const stats = {
    total: activeQuestions.length,
    byType: {} as { [key: string]: number },
    byDifficulty: {} as { [key: string]: number },
    byChapter: {} as { [key: string]: number }
  };
  
  activeQuestions.forEach(q => {
    // 按类型统计
    stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
    
    // 按难度统计
    stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
    
    // 按章节统计
    stats.byChapter[q.chapter] = (stats.byChapter[q.chapter] || 0) + 1;
  });
  
  res.json({
    success: true,
    data: stats
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '模拟服务器运行中' });
});

app.listen(PORT, () => {
  console.log(`🚀 模拟后端服务器运行在 http://localhost:${PORT}`);
  console.log('📝 测试账户:');
  console.log('   管理员: admin / admin123');
  console.log('   学生: student / student123');
});