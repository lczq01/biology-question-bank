import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../../utils/examApi';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { AccessTime, Description, ArrowBack, PlayArrow, Grade as GradeIcon } from '@mui/icons-material';

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
  duration?: number;
}

const PreviewStartPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [examSession, setExamSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchExamSession = async () => {
      if (!examId) {
        setError('考试ID不存在');
        setLoading(false);
        return;
      }

      try {
        const response = await examApi.getExam(examId);
        
        if (!response.ok) {
          throw new Error('获取考试信息失败');
        }
        
        const data = await response.json();
        if (data.success) {
          setExamSession(data.data);
        } else {
          throw new Error(data.message || '获取考试信息失败');
        }
      } catch (err) {
        setError('获取考试信息失败');
        console.error('获取考试信息失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamSession();
  }, [examId]);

  const handleStartPreview = () => {
    if (examId) {
      navigate(`/preview/exam/${examId}`);
    }
  };

  const handleBack = () => {
    navigate('/exam-management');
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ color: 'primary.main', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">加载试卷信息中...</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !examSession) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ pt: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error" sx={{ mb: 2 }}>⚠️</Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>加载失败</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {error || '考试不存在'}
              </Typography>
              <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                返回考试管理
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Container maxWidth="md">
        <Button 
          variant="text" 
          onClick={handleBack}
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
        >
          返回考试管理
        </Button>

        <Card sx={{ boxShadow: 3 }}>
          <CardHeader 
            sx={{ textAlign: 'center', borderBottom: 1, borderColor: 'divider', pb: 2 }}
            title={
              <Box>
                <Chip label="预览模式" color="secondary" sx={{ mb: 2 }} />
                <Typography variant="h4">{examSession.name}</Typography>
              </Box>
            }
          />

          <CardContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 考试基本信息 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description sx={{ color: 'grey.500', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">考试名称:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {examSession.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ color: 'grey.500', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">考试时长:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {examSession.duration} 分钟
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GradeIcon sx={{ color: 'grey.500', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">考试类型:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {examSession.type === 'on_demand' ? '随时考试' : '定时考试'}
                  </Typography>
                </Box>
              </Box>

              {/* 预览说明 */}
              <Box sx={{ bgcolor: 'info.light', border: 1, borderColor: 'info.main', borderRadius: 1, p: 2 }}>
                <Typography variant="h6" color="info.dark" sx={{ mb: 1 }}>预览说明</Typography>
                <List dense sx={{ py: 0 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Typography variant="body2" color="info.dark">•</Typography>
                    </ListItemIcon>
                    <ListItemText primary="此预览仅用于检查试卷内容和流程" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Typography variant="body2" color="info.dark">•</Typography>
                    </ListItemIcon>
                    <ListItemText primary="预览成绩不计入正式考试记录" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Typography variant="body2" color="info.dark">•</Typography>
                    </ListItemIcon>
                    <ListItemText primary="可以多次预览同一份试卷" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Typography variant="body2" color="info.dark">•</Typography>
                    </ListItemIcon>
                    <ListItemText primary="预览过程中可以随时退出" />
                  </ListItem>
                </List>
              </Box>

              {/* 开始预览按钮 */}
              <Box sx={{ textAlign: 'center', pt: 2 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={handleStartPreview}
                  startIcon={<PlayArrow />}
                  sx={{ px: 4 }}
                >
                  开始预览
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default PreviewStartPage;