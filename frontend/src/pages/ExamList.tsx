import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Award, 
  Play, 
  Calendar,
  Filter,
  Search,
  Loader
} from 'lucide-react';
import { examAPI } from '../utils/api';

interface ExamSession {
  _id: string;
  name: string;
  description?: string;
  status: string;
  paperId: {
    _id: string;
    title: string;
    description?: string;
  } | null;
  startTime: string;
  endTime: string;
  duration: number;
  participants: any[];
  settings: {
    maxAttempts: number;
    [key: string]: any;
  };
  createdAt: string;
}

const ExamList: React.FC = () => {
  const navigate = useNavigate();
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startingExam, setStartingExam] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailablePapers();
  }, []);

  const fetchAvailablePapers = async () => {
    try {
      const result = await examAPI.getAvailableExamSessions({ limit: 50 });
      console.log('获取可参与考试列表:', result);
      setExamSessions(result.data?.sessions || []);
    } catch (error) {
      console.error('获取考试列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (sessionId: string) => {
    try {
      setStartingExam(sessionId);
      
      // 首先尝试加入考试会话
      try {
        await examAPI.joinExamSession(sessionId);
        console.log('成功加入考试会话');
      } catch (joinError: any) {
        // 如果已经加入过，继续执行开始考试
        if (!joinError.response?.data?.message?.includes('已经加入')) {
          throw joinError;
        }
      }
      
      // 开始考试
      const startResult = await examAPI.startExam(sessionId);
      console.log('开始考试成功:', startResult);
      
      // 跳转到考试页面
      navigate(`/exam-taking/${sessionId}`);
      
    } catch (error: any) {
      console.error('开始考试失败:', error);
      
      // 根据错误类型显示不同的提示信息
      let errorMessage = '开始考试失败，请重试';
      
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes('考试尚未开始')) {
          errorMessage = '考试尚未开始，请等待考试开始时间';
        } else if (message.includes('考试已结束')) {
          errorMessage = '考试已结束，无法参加';
        } else if (message.includes('考试已经开始')) {
          errorMessage = '您已经开始了这场考试，正在跳转...';
          // 如果已经开始，直接跳转
          navigate(`/exam-taking/${sessionId}`);
          return;
        } else if (message.includes('超过最大尝试次数')) {
          errorMessage = '您已超过最大尝试次数，无法再次参加考试';
        } else {
          errorMessage = message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setStartingExam(null);
    }
  };

  const handleViewDetails = async (sessionId: string) => {
    try {
      const result = await examAPI.getStudentExamSessionDetails(sessionId);
      console.log('考试详情:', result);
      
      // 可以显示详情对话框或跳转到详情页
      alert(`考试详情:
标题: ${result.data.name}
状态: ${result.data.status}
参与人数: ${result.data.participants?.length || 0}
开始时间: ${new Date(result.data.startTime).toLocaleString('zh-CN')}
结束时间: ${new Date(result.data.endTime).toLocaleString('zh-CN')}`);
    } catch (error: any) {
      console.error('获取考试详情失败:', error);
      alert(error.response?.data?.message || '获取考试详情失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'published': return 'text-blue-600 bg-blue-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'expired': return '已过期';
      default: return status;
    }
  };

  const filteredExamSessions = examSessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (session.description && session.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || session.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">在线考试</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/exam/history')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                考试历史
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
            <h2 className="text-3xl font-bold text-gray-900">考试会话列表</h2>
            <p className="mt-2 text-gray-600">查看和管理所有考试会话</p>
          </div>

          {/* 搜索和筛选 */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索试卷..."
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
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
                <option value="expired">已过期</option>
              </select>
            </div>
          </div>

          {/* 考试会话列表 */}
          {filteredExamSessions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无考试会话</h3>
              <p className="mt-1 text-sm text-gray-500">请创建新的考试会话</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExamSessions.map((session) => (
                <div
                  key={session._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* 左侧：考试基本信息 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">{session.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                            {getStatusText(session.status)}
                          </span>
                        </div>

                        {/* 考试描述 */}
                        {session.description && (
                          <p className="text-gray-600 mb-4">{session.description}</p>
                        )}

                        {/* 试卷信息 */}
                        {session.paperId && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4 inline-block">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">{session.paperId.title}</span>
                            </div>
                            {session.paperId.description && (
                              <p className="text-xs text-gray-600 mt-1 ml-6">{session.paperId.description}</p>
                            )}
                          </div>
                        )}

                        {/* 考试详细信息 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-green-600" />
                            <span>{session.participants?.length || 0} 名参与者</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-orange-600" />
                            <span>{session.duration} 分钟</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                            <span>开始: {new Date(session.startTime).toLocaleDateString('zh-CN')}</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-2 text-yellow-600" />
                            <span>最大尝试: {session.settings?.maxAttempts || 1}</span>
                          </div>
                        </div>

                        {/* 时间信息 */}
                        <div className="mt-3 text-xs text-gray-500">
                          <span>创建时间: {new Date(session.createdAt).toLocaleString('zh-CN')}</span>
                          <span className="mx-2">•</span>
                          <span>考试时间: {new Date(session.startTime).toLocaleString('zh-CN')} - {new Date(session.endTime).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>

                      {/* 右侧：操作按钮 */}
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => handleViewDetails(session._id)}
                          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium min-w-[100px]"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => handleStartExam(session._id)}
                          disabled={startingExam === session._id}
                          className={`py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1 text-sm font-medium ${
                            startingExam === session._id
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {startingExam === session._id ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>开始中...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              <span>开始考试</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamList;