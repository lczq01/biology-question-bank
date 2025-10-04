// 模拟认证服务，用于在MongoDB不可用时提供基本功能
export interface MockUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'student';
  password: string;
}

// 模拟用户数据
const mockUsers: MockUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    password: 'admin123'
  },
  {
    id: '2',
    username: 'student',
    email: 'student@example.com',
    role: 'student',
    password: 'student123'
  }
];

// 存储新注册的用户（内存中）
let registeredUsers: MockUser[] = [...mockUsers];

export const mockAuthService = {
  // 登录验证
  login: async (username: string, password: string) => {
    const user = registeredUsers.find(u => u.username === username && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword,
        token: `mock_token_${user.id}_${Date.now()}`
      };
    }
    return {
      success: false,
      message: '用户名或密码错误'
    };
  },

  // 注册用户
  register: async (userData: Omit<MockUser, 'id'>) => {
    // 检查用户名是否已存在
    const existingUser = registeredUsers.find(u => u.username === userData.username);
    if (existingUser) {
      return {
        success: false,
        message: '用户名已存在'
      };
    }

    // 检查邮箱是否已存在
    const existingEmail = registeredUsers.find(u => u.email === userData.email);
    if (existingEmail) {
      return {
        success: false,
        message: '邮箱已被注册'
      };
    }

    // 创建新用户
    const newUser: MockUser = {
      ...userData,
      id: (registeredUsers.length + 1).toString()
    };

    registeredUsers.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    return {
      success: true,
      user: userWithoutPassword,
      message: '注册成功'
    };
  },

  // 验证token
  verifyToken: async (token: string) => {
    if (token.startsWith('mock_token_')) {
      const userId = token.split('_')[2];
      const user = registeredUsers.find(u => u.id === userId);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return {
          success: true,
          user: userWithoutPassword
        };
      }
    }
    return {
      success: false,
      message: 'Invalid token'
    };
  }
};