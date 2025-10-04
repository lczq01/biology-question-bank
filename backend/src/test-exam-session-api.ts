// 测试考试会话创建API
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// 测试数据
const testSessionData = {
  name: '高中生物期末考试',
  description: '高中生物第一学期期末考试，涵盖细胞生物学、遗传学等内容',
  paperId: '507f1f77bcf86cd799439011', // 示例试卷ID
  startTime: '2024-01-20T09:00:00.000Z',
  endTime: '2024-01-20T11:00:00.000Z',
  duration: 120,
  settings: {
    allowReview: true,
    shuffleQuestions: false,
    shuffleOptions: true,
    showResults: false,
    allowRetake: false,
    maxAttempts: 1,
    passingScore: 60,
    autoGrade: true,
    preventCheating: true
  }
};

// 模拟用户token（需要实际登录获取）
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

async function testCreateExamSession() {
  console.log('🧪 测试考试会话创建API...\n');

  try {
    // 测试1: 正常创建考试会话
    console.log('📝 测试1: 正常创建考试会话');
    console.log('请求数据:', JSON.stringify(testSessionData, null, 2));
    
    const response = await axios.post(
      `${BASE_URL}/exam-sessions`,
      testSessionData,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ 创建成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('');

  } catch (error: any) {
    if (error.response) {
      console.log('❌ 创建失败 - 服务器响应错误');
      console.log('状态码:', error.response.status);
      console.log('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ 创建失败 - 网络错误');
      console.log('无法连接到服务器，请确保后端服务正在运行');
    } else {
      console.log('❌ 创建失败 - 请求配置错误');
      console.log('错误:', error.message);
    }
    console.log('');
  }

  // 测试2: 缺少必填字段
  console.log('📝 测试2: 缺少必填字段');
  try {
    const invalidData = { ...testSessionData };
    delete (invalidData as any).name;
    delete (invalidData as any).paperId;

    const response = await axios.post(
      `${BASE_URL}/exam-sessions`,
      invalidData,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('⚠️ 意外成功 - 应该返回验证错误');
    console.log('响应:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      console.log('✅ 正确返回验证错误');
      console.log('错误信息:', error.response.data.message);
    } else {
      console.log('❌ 意外错误:', error.message);
    }
  }
  console.log('');

  // 测试3: 无效的时间格式
  console.log('📝 测试3: 无效的时间格式');
  try {
    const invalidTimeData = {
      ...testSessionData,
      startTime: 'invalid-date',
      endTime: 'invalid-date'
    };

    const response = await axios.post(
      `${BASE_URL}/exam-sessions`,
      invalidTimeData,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('⚠️ 意外成功 - 应该返回时间格式错误');

  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      console.log('✅ 正确返回时间格式错误');
      console.log('错误信息:', error.response.data.message);
    } else {
      console.log('❌ 意外错误:', error.message);
    }
  }
  console.log('');

  // 测试4: 未授权访问
  console.log('📝 测试4: 未授权访问');
  try {
    const response = await axios.post(
      `${BASE_URL}/exam-sessions`,
      testSessionData,
      {
        headers: {
          'Content-Type': 'application/json'
          // 不提供Authorization头
        }
      }
    );

    console.log('⚠️ 意外成功 - 应该返回未授权错误');

  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      console.log('✅ 正确返回未授权错误');
      console.log('错误信息:', error.response.data.message);
    } else {
      console.log('❌ 意外错误:', error.message);
    }
  }
  console.log('');

  console.log('🎯 API测试完成!');
}

// 检查服务器连接
async function checkServerConnection() {
  console.log('🔍 检查服务器连接...');
  try {
    const response = await axios.get(`${BASE_URL}/auth/test`, {
      timeout: 5000
    });
    console.log('✅ 服务器连接正常');
    return true;
  } catch (error) {
    console.log('❌ 无法连接到服务器');
    console.log('请确保后端服务在 http://localhost:3001 运行');
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试考试会话创建API...\n');
  
  const serverOnline = await checkServerConnection();
  if (!serverOnline) {
    console.log('\n💡 启动服务器命令:');
    console.log('cd biology-question-bank/backend && npm run dev');
    return;
  }

  console.log('');
  await testCreateExamSession();
}

// 运行测试
runTests().catch(console.error);