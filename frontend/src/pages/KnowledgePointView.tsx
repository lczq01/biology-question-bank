import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Pagination,
  Chip,
  InputAdornment
} from '@mui/material';
import { Search, Clear, MenuBook, Category } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer';
import { 
  KnowledgePoint, 
  KnowledgePointFilters, 
  KnowledgePointPagination
} from '../types/knowledgePoint';

const KnowledgePointView: React.FC = () => {
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
    limit: 12,
    total: 0
  });

  // 搜索防抖
  const [searchInput, setSearchInput] = useState('');

  // 获取知识点列表
  const fetchKnowledgePoints = useCallback(async () => {
    setLoading(true);
    setError(null);
    
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
      
      // 修复数据结构解析
      const knowledgePoints = data.data?.knowledgePoints || data.knowledgePoints || [];
      const paginationData = data.data?.pagination || { total: data.total || 0 };
      
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
  }, [pagination.page, pagination.limit, filters, token]);

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

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 获取章节列表用于筛选
  const chapters = Array.from(new Set(knowledgePoints.map(kp => kp.chapter).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
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
            <MenuBook className="mr-3" />
            <h1 className="text-2xl font-bold">知识点浏览</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-100">欢迎, {user?.username}</span>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              返回首页
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
        {/* 搜索和筛选工具栏 */}
        <Card className="mb-6">
          <CardContent>
            {/* 搜索框 */}
            <div className="mb-4">
              <TextField
                fullWidth
                placeholder="搜索知识点名称或描述内容..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput && (
                    <InputAdornment position="end">
                      <button
                        onClick={() => setSearchInput('')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Clear />
                      </button>
                    </InputAdornment>
                  )
                }}
              />
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Category className="text-gray-400" />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                size="small"
                fullWidth
                label="知识点ID"
                value={filters.customId}
                onChange={(e) => handleFilterChange('customId', e.target.value)}
                placeholder="输入知识点ID进行筛选"
              />
              <div className="flex items-center">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
                >
                  <Clear className="mr-1" />
                  清除筛选
                </button>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>共找到 {pagination.total} 个知识点</span>
                {(filters.search || filters.chapter || filters.customId) && (
                  <span>当前显示筛选结果</span>
                )}
              </div>
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
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <CircularProgress size={40} />
              <Typography variant="body2" className="mt-2 text-gray-600">
                正在加载知识点...
              </Typography>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {knowledgePoints.map((knowledgePoint, index) => (
                <Card 
                  key={knowledgePoint._id} 
                  className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-400"
                >
                  <CardContent className="p-6">
                    {/* 头部信息 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </span>
                          <Typography variant="h6" className="font-semibold text-gray-900 leading-tight">
                            {knowledgePoint.name}
                          </Typography>
                        </div>
                        
                        {/* 标签信息 */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {knowledgePoint.chapter && (
                            <Chip 
                              label={knowledgePoint.chapter} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              icon={<Category />}
                            />
                          )}
                          {knowledgePoint.customId && (
                            <Chip 
                              label={`ID: ${knowledgePoint.customId}`} 
                              size="small" 
                              color="secondary" 
                              variant="outlined"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-px bg-gray-200 mb-4"></div>

                    {/* 知识点描述内容 */}
                    <div className="text-gray-700 leading-relaxed">
                      <SafeHtmlRenderer 
                        html={knowledgePoint.description}
                        className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-green-600 hover:prose-a:text-green-700"
                      />
                    </div>

                    {/* 底部时间信息 */}
                    {knowledgePoint.createdAt && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <Typography variant="caption" className="text-gray-500">
                          创建时间: {new Date(knowledgePoint.createdAt).toLocaleDateString('zh-CN')}
                        </Typography>
                      </div>
                    )}
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
                  size="large"
                />
              </div>
            )}

            {/* 空状态 */}
            {knowledgePoints.length === 0 && !loading && (
              <div className="text-center py-12">
                <MenuBook className="mx-auto text-gray-300 mb-4" style={{ fontSize: 64 }} />
                <Typography variant="h6" color="text.secondary" className="mb-2">
                  {(filters.search || filters.chapter || filters.customId) ? '没有找到匹配的知识点' : '暂无知识点数据'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(filters.search || filters.chapter || filters.customId) ? '请尝试调整搜索条件' : '系统中还没有添加任何知识点'}
                </Typography>
                {(filters.search || filters.chapter || filters.customId) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    清除筛选条件
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default KnowledgePointView;