import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Award, 
  Calendar,
  Filter,
  Search,
  Eye,
  TrendingUp,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { examAPI } from '../utils/api';

interface ExamRecord {
  _id: string;
  examSessionId: {
    _id: string;
    name: string;
    paperId: {
      _id: string;
      title: string;
    } | null;
  };
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  startTime?: string;
  endTime?: string;
  score?: number;
  totalQuestions: number;
  answeredQuestions: number;
  answers: any[];
  createdAt: string;
  updatedAt: string;
}

const ExamHistory: React.FC = () => {
  const navigate = useNavigate();
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchExamHistory();
  }, [page, statusFilter]);

  const fetchExamHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined
      };
      
      const result = await examAPI.getExamHistory(params);
      console.log('获取考试历史:', result);
      
      setExamRecords(result.data?.records || []);
      setTotalPages(Math.ceil((result.data?.total || 0) / 10));
    } catch (error) {
      console.error('获取考试历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (recordId: string) => {
    navigate(`/exam-result?recordId=${recordId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return '未开始';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'expired': return '已过期';
      default: return status;
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return '未知';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    return `${duration} 分钟`;
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredRecords = examRecords.filter(record => {
    const matchesSearch = record.examSessionId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.examSessionId?.paperId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                返回
              </button>
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">考试历史</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/exam-list')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                参加考试
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">我的考试历史</h2>
            <p className="mt-2 text-gray-600">查看您的所有考试记录和成绩</p>
          </div>

          {/* 搜索和筛选 */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索考试..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">全部状态</option>
                <option value="not_started">未开始</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="expired">已过期</option>
              </select>
            </div>
          </div>

          {/* 考试记录列表 */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无考试记录</h3>
              <p className="mt-1 text-sm text-gray-500">您还没有参加过任何考试</p>
              <button
                onClick={() => navigate('/exam-list')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                去参加考试
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div
                  key={record._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* 左侧：考试基本信息 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {record.examSessionId?.name || '未知考试'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                            {getStatusText(record.status)}
                          </span>
                        </div>

                        {/* 试卷信息 */}
                        {record.examSessionId?.paperId && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4 inline-block">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">
                                {record.examSessionId.paperId.title}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 考试详细信息 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Award className={`h-4 w-4 mr-2 ${getScoreColor(record.score)}`} />
                            <span className={getScoreColor(record.score)}>
                              {record.score !== undefined ? `${record.score}分` : '未评分'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                            <span>{record.answeredQuestions}/{record.totalQuestions} 题</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-orange-600" />
                            <span>{formatDuration(record.startTime, record.endTime)}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                            <span>{new Date(record.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>

                        {/* 时间信息 */}
                        <div className="mt-3 text-xs text-gray-500">
                          <span>创建时间: {new Date(record.createdAt).toLocaleString('zh-CN')}</span>
                          {record.startTime && (
                            <>
                              <span className="mx-2">•</span>
                              <span>开始时间: {new Date(record.startTime).toLocaleString('zh-CN')}</span>
                            </>
                          )}
                          {record.endTime && (
                            <>
                              <span className="mx-2">•</span>
                              <span>结束时间: {new Date(record.endTime).toLocaleString('zh-CN')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 右侧：操作按钮 */}
                      <div className="ml-6 flex flex-col space-y-2">
                        {record.status === 'completed' && (
                          <button
                            onClick={() => handleViewResult(record._id)}
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                          >
                            <Eye className="h-4 w-4" />
                            <span>查看结果</span>
                          </button>
                        )}
                        {record.status === 'in_progress' && (
                          <button
                            onClick={() => navigate(`/exam-taking/${record.examSessionId._id}`)}
                            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                          >
                            <Clock className="h-4 w-4" />
                            <span>继续考试</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="px-3 py-2 text-gray-600">
                  第 {page} 页，共 {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamHistory;