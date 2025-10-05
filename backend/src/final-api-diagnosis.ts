// 最终API诊断和修复脚本
import axios from 'axios';
import { connectDatabase } from './utils/database';

async function finalAPIDiagnosis() {
  console.log('🔧 最终API诊断开始...\n');

  try {
    // 1. 检查服务器连通性
    console.log('1️⃣ 检查服务器连通性:');
    console.log('-----------------------------------');
    
    try {
      const healthResponse = await axios.get('http://localhost:3001', {
        timeout: 3000
      });
      console.log('✅ 服务器正常响应');
    } catch (error: any) {
      console.log(`❌ 服务器连接失败: ${error.message}`);
      console.log('请确保后端服务器正在运行：npm run dev');
      return;
    }

    // 2. 测试具体API端点
    console.log('\n2️⃣ 测试API端点:');
    console.log('-----------------------------------');
    
    const baseURL = 'http://localhost:3001/api';
    const adminToken = 'mock-token-admin';
    
    const apiEndpoints = [
      { name: '题目列表', url: '/questions' },
      { name: '试卷列表', url: '/exam-paper' },
      { name: '试卷列表(备选)', url: '/papers' },
      { name: '考试会话', url: '/exam-sessions' },
      { name: '考试历史', url: '/exam/history' },
      { name: '用户信息', url: '/auth/profile' }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await axios.get(`${baseURL}${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          timeout: 3000
        });
        console.log(`✅ ${endpoint.name} API正常 (状态: ${response.status})`);
      } catch (error: any) {
        const status = error.response?.status || 'No Response';
        const message = error.response?.data?.message || error.message;
        console.log(`❌ ${endpoint.name} API失败 (状态: ${status}, 消息: ${message})`);
      }
    }

    // 3. 检查数据库连接和数据
    console.log('\n3️⃣ 检查数据库状态:');
    console.log('-----------------------------------');
    
    await connectDatabase({
      uri: 'mongodb://localhost:27017/biology_question_bank',
      options: {}
    });
    console.log('✅ 数据库连接成功');

    // 动态导入模型
    try {
      const { default: Question } = await import('./models/Question');
      const questionCount = await Question.countDocuments();
      console.log(`📊 题目数量: ${questionCount}`);
      
      if (questionCount > 0) {
        const firstQuestion = await Question.findOne({});
        console.log(`📋 第一个题目ID: ${firstQuestion?._id}`);
        console.log(`📋 第一个题目标题: ${firstQuestion?.title}`);
      }
    } catch (error: any) {
      console.log(`❌ 题目模型导入失败: ${error.message}`);
    }

    try {
      const { default: Paper } = await import('./models/Paper');
      const paperCount = await Paper.countDocuments();
      console.log(`📊 试卷数量: ${paperCount}`);
    } catch (error: any) {
      console.log(`❌ 试卷模型导入失败: ${error.message}`);
    }

    try {
      const { default: ExamSession } = await import('./models/ExamSession');
      const sessionCount = await ExamSession.countDocuments();
      console.log(`📊 考试会话数量: ${sessionCount}`);
    } catch (error: any) {
      console.log(`❌ 考试会话模型导入失败: ${error.message}`);
    }

    // 4. 生成修复建议
    console.log('\n4️⃣ 修复建议:');
    console.log('-----------------------------------');
    console.log('基于上述诊断结果，建议的修复步骤：');
    console.log('1. 确保后端服务器正常运行 (npm run dev)');
    console.log('2. 检查API路由注册是否正确');
    console.log('3. 验证认证中间件配置');
    console.log('4. 检查Mongoose模型注册');
    console.log('5. 验证CORS配置');

    console.log('\n🎉 诊断完成！');

  } catch (error) {
    console.error('❌ 诊断过程失败:', error);
  }
}

finalAPIDiagnosis().catch(console.error);