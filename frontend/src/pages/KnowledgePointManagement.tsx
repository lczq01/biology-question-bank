import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Search, Clear } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import KnowledgePointForm from '../components/KnowledgePointForm';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer';
import { 
  KnowledgePoint, 
  KnowledgePointFormData, 
  KnowledgePointFilters, 
  KnowledgePointPagination
} from '../types/knowledgePoint';

const KnowledgePointManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();

  // 状态管理
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 筛选和分页状态
  const [filters, setFilters] = useState<KnowledgePointFilters>({
    search: '',
    chapter: '',
    customId: ''
  });

  const [pagination, setPagination] = useState<KnowledgePointPagination>({
    page: 1,
    limit: 10,
    total: 0
  });

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<KnowledgePoint | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  // 搜索防抖
  const [searchInput, setSearchInput] = useState('');

  // 获取知识点列表
  const fetchKnowledgePoints = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // 调试信息
    console.log('当前用户:', user);
    console.log('当前token:', token);
    
    if (!token) {
      setError('用户未登录，请先登录');
      setLoading(false);
      return;
    }
    
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.chapter && { chapter: filters.chapter }),
        ...(filters.customId && { customId: filters.customId })
      });

      const response = await fetch(`/api/knowledge-points?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取知识点列表失败');
      }

      const data = await response.json();
      console.log('API响应数据:', data);
      
      // 修复数据结构解析
      const knowledgePoints = data.data?.knowledgePoints || data.knowledgePoints || [];
      const paginationData = data.data?.pagination || { total: data.total || 0 };
      
      console.log('解析的知识点:', knowledgePoints);
      console.log('解析的分页信息:', paginationData);
      
      setKnowledgePoints(knowledgePoints);
      setPagination(prev => ({
        ...prev,
        total: paginationData.total || 0
      }));
    } catch (error) {
      console.error('获取知识点列表失败:', error);
      setError('获取知识点列表失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // 搜索防抖效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 获取数据
  useEffect(() => {
    fetchKnowledgePoints();
  }, [fetchKnowledgePoints]);

  // 处理筛选变化
  const handleFilterChange = (field: keyof KnowledgePointFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      search: '',
      chapter: '',
      customId: ''
    });
    setSearchInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 处理分页变化
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // 打开创建对话框
  const handleCreate = () => {
    setSelectedKnowledgePoint(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (knowledgePoint: KnowledgePoint) => {
    setSelectedKnowledgePoint(knowledgePoint);
    setDialogMode('edit');
    setDialogOpen(true);
  };



  // 删除知识点
  const handleDelete = async (knowledgePoint: KnowledgePoint) => {
    if (!confirm(`确定要删除知识点"${knowledgePoint.name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-points/${knowledgePoint._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      await fetchKnowledgePoints();
    } catch (error) {
      console.error('删除知识点失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (formData: KnowledgePointFormData) => {
    setFormLoading(true);
    
    // 调试信息
    console.log('提交表单时的用户:', user);
    console.log('提交表单时的token:', token);
    console.log('提交的表单数据:', formData);
    
    if (!token) {
      alert('用户未登录，请先登录');
      setFormLoading(false);
      return;
    }
    
    try {
      // 清理和验证数据
      const cleanedData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        chapter: formData.chapter.trim(),
        customId: formData.customId?.trim() || '',
        parentId: formData.parentId?.trim() || '',
        relatedIds: Array.isArray(formData.relatedIds) ? formData.relatedIds : []
      };
      
      console.log('清理后的数据:', cleanedData);
      
      const url = dialogMode === 'create' 
        ? '/api/knowledge-points'
        : `/api/knowledge-points/${selectedKnowledgePoint?._id}`;
      
      const method = dialogMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedData)
      });

      const responseData = await response.json();
      console.log('服务器响应:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || '操作失败');
      }

      setDialogOpen(false);
      await fetchKnowledgePoints();
      alert(dialogMode === 'create' ? '知识点创建成功！' : '知识点更新成功！');
    } catch (error) {
      console.error('保存知识点失败:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 hover:bg-blue-600 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">知识点管理</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-100">欢迎, {user?.username}</span>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 操作工具栏 */}
        <Card className="mb-6">
          <CardContent>
            {/* 搜索和添加按钮 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="text-gray-400" />
                <TextField
                  fullWidth
                  placeholder="搜索知识点名称或描述..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  size="small"
                />
              </div>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                className="whitespace-nowrap"
              >
                添加知识点
              </Button>
            </div>

            {/* 筛选器 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                size="small"
                fullWidth
                label="所属章节"
                value={filters.chapter}
                onChange={(e) => handleFilterChange('chapter', e.target.value)}
                placeholder="输入章节名称进行筛选"
              />
              <TextField
                size="small"
                fullWidth
                label="自定义ID"
                value={filters.customId}
                onChange={(e) => handleFilterChange('customId', e.target.value)}
                placeholder="输入customId进行筛选"
              />
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
                size="small"
              >
                清除筛选
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* 知识点列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <CircularProgress />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-6">
              {knowledgePoints.map((knowledgePoint, index) => (
                <Card key={knowledgePoint._id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-400">
                  <CardContent className="py-5 px-6">
                    {/* 顶部操作区域 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </span>
                        <div>
                          <Typography variant="h6" className="font-semibold text-gray-900 leading-tight">
                            {knowledgePoint.name}
                          </Typography>
                          <div className="flex items-center space-x-2 mt-1">
                            <Typography variant="caption" className="text-gray-500">
                              章节: {knowledgePoint.chapter || '未分类'}
                            </Typography>
                            {knowledgePoint.customId && (
                              <Typography variant="caption" className="text-gray-500">
                                ID: {knowledgePoint.customId}
                              </Typography>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Tooltip title="编辑知识点">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(knowledgePoint)}
                            className="hover:bg-blue-50"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除知识点">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(knowledgePoint)}
                            className="hover:bg-red-50"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-px bg-gray-200 mb-4"></div>

                    {/* 完整描述内容 */}
                    <div className="text-gray-700 leading-relaxed">
                      <SafeHtmlRenderer 
                        html={knowledgePoint.description}
                        className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 分页 */}
            {pagination.total > 0 && (
              <div className="flex justify-center">
                <Pagination
                  count={Math.ceil(pagination.total / pagination.limit)}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </div>
            )}

            {/* 空状态 */}
            {knowledgePoints.length === 0 && !loading && (
              <div className="text-center py-8">
                <Typography variant="h6" color="text.secondary">
                  暂无知识点数据
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mt-2">
                  点击"添加知识点"按钮创建第一个知识点
                </Typography>
              </div>
            )}
          </>
        )}
      </div>

      {/* 知识点表单对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && '创建知识点'}
          {dialogMode === 'edit' && '编辑知识点'}
        </DialogTitle>
        <DialogContent>
          <KnowledgePointForm
            knowledgePoint={selectedKnowledgePoint}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            loading={formLoading}
            readOnly={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgePointManagement;