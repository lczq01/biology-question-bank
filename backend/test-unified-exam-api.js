// 统一考试API测试脚本
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  userId: '67f8a1b2c3d4e5f6a7b8c9d0',
  username: 'testuser',
  role: 'admin'
};

// 模拟认证头 - 使用mock token
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer mock-token-admin'
};

async function testAPI() {
  console.log('🧪 开始测试统一考试API端点...\n');
  
  try {
    // 测试1: 获取考试列表
    console.log('1. 测试获取考试列表...');
    const listResponse = await axios.get(`${BASE_URL}/unified-exams`, { headers });
    console.log('✅ 获取考试列表成功');
    console.log('   响应:', JSON.stringify(listResponse.data, null, 2));
    
    // 测试2: 创建新的考试
    console.log('\n2. 测试创建考试...');
    const createData = {
      title: '测试统一考试',
      description: '这是一个测试用的统一考试',
      type: 'assessment',
      examDuration: 120,
      config: {
        totalQuestions: 3,
        totalPoints: 30,
        timeLimit: 120,
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: [
        {
          questionId: '68e0c8a6b5110614871452d3',
          order: 1,
          points: 10
        },
        {
          questionId: '68e0c8a6b5110614871452d4', 
          order: 2,
          points: 10
        },
        {
          questionId: '68e0c8a6b5110614871452d5',
          order: 3,
          points: 10
        }
      ],
      allowRetake: false,
      maxAttempts: 1,
      showAnswers: true,
      countToGrade: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      allowReview: true
    };
    
    const createResponse = await axios.post(`${BASE_URL}/unified-exams`, createData, { headers });
    console.log('✅ 创建考试成功');
    console.log('   考试ID:', createResponse.data.data._id);
    
    const examId = createResponse.data.data._id;
    
    // 测试3: 获取考试详情
    console.log('\n3. 测试获取考试详情...');
    const detailResponse = await axios.get(`${BASE_URL}/unified-exams/${examId}`, { headers });
    console.log('✅ 获取考试详情成功');
    console.log('   考试标题:', detailResponse.data.data.title);
    
    // 测试4: 验证学生参与权限
    console.log('\n4. 测试验证学生参与权限...');
    const permissionResponse = await axios.get(`${BASE_URL}/unified-exams/${examId}/can-participate`, { headers });
    console.log('✅ 验证参与权限成功');
    console.log('   是否可以参与:', permissionResponse.data.data.canParticipate);
    
    // 测试5: 更新考试状态
    console.log('\n5. 测试更新考试状态...');
    const updateResponse = await axios.patch(`${BASE_URL}/unified-exams/${examId}/status`, 
      { status: 'published' }, { headers });
    console.log('✅ 更新考试状态成功');
    console.log('   新状态:', updateResponse.data.data.status);
    
    // 测试6: 获取可用考试（学生视角）
    console.log('\n6. 测试获取可用考试...');
    const availableResponse = await axios.get(`${BASE_URL}/unified-exams/available`, { headers });
    console.log('✅ 获取可用考试成功');
    console.log('   可用考试数量:', availableResponse.data.data.length);
    
    console.log('\n🎉 所有API端点测试通过！');
    
  } catch (error) {
    console.error('❌ API测试失败:');
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   错误信息:', error.response.data);
    } else {
      console.error('   错误:', error.message);
    }
  }
}

// 运行测试
testAPI();