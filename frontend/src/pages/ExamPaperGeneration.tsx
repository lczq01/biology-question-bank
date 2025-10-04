import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  TextField, 
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

// 题目配置接口
interface QuestionConfig {
  id: string;
  type: string;
  difficulty: string;
  chapters: string[];
  count: number;
  pointsPerQuestion: number;
}

// 生成的试卷接口
interface GeneratedExamPaper {
  id: string;
  title: string;
  questions: any[];
  totalQuestions: number;
  totalPoints: number;
  difficultyBreakdown: {
    简单: number;
    中等: number;
    困难: number;
  };
  typeBreakdown: {
    single_choice: number;
    multiple_choice: number;
    fill_blank: number;
  };
  createdAt: string;
  createdBy: string;
}

const ExamPaperGeneration: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [examTitle, setExamTitle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedExamPaper | null>(null);
  const [error, setError] = useState<string>('');
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  
  // 题目配置列表
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfig[]>([]);
  
  // 当前编辑的配置
  const [currentConfig, setCurrentConfig] = useState({
    type: '',
    difficulty: '',
    chapters: [] as string[],
    count: 1,
    pointsPerQuestion: 5
  });
  
  // 编辑模式
  const [editingId, setEditingId] = useState<string | null>(null);

  // 题型选项
  const questionTypes = [
    { value: 'single_choice', label: '单选题' },
    { value: 'multiple_choice', label: '多选题' },
    { value: 'fill_blank', label: '填空题' }
  ];

  // 难度选项
  const difficultyOptions = [
    { value: '简单', label: '简单' },
    { value: '中等', label: '中等' },
    { value: '困难', label: '困难' }
  ];

  // 获取可用章节
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/questions/filter-options', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setAvailableChapters(result.data.chapters || []);
        }
      } catch (error) {
        console.error('获取章节列表失败:', error);
      }
    };
    fetchChapters();
  }, []);

  // 添加或更新配置
  const handleAddOrUpdateConfig = () => {
    if (!currentConfig.type || !currentConfig.difficulty || currentConfig.chapters.length === 0) {
      setError('请填写完整的配置信息');
      return;
    }
    
    if (currentConfig.count < 1 || currentConfig.count > 50) {
      setError('题目数量必须在1-50之间');
      return;
    }
    
    if (currentConfig.pointsPerQuestion < 1 || currentConfig.pointsPerQuestion > 20) {
      setError('每题分值必须在1-20之间');
      return;
    }

    if (editingId) {
      // 更新现有配置
      setQuestionConfigs(prev => prev.map(config => 
        config.id === editingId 
          ? { ...currentConfig, id: editingId }
          : config
      ));
      setEditingId(null);
    } else {
      // 添加新配置
      const newConfig: QuestionConfig = {
        ...currentConfig,
        id: Date.now().toString()
      };
      setQuestionConfigs(prev => [...prev, newConfig]);
    }

    // 重置表单
    setCurrentConfig({
      type: '',
      difficulty: '',
      chapters: [] as string[],
      count: 1,
      pointsPerQuestion: 5
    });
    setError('');
  };

  // 编辑配置
  const handleEditConfig = (config: QuestionConfig) => {
    setCurrentConfig({
      type: config.type,
      difficulty: config.difficulty,
      chapters: config.chapters,
      count: config.count,
      pointsPerQuestion: config.pointsPerQuestion
    });
    setEditingId(config.id);
  };

  // 删除配置
  const handleDeleteConfig = (id: string) => {
    setQuestionConfigs(prev => prev.filter(config => config.id !== id));
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setCurrentConfig({
      type: '',
      difficulty: '',
      chapters: [] as string[],
      count: 1,
      pointsPerQuestion: 5
    });
    setEditingId(null);
  };

  // 计算总计信息
  const getTotalStats = () => {
    const totalQuestions = questionConfigs.reduce((sum, config) => sum + config.count, 0);
    const totalPoints = questionConfigs.reduce((sum, config) => sum + (config.count * config.pointsPerQuestion), 0);
    return { totalQuestions, totalPoints };
  };

  // 生成试卷
  const handleGenerateExam = async () => {
    if (!examTitle.trim()) {
      setError('请输入试卷标题');
      return;
    }

    if (questionConfigs.length === 0) {
      setError('请至少添加一个题目配置');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const { totalQuestions, totalPoints } = getTotalStats();
      
      // 构建难度分布
      const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
      questionConfigs.forEach(config => {
        if (config.difficulty === '简单') difficultyDistribution.easy += config.count;
        else if (config.difficulty === '中等') difficultyDistribution.medium += config.count;
        else if (config.difficulty === '困难') difficultyDistribution.hard += config.count;
      });

      // 构建题型分布
      const typeDistribution = { single_choice: 0, multiple_choice: 0, fill_blank: 0 };
      questionConfigs.forEach(config => {
        typeDistribution[config.type as keyof typeof typeDistribution] += config.count;
      });

      // 构建章节列表
      const chapters = [...new Set(questionConfigs.flatMap(config => config.chapters))];

      const url = 'http://localhost:3001/api/exam-paper/generate/custom';
      const body = {
        title: examTitle.trim(),
        createdBy: user?.username || 'unknown',
        config: {
          totalQuestions,
          totalPoints,
          difficultyDistribution,
          typeDistribution,
          chapters,
          questionConfigs // 传递详细的配置信息
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedPaper(result.data);
        setError('');
      } else {
        setError(result.message || '生成试卷失败');
      }
    } catch (err) {
      console.error('生成试卷错误:', err);
      setError('网络错误，请检查服务器连接');
    } finally {
      setIsGenerating(false);
    }
  };

  const { totalQuestions, totalPoints } = getTotalStats();

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* 顶部导航栏 */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 hover:bg-green-600 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">智能组卷</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-100">欢迎, {user?.username}</span>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              控制台
            </button>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">智能组卷系统</h2>
          <p className="text-gray-600">灵活配置，精准组卷</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：配置添加区域 */}
          <div className="space-y-6">
            {/* 添加题目配置 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingId ? '编辑题目配置' : '添加题目配置'}
                </h3>
                
                <div className="space-y-4">
                  {/* 题型选择 */}
                  <FormControl fullWidth size="small">
                    <InputLabel>题型</InputLabel>
                    <Select
                      value={currentConfig.type}
                      label="题型"
                      onChange={(e) => setCurrentConfig(prev => ({ ...prev, type: e.target.value }))}
                    >
                      {questionTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* 难度选择 */}
                  <FormControl fullWidth size="small">
                    <InputLabel>难度</InputLabel>
                    <Select
                      value={currentConfig.difficulty}
                      label="难度"
                      onChange={(e) => setCurrentConfig(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      {difficultyOptions.map(difficulty => (
                        <MenuItem key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* 章节选择 */}
                  <FormControl fullWidth size="small">
                    <InputLabel>章节</InputLabel>
                    <Select
                      multiple
                      value={currentConfig.chapters}
                      label="章节"
                      onChange={(e) => setCurrentConfig(prev => ({ 
                        ...prev, 
                        chapters: typeof e.target.value === 'string' ? [e.target.value] : e.target.value 
                      }))}
                      renderValue={(selected) => (
                        <div className="flex flex-wrap gap-1">
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </div>
                      )}
                    >
                      {availableChapters.map(chapter => (
                        <MenuItem key={chapter} value={chapter}>
                          {chapter}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* 题目数量和分值 */}
                  <div className="grid grid-cols-2 gap-4">
                    <TextField
                      label="题目数量"
                      type="number"
                      size="small"
                      value={currentConfig.count}
                      onChange={(e) => setCurrentConfig(prev => ({ 
                        ...prev, 
                        count: Math.max(1, parseInt(e.target.value) || 1) 
                      }))}
                      inputProps={{ min: 1, max: 50 }}
                    />
                    <TextField
                      label="每题分值"
                      type="number"
                      size="small"
                      value={currentConfig.pointsPerQuestion}
                      onChange={(e) => setCurrentConfig(prev => ({ 
                        ...prev, 
                        pointsPerQuestion: Math.max(1, parseInt(e.target.value) || 1) 
                      }))}
                      inputProps={{ min: 1, max: 20 }}
                    />
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex space-x-2">
                    <Button
                      variant="contained"
                      onClick={handleAddOrUpdateConfig}
                      disabled={!currentConfig.type || !currentConfig.difficulty || currentConfig.chapters.length === 0}
                      className="flex-1"
                    >
                      {editingId ? '更新配置' : '添加配置'}
                    </Button>
                    {editingId && (
                      <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                      >
                        取消
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 试卷基本信息 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">试卷信息</h3>
                
                <div className="space-y-4">
                  <TextField
                    label="试卷标题"
                    fullWidth
                    size="small"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="请输入试卷标题"
                  />

                  {/* 统计信息 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">总题目数：</span>
                        <span className="font-semibold text-blue-600">{totalQuestions}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">总分值：</span>
                        <span className="font-semibold text-green-600">{totalPoints}</span>
                      </div>
                    </div>
                  </div>

                  {/* 错误信息 */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {/* 生成按钮 */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleGenerateExam}
                    disabled={isGenerating || !examTitle.trim() || questionConfigs.length === 0}
                    className="mt-4"
                  >
                    {isGenerating ? '正在生成试卷...' : '生成试卷'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：配置列表 */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  题目配置列表 ({questionConfigs.length})
                </h3>
                
                {questionConfigs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无配置，请添加题目配置</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {questionConfigs.map((config, index) => (
                      <div
                        key={config.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Chip 
                                label={questionTypes.find(t => t.value === config.type)?.label} 
                                size="small" 
                                color="primary" 
                              />
                              <Chip 
                                label={config.difficulty} 
                                size="small" 
                                color="secondary" 
                              />
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>章节：{config.chapters.join(', ')}</div>
                              <div>数量：{config.count}道</div>
                              <div>分值：每题{config.pointsPerQuestion}分，共{config.count * config.pointsPerQuestion}分</div>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <IconButton
                              size="small"
                              onClick={() => handleEditConfig(config)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteConfig(config.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 生成结果 */}
        {generatedPaper && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">生成成功</h3>
              
              {/* 试卷基本信息 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-2">{generatedPaper.title}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700">
                  <div>试卷ID: {generatedPaper.id}</div>
                  <div>题目数量: {generatedPaper.totalQuestions}题</div>
                  <div>总分: {generatedPaper.totalPoints}分</div>
                  <div>创建时间: {new Date(generatedPaper.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setGeneratedPaper(null);
                    setExamTitle('');
                    setQuestionConfigs([]);
                  }}
                >
                  重新生成
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    alert('预览功能将在后续版本中实现');
                  }}
                >
                  预览试卷
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    alert('导出功能将在后续版本中实现');
                  }}
                >
                  导出试卷
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    if (window.confirm('确定要删除这份试卷吗？此操作不可撤销。')) {
                      setGeneratedPaper(null);
                      setError('');
                      // 这里可以添加调用后端API删除试卷的逻辑
                      // 目前只是清除前端显示
                    }
                  }}
                >
                  删除试卷
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExamPaperGeneration;