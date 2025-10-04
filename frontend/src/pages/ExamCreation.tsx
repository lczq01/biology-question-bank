import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Divider,
  Paper,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  Schedule as TimeIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  QuestionAnswer as QuestionIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ExamPaper {
  id: string;
  title: string;
  questions: any[];
  totalPoints: number;
  totalQuestions: number;
  type: string;
  createdAt: string;
}

interface ExamFormData {
  title: string;
  description: string;
  examPaperId: string;
  duration: number;
  startTime: string;
  endTime: string;
  maxAttempts: number;
  isTimed: boolean;
  shuffleQuestions: boolean;
  showResults: boolean;
  passingScore: number;
}

const ExamCreation: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    description: '',
    examPaperId: '',
    duration: 60,
    startTime: '',
    endTime: '',
    maxAttempts: 1,
    isTimed: true,
    shuffleQuestions: true,
    showResults: true,
    passingScore: 60
  });

  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);

  // 获取试卷列表
  const fetchExamPapers = async () => {
    try {
      setLoading(true);
      // 使用mock认证获取试卷列表
      const response = await fetch('http://localhost:3001/api/exam-paper/list', {
        headers: {
          'Authorization': `Bearer mock-token-admin`
        }
      });

      const result = await response.json();

      if (result.success) {
        setExamPapers(result.data || []);
        setError(null);
      } else {
        setError(result.message || '获取试卷列表失败');
      }
    } catch (error) {
      console.error('获取试卷列表失败:', error);
      setError('获取试卷列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单变化
  const handleInputChange = (field: keyof ExamFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'duration' || field === 'maxAttempts' || field === 'passingScore' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  // 处理开关变化
  const handleSwitchChange = (field: keyof ExamFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  // 处理试卷选择
  const handlePaperSelect = (paperId: string) => {
    setFormData(prev => ({ ...prev, examPaperId: paperId }));
    const paper = examPapers.find(p => p.id === paperId);
    setSelectedPaper(paper || null);
  };

  // 提交表单
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.title.trim()) {
      setError('请输入考试标题');
      return;
    }

    if (!formData.examPaperId) {
      setError('请选择试卷');
      return;
    }

    if (formData.isTimed && formData.duration <= 0) {
      setError('考试时长必须大于0分钟');
      return;
    }

    try {
      // 准备符合后端API的数据结构
      const examSessionData = {
        name: formData.title,  // 后端期望name字段，不是title
        description: formData.description,
        paperId: formData.examPaperId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        maxAttempts: formData.maxAttempts,
        settings: {
          allowReview: formData.showResults,
          shuffleQuestions: formData.shuffleQuestions,
          showResults: formData.showResults
        }
      };

      const response = await fetch('http://localhost:3001/api/exam-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock-token-admin`
        },
        body: JSON.stringify(examSessionData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('考试创建成功！');
        setError(null);
        // 清空表单
        setFormData({
          title: '',
          description: '',
          examPaperId: '',
          duration: 60,
          startTime: '',
          endTime: '',
          maxAttempts: 1,
          isTimed: true,
          shuffleQuestions: true,
          showResults: true,
          passingScore: 60
        });
        setSelectedPaper(null);
        
        // 3秒后跳转到考试管理页面
        setTimeout(() => {
          navigate('/exam-management');
        }, 3000);
      } else {
        setError(result.message || '创建考试失败');
      }
    } catch (error) {
      console.error('创建考试失败:', error);
      setError('创建考试失败，请稍后重试');
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchExamPapers();
  }, []);

  // 设置默认开始和结束时间
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (!formData.startTime) {
      setFormData(prev => ({
        ...prev,
        startTime: now.toISOString().slice(0, 16)
      }));
    }
    
    if (!formData.endTime) {
      setFormData(prev => ({
        ...prev,
        endTime: tomorrow.toISOString().slice(0, 16)
      }));
    }
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'white' }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            创建考试
          </Typography>
          <Typography>加载中...</Typography>
        </Container>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">创建考试</h1>
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
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* 左侧表单 */}
          <Box sx={{ width: { xs: '100%', md: '66.666%' } }}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                  考试基本信息
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="考试标题"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    margin="normal"
                    required
                    placeholder="请输入考试标题，如：高一生物期中考试"
                  />
                  
                  <TextField
                    fullWidth
                    label="考试描述"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="请输入考试描述，如：本次考试涵盖细胞生物学和遗传学相关内容"
                  />

                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>选择试卷</InputLabel>
                    <Select
                      value={formData.examPaperId}
                      onChange={(e) => handlePaperSelect(e.target.value)}
                      label="选择试卷"
                    >
                      {examPapers.map((paper) => (
                        <MenuItem key={paper.id} value={paper.id}>
                          {paper.title} ({paper.totalQuestions}题, {paper.totalPoints}分)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    考试设置
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isTimed}
                            onChange={handleSwitchChange('isTimed')}
                          />
                        }
                        label="限时考试"
                      />
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.shuffleQuestions}
                            onChange={handleSwitchChange('shuffleQuestions')}
                          />
                        }
                        label="题目随机排序"
                      />
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.showResults}
                            onChange={handleSwitchChange('showResults')}
                          />
                        }
                        label="显示考试结果"
                      />
                    </Box>
                  </Box>

                  {formData.isTimed && (
                    <TextField
                      fullWidth
                      label="考试时长（分钟）"
                      type="number"
                      value={formData.duration}
                      onChange={handleInputChange('duration')}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}

                  <TextField
                    fullWidth
                    label="最大尝试次数"
                    type="number"
                    value={formData.maxAttempts}
                    onChange={handleInputChange('maxAttempts')}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AddIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="及格分数"
                    type="number"
                    value={formData.passingScore}
                    onChange={handleInputChange('passingScore')}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GradeIcon />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">分</InputAdornment>,
                    }}
                  />

                  <TextField
                    fullWidth
                    label="考试开始时间"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleInputChange('startTime')}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    fullWidth
                    label="考试结束时间"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleInputChange('endTime')}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />

                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{
                        background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #388e3c, #4caf50)'
                        },
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      创建考试
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/exam-management')}
                      sx={{
                        borderColor: '#666',
                        color: '#666',
                        px: 4,
                        py: 1.5
                      }}
                    >
                      取消
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Box>

          {/* 右侧预览 */}
          <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  试卷预览
                </Typography>
                
                {selectedPaper ? (
                  <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {selectedPaper.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<QuestionIcon />}
                        label={`${selectedPaper.totalQuestions}题`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<GradeIcon />}
                        label={`${selectedPaper.totalPoints}分`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        label={selectedPaper.type === 'manual' ? '手动组卷' : '自动组卷'}
                        size="small"
                        color={selectedPaper.type === 'manual' ? 'secondary' : 'info'}
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      创建时间：{new Date(selectedPaper.createdAt).toLocaleDateString('zh-CN')}
                    </Typography>
                  </Paper>
                ) : (
                  <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      请选择试卷以预览
                    </Typography>
                  </Paper>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  考试设置预览
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>考试类型：</strong>
                    {formData.isTimed ? `限时考试（${formData.duration}分钟）` : '不限时考试'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>题目顺序：</strong>
                    {formData.shuffleQuestions ? '随机排序' : '固定顺序'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>尝试次数：</strong>
                    {formData.maxAttempts} 次
                  </Typography>
                  <Typography variant="body2">
                    <strong>及格分数：</strong>
                    {formData.passingScore} 分
                  </Typography>
                  {formData.startTime && (
                    <Typography variant="body2">
                      <strong>开始时间：</strong>
                      {new Date(formData.startTime).toLocaleString('zh-CN')}
                    </Typography>
                  )}
                  {formData.endTime && (
                    <Typography variant="body2">
                      <strong>结束时间：</strong>
                      {new Date(formData.endTime).toLocaleString('zh-CN')}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default ExamCreation;