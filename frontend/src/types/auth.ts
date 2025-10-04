export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'student';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
      role: 'admin' | 'student';
      createdAt: string;
    };
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      role: 'admin' | 'student';
      createdAt: string;
    };
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'student';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: {
    username: string;
    password: string;
    email: string;
    role: 'admin' | 'student';
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}