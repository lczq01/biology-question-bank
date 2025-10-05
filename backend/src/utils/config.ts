import dotenv from 'dotenv';
import { IAppConfig } from '../types/common.types';

// 加载环境变量
dotenv.config();

// 应用配置
export const config: IAppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/biology_question_bank',
    options: {
      // 移除已废弃的选项，MongoDB Driver 4.0+ 已默认启用
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
};

// 验证必要的环境变量
export const validateConfig = (): void => {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️ 环境变量 ${envVar} 未设置，使用默认值`);
    }
  }
  
  if (config.nodeEnv === 'production' && config.jwt.secret === 'your_jwt_secret_key_here') {
    console.error('❌ 生产环境必须设置JWT_SECRET环境变量');
    process.exit(1);
  }
};