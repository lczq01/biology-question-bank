import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './utils/config';
import { connectDatabase } from './utils/database';

// 验证配置
validateConfig();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基础路由
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '高中生物题库系统API运行正常',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await connectDatabase(config.database);
    
    // 启动HTTP服务器
    app.listen(config.port, () => {
      console.log(`🚀 服务器运行在 http://localhost:${config.port}`);
      console.log(`📚 高中生物题库系统API已启动`);
      console.log(`🌍 环境: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('📤 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📤 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动应用
startServer();

export default app;