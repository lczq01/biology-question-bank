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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Pagination,
  Stack
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Drafts as DraftIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { examAPI } from '../utils/api';

interface ExamSession {
  _id: string;
  name: string;
  description?: string;
  status: string;
  paperId: {
    _id: string;
    title: string;
  } | null;
  startTime: string;
  endTime: string;
  duration: number;
  participants: any[];
  settings: {
    maxAttempts: number;
    allowReview?: boolean;
    shuffleQuestions?: boolean;
    showResults?: boolean;
  };
  createdAt: string;
  createdBy: string;
}

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // 状态管理
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [batchStatusMenuAnchor, setBatchStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentSessionForStatus, setCurrentSessionForStatus] = useState<string | null>(null);
  
  // 筛选相关状态
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);











  // 获取考试会话列表
  const fetchExamSessions = async () => {
    try {
      setLoading(true);
      const result = await examAPI.getExamSessions({ limit: 50 });
      
      if (result.success) {
        setExamSessions(result.data?.sessions || []);
        setError(null);
      } else {
        setError(result.message || '获取考试列表失败');
      }
    } catch (error) {
      console.error('获取考试列表失败:', error);
      setError('获取考试列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };





  // 处理状态更新
  const handleStatusChange = async (examId: string, newStatus: string) => {
    try {
      setLoading(true);
      // 后端期望小写状态值
      const backendStatus = newStatus.toLowerCase();
      
      const result = await examAPI.updateExamSessionStatus(examId, backendStatus);

      if (result.success) {
        // 更新本地状态
        setExamSessions(prev => prev.map(exam => 
          exam._id === examId 
            ? { ...exam, status: newStatus }
            : exam
        ));
        setSuccess(result.message || '状态更新成功');
        setError(null);
      } else {
        setError(result.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新错误:', error);
      setError('状态更新失败，请稍后重试');
    } finally {
      setLoading(false);
      setStatusMenuAnchor(null);
      setCurrentSessionForStatus(null);
    }
  };







  // 删除考试
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这个考试吗？此操作不可恢复。')) {
      return;
    }

    try {
      const result = await examAPI.deleteExamSession(sessionId);

      if (result.success) {
        setSuccess('考试删除成功');
        setError(null);
        fetchExamSessions(); // 重新获取列表
      } else {
        setError(`删除失败：${result.message}`);
      }
    } catch (error) {
      console.error('删除考试失败:', error);
      setError('删除考试失败，请稍后重试');
    }
  };





  // 批量更新状态
  const handleBatchUpdateStatus = async (newStatus: string) => {
    if (selectedSessions.length === 0) {
      setError('请先选择要更新的考试');
      return;
    }

    try {
      const result = await examAPI.batchUpdateExamSessionStatus(selectedSessions, newStatus);

      if (result.success) {
        setSuccess(`已批量更新 ${selectedSessions.length} 个考试的状态`);
        setError(null);
        setSelectedSessions([]);
        fetchExamSessions();
      } else {
        setError(result.message || '批量更新失败');
      }
    } catch (error) {
      console.error('批量更新失败:', error);
      setError('批量更新失败，请稍后重试');
    }
    
    setBatchStatusMenuAnchor(null);
  };

  // 批量删除考试
  const handleBatchDelete = async () => {
    if (selectedSessions.length === 0) {
      setError('请先选择要删除的考试');
      return;
    }

    const confirmed = window.confirm(`确定要删除选中的 ${selectedSessions.length} 个考试吗？此操作不可撤销。`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const promises = selectedSessions.map(sessionId =>
        examAPI.deleteExamSession(sessionId)
      );

      const results = await Promise.all(promises);
      const failedCount = results.filter(result => !result.success).length;
      
      if (failedCount === 0) {
        setSuccess(`成功删除 ${selectedSessions.length} 个考试`);
        setError(null);
      } else {
        setError(`删除完成，${failedCount} 个考试删除失败`);
      }
      
      setSelectedSessions([]);
      fetchExamSessions();
    } catch (error) {
      console.error('批量删除失败:', error);
      setError('批量删除失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理选择
  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    const currentPageSessions = getPaginatedExamSessions();
    const currentPageIds = currentPageSessions.map(session => session._id);
    const allCurrentPageSelected = currentPageIds.every(id => selectedSessions.includes(id));
    
    if (allCurrentPageSelected) {
      // 取消选择当前页的所有项目
      setSelectedSessions(selectedSessions.filter(id => !currentPageIds.includes(id)));
    } else {
      // 选择当前页的所有项目
      const newSelected = [...selectedSessions];
      currentPageIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedSessions(newSelected);
    }
  };





  // 筛选逻辑
  const getFilteredExamSessions = () => {
    let filtered = [...examSessions];

    // 按名称搜索
    if (searchText.trim()) {
      filtered = filtered.filter(session => 
        session.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 按状态筛选
    if (statusFilter !== 'all') {
      if (statusFilter === 'draft') {
        filtered = filtered.filter(session => session.status.toLowerCase() === 'draft');
      } else if (statusFilter === 'published') {
        filtered = filtered.filter(session => session.status.toLowerCase() !== 'draft');
      }
    }

    // 按时间筛选
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.createdAt);
        
        switch (timeFilter) {
          case 'today':
            return sessionDate >= today;
          case 'week':
            return sessionDate >= thisWeekStart;
          case 'month':
            return sessionDate >= thisMonthStart;
          case 'custom':
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
              return sessionDate >= startDate && sessionDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // 分页逻辑
  const getPaginatedExamSessions = () => {
    const filtered = getFilteredExamSessions();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // 计算总页数
  const getTotalPages = () => {
    const filtered = getFilteredExamSessions();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedSessions([]); // 清空选择
  };

  // 处理每页显示数量变化
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 重置到第一页
    setSelectedSessions([]); // 清空选择
  };

  // 清空筛选条件
  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setTimeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 获取简化的状态标签
  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'draft') {
      return { label: '未发布', color: 'default' as const };
    } else {
      // published, active, completed, expired, cancelled 都显示为"已发布"
      return { label: '已发布', color: 'success' as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    fetchExamSessions();
  }, []);



  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'white' }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            考试管理
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
            <h1 className="text-2xl font-bold">考试管理</h1>
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
        {/* 筛选区域 */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mr: 2 }}>
                筛选条件
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={clearFilters}
                sx={{ color: '#666' }}
              >
                清空筛选
              </Button>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {/* 搜索框 */}
              <TextField
                fullWidth
                size="small"
                label="搜索考试名称"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="输入考试名称进行搜索"
              />
              
              {/* 状态筛选 */}
              <FormControl fullWidth size="small">
                <InputLabel>状态筛选</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="状态筛选"
                >
                  <MenuItem value="all">全部状态</MenuItem>
                  <MenuItem value="draft">未发布</MenuItem>
                  <MenuItem value="published">已发布</MenuItem>
                </Select>
              </FormControl>
              
              {/* 时间筛选 */}
              <FormControl fullWidth size="small">
                <InputLabel>时间筛选</InputLabel>
                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  label="时间筛选"
                >
                  <MenuItem value="all">全部时间</MenuItem>
                  <MenuItem value="today">今天</MenuItem>
                  <MenuItem value="week">本周</MenuItem>
                  <MenuItem value="month">本月</MenuItem>
                  <MenuItem value="custom">自定义时间</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* 自定义时间范围 */}
            {timeFilter === 'custom' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="开始日期"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="结束日期"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}
            
            {/* 筛选结果统计 */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                共找到 {getFilteredExamSessions().length} 个考试
              </Typography>
              {(searchText || statusFilter !== 'all' || timeFilter !== 'all') && (
                <Chip
                  label="已应用筛选"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 操作按钮区域 */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              考试列表
            </Typography>
            
            {selectedSessions.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`已选择 ${selectedSessions.length} 项`} 
                  color="primary" 
                  size="small" 
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => setBatchStatusMenuAnchor(e.currentTarget)}
                    sx={{ borderColor: '#666', color: '#666' }}
                  >
                    批量状态
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleBatchDelete}
                    sx={{ borderColor: '#f44336', color: '#f44336' }}
                  >
                    批量删除
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/exam-creation')}
              sx={{
                background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c, #4caf50)'
                }
              }}
            >
              创建新考试
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/questions?source=exam')}
              sx={{
                borderColor: '#2196f3',
                color: '#2196f3',
                '&:hover': {
                  borderColor: '#1976d2',
                  backgroundColor: 'rgba(33, 150, 243, 0.04)'
                }
              }}
            >
              手动组卷
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/exam-paper-generation')}
              sx={{
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': {
                  borderColor: '#f57c00',
                  backgroundColor: 'rgba(255, 152, 0, 0.04)'
                }
              }}
            >
              自动组卷
            </Button>
          </Box>
        </Box>

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



        {/* 考试列表 */}
        <Card>
          <CardContent>
            {examSessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  暂无考试
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  点击"创建新考试"按钮开始创建您的第一个考试
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={(() => {
                            const currentPageSessions = getPaginatedExamSessions();
                            const currentPageIds = currentPageSessions.map(session => session._id);
                            return currentPageSessions.length > 0 && currentPageIds.every(id => selectedSessions.includes(id));
                          })()}
                          indeterminate={(() => {
                            const currentPageSessions = getPaginatedExamSessions();
                            const currentPageIds = currentPageSessions.map(session => session._id);
                            const selectedCount = currentPageIds.filter(id => selectedSessions.includes(id)).length;
                            return selectedCount > 0 && selectedCount < currentPageIds.length;
                          })()}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell><strong>考试名称</strong></TableCell>
                      <TableCell><strong>状态</strong></TableCell>
                      <TableCell><strong>参与者</strong></TableCell>
                      <TableCell><strong>创建时间</strong></TableCell>
                      <TableCell><strong>操作</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedExamSessions().map((session) => {
                      const statusInfo = getStatusLabel(session.status);
                      return (
                        <TableRow 
                          key={session._id} 
                          hover
                          selected={selectedSessions.includes(session._id)}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedSessions.includes(session._id)}
                              onChange={() => handleSelectSession(session._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {session.name}
                            </Typography>
                            {session.description && (
                              <Typography variant="caption" color="text.secondary">
                                {session.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="点击切换状态">
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size="small"
                                onClick={(e) => {
                                  setCurrentSessionForStatus(session._id);
                                  setStatusMenuAnchor(e.currentTarget);
                                }}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.8,
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>{session.participants?.length || 0} 人</TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {formatDate(session.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="删除考试">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteSession(session._id)}
                                  sx={{ color: '#f44336' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              )}

              {/* 分页导航 */}
              {getFilteredExamSessions().length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mt: 3, 
                  px: 2,
                  py: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      每页显示：
                    </Typography>
                    <Select
                      size="small"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      sx={{ minWidth: 80 }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                    <Typography variant="body2" color="text.secondary">
                      共 {getFilteredExamSessions().length} 个考试，第 {currentPage} / {getTotalPages()} 页
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Pagination
                      count={getTotalPages()}
                      page={currentPage}
                      onChange={(_, page) => handlePageChange(page)}
                      color="primary"
                      size="medium"
                      showFirstButton
                      showLastButton
                      siblingCount={1}
                      boundaryCount={1}
                    />
                  </Stack>
                </Box>
              )}
          </CardContent>
        </Card>





        {/* 简化的状态更新菜单 */}
        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor)}
          onClose={() => setStatusMenuAnchor(null)}
        >
          {currentSessionForStatus && (
            <>
              <MenuItem
                onClick={() => handleStatusChange(currentSessionForStatus, 'published')}
              >
                <ListItemIcon>
                  <PublishIcon />
                </ListItemIcon>
                <ListItemText primary="发布考试" />
              </MenuItem>
              <MenuItem
                onClick={() => handleStatusChange(currentSessionForStatus, 'draft')}
              >
                <ListItemIcon>
                  <DraftIcon />
                </ListItemIcon>
                <ListItemText primary="取消发布" />
              </MenuItem>
            </>
          )}
        </Menu>

        {/* 简化的批量状态更新菜单 */}
        <Menu
          anchorEl={batchStatusMenuAnchor}
          open={Boolean(batchStatusMenuAnchor)}
          onClose={() => setBatchStatusMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => handleBatchUpdateStatus('published')}
          >
            <ListItemIcon>
              <PublishIcon />
            </ListItemIcon>
            <ListItemText primary="批量发布考试" />
          </MenuItem>
          <MenuItem
            onClick={() => handleBatchUpdateStatus('draft')}
          >
            <ListItemIcon>
              <DraftIcon />
            </ListItemIcon>
            <ListItemText primary="批量取消发布" />
          </MenuItem>
        </Menu>
      </Container>
    </div>
  );
};

export default ExamManagement;