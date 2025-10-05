import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { authAPI } from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 去除用户名和密码的空格
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      
      // Mock登录逻辑 - 优先使用，用于测试环境
      if (trimmedUsername === 'admin' && trimmedPassword === 'admin123') {
        const mockToken = 'mock-token-admin';
        const mockUser = {
          id: '68e0c8a6b5110614871452d1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin' as const,
          profile: {
            name: '管理员',
            avatar: ''
          },
          createdAt: new Date().toISOString()
        };
        
        setToken(mockToken);
        setUser(mockUser);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        console.log('管理员Mock登录成功');
        return true;
      } else if (trimmedUsername === 'student' && trimmedPassword === 'student123') {
        const mockToken = 'mock-token-student';
        const mockUser = {
          id: '68e0c8a6b5110614871452d2',
          username: 'student',
          email: 'student@example.com',
          role: 'student' as const,
          profile: {
            name: '学生',
            avatar: ''
          },
          createdAt: new Date().toISOString()
        };
        
        setToken(mockToken);
        setUser(mockUser);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        console.log('学生Mock登录成功');
        return true;
      }
      
      // 如果不是测试账户，尝试真实API登录
      console.log('尝试真实API登录...');
      const response = await authAPI.login({ username: trimmedUsername, password: trimmedPassword });
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('真实API登录成功');
        return true;
      }
      
      console.log('登录失败：用户名或密码错误');
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      console.log('登录失败：网络错误或服务器错误');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    email: string;
    role: 'admin' | 'student';
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.success) {
        return { success: true, message: '注册成功，请登录' };
      }
      return { success: false, message: response.message || '注册失败' };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, message: '注册失败，请稍后重试' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};