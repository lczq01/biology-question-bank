import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Schedule as TimeIcon,
  Grade as GradeIcon,
  QuestionAnswer as QuestionIcon,
  AutoMode as AutoModeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer';

interface ExamPaper {
  id: string;
  title: string;
  questions: any[];
  totalPoints: number;
  totalQuestions: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  type: string;
}

const ExamPaperManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 获取试卷列表
  const fetchExamPapers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/exam-paper/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  // 删除试卷
  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('确定要删除这份试卷吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/exam-paper/${paperId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('试卷删除成功');
        fetchExamPapers(); // 重新获取列表
      } else {
        alert(`删除失败：${result.message}`);
      }
    } catch (error) {
      console.error('删除试卷失败:', error);
      alert('删除试卷失败，请稍后重试');
    }
  };

  // 查看试卷详情
  const handleViewPaper = async (paperId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/exam-paper/${paperId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSelectedPaper(result.data);
        setViewDialogOpen(true);
      } else {
        alert(`获取试卷详情失败：${result.message}`);
      }
    } catch (error) {
      console.error('获取试卷详情失败:', error);
      alert('获取试卷详情失败，请稍后重试');
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'single_choice': '单选题',
      'multiple_choice': '多选题',
      'fill_blank': '填空题'
    };
    return typeMap[type] || type;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const difficultyMap: { [key: string]: string } = {
      'easy': '容易',
      'medium': '中等',
      'hard': '困难'
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    fetchExamPapers();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          试卷管理
        </Typography>
        <Typography>加载中...</Typography>
      </Container>
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
            <h1 className="text-2xl font-bold">试卷管理</h1>
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

      {/* 组卷功能按钮 */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AssignmentIcon />}
          onClick={() => navigate('/questions')}
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
          手动组卷
        </Button>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<AutoModeIcon />}
          onClick={() => navigate('/exam-paper-generation')}
          sx={{
            background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1976d2, #2196f3)'
            },
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          自动组卷
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {examPapers.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <AssignmentIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              暂无试卷
            </Typography>
            <Typography variant="body2" color="text.secondary">
              您还没有创建任何试卷，请前往题目管理页面使用试题篮功能创建试卷
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {examPapers.map((paper) => (
            <Box key={paper.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 'bold',
                    color: '#333',
                    minHeight: '3em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {paper.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<QuestionIcon />}
                      label={`${paper.totalQuestions}题`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<GradeIcon />}
                      label={`${paper.totalPoints}分`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={paper.type === 'manual' ? '手动组卷' : '自动组卷'}
                      size="small"
                      color={paper.type === 'manual' ? 'secondary' : 'info'}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                    <TimeIcon sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="caption">
                      创建时间：{formatDate(paper.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    创建者：{paper.createdBy}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewPaper(paper.id)}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#4caf50',
                      color: '#4caf50',
                      '&:hover': {
                        borderColor: '#388e3c',
                        background: '#e8f5e8'
                      }
                    }}
                  >
                    查看详情
                  </Button>
                  
                  <Tooltip title="删除试卷">
                    <IconButton
                      onClick={() => handleDeletePaper(paper.id)}
                      size="small"
                      sx={{ 
                        color: '#f44336',
                        '&:hover': {
                          background: '#ffebee'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* 试卷详情对话框 */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          试卷详情
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {selectedPaper && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {selectedPaper.title}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  icon={<QuestionIcon />}
                  label={`总题数：${selectedPaper.totalQuestions}`}
                  color="primary"
                />
                <Chip
                  icon={<GradeIcon />}
                  label={`总分：${selectedPaper.totalPoints}分`}
                  color="success"
                />
                <Chip
                  label={selectedPaper.type === 'manual' ? '手动组卷' : '自动组卷'}
                  color={selectedPaper.type === 'manual' ? 'secondary' : 'info'}
                />
              </Box>
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
                题目列表：
              </Typography>
              
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {selectedPaper.questions.map((question, index) => (
                  <React.Fragment key={question._id || index}>
                    <ListItem sx={{ alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {index + 1}. 
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <SafeHtmlRenderer 
                                html={question.content || '题目内容'} 
                                maxLength={100}
                              />
                            </Box>
                            {question.explanation && (
                              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>
                                  解析：
                                </Typography>
                                <SafeHtmlRenderer 
                                  html={question.explanation} 
                                  maxLength={150}
                                />
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip
                                label={getTypeLabel(question.type)}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={getDifficultyLabel(question.difficulty)}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                              <Chip
                                label={question.chapter}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                              <Chip
                                label={`${question.points || 0}分`}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < selectedPaper.questions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </div>
  );
};

export default ExamPaperManagement;