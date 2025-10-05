// 详细调试剩余API问题
import axios from 'axios';
import { connectDatabase } from './utils/database';

async function debugRemainingAPIIssues() {
  console.log('🔍 开始详细调试剩余API问题...\n');

  try {
    await connectDatabase({
      uri: 'mongodb://localhost:27017/biology_question_bank',
      options: {}
    });
    console.log('✅ 数据库连接成功\n');

    const baseURL = 'http://localhost:3001/api';
    const adminToken = 'mock-token-admin';

    // 1. 调试题目管理API问题
    console.log('1️⃣ 调试题目管理API问题:');
    console.log('-----------------------------------');
    
    // 先检查题目列表
    try {
      const questionsResponse = await axios.get(`${baseURL}/questions`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        timeout: 5000
      });
      console.log(`✅ 题目列表查询成功，共 ${questionsResponse.data.data?.questions?.length || 0} 个题目`);
      
      if (questionsResponse.data.data?.questions?.length > 0) {
        const firstQuestion = questionsResponse.data.data.questions[0];
        console.log(`📋 第一个题目ID: ${firstQuestion._id}`);
        
        // 尝试获取具体题目详情
        try {
          const questionDetailResponse = await axios.get(`${baseURL}/questions/${firstQuestion._id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            timeout: 5000
          });
          console.log(`✅ 题目详情获取成功`);
        } catch (error: any) {
          console.log(`❌ 题目详情获取失败: ${error.response?.data?.message || error.message}`);
        }
      } else {
        console.log('⚠️ 数据库中没有题目，需要创建测试题目');
      }
      
    } catch (error: any) {
      console.log(`❌ 题目列表查询失败: ${error.response?.data?.message || error.message}`);
    }

    // 2. 调试试卷管理API问题
    console.log('\n2️⃣ 调试试卷管理API问题:');
    console.log('-----------------------------------');
    
    try {
      const papersResponse = await axios.get(`${baseURL}/exam-paper`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        timeout: 5000
      });
      console.log(`✅ 试卷列表查询成功，共 ${papersResponse.data.data?.papers?.length || 0} 个试卷`);
      
      // 尝试创建一个简单的试卷
      const createPaperData = {
        title: '调试测试试卷',
        description: '用于调试API问题的测试试卷',
        questions: [],
        config: {
          totalQuestions: 0,
          totalScore: 0,
          timeLimit: 60,
          difficulty: 'MEDIUM'
        },
        type: 'MANUAL'
      };
      
      try {
        const createPaperResponse = await axios.post(`${baseURL}/exam-paper`, createPaperData, {
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        console.log(`✅ 试卷创建成功: ${createPaperResponse.data.data?._id}`);
      } catch (error: any) {
        console.log(`❌ 试卷创建失败: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
          console.log(`   详细错误信息:`, JSON.stringify(error.response.data, null, 2));
        }
      }
      
    } catch (error: any) {
      console.log(`❌ 试卷列表查询失败: ${error.response?.data?.message || error.message}`);
    }

    // 3. 调试考试会话管理API问题
    console.log('\n3️⃣ 调试考试会话管理API问题:');
    console.log('-----------------------------------');
    
    // 测试不同的token格式
    const testTokens = [
      'mock-token-admin',
      'mock_token_admin', 
      'Bearer mock-token-admin',
      'admin-token'
    ];
    
    for (const token of testTokens) {
      try {
        const examSessionsResponse = await axios.get(`${baseURL}/exam-sessions`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        console.log(`✅ Token "${token}" 成功访问考试会话`);
      } catch (error: any) {
        console.log(`❌ Token "${token}" 失败: ${error.response?.data?.message || error.message}`);
      }
    }

    // 4. 调试考试结果API问题
    console.log('\n4️⃣ 调试考试结果API问题:');
    console.log('-----------------------------------');
    
    const examResultAPIs = [
      '/exam/history',
      '/exam/statistics'
    ];
    
    for (const api of examResultAPIs) {
      try {
        const response = await axios.get(`${baseURL}${api}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          timeout: 5000
        });
        console.log(`✅ ${api} 访问成功`);
      } catch (error: any) {
        console.log(`❌ ${api} 访问失败: ${error.response?.data?.message || error.message}`);
        if (error.response?.status === 401) {
          console.log(`   认证问题，检查该API的认证中间件配置`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 调试过程失败:', error);
  }
}

debugRemainingAPIIssues().catch(console.error);