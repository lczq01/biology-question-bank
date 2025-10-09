import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../../utils/examApi';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Checkbox,
  TextField
} from '@mui/material';
import { ArrowBack, ArrowForward, Check, Timer } from '@mui/icons-material';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

interface ExamPaper {
  id: string;
  title: string;
  questions: Question[];
  duration: number;
}

const PreviewExamPage: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 默认60分钟
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExamPaper = async () => {
      if (!paperId) {
        setError('试卷ID不存在');
        setLoading(false);
        return;
      }

      try {
        const response = await examApi.getExam(paperId);
        
        if (!response.ok) {
          throw new Error('获取试卷信息失败');
        }
        
        const data = await response.json();
        if (data.success) {
          setExamPaper(data.data);
          setTimeLeft((data.data.duration || 60) * 60); // 转换为秒
        } else {
          throw new Error(data.message || '获取试卷信息失败');
        }
      } catch (err) {
        setError('获取试卷信息失败');
        console.error('获取试卷信息失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamPaper();
  }, [paperId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const currentQuestion = examPaper?.questions[currentQuestionIndex];

  const handleAnswerChange = (value: string | string[]) => {
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value
      }));
    }
  };

  const handleNextQuestion = () => {
    if (examPaper && currentQuestionIndex < examPaper.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitExam = () => {
    // 计算得分
    let score = 0;
    examPaper?.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer && JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)) {
        score += question.points;
      }
    });

    // 导航到结果页面
    navigate(`/preview/result/${paperId}`, {
      state: {
        score,
        totalScore: examPaper?.questions.reduce((sum, q) => sum + q.points, 0) || 0,
        answers,
        examPaper
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6">加载试卷中...</Typography>
      </Box>
    );
  }

  if (error || !examPaper) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>加载失败</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error || '试卷不存在'}
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/exam-management')}>
              返回考试管理
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* 顶部信息栏 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button 
            variant="text" 
            onClick={() => navigate('/exam-management')}
            startIcon={<ArrowBack />}
          >
            退出预览
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              icon={<Timer />} 
              label={formatTime(timeLeft)} 
              color={timeLeft < 300 ? 'error' : 'primary'}
            />
            <Chip label="预览模式" color="secondary" />
          </Box>
        </Box>

        {/* 进度条 */}
        <LinearProgress 
          variant="determinate" 
          value={(currentQuestionIndex + 1) / examPaper.questions.length * 100}
          sx={{ mb: 3, height: 8, borderRadius: 4 }}
        />

        {/* 题目导航 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {examPaper.questions.map((_, index) => (
            <Chip
              key={index}
              label={index + 1}
              onClick={() => setCurrentQuestionIndex(index)}
              color={index === currentQuestionIndex ? 'primary' : 
                     answers[examPaper.questions[index].id] ? 'success' : 'default'}
              variant={index === currentQuestionIndex ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>

        {/* 题目内容 */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ flex: 1 }}>
                第 {currentQuestionIndex + 1} 题 ({currentQuestion?.points}分)
              </Typography>
              <Chip label={currentQuestion?.type === 'single' ? '单选题' : 
                          currentQuestion?.type === 'multiple' ? '多选题' : 
                          currentQuestion?.type === 'true_false' ? '判断题' : '填空题'} 
                    variant="outlined" />
            </Box>

            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
              {currentQuestion?.question}
            </Typography>

            {/* 答题区域 */}
            {currentQuestion?.type === 'single' && (
              <FormControl component="fieldset">
                <FormLabel component="legend">请选择正确答案</FormLabel>
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}

            {currentQuestion?.type === 'multiple' && (
              <FormControl component="fieldset">
                <FormLabel component="legend">请选择所有正确答案（多选）</FormLabel>
                <Box>
                  {currentQuestion.options?.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      control={
                        <Checkbox
                          checked={Array.isArray(answers[currentQuestion.id]) && 
                                  (answers[currentQuestion.id] as string[]).includes(option)}
                          onChange={(e) => {
                            const currentAnswers = Array.isArray(answers[currentQuestion.id]) 
                              ? (answers[currentQuestion.id] as string[])
                              : [];
                            const newAnswers = e.target.checked
                              ? [...currentAnswers, option]
                              : currentAnswers.filter(a => a !== option);
                            handleAnswerChange(newAnswers);
                          }}
                        />
                      }
                      label={option}
                    />
                  ))}
                </Box>
              </FormControl>
            )}

            {currentQuestion?.type === 'true_false' && (
              <FormControl component="fieldset">
                <FormLabel component="legend">请判断正误</FormLabel>
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                >
                  <FormControlLabel value="true" control={<Radio />} label="正确" />
                  <FormControlLabel value="false" control={<Radio />} label="错误" />
                </RadioGroup>
              </FormControl>
            )}

            {currentQuestion?.type === 'fill_blank' && (
              <FormControl fullWidth>
                <FormLabel component="legend">请在下方填写答案</FormLabel>
                <TextField
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  multiline
                  rows={3}
                  placeholder="请输入您的答案..."
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </FormControl>
            )}
          </CardContent>
        </Card>

        {/* 导航按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            startIcon={<ArrowBack />}
          >
            上一题
          </Button>

          {currentQuestionIndex === examPaper.questions.length - 1 ? (
            <Button
              variant="contained"
              color="success"
              onClick={() => setShowSubmitDialog(true)}
              endIcon={<Check />}
            >
              提交试卷
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNextQuestion}
              endIcon={<ArrowForward />}
            >
              下一题
            </Button>
          )}
        </Box>
      </Container>

      {/* 提交确认对话框 */}
      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
      >
        <DialogTitle>确认提交</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要提交试卷吗？提交后将无法修改答案。
            <br />
            已答题数: {Object.keys(answers).length} / {examPaper.questions.length}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>取消</Button>
          <Button onClick={handleSubmitExam} variant="contained" color="primary">
            确认提交
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PreviewExamPage;