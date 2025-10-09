import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authAPI } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}

interface AuthHook {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  token: string | null;
}

interface AuthContextType extends AuthHook {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Mock authentication hook for development
export const useAuth = (): AuthHook => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await authAPI.login({ username, password });
      
      if (response.success) {
        const user = response.data.user;
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await authAPI.register({ username, email, password, role: 'student' });
      
      if (response.success) {
        // 注册成功后自动登录
        const loginResponse = await authAPI.login({ username, password });
        if (loginResponse.success) {
          const user = loginResponse.data.user;
          setUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('token', loginResponse.data.token);
          setToken(loginResponse.data.token);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // 调用后端登出API
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
  };

  return {
    user,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isLoading: loading,
    loading,
    token
  };
};