import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Stack,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  NavigateBefore as BackIcon,
  NavigateNext as NextIcon,
  Assignment as AssignmentIcon,
  AutoAwesome as AutoModeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExamBasket } from '../contexts/ExamBasketContext';

interface ExamQuestion {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  points: number;
  order: number;
}

const ExamPaperManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { basketState, clearBasket } = useExamBasket();
  
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [tempPoints, setTempPoints] = useState<number>(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, questionId: string | null }>({ open: false, questionId: null });

  // 从试题篮或URL参数初始化题目数据
  useEffect(() => {
    const initializeQuestions = () => {
      // 优先从试题篮获取数据
      if (basketState.examBasket && basketState.examBasket.length > 0) {
        const basketQuestions: ExamQuestion[] = basketState.examBasket.map((item, index) => ({
          id: item.question.id,
          title: item.question.content || `题目 ${index + 1}`,
          type: item.question.type || '选择题',
          difficulty: item.question.difficulty || '中等',
          points: item.points || 5,
          order: index + 1
        }));
        setQuestions(basketQuestions);
        setSuccess(`已从试题篮加载 ${basketQuestions.length} 道题目`);
      } else {
        // 如果没有试题篮数据，显示示例数据或空状态
        setQuestions([]);
        setError('暂无题目数据，请先选择题目');
      }
    };

    initializeQuestions();
  }, [basketState.examBasket]);

  // 处理题目排序
  const moveQuestionUp = (index: number) => {
    if (index <= 0) return;
    
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    
    // 更新排序序号
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });
    
    setQuestions(newQuestions);
    setSuccess('题目顺序已调整');
  };

  const moveQuestionDown = (index: number) => {
    if (index >= questions.length - 1) return;
    
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    
    // 更新排序序号
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });
    
    setQuestions(newQuestions);
    setSuccess('题目顺序已调整');
  };

  // 开始编辑分值
  const startEditingPoints = (questionId: string, currentPoints: number) => {
    setEditingQuestion(questionId);
    setTempPoints(currentPoints);
  };

  // 保存分值修改
  const savePoints = (questionId: string) => {
    const newQuestions = questions.map(q => 
      q.id === questionId ? { ...q, points: tempPoints } : q
    );
    setQuestions(newQuestions);
    setEditingQuestion(null);
    setSuccess('分值设置已保存');
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingQuestion(null);
    setTempPoints(0);
  };

  // 删除题目
  const deleteQuestion = (questionId: string) => {
    const newQuestions = questions.filter(q => q.id !== questionId);
    
    // 更新排序序号
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });
    
    setQuestions(newQuestions);
    setConfirmDialog({ open: false, questionId: null });
    setSuccess('题目已删除');
  };

  // 计算总分
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // 保存试卷配置
  const saveExamPaper = () => {
    // 这里可以调用API保存试卷配置
    setSuccess('试卷配置已保存');
    
    // 清空试题篮
    clearBasket();
  };

  // 跳转到考试创建页面
  const goToExamCreation = () => {
    navigate('/exam-creation');
  };

  // 处理手动组卷
  const handleManualGeneration = () => {
    // 跳转到题目管理页面进行手动组卷
    window.location.href = 'http://localhost:5173/questions?source=exam';
  };

  // 处理自动组卷
  const handleAutoGeneration = () => {
    // 跳转到自动组卷页面
    navigate('/exam-paper-generation');
  };

  // 清除消息
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* 顶部导航栏 */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 hover:bg-purple-600 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">考试卷管理</h1>
            <Typography variant="body2" sx={{ ml: 2, opacity: 0.8 }}>
              管理考试题目配置和试卷设置
            </Typography>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-purple-100">欢迎, {user?.username}</span>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              控制台
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* 消息提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* 操作工具栏 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AssignmentIcon />}
                  onClick={handleManualGeneration}
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388e3c, #4caf50)'
                    }
                  }}
                >
                  手动组卷
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<AutoModeIcon />}
                  onClick={handleAutoGeneration}
                  sx={{
                    background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1976d2, #2196f3)'
                    }
                  }}
                >
                  自动组卷
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<NextIcon />}
                  onClick={goToExamCreation}
                  sx={{
                    background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f57c00, #ff9800)'
                    }
                  }}
                >
                  前往考试创建
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="h6" color="primary">
                  总分: {totalPoints} 分
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveExamPaper}
                  disabled={questions.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388e3c, #4caf50)'
                    }
                  }}
                >
                  保存试卷配置
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 题目管理表格 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              考试题目管理 ({questions.length} 道题目)
            </Typography>

            {questions.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  暂无题目数据
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  暂无题目数据
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="60px">序号</TableCell>
                      <TableCell>题目信息</TableCell>
                      <TableCell width="120px">题型</TableCell>
                      <TableCell width="100px">难度</TableCell>
                      <TableCell width="150px">分值设置</TableCell>
                      <TableCell width="120px">排序操作</TableCell>
                      <TableCell width="80px">删除</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questions.map((question, index) => (
                      <TableRow key={question.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {question.order}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {question.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={question.type} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={question.difficulty} 
                            size="small" 
                            color={
                              question.difficulty === '简单' ? 'success' :
                              question.difficulty === '中等' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {editingQuestion === question.id ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TextField
                                size="small"
                                type="number"
                                value={tempPoints}
                                onChange={(e) => setTempPoints(Number(e.target.value))}
                                inputProps={{ min: 1, max: 100 }}
                                sx={{ width: 80 }}
                              />
                              <IconButton size="small" onClick={() => savePoints(question.id)}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={cancelEditing}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {question.points} 分
                              </Typography>
                              <Tooltip title="编辑分值">
                                <IconButton 
                                  size="small" 
                                  onClick={() => startEditingPoints(question.id, question.points)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="上移">
                              <IconButton 
                                size="small" 
                                disabled={index === 0}
                                onClick={() => moveQuestionUp(index)}
                              >
                                <ArrowUpIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="下移">
                              <IconButton 
                                size="small" 
                                disabled={index === questions.length - 1}
                                onClick={() => moveQuestionDown(index)}
                              >
                                <ArrowDownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="删除题目">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => setConfirmDialog({ open: true, questionId: question.id })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* 删除确认对话框 */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, questionId: null })}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除这道题目吗？此操作不可恢复。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, questionId: null })}>
            取消
          </Button>
          <Button 
            onClick={() => confirmDialog.questionId && deleteQuestion(confirmDialog.questionId)} 
            color="error"
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExamPaperManagement;