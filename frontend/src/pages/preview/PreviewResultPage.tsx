import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { ArrowBack, Check, Close, ExpandMore, BarChart } from '@mui/icons-material';

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
}

interface ResultData {
  score: number;
  totalScore: number;
  answers: Record<string, string | string[]>;
  examPaper: ExamPaper;
}

const PreviewResultPage: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const resultData = location.state as ResultData;

  if (!resultData) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>数据加载失败</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              请从预览开始页面重新进入
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/exam-management')}>
              返回考试管理
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const { score, totalScore, answers, examPaper } = resultData;
  const percentage = Math.round((score / totalScore) * 100);
  const correctCount = examPaper.questions.filter(question => {
    const userAnswer = answers[question.id];
    return userAnswer && JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
  }).length;

  const handleBackToManagement = () => {
    navigate('/exam-management');
  };

  const handleReviewAnswers = () => {
    navigate(`/preview/start/${paperId}`);
  };

  const isAnswerCorrect = (question: Question) => {
    const userAnswer = answers[question.id];
    return userAnswer && JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
  };

  const getAnswerDisplay = (question: Question) => {
    const userAnswer = answers[question.id];
    if (!userAnswer) return '未作答';
    
    if (Array.isArray(userAnswer)) {
      return userAnswer.join(', ');
    }
    return userAnswer;
  };

  const getCorrectAnswerDisplay = (question: Question) => {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.join(', ');
    }
    return question.correctAnswer;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Container maxWidth="lg">
        {/* 顶部操作栏 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button 
            variant="text" 
            onClick={handleBackToManagement}
            startIcon={<ArrowBack />}
          >
            返回考试管理
          </Button>
          <Chip label="预览结果" color="secondary" />
        </Box>

        {/* 成绩概览 */}
        <Card sx={{ mb: 4, boxShadow: 3 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {examPaper.title}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
              <Box>
                <Typography variant="h2" color={percentage >= 60 ? 'success.main' : 'error.main'}>
                  {score}
                </Typography>
                <Typography variant="body2" color="text.secondary">得分</Typography>
              </Box>
              <Box>
                <Typography variant="h2" color="text.secondary">
                  {totalScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">总分</Typography>
              </Box>
              <Box>
                <Typography variant="h2" color={percentage >= 60 ? 'success.main' : 'error.main'}>
                  {percentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">正确率</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Chip 
                icon={<Check />} 
                label={`正确: ${correctCount}`} 
                color="success" 
                variant="outlined" 
              />
              <Chip 
                icon={<Close />} 
                label={`错误: ${examPaper.questions.length - correctCount}`} 
                color="error" 
                variant="outlined" 
              />
              <Chip 
                icon={<BarChart />} 
                label={`总数: ${examPaper.questions.length}`} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          </CardContent>
        </Card>

        {/* 题目详情 */}
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">答题详情</Typography>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>题号</TableCell>
                    <TableCell>题目类型</TableCell>
                    <TableCell>您的答案</TableCell>
                    <TableCell>正确答案</TableCell>
                    <TableCell>得分</TableCell>
                    <TableCell>状态</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examPaper.questions.map((question, index) => {
                    const isCorrect = isAnswerCorrect(question);
                    return (
                      <TableRow key={question.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {question.type === 'single' ? '单选题' :
                           question.type === 'multiple' ? '多选题' :
                           question.type === 'true_false' ? '判断题' : '填空题'}
                        </TableCell>
                        <TableCell>{getAnswerDisplay(question)}</TableCell>
                        <TableCell>{getCorrectAnswerDisplay(question)}</TableCell>
                        <TableCell>
                          {isCorrect ? question.points : 0} / {question.points}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={isCorrect ? '正确' : '错误'} 
                            color={isCorrect ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* 题目解析 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>题目解析</Typography>
          {examPaper.questions.map((question, index) => (
            <Accordion key={question.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle1">
                    第 {index + 1} 题 ({question.points}分)
                  </Typography>
                  <Chip 
                    label={isAnswerCorrect(question) ? '正确' : '错误'} 
                    color={isAnswerCorrect(question) ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {question.question}
                </Typography>
                
                {question.options && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>选项:</Typography>
                    {question.options.map((option, optIndex) => (
                      <Typography key={optIndex} variant="body2" sx={{ ml: 2 }}>
                        {String.fromCharCode(65 + optIndex)}. {option}
                      </Typography>
                    ))}
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">您的答案:</Typography>
                  <Typography variant="body2" color={isAnswerCorrect(question) ? 'success.main' : 'error.main'}>
                    {getAnswerDisplay(question)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">正确答案:</Typography>
                  <Typography variant="body2" color="success.main">
                    {getCorrectAnswerDisplay(question)}
                  </Typography>
                </Box>

                {question.explanation && (
                  <Box>
                    <Typography variant="subtitle2">解析:</Typography>
                    <Typography variant="body2">{question.explanation}</Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* 底部操作按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={handleReviewAnswers}
            size="large"
          >
            重新预览
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleBackToManagement}
            size="large"
          >
            返回考试管理
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default PreviewResultPage;