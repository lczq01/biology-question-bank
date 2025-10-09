import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  Schedule as TimeIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ExamFormData {
  title: string;
  description: string;
  duration: number;
  startTime: string;
  endTime: string;
  allowRetake: boolean;
  shuffleQuestions: boolean;
  passingScore: number;
}

const ExamCreation: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    description: '',
    duration: 60,
    startTime: '',
    endTime: '',
    allowRetake: false,
    shuffleQuestions: true,
    passingScore: 60
  });

  // 处理表单变化
  const handleInputChange = (field: keyof ExamFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'duration' || field === 'passingScore' 
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

  // 提交表单
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.title.trim()) {
      setError('请输入考试标题');
      return;
    }

    if (formData.duration < 0) {
      setError('考试时长不能为负数');
      return;
    }

    try {
      // 准备符合后端API的数据结构
      const examSessionData = {
        name: formData.title,  // 后端期望name字段，不是title
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        settings: {
          allowRetake: formData.allowRetake,
          shuffleQuestions: formData.shuffleQuestions,
          passingScore: formData.passingScore
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
          duration: 60,
          startTime: '',
          endTime: '',
          allowRetake: false,
          shuffleQuestions: true,
          passingScore: 60
        });
        
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



  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* 顶部导航栏 */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/exam-management')}
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

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    考试设置
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.allowRetake}
                            onChange={handleSwitchChange('allowRetake')}
                          />
                        }
                        label="是否允许重考"
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
                  </Box>

                  <TextField
                    fullWidth
                    label="考试时长（分钟，0表示不限时）"
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
                    label="考试开放时间"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleInputChange('startTime')}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    helperText="学生可以开始参加考试的时间"
                  />

                  <TextField
                    fullWidth
                    label="考试关闭时间"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleInputChange('endTime')}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    helperText="学生不能再开始新考试的时间"
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
                  考试设置预览
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>考试时长：</strong>
                    {formData.duration === 0 ? '不限时' : `${formData.duration}分钟`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>是否允许重考：</strong>
                    {formData.allowRetake ? '是' : '否'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>题目顺序：</strong>
                    {formData.shuffleQuestions ? '随机排序' : '固定顺序'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>及格分数：</strong>
                    {formData.passingScore} 分
                  </Typography>
                  {formData.startTime && (
                    <Typography variant="body2">
                      <strong>开放时间：</strong>
                      {new Date(formData.startTime).toLocaleString('zh-CN')}
                    </Typography>
                  )}
                  {formData.endTime && (
                    <Typography variant="body2">
                      <strong>关闭时间：</strong>
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