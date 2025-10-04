import express from 'express';
import cors from 'cors';
import path from 'path';
import { config, validateConfig } from './utils/config';
import { connectDatabase } from './utils/database';
import { mockAuthService } from './utils/mockAuth';
import apiRoutes from './routes';

// 验证配置
validateConfig();

const app = express();

// 中间件
app.use(cors());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('原始请求体长度:', req.headers['content-length']);
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

// 添加原始请求体捕获中间件
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString();
    });
    req.on('end', () => {
      console.log('原始请求体内容:', rawBody);
      console.log('原始请求体前50个字符:', rawBody.substring(0, 50));
    });
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 添加JSON解析错误处理
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && 'body' in error) {
    console.error('JSON解析错误:', error.message);
    console.error('错误的请求体:', error.body);
    return res.status(400).json({
      success: false,
      message: 'JSON格式错误',
      error: error.message
    });
  }
  next(error);
});

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api', apiRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalUrl
  });
});

// 全局错误处理
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: config.nodeEnv === 'development' ? error.message : undefined
  });
});



// 启动服务器
const startServer = async () => {
  try {
    // 尝试连接数据库
    try {
      await connectDatabase(config.database);
      console.log('✅ 数据库连接成功');
    } catch (dbError) {
      console.warn('⚠️ 数据库连接失败，使用模拟数据模式');
    }
    
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