import React, { useState } from 'react';
import {
  Fab,
  Badge,
  Drawer,
  Box,
  Typography,
  List,
  IconButton,
  Button,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  ShoppingBasket as BasketIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Quiz as ExamSystemIcon
} from '@mui/icons-material';
import { useExamBasket } from '../contexts/ExamBasketContext';
import SafeHtmlRenderer from './SafeHtmlRenderer';

const ExamBasket: React.FC = () => {
  const {
    basketState,
    removeFromBasket,
    clearBasket,
    getItemCount
  } = useExamBasket();
  
  const basketItems = basketState.examBasket;
  
  const [isOpen, setIsOpen] = useState(false);

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

  const handleClearBasket = () => {
    if (basketItems.length === 0) {
      alert('试题篮为空');
      return;
    }
    
    if (confirm(`确定要清空试题篮吗？这将删除 ${basketItems.length} 道题目。`)) {
      clearBasket();
      alert('试题篮已清空');
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
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}>
                试题篮 ({getItemCount()}题)
              </Typography>
              <Chip
                icon={<ExamSystemIcon />}

                size="small"
                variant="outlined"
              />
            </Box>
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
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'bold',
                    color: '#4caf50'
                  }}>
                    已选择 {basketItems.length} 道题目
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      alert(`已选择 ${basketItems.length} 道题目，完成题目选择`);
                      setIsOpen(false);
                    }}
                    fullWidth
                    sx={{ 
                      background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                      }
                    }}
                  >
                    完成选择 ({basketItems.length})
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearBasket}
                    fullWidth
                    sx={{ 
                      borderColor: '#f44336',
                      color: '#f44336',
                      '&:hover': {
                        borderColor: '#d32f2f',
                        background: '#ffebee'
                      }
                    }}
                  >
                    清空试题篮
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