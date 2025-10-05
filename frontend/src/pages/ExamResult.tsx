import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  Award,
  BookOpen,
  ArrowLeft,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer';

interface ExamResult {
  examRecordId: string;
  sessionId: string;
  userId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  totalPoints: number;
  accuracy: number;
  timeUsed: number;
  isPassed: boolean;
  grade: string;
  answers: Array<{
    questionId: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
    timeSpent: number;
  }>;
  statistics: {
    averageTimePerQuestion: number;
    fastestQuestion: number;
    slowestQuestion: number;
    skippedQuestions: number;
  };
}

interface Question {
  _id: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  difficulty: string;
  chapter: string;
}

const ExamResult: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analysis'>('overview');

  // 获取考试结果
  const fetchExamResult = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/exam/result/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const resultData = await response.json();
        setResult(resultData.data);
      } else {
        const error = await response.json();
        alert(error.message || '获取考试结果失败');
        navigate('/exam-list');
      }
    } catch (error) {
      console.error('获取考试结果失败:', error);
      alert('获取考试结果失败，请重试');
      navigate('/exam-list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 如果从考试页面传递了结果数据，直接使用
    if (location.state?.examResult) {
      setResult(location.state.examResult);
      setLoading(false);
    } else if (examId) {
      fetchExamResult();
    }
  }, [examId, location.state]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟${secs}秒`;
    }
    if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    }
    return `${secs}秒`;
  };

  // 获取成绩等级颜色
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取答案显示文本
  const getAnswerText = (answer: string | string[], type: string) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer || '未作答';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载考试结果中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">考试结果不存在</h2>
          <button
            onClick={() => navigate('/exam-list')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            返回考试列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/exam-list')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>返回考试列表</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">考试结果</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 结果概览卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              result.isPassed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.isPassed ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {result.isPassed ? '考试通过' : '考试未通过'}
            </h2>
            
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getGradeColor(result.grade)}`}>
              {result.grade} 级
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{result.score}</div>
              <div className="text-sm text-gray-600">总分 {result.totalPoints}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{result.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">正确率</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatTime(result.timeUsed)}</div>
              <div className="text-sm text-gray-600">用时</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{result.correctAnswers}/{result.totalQuestions}</div>
              <div className="text-sm text-gray-600">正确题数</div>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>概览统计</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>答题详情</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>答题分析</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* 概览统计 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">答题统计</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">总题数</span>
                        <span className="font-medium">{result.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">已答题数</span>
                        <span className="font-medium">{result.answeredQuestions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">正确题数</span>
                        <span className="font-medium text-green-600">{result.correctAnswers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">错误题数</span>
                        <span className="font-medium text-red-600">{result.answeredQuestions - result.correctAnswers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">未答题数</span>
                        <span className="font-medium text-gray-500">{result.statistics.skippedQuestions}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">时间统计</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">总用时</span>
                        <span className="font-medium">{formatTime(result.timeUsed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">平均每题用时</span>
                        <span className="font-medium">{formatTime(result.statistics.averageTimePerQuestion)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">最快答题</span>
                        <span className="font-medium">{formatTime(result.statistics.fastestQuestion)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">最慢答题</span>
                        <span className="font-medium">{formatTime(result.statistics.slowestQuestion)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 答题详情 */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {result.answers.map((answer, index) => (
                  <div key={answer.questionId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          第 {index + 1} 题
                        </span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {answer.isCorrect ? '正确' : '错误'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {answer.points} 分 | 用时 {formatTime(answer.timeSpent)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">你的答案：</span>
                        <span className={`ml-2 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {getAnswerText(answer.userAnswer, 'single_choice')}
                        </span>
                      </div>
                      
                      {!answer.isCorrect && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">正确答案：</span>
                          <span className="ml-2 text-green-600">
                            {getAnswerText(answer.correctAnswer, 'single_choice')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 答题分析 */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">总体表现</h3>
                  <p className="text-blue-800">
                    {result.isPassed 
                      ? `恭喜！您以 ${result.accuracy.toFixed(1)}% 的正确率通过了考试，表现优秀！`
                      : `您的正确率为 ${result.accuracy.toFixed(1)}%，还需要继续努力。建议重点复习错误的知识点。`
                    }
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">优势分析</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {result.accuracy >= 80 && (
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>正确率较高，基础知识掌握良好</span>
                        </li>
                      )}
                      {result.statistics.averageTimePerQuestion <= 60 && (
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>答题速度较快，时间管理良好</span>
                        </li>
                      )}
                      {result.statistics.skippedQuestions === 0 && (
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>完成了所有题目，学习态度认真</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">改进建议</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {result.accuracy < 60 && (
                        <li className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>需要加强基础知识的学习和理解</span>
                        </li>
                      )}
                      {result.statistics.skippedQuestions > 0 && (
                        <li className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>建议合理分配时间，避免遗漏题目</span>
                        </li>
                      )}
                      {result.statistics.averageTimePerQuestion > 120 && (
                        <li className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>可以通过练习提高答题速度</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/exam-list')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回考试列表
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            打印结果
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;