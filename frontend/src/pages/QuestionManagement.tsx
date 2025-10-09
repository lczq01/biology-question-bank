import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExamBasket } from '../contexts/ExamBasketContext';
import ExamBasket from '../components/ExamBasket';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer';


// 防抖函数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}

interface Question {
  id?: string;
  _id?: string;
  content: string;
  type: string;
  difficulty: string;
  chapter: string;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

const QuestionManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { addToBasket } = useExamBasket();

  // 获取题目ID的辅助函数
  const getQuestionId = (question: Question): string => {
    return question.id || question._id || '';
  };

  // 基础状态
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [jumpToPage, setJumpToPage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 优化功能状态
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchInput, setSearchInput] = useState('');


  // 筛选状态
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);

  // 排序状态
  const [sortBy, setSortBy] = useState('createdAt'); // 排序字段
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 排序顺序

  // 回到顶部功能状态
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 搜索防抖
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setSearchTerm(searchValue);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchInput);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchInput, debouncedSearch]);

  // 批量操作函数
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedQuestions(new Set());
    } else {
      const allQuestionIds = new Set(questions.map(q => getQuestionId(q)));
      setSelectedQuestions(allQuestionIds);
    }
    setSelectAll(!selectAll);
  };

  const handleQuestionSelect = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
    setSelectAll(newSelected.size === questions.length);
  };

  const handleBatchDelete = async () => {
    if (selectedQuestions.size === 0) {
      alert('请先选择要删除的题目');
      return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedQuestions.size} 道题目吗？`)) {
      for (const questionId of selectedQuestions) {
        await handleDelete(questionId);
      }
      setSelectedQuestions(new Set());
      setSelectAll(false);
    }
  };

  // 获取题目列表
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter }),
        ...(difficultyFilter && { difficulty: difficultyFilter }),
        ...(chapterFilter && { chapter: chapterFilter }),
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      const response = await fetch(`http://localhost:3001/api/questions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API响应数据:', data); // 调试日志
        
        // 处理数据结构差异
        if (data.success && data.data) {
          setQuestions(data.data.questions || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        } else {
          setQuestions(data.questions || []);
          setTotalPages(data.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('获取题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取章节列表
  const fetchChapters = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/questions/chapters', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('章节API响应:', data); // 调试日志
        
        // 处理数据结构差异
        if (data.success && data.data) {
          setAvailableChapters(data.data.chapters || []);
        } else {
          setAvailableChapters(data.chapters || []);
        }
      }
    } catch (error) {
      console.error('获取章节失败:', error);
    }
  };



  useEffect(() => {
    fetchQuestions();
  }, [currentPage, searchTerm, typeFilter, difficultyFilter, chapterFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchChapters();
  }, []);

  // 监听滚动事件，控制回到顶部按钮显示
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 300); // 滚动超过300px时显示按钮
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 删除题目
  const handleDelete = async (questionId: string) => {
    if (confirm('确定要删除这道题目吗？')) {
      try {
        const response = await fetch(`http://localhost:3001/api/questions/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchQuestions();
          fetchChapters();
        } else {
          const errorData = await response.json();
          alert(errorData.message || '删除失败');
        }
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 清除筛选
  const clearFilters = () => {
    setTypeFilter('');
    setDifficultyFilter('');
    setChapterFilter('');
    setSearchInput('');
    setSearchTerm('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // 排序处理函数
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // 如果点击的是当前排序字段，切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击的是新字段，设置为该字段并默认降序
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // 重置到第一页
  };

  // 获取排序图标
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️'; // 未排序状态
    return sortOrder === 'asc' ? '↑' : '↓'; // 升序或降序
  };

  // 获取排序显示文本
  const getSortDisplayText = () => {
    const fieldNames: { [key: string]: string } = {
      'createdAt': '创建时间',
      'difficulty': '难度',
      'type': '题型',
      'chapter': '章节',
      'content': '题目内容'
    };
    
    const fieldName = fieldNames[sortBy] || '未知';
    const orderName = sortOrder === 'asc' ? '升序' : '降序';
    return `${fieldName} (${orderName})`;
  };

  // 回到顶部功能
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 页码跳转功能
  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpToPage('');
    } else {
      alert(`请输入1到${totalPages}之间的页码`);
    }
  };

  const handleJumpInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  // 直接跳转到指定页面
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 生成页码数组
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7; // 最多显示7个页码
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数不超过最大显示数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 如果总页数超过最大显示数，智能显示页码
      if (currentPage <= 4) {
        // 当前页在前面，显示 1,2,3,4,5...last
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 当前页在后面，显示 1...last-4,last-3,last-2,last-1,last
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间，显示 1...current-1,current,current+1...last
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
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
            只有管理员可以访问题目管理功能
          </p>
        </div>
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
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">题目管理</h1>
            </div>
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

      {/* 主要内容区域 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* 操作工具栏 */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          {/* 搜索和添加按钮 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center flex-1 gap-2">
              <span>🔍</span>
              <input
                type="text"
                placeholder="搜索题目内容..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            

          </div>

          {/* 筛选器 */}
          <div className="flex items-center gap-4 mb-4">
            <span>🔽</span>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">所有题型</option>
              <option value="single_choice">单选题</option>
              <option value="multiple_choice">多选题</option>
              <option value="fill_blank">填空题</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">所有难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>

            <select
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">所有章节</option>
              {availableChapters.map(chapter => (
                <option key={chapter} value={chapter}>{chapter}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 清除
            </button>
          </div>

          {/* 排序控件 */}
          <div className="flex items-center gap-4 mb-4">
            <span>📊</span>
            <span className="text-sm text-gray-600">排序方式:</span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSort('createdAt')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'createdAt' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                创建时间 {getSortIcon('createdAt')}
              </button>

              <button
                onClick={() => handleSort('difficulty')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'difficulty' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                难度 {getSortIcon('difficulty')}
              </button>

              <button
                onClick={() => handleSort('type')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'type' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                题型 {getSortIcon('type')}
              </button>

              <button
                onClick={() => handleSort('chapter')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'chapter' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                章节 {getSortIcon('chapter')}
              </button>
            </div>

            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              当前排序: {getSortDisplayText()}
            </div>
          </div>

          {/* 批量操作和页码跳转 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="cursor-pointer"
                />
                全选
              </label>
              
              {selectedQuestions.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  批量删除 ({selectedQuestions.size})
                </button>
              )}
            </div>

            {/* 顶部分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">第 {currentPage}/{totalPages} 页</span>
                
                {/* 紧凑的分页按钮 */}
                <div className="flex items-center gap-1">
                  {/* 首页 */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded text-xs ${
                      currentPage === 1 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title="首页"
                  >
                    ««
                  </button>

                  {/* 上一页 */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded text-xs ${
                      currentPage === 1 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    title="上一页"
                  >
                    «
                  </button>

                  {/* 页码显示（紧凑版） */}
                  {totalPages <= 5 ? (
                    // 总页数少时显示所有页码
                    Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-2 py-1 rounded text-xs min-w-[24px] ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))
                  ) : (
                    // 总页数多时显示当前页和相邻页
                    <>
                      {currentPage > 2 && (
                        <>
                          <button
                            onClick={() => goToPage(1)}
                            className="px-2 py-1 rounded text-xs min-w-[24px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            1
                          </button>
                          {currentPage > 3 && <span className="text-xs text-gray-400">...</span>}
                        </>
                      )}
                      
                      {[currentPage - 1, currentPage, currentPage + 1]
                        .filter(page => page >= 1 && page <= totalPages)
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-2 py-1 rounded text-xs min-w-[24px] ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      }
                      
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && <span className="text-xs text-gray-400">...</span>}
                          <button
                            onClick={() => goToPage(totalPages)}
                            className="px-2 py-1 rounded text-xs min-w-[24px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* 下一页 */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 rounded text-xs ${
                      currentPage === totalPages 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    title="下一页"
                  >
                    »
                  </button>

                  {/* 末页 */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 rounded text-xs ${
                      currentPage === totalPages 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title="末页"
                  >
                    »»
                  </button>
                </div>

                {/* 跳转输入框 */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyPress={handleJumpInputKeyPress}
                    placeholder={currentPage.toString()}
                    className="w-12 px-1 py-1 border border-gray-300 rounded text-xs text-center focus:ring-1 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleJumpToPage}
                    disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                    className={`px-2 py-1 rounded text-xs ${
                      !jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    跳转
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 题目列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
              <div>加载中...</div>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              暂无题目数据
            </div>
          ) : (
            <div>
              {questions.map((question, index) => (
                <div
                  key={getQuestionId(question)}
                  className={`p-6 ${index < questions.length - 1 ? 'border-b border-gray-200' : ''} flex items-start gap-4`}
                >
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(getQuestionId(question))}
                    onChange={() => handleQuestionSelect(getQuestionId(question))}
                    className="mt-1 cursor-pointer"
                  />

                  {/* 题目内容 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                        ID: {getQuestionId(question)}
                      </span>
                      
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {question.type === 'single_choice' ? '单选题' :
                         question.type === 'multiple_choice' ? '多选题' :
                         question.type === 'fill_blank' ? '填空题' : '未知题型'}
                      </span>
                      
                      <span className={`px-2 py-1 rounded text-xs ${
                        (question.difficulty === 'easy' || question.difficulty === '简单') ? 'bg-green-100 text-green-800' :
                        (question.difficulty === 'medium' || question.difficulty === '中等') ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {(question.difficulty === 'easy' || question.difficulty === '简单') ? '简单' :
                         (question.difficulty === 'medium' || question.difficulty === '中等') ? '中等' : '困难'}
                      </span>
                      
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        {question.chapter}
                      </span>
                    </div>

                    <div className="text-gray-800 mb-3 leading-relaxed">
                      <SafeHtmlRenderer html={question.content} />
                    </div>

                    {question.image && (
                      <img
                        src={
                          question.image.startsWith('http') || question.image.startsWith('data:') 
                            ? question.image 
                            : `http://localhost:3001${question.image}`
                        }
                        alt="题目图片"
                        className="max-w-xs max-h-48 rounded mb-3"
                        onError={(e) => {
                          console.error('图片加载失败:', question.image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    {question.options && question.options.length > 0 && (
                      <div className="mb-3">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={option.id}
                            className={`p-2 m-1 rounded text-sm ${
                              option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option.text}
                            {option.isCorrect && (
                              <span className="ml-2 text-green-600 font-bold">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === 'fill_blank' && question.correctAnswer && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                        <strong className="text-green-800">答案：</strong>
                        <span className="text-green-700 font-medium">{question.correctAnswer}</span>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="p-3 bg-gray-50 border-l-4 border-green-500 rounded-r text-sm text-gray-600 mb-3">
                        <strong>解析：</strong>
                        <SafeHtmlRenderer html={question.explanation} />
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      创建时间: {new Date(question.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const questionWithId = {
                          ...question,
                          id: getQuestionId(question),
                          answer: question.correctAnswer || ''
                        };
                        addToBasket(questionWithId);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      添加到考试试题篮
                    </button>
                    
                    <button
                      onClick={() => navigate(`/questions/edit/${getQuestionId(question)}`)}
                      className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                    >
                      ✏️ 编辑
                    </button>
                    
                    <button
                      onClick={() => handleDelete(getQuestionId(question))}
                      className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {/* 完整分页控件 */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {/* 首页按钮 */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  首页
                </button>

                {/* 上一页按钮 */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  上一页
                </button>

                {/* 页码按钮 */}
                <div className="flex gap-1">
                  {generatePageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? goToPage(page) : undefined}
                      disabled={page === '...' || page === currentPage}
                      className={`px-3 py-1 rounded text-sm min-w-[32px] ${
                        page === '...' 
                          ? 'bg-transparent text-gray-400 cursor-default' 
                          : page === currentPage
                          ? 'bg-blue-600 text-white cursor-default'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* 下一页按钮 */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  下一页
                </button>

                {/* 末页按钮 */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  末页
                </button>
              </div>

              {/* 页面信息和跳转 */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                
                {/* 页码跳转功能 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">跳转到第</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyPress={handleJumpInputKeyPress}
                    placeholder={currentPage.toString()}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">页</span>
                  <button
                    onClick={handleJumpToPage}
                    disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                    className={`px-3 py-1 rounded text-sm ${
                      !jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    跳转
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>


      </div>

      {/* 试题篮组件 */}
      <ExamBasket />

      {/* 回到顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-20 z-50 w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          title="回到顶部"
        >
          <svg 
            className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 10l7-7m0 0l7 7m-7-7v18" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default QuestionManagement;