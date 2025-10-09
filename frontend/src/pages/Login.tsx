import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'student' as 'admin' | 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('请输入用户名');
      return false;
    }
    if (!formData.password.trim()) {
      setError('请输入密码');
      return false;
    }
    if (!isLoginMode) {
      if (!formData.email.trim()) {
        setError('请输入邮箱');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('请输入有效的邮箱地址');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        return false;
      }
      if (formData.password.length < 6) {
        setError('密码长度至少6位');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        const success = await login(formData.username, formData.password);
        if (success) {
          // 登录成功，跳转到控制台
          navigate('/dashboard');
        } else {
          setError('用户名或密码错误');
        }
      } else {
        const success = await register(formData.username, formData.email, formData.password);
        
        if (success) {
          setSuccess('注册成功！请登录');
          setIsLoginMode(true);
          setFormData({
            username: formData.username,
            password: '',
            confirmPassword: '',
            email: '',
            role: 'student'
          });
        } else {
          setError('注册失败');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError(isLoginMode ? '登录失败，请稍后重试' : '注册失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      role: 'student'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 50%, #e8eaf6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #2196f3, #3f51b5)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
          }}>
            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 8px' }}>
            高中生物题库系统
          </h2>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            {isLoginMode ? '智能学习，轻松掌握生物知识' : '加入我们，开启学习之旅'}
          </p>
        </div>

        {/* 表单 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #f0f0f0'
        }}>
          {/* 模式切换标签 */}
          <div style={{
            display: 'flex',
            marginBottom: '32px',
            background: '#f5f5f5',
            borderRadius: '12px',
            padding: '4px',
            border: '1px solid #e0e0e0'
          }}>
            <button
              type="button"
              onClick={() => setIsLoginMode(true)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: isLoginMode ? 'linear-gradient(135deg, #2196f3, #3f51b5)' : 'transparent',
                color: isLoginMode ? 'white' : '#666',
                boxShadow: isLoginMode ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none'
              }}
            >
              登录账户
            </button>
            <button
              type="button"
              onClick={() => setIsLoginMode(false)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: !isLoginMode ? 'linear-gradient(135deg, #2196f3, #3f51b5)' : 'transparent',
                color: !isLoginMode ? 'white' : '#666',
                boxShadow: !isLoginMode ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none'
              }}
            >
              注册账户
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && (
              <div style={{
                background: '#ffebee',
                border: '1px solid #ffcdd2',
                color: '#c62828',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: '#e8f5e8',
                border: '1px solid #c8e6c9',
                color: '#2e7d32',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {success}
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                用户名
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: '#fafafa',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="请输入用户名"
                  disabled={isSubmitting}
                />
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  <svg width="16" height="16" fill="none" stroke="#999" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 邮箱 - 仅注册模式显示 */}
            {!isLoginMode && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                  邮箱地址
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: '#fafafa',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="请输入邮箱地址"
                    disabled={isSubmitting}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}>
                    <svg width="16" height="16" fill="none" stroke="#999" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* 密码 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: '#fafafa',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder={isLoginMode ? "请输入密码" : "请输入密码（至少6位）"}
                  disabled={isSubmitting}
                />
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  <svg width="16" height="16" fill="none" stroke="#999" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 确认密码 - 仅注册模式显示 */}
            {!isLoginMode && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                  确认密码
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: '#fafafa',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="请再次输入密码"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* 角色选择 - 仅注册模式显示 */}
            {!isLoginMode && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                  账户类型
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: '#fafafa',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  disabled={isSubmitting}
                >
                  <option value="student">学生</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            )}

            {/* 提交按钮 */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #2196f3, #3f51b5)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                }}
              >
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    {isLoginMode ? '登录中...' : '注册中...'}
                  </div>
                ) : (
                  isLoginMode ? '立即登录' : '创建账户'
                )}
              </button>
            </div>
          </form>

          {/* 测试账户提示 - 仅登录模式显示 */}
          {isLoginMode && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px' }}>测试账户</h4>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <div style={{ marginBottom: '4px' }}>管理员: admin / admin123</div>
                <div>学生: student / student123</div>
              </div>
            </div>
          )}

          {/* 注册提示 - 仅注册模式显示 */}
          {!isLoginMode && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <p style={{ fontSize: '12px', color: '#1565c0', margin: 0 }}>
                注册成功后，您可以使用新账户登录系统。管理员账户可以管理题库，学生账户可以进行练习和考试。
              </p>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            © 2024 高中生物题库系统. 保留所有权利.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;