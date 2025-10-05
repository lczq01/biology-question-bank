import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  Send,
  ArrowLeft,
  ArrowRight,
  Flag
} from 'lucide-react';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer';

interface Question {
  _id: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  options?: string[];
  points: number;
  difficulty: string;
  chapter: string;
}

interface ExamData {
  _id: string;
  status: string;
  config: {
    timeLimit: number;
    totalQuestions: number;
    totalPoints: number;
  };
  answers: Array<{
    questionId: string;
    answer: string | string[];
    timeSpent: number;
  }>;
  startTime: string;
  paperId: {
    title: string;
    questions: Question[];
  };
}

const ExamTaking: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // 获取考试详情
  const fetchExamDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/exam-sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const examData = result.data;
        setExam(examData);
        
        // 初始化已有答案
        const existingAnswers: Record<string, string | string[]> = {};
        examData.answers.forEach((answer: any) => {
          existingAnswers[answer.questionId] = answer.answer;
        });
        setAnswers(existingAnswers);
        
        // 计算剩余时间
        const startTime = new Date(examData.startTime).getTime();
        const timeLimit = examData.config.timeLimit * 60 * 1000; // 转换为毫秒
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeRemaining(Math.floor(remaining / 1000));
        
      } else {
        const error = await response.json();
        alert(error.message || '获取考试详情失败');
        navigate('/exam-list');
      }
    } catch (error) {
      console.error('获取考试详情失败:', error);
      alert('获取考试详情失败，请重试');
      navigate('/exam-list');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  // 自动保存答案
  const autoSaveAnswer = useCallback(async (questionId: string, answer: string | string[]) => {
    if (!exam || autoSaving) return;
    
    setAutoSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/api/exam-sessions/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examId: exam._id,
          questionId,
          answer
        })
      });
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [exam, autoSaving]);

  // 处理答案变化
  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // 延迟自动保存
    setTimeout(() => {
      autoSaveAnswer(questionId, answer);
    }, 1000);
  };

  // 提交考试
  const handleSubmitExam = async () => {
    if (!exam) return;
    
    const confirmed = window.confirm('确定要提交考试吗？提交后将无法修改答案。');
    if (!confirmed) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // 使用新的考试结果API
      const response = await fetch('http://localhost:3001/api/exam/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recordId: exam._id
        })
      });

      if (response.ok) {
        const result = await response.json();
        // 跳转到考试结果页面
        navigate(`/exam/result/${exam._id}`, { 
          state: { examResult: result.data } 
        });
      } else {
        const error = await response.json();
        alert(error.message || '提交考试失败');
      }
    } catch (error) {
      console.error('提交考试失败:', error);
      alert('提交考试失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 倒计时
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 时间到，自动提交
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // 初始化
  useEffect(() => {
    if (sessionId) {
      fetchExamDetails();
    }
  }, [sessionId, fetchExamDetails]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取时间颜色
  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-600'; // 5分钟内红色
    if (timeRemaining <= 600) return 'text-yellow-600'; // 10分钟内黄色
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载考试中...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">考试不存在</h2>
          <button
            onClick={() => navigate('/exam')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            返回考试列表
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.paperId.questions[currentQuestionIndex];
  const totalQuestions = exam.paperId.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部状态栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{exam.paperId.title}</h1>
                <p className="text-sm text-gray-600">
                  第 {currentQuestionIndex + 1} 题 / 共 {totalQuestions} 题
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">
                  已答 {answeredCount}/{totalQuestions}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className={`h-5 w-5 ${getTimeColor()}`} />
                <span className={`text-sm font-medium ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              {autoSaving && (
                <div className="text-sm text-blue-600">保存中...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 题目导航 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">题目导航</h3>
              <div className="grid grid-cols-5 gap-2">
                {exam.paperId.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                      w-10 h-10 rounded-lg text-sm font-medium transition-colors
                      ${index === currentQuestionIndex 
                        ? 'bg-blue-600 text-white' 
                        : answers[exam.paperId.questions[index]._id]
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="w-full mt-6 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? '提交中...' : '提交考试'}</span>
              </button>
            </div>
          </div>

          {/* 题目内容 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* 题目信息 */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    第 {currentQuestionIndex + 1} 题
                  </span>
                  <span className="text-sm text-gray-600">
                    {currentQuestion.points} 分
                  </span>
                  <span className="text-sm text-gray-600">
                    {currentQuestion.difficulty === 'easy' ? '简单' : 
                     currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
                
                {answers[currentQuestion._id] && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">已答</span>
                  </div>
                )}
              </div>

              {/* 题目内容 */}
              <div className="mb-6">
                <SafeHtmlRenderer html={currentQuestion.content} />
              </div>

              {/* 答题区域 */}
              <div className="space-y-4">
                {currentQuestion.type === 'single_choice' && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion._id}`}
                          value={String.fromCharCode(65 + index)}
                          checked={answers[currentQuestion._id] === String.fromCharCode(65 + index)}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <SafeHtmlRenderer html={option} />
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'multiple_choice' && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={String.fromCharCode(65 + index)}
                          checked={Array.isArray(answers[currentQuestion._id]) && 
                                   (answers[currentQuestion._id] as string[]).includes(String.fromCharCode(65 + index))}
                          onChange={(e) => {
                            const currentAnswers = Array.isArray(answers[currentQuestion._id]) 
                              ? answers[currentQuestion._id] as string[] 
                              : [];
                            
                            if (e.target.checked) {
                              handleAnswerChange(currentQuestion._id, [...currentAnswers, e.target.value]);
                            } else {
                              handleAnswerChange(currentQuestion._id, currentAnswers.filter(a => a !== e.target.value));
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <SafeHtmlRenderer html={option} />
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'fill_blank' && (
                  <div>
                    <textarea
                      value={answers[currentQuestion._id] as string || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                      placeholder="请输入答案..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                )}
              </div>

              {/* 导航按钮 */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>上一题</span>
                </button>

                <div className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </div>

                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>下一题</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;