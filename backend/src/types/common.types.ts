// API响应基础接口
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 分页查询基础接口
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应接口
export interface IPaginationResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// 文件上传响应接口
export interface IFileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
}

// JWT载荷接口
export interface IJwtPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 数据库连接配置接口
export interface IDatabaseConfig {
  uri: string;
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    maxPoolSize?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
  };
}

// 应用配置接口
export interface IAppConfig {
  port: number;
  nodeEnv: string;
  database: IDatabaseConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  upload: {
    path: string;
    maxFileSize: number;
    allowedTypes: string[];
  };
}