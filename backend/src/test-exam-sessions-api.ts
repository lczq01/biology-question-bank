// 测试考试会话API权限问题
import axios from 'axios';
import { connectDatabase } from './utils/database';

async function testExamSessionsAPI() {
  console.log('🧪 测试考试会话API权限问题...\n');

  try {
    await connectDatabase({
      uri: 'mongodb://localhost:27017/biology_question_bank',
      options: {}
    });
    console.log('✅ 数据库连接成功\n');

    const baseURL = 'http://localhost:3001/api';
    
    // 测试不同的认证token
    const testTokens = [
      { name: '管理员Token', token: 'mock-token-admin' },
      { name: '学生Token', token: 'mock-token-student' },
      { name: '无效Token', token: 'invalid-token' }
    ];

    for (const { name, token } of testTokens) {
      console.log(`📋 测试 ${name}:`);
      
      try {
        const response = await axios.get(`${baseURL}/exam-sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        console.log(`✅ ${name} - 成功 (${response.status})`);
        console.log(`   数据: ${JSON.stringify(response.data).substring(0, 100)}...`);
        
      } catch (error: any) {
        if (error.response) {
          console.log(`❌ ${name} - 失败 (${error.response.status})`);
          console.log(`   错误: ${error.response.data?.message || error.response.statusText}`);
        } else {
          console.log(`❌ ${name} - 网络错误: ${error.message}`);
        }
      }
      
      console.log('');
    }

    // 测试其他考试会话相关API
    console.log('🔍 测试其他考试会话API:');
    
    const adminToken = 'mock-token-admin';
    const testAPIs = [
      { method: 'GET', url: '/exam-sessions/available', desc: '可用考试列表' },
      { method: 'GET', url: '/exam-sessions/status-rules', desc: '状态规则' }
    ];

    for (const api of testAPIs) {
      try {
        const response = await axios({
          method: api.method,
          url: `${baseURL}${api.url}`,
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        console.log(`✅ ${api.desc} - 成功 (${response.status})`);
        
      } catch (error: any) {
        if (error.response) {
          console.log(`❌ ${api.desc} - 失败 (${error.response.status}): ${error.response.data?.message}`);
        } else {
          console.log(`❌ ${api.desc} - 网络错误: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testExamSessionsAPI().catch(console.error);