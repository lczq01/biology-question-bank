import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import WordImporter from '../components/WordImporter';

interface ParsedQuestion {
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  difficulty: string;
  chapter: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  answer: string;
  explanation: string;
  images: string[];
}

const DocumentImport: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 权限检查
  if (!user || user.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#333', marginBottom: '16px' }}>访问受限</h2>
          <p style={{ color: '#666', margin: 0 }}>
            只有管理员可以访问文档导入功能
          </p>
        </div>
      </div>
    );
  }

  // 处理Word文档导入
  const handleWordImport = async (questions: ParsedQuestion[]) => {
    try {
      console.log('开始批量导入题目:', questions);
      console.log('待导入题目总数:', questions.length);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`正在处理第 ${i + 1}/${questions.length} 道题目:`, question.content.substring(0, 50) + '...');
        try {
          // 转换题型格式 - 确保与编辑表单一致
          const typeMapping: { [key: string]: string } = {
            'single_choice': 'single_choice',
            'multiple_choice': 'multiple_choice',
            'fill_blank': 'fill_blank'
          };
          
          // 根据题型处理选项
          let processedOptions: any[] = [];
          
          if (['single_choice', 'multiple_choice'].includes(question.type)) {
            // 选择题：确保选项结构完整
            processedOptions = question.options.map((option, index) => ({
              id: option.id || (index + 1).toString(),
              text: option.text || '',
              isCorrect: option.isCorrect || false
            }));
            
            // 如果选项不足4个，补充空选项
            while (processedOptions.length < 4) {
              processedOptions.push({
                id: (processedOptions.length + 1).toString(),
                text: '',
                isCorrect: false
              });
            }
          } else {
            // 填空题：不需要选项
            processedOptions = [];
          }
          
          const questionData = {
            content: question.content,
            type: typeMapping[question.type] || 'single_choice',
            difficulty: question.difficulty,
            chapter: question.chapter,
            options: processedOptions,
            answer: question.answer,
            explanation: question.explanation,
            image: question.images && question.images.length > 0 ? question.images[0] : undefined
          };
          
          const response = await fetch('http://localhost:3001/api/questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(questionData)
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              // 确保返回的题目数据具有正确的ID字段
              console.log(`第 ${i + 1} 道题目创建成功:`, result.data);
            }
            successCount++;
          } else {
            errorCount++;
            const errorText = await response.text();
            console.error(`第 ${i + 1} 道题目保存失败:`, errorText);
          }
        } catch (error) {
          errorCount++;
          console.error(`第 ${i + 1} 道题目处理时出错:`, error);
        }
      }
      
      console.log(`批量导入完成 - 成功: ${successCount}, 失败: ${errorCount}, 总计: ${questions.length}`);
      
      if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `成功导入 ${successCount} 道题目${errorCount > 0 ? `，${errorCount} 道题目导入失败` : ''}`,
          severity: errorCount > 0 ? 'warning' : 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: '导入失败，请检查文档格式或网络连接',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('批量导入失败:', error);
      setSnackbar({
        open: true,
        message: '导入过程中发生错误，请重试',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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
            <h1 className="text-2xl font-bold">题目创建</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-purple-100">欢迎, {user?.username}</span>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
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

      <Container maxWidth="lg" className="py-8">
        {/* 页面标题 */}
        <Box className="mb-8">
          <Typography variant="h4" component="h1" className="text-gray-800 font-bold mb-2">
            题目创建中心
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            支持手动创建单个题目或从Word文档批量导入题目，提供完整的题目创建解决方案
          </Typography>
        </Box>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要导入区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 手动添加题目 */}
          <Paper elevation={2} className="p-6">
            <Box className="flex items-center justify-between mb-6">
              <Box className="flex items-center">
                <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <Typography variant="h5" component="h2" className="text-gray-800 font-semibold">
                  手动添加题目
                </Typography>
              </Box>
              <button
                onClick={() => navigate('/questions/new')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                ➕ 创建新题目
              </button>
            </Box>
            <Typography variant="body2" className="text-gray-600">
              点击"创建新题目"按钮，使用表单界面手动创建单个题目，支持富文本编辑、图片上传等功能。
            </Typography>
          </Paper>

          {/* Word文档导入 */}
          <Paper elevation={2} className="p-6">
            <Box className="flex items-center mb-6">
              <CloudUploadIcon className="text-blue-600 mr-3" fontSize="large" />
              <Typography variant="h5" component="h2" className="text-gray-800 font-semibold">
                Word文档批量导入
              </Typography>
            </Box>
            
            <WordImporter 
              onImport={handleWordImport}
              defaultDifficulty="中等"
              defaultChapter="未分类"
            />
          </Paper>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-6">
          {/* 支持格式 */}
          <Card elevation={1}>
            <CardContent>
              <Box className="flex items-center mb-3">
                <DescriptionIcon className="text-green-600 mr-2" />
                <Typography variant="h6" className="text-gray-800 font-semibold">
                  支持格式
                </Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon className="text-green-500" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary=".docx格式文档" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon className="text-green-500" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="图文混排内容" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon className="text-green-500" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="标准题目格式" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* 格式要求 */}
          <Card elevation={1}>
            <CardContent>
              <Box className="flex items-center mb-3">
                <InfoIcon className="text-blue-600 mr-2" />
                <Typography variant="h6" className="text-gray-800 font-semibold">
                  格式要求
                </Typography>
              </Box>
              <Typography variant="body2" className="text-gray-600 mb-3">
                请确保Word文档包含以下格式的题目：
              </Typography>
              <Box className="bg-gray-50 p-3 rounded text-sm">
                <div className="mb-2"><strong>1. 题目内容</strong></div>
                <div className="mb-2">A. 选项A</div>
                <div className="mb-2">B. 选项B</div>
                <div className="mb-2">C. 选项C</div>
                <div className="mb-2">D. 选项D</div>
                <div className="mb-2"><strong>答案：A</strong></div>
                <div><strong>解析：</strong>解析内容</div>
              </Box>
            </CardContent>
          </Card>

          {/* 注意事项 */}
          <Card elevation={1}>
            <CardContent>
              <Box className="flex items-center mb-3">
                <WarningIcon className="text-orange-600 mr-2" />
                <Typography variant="h6" className="text-gray-800 font-semibold">
                  注意事项
                </Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="图片处理"
                    secondary="文档中的图片会自动上传到服务器"
                    className="text-sm"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="题目识别"
                    secondary="系统会自动识别题目结构和类型"
                    className="text-sm"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="导入预览"
                    secondary="导入前会显示预览，可确认后再保存"
                    className="text-sm"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 成功/错误提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </div>
  );
};

export default DocumentImport;