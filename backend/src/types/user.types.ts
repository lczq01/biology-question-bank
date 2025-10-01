// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 用户接口定义
export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    grade?: string; // 年级（仅学生）
    class?: string; // 班级（仅学生）
  };
  createdAt: Date;
  updatedAt: Date;
}

// 用户创建请求接口
export interface ICreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    grade?: string;
    class?: string;
  };
}

// 用户登录请求接口
export interface ILoginRequest {
  username: string;
  password: string;
}

// 用户登录响应接口
export interface ILoginResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}