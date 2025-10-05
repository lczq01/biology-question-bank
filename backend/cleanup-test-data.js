const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token-admin'
  }
});

async function cleanupTestData() {
  try {
    console.log('🧹 清理测试数据...');
    
    // 1. 获取所有考试会话
    console.log('1. 获取所有考试会话...');
    const sessionsResponse = await api.get('/exam-sessions?limit=100');
    
    if (sessionsResponse.data.success && sessionsResponse.data.data.sessions) {
      const sessions = sessionsResponse.data.data.sessions;
      console.log(`找到 ${sessions.length} 个考试会话`);
      
      // 删除所有测试相关的考试会话
      for (const session of sessions) {
        if (session.name.includes('测试') || session.name.includes('调试') || session.name.includes('API')) {
          try {
            console.log(`删除考试会话: ${session.name} (${session._id})`);
            await api.delete(`/exam-sessions/${session._id}`);
            console.log('✅ 删除成功');
          } catch (error) {
            console.log(`❌ 删除失败: ${error.response?.data?.message || error.message}`);
          }
        }
      }
    }
    
    // 2. 获取所有试卷
    console.log('2. 获取所有试卷...');
    const papersResponse = await api.get('/exam-paper');
    
    if (papersResponse.data.success && papersResponse.data.data) {
      const papers = papersResponse.data.data;
      console.log(`找到 ${papers.length} 个试卷`);
      
      // 删除所有测试相关的试卷
      for (const paper of papers) {
        if (paper.title.includes('测试') || paper.title.includes('调试') || paper.title.includes('API')) {
          try {
            console.log(`删除试卷: ${paper.title} (${paper._id || paper.id})`);
            await api.delete(`/exam-paper/${paper._id || paper.id}`);
            console.log('✅ 删除成功');
          } catch (error) {
            console.log(`❌ 删除失败: ${error.response?.data?.message || error.message}`);
          }
        }
      }
    }
    
    console.log('🎉 清理完成！');
    
  } catch (error) {
    console.log('❌ 清理过程中发生错误:', error.response?.data?.message || error.message);
  }
}

// 运行清理
cleanupTestData().catch(console.error);