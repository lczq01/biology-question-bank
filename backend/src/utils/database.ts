import mongoose from 'mongoose';
import { IDatabaseConfig } from '../types/common.types';

// 数据库连接配置
export const connectDatabase = async (config: IDatabaseConfig): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // 移除已废弃的选项
      // useNewUrlParser 和 useUnifiedTopology 在 MongoDB Driver 4.0+ 已默认启用
      ...config.options
    };

    await mongoose.connect(config.uri, options);
    
    console.log('✅ MongoDB连接成功');
    console.log(`📍 数据库地址: ${config.uri.replace(/\/\/.*@/, '//***:***@')}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB连接错误:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB连接断开');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB重新连接成功');
    });
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    console.warn('⚠️ 将使用模拟数据模式运行');
    // 不退出进程，让服务器继续运行
  }
};

// 关闭数据库连接
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB连接已关闭');
  } catch (error) {
    console.error('❌ 关闭MongoDB连接失败:', error);
  }
};