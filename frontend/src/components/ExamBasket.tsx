import React, { useState } from 'react';
import {
  Fab,
  Badge,
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Divider,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  ShoppingBasket as BasketIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Assignment as ExamIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useExamBasket } from '../contexts/ExamBasketContext';
import SafeHtmlRenderer from './SafeHtmlRenderer';

const ExamBasket: React.FC = () => {
  const {
    basketItems,
    removeFromBasket,
    updatePoints,
    clearBasket,
    getTotalPoints,
    getItemCount
  } = useExamBasket();
  
  const [isOpen, setIsOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'single_choice': '单选题',
      'multiple_choice': '多选题',
      'true_false': '判断题',
      'fill_blank': '填空题',
      'essay': '简答题'
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

  const handleGenerateExam = async () => {
    if (basketItems.length === 0) {
      alert('试题篮为空，请先添加题目');
      return;
    }
    
    if (!examTitle.trim()) {
      alert('请输入试卷标题');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/exam-paper/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: examTitle,
          questions: basketItems.map(item => ({
            ...item.question,
            points: item.points
          }))
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`试卷"${examTitle}"生成成功！总分：${getTotalPoints()}分
试卷ID：${result.data.id}`);
        clearBasket();
        setExamTitle('');
        setIsOpen(false);
      } else {
        alert(`生成试卷失败：${result.message}`);
      }
    } catch (error) {
      console.error('生成试卷失败:', error);
      alert('生成试卷失败，请稍后重试');
    }
  };

  return (
    <>
      {/* 浮动按钮 */}
      <Fab
        color="primary"
        aria-label="exam basket"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
          '&:hover': {
            background: 'linear-gradient(135deg, #388e3c, #4caf50)',
          }
        }}
        onClick={() => setIsOpen(true)}
      >
        <Badge badgeContent={getItemCount()} color="error">
          <BasketIcon />
        </Badge>
      </Fab>

      {/* 侧边抽屉 */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: { 
            width: 450, 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 头部 */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 3,
            pb: 2,
            borderBottom: '2px solid #e0e0e0'
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              试题篮 ({getItemCount()}题)
            </Typography>
            <IconButton onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {basketItems.length === 0 ? (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <BasketIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                试题篮为空
              </Typography>
              <Typography variant="body2" color="text.secondary">
                在题目管理页面点击"添加到试题篮"来添加题目
              </Typography>
            </Box>
          ) : (
            <>
              {/* 题目列表 */}
              <Box sx={{ flex: 1, overflow: 'auto', mb: 3 }}>
                <List>
                  {basketItems.map((item, index) => (
                    <Card key={item.question._id || item.question.id} sx={{ mb: 2, boxShadow: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1, mr: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {index + 1}. 
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                              <SafeHtmlRenderer 
                                html={item.question.content} 
                                maxLength={60}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <Typography variant="caption" sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                background: '#e3f2fd',
                                color: '#1565c0'
                              }}>
                                {getTypeLabel(item.question.type)}
                              </Typography>
                              <Typography variant="caption" sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                background: '#fff3e0',
                                color: '#ef6c00'
                              }}>
                                {getDifficultyLabel(item.question.difficulty)}
                              </Typography>
                              <Typography variant="caption" sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                background: '#f3e5f5',
                                color: '#7b1fa2'
                              }}>
                                {item.question.chapter}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={item.points}
                              onChange={(e) => updatePoints(item.question._id || item.question.id, parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1, max: 100 }}
                              sx={{ width: 70 }}
                            />
                            <Typography variant="caption">分</Typography>
                            <IconButton
                              size="small"
                              onClick={() => removeFromBasket(item.question._id || item.question.id)}
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              </Box>
              
              {/* 底部操作区 */}
              <Box>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold',
                    color: '#4caf50'
                  }}>
                    总分：{getTotalPoints()}分
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="试卷标题"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="请输入试卷标题"
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<ExamIcon />}
                    onClick={handleGenerateExam}
                    fullWidth
                    sx={{
                      background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                      }
                    }}
                  >
                    生成试卷
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearBasket}
                    sx={{ 
                      borderColor: '#f44336',
                      color: '#f44336',
                      '&:hover': {
                        borderColor: '#d32f2f',
                        background: '#ffebee'
                      }
                    }}
                  >
                    清空
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default ExamBasket;