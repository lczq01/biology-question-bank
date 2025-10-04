import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { truncateText } from '../utils/textUtils';

interface Question {
  _id: string;
  content: string;
  type: string;
  difficulty: string;
  chapter: string;
  points: number;
  options?: string[];
  answer: string | string[];
  explanation?: string;
  image?: string;
  createdAt: string;
}

interface FilterParams {
  search: string;
  type: string;
  difficulty: string;
  chapter: string;
  pointsMin: string;
  pointsMax: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}

const QuestionFilter: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // 筛选参数状态
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    type: '',
    difficulty: '',
    chapter: '',
    pointsMin: '',
    pointsMax: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  // 可选项数据
  const questionTypes = [
    { value: 'single_choice', label: '单选题' },
    { value: 'multiple_choice', label: '多选题' },
    { value: 'fill_blank', label: '填空题' }
  ];

  const difficulties = [
    { value: '简单', label: '简单' },
    { value: '中等', label: '中等' },
    { value: '困难', label: '困难' }
  ];

  const [chapters, setChapters] = useState<string[]>([]);

  const sortOptions = [
    { value: 'createdAt', label: '创建时间' },
    { value: 'difficulty', label: '难度' },
    { value: 'points', label: '分值' },
    { value: 'usage', label: '使用频率' }
  ];

  // 获取题目列表
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // 添加非空的筛选参数
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 0) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`http://localhost:3001/api/questions?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
        setTotalPages(data.data.totalPages);
        setTotalQuestions(data.data.total);
      } else {
        console.error('获取题目失败:', data.message);
      }
    } catch (error) {
      console.error('获取题目错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/questions/filter-options', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters || []);
      }
    } catch (error) {
      console.error('获取筛选选项失败:', error);
    }
  };

  // 初始加载和筛选参数变化时重新获取数据
  useEffect(() => {
    fetchQuestions();
    fetchFilterOptions();
  }, [filters]);

  // 处理筛选参数变化
  const handleFilterChange = (key: keyof FilterParams, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (value as number) // 除了页码变化，其他筛选条件变化时重置到第一页
    }));
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      search: '',
      type: '',
      difficulty: '',
      chapter: '',
      pointsMin: '',
      pointsMax: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 获取题型显示名称
  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'single_choice': '单选题',
      'multiple_choice': '多选题',
      'fill_blank': '填空题'
    };
    return typeMap[type] || type;
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    const colorMap: { [key: string]: string } = {
      '简单': '#4CAF50',
      '中等': '#FF9800',
      '困难': '#f44336'
    };
    return colorMap[difficulty] || '#666';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 导航栏 */}
      <div style={{
        backgroundColor: '#fff',
        padding: '16px 24px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← 返回控制台
          </button>
          <h2 style={{ margin: 0, color: '#333' }}>题目筛选</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#666' }}>
            {user?.username} ({user?.role === 'admin' ? '管理员' : '学生'})
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 筛选面板 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>筛选条件</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* 关键词搜索 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                关键词搜索
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="搜索题目内容、选项、解析..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* 题型筛选 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                题型
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">全部题型</option>
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* 难度筛选 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                难度
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">全部难度</option>
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            {/* 章节筛选 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                章节
              </label>
              <select
                value={filters.chapter}
                onChange={(e) => handleFilterChange('chapter', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">全部章节</option>
                {chapters.map(chapter => (
                  <option key={chapter} value={chapter}>{chapter}</option>
                ))}
              </select>
            </div>

            {/* 分值范围 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                分值范围
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={filters.pointsMin}
                  onChange={(e) => handleFilterChange('pointsMin', e.target.value)}
                  placeholder="最小分值"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <span>-</span>
                <input
                  type="number"
                  value={filters.pointsMax}
                  onChange={(e) => handleFilterChange('pointsMax', e.target.value)}
                  placeholder="最大分值"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* 排序方式 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                排序方式
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              onClick={resetFilters}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重置筛选
            </button>
          </div>
        </div>

        {/* 结果统计 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ color: '#666' }}>
              共找到 <strong style={{ color: '#2196F3' }}>{totalQuestions}</strong> 道题目
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#666' }}>每页显示：</span>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              style={{
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value={5}>5条</option>
              <option value={10}>10条</option>
              <option value={20}>20条</option>
              <option value={50}>50条</option>
            </select>
          </div>
        </div>

        {/* 题目列表 */}
        {loading ? (
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#666' }}>正在加载...</div>
          </div>
        ) : questions.length === 0 ? (
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#666' }}>没有找到符合条件的题目</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((question) => (
              <div
                key={question._id}
                style={{
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getTypeLabel(question.type)}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: getDifficultyColor(question.difficulty),
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {question.difficulty}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {question.points}分
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {question.chapter}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', color: '#333', lineHeight: '1.5', marginBottom: '8px' }}>
                      {truncateText(question.content, 150)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      创建时间: {new Date(question.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={() => navigate('/question-management', { 
                        state: { editQuestion: question } 
                      })}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      编辑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{
            backgroundColor: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button
              onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
              disabled={filters.page === 1}
              style={{
                padding: '8px 12px',
                backgroundColor: filters.page === 1 ? '#f5f5f5' : '#2196F3',
                color: filters.page === 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: filters.page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              上一页
            </button>
            
            <span style={{ margin: '0 16px', color: '#666' }}>
              第 {filters.page} 页，共 {totalPages} 页
            </span>
            
            <button
              onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
              disabled={filters.page === totalPages}
              style={{
                padding: '8px 12px',
                backgroundColor: filters.page === totalPages ? '#f5f5f5' : '#2196F3',
                color: filters.page === totalPages ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: filters.page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionFilter;