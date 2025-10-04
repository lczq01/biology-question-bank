import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RichTextEditor from '../components/RichTextEditor';
import ImageUpload from '../components/ImageUpload';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionData {
  content: string;
  type: string;
  difficulty: string;
  chapter: string;
  options: QuestionOption[];
  answer: string | string[];
  explanation: string;
  image?: string;
}

const QuestionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);

  const [formData, setFormData] = useState<QuestionData>({
    content: '',
    type: 'single_choice',
    difficulty: '简单',
    chapter: '',
    options: [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
      { id: '3', text: '', isCorrect: false },
      { id: '4', text: '', isCorrect: false }
    ],
    answer: '',
    explanation: ''
  });

  // 题型选项
  const questionTypes = [
    { value: 'single_choice', label: '单选题' },
    { value: 'multiple_choice', label: '多选题' },
    { value: 'fill_blank', label: '填空题' }
  ];

  // 难度选项
  const difficultyOptions = [
    { value: '简单', label: '简单' },
    { value: '中等', label: '中等' },
    { value: '困难', label: '困难' }
  ];

  // 获取章节列表
  const fetchChapters = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/questions/chapters', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setAvailableChapters(result.data.chapters || []);
      }
    } catch (error) {
      console.error('获取章节失败:', error);
    }
  };

  // 获取题目详情（编辑模式）
  const fetchQuestionDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      console.log('正在获取题目详情，ID:', id);
      
      const response = await fetch(`http://localhost:3001/api/questions/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('响应状态:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('API返回结果:', result);
        
        if (result.success) {
          const question = result.data;
          console.log('题目数据:', question);
          
          // 映射难度字段
          const difficultyMap: { [key: string]: string } = {
            'easy': '简单',
            'medium': '中等', 
            'hard': '困难'
          };
          
          const mappedFormData = {
            content: question.content || '',
            type: question.type || 'single_choice',
            difficulty: difficultyMap[question.difficulty] || question.difficulty || '简单',
            chapter: question.chapter || '',
            options: question.options || [
              { id: '1', text: '', isCorrect: false },
              { id: '2', text: '', isCorrect: false },
              { id: '3', text: '', isCorrect: false },
              { id: '4', text: '', isCorrect: false }
            ],
            answer: question.correctAnswer || question.answer || '',
            explanation: question.explanation || '',
            image: question.image
          };
          
          console.log('映射后的表单数据:', mappedFormData);
          setFormData(mappedFormData);
        } else {
          console.error('API返回失败:', result.message);
          alert(`获取题目信息失败: ${result.message}`);
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP错误:', response.status, errorText);
        alert(`获取题目详情失败: HTTP ${response.status}`);
        navigate('/questions');
      }
    } catch (error) {
      console.error('获取题目详情失败:', error);
      alert(`获取题目详情失败: ${error.message}`);
      navigate('/questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
    if (isEditing) {
      fetchQuestionDetail();
    }
  }, [id, isEditing]);

  // 处理选项变化
  const handleOptionChange = (optionId: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === optionId ? { ...option, [field]: value } : option
      )
    }));
  };

  // 添加选项
  const addOption = () => {
    const newId = (formData.options.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: newId, text: '', isCorrect: false }]
    }));
  };

  // 删除选项
  const removeOption = (optionId: string) => {
    if (formData.options.length <= 2) {
      alert('至少需要保留2个选项');
      return;
    }
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(option => option.id !== optionId)
    }));
  };

  // 处理图片上传
  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }));
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.content.trim()) {
      alert('请输入题目内容');
      return false;
    }
    
    if (!formData.chapter.trim()) {
      alert('请选择或输入章节');
      return false;
    }

    if (formData.type === 'single_choice' || formData.type === 'multiple_choice') {
      const validOptions = formData.options.filter(opt => opt.text.trim());
      if (validOptions.length < 2) {
        alert('选择题至少需要2个选项');
        return false;
      }
      
      const correctOptions = formData.options.filter(opt => opt.isCorrect);
      if (formData.type === 'single_choice' && correctOptions.length !== 1) {
        alert('单选题必须有且仅有一个正确答案');
        return false;
      }
      if (formData.type === 'multiple_choice' && correctOptions.length === 0) {
        alert('多选题至少需要一个正确答案');
        return false;
      }
    }

    if (formData.type === 'fill_blank' && !formData.answer) {
      alert('请填写答案');
      return false;
    }

    return true;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = isEditing 
        ? `http://localhost:3001/api/questions/${id}`
        : 'http://localhost:3001/api/questions';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(isEditing ? '题目更新成功！' : '题目创建成功！');
          navigate('/questions');
        } else {
          alert(result.message || '操作失败');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('网络错误，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'white' }}>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">加载中...</h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">正在加载题目信息...</div>
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
              onClick={() => navigate('/questions')}
              className="mr-4 p-2 hover:bg-green-600 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">
              {isEditing ? '编辑题目' : '新增题目'}
            </h1>
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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* 题型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">题型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 难度选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {difficultyOptions.map(difficulty => (
                    <option key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 章节输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">章节</label>
                <input
                  type="text"
                  value={formData.chapter}
                  onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
                  placeholder="请输入章节名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>


          </div>

          {/* 题目内容 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">题目内容</h3>
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              placeholder="请输入题目内容..."
            />
          </div>

          {/* 图片上传 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">题目图片（可选）</h3>
            <ImageUpload
              onImageUpload={handleImageUpload}
              currentImage={formData.image}
            />
          </div>

          {/* 选项设置（选择题） */}
          {(formData.type === 'single_choice' || formData.type === 'multiple_choice') && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">选项设置</h3>
              
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(option.id, 'text', e.target.value)}
                    placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  
                  <label className="flex items-center gap-2">
                    <input
                      type={formData.type === 'single_choice' ? 'radio' : 'checkbox'}
                      name={formData.type === 'single_choice' ? 'correct_answer' : undefined}
                      checked={option.isCorrect}
                      onChange={(e) => {
                        if (formData.type === 'single_choice') {
                          // 单选题：先清除所有选项的正确状态，再设置当前选项
                          setFormData(prev => ({
                            ...prev,
                            options: prev.options.map(opt => ({
                              ...opt,
                              isCorrect: opt.id === option.id ? e.target.checked : false
                            }))
                          }));
                        } else {
                          // 多选题：直接切换当前选项状态
                          handleOptionChange(option.id, 'isCorrect', e.target.checked);
                        }
                      }}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-600">正确答案</span>
                  </label>
                  
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addOption}
                className="mt-2 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                + 添加选项
              </button>
            </div>
          )}

          {/* 答案设置（填空题） */}
          {formData.type === 'fill_blank' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">答案</h3>
              <textarea
                value={formData.answer as string}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="请输入答案..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          )}

          {/* 解析 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">解析（可选）</h3>
            <RichTextEditor
              value={formData.explanation}
              onChange={(explanation) => setFormData(prev => ({ ...prev, explanation }))}
              placeholder="请输入题目解析..."
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/questions')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : (isEditing ? '更新题目' : '创建题目')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;