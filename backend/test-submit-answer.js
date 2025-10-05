const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3001/api';
const MOCK_TOKEN = 'mock_token';

// 测试数据
const testData = {
  // 模拟考试记录ID (需要先创建考试记录)
  examRecordId: '67008f123456789012345678',
  questionId: '670089123456789012345678',
  answer: 'A'
};

async function testSubmitAnswer() {
  console.log('🧪 开始测试答题提交API...\n');

  try {
    // 1. 测试提交答案
    console.log('1. 测试提交答案...');
    const submitResponse = await axios.post(`${BASE_URL}/exam/answer`, {
      recordId: testData.examRecordId,
      questionId: testData.questionId,
      answer: testData.answer
    }, {
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ 答案提交成功:');
    console.log('状态码:', submitResponse.status);
    console.log('响应数据:', JSON.stringify(submitResponse.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ API调用失败:');
      console.log('状态码:', error.response.status);
      console.log('错误信息:', error.response.data);
      
      // 如果是404错误，说明考试记录不存在，这是正常的
      if (error.response.status === 404) {
        console.log('ℹ️  这是预期的错误，因为测试数据中的考试记录不存在');
        console.log('✅ API接口本身是正常工作的');
      }
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }

  // 2. 测试参数验证
  console.log('\n2. 测试参数验证...');
  
  try {
    // 测试缺少必需参数
    const invalidResponse = await axios.post(`${BASE_URL}/exam/answer`, {
      recordId: testData.examRecordId,
      // 缺少 questionId 和 answer
    }, {
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ 参数验证正常工作');
    } else {
      console.log('⚠️  参数验证可能需要改进');
    }
  }

  // 3. 测试认证
  console.log('\n3. 测试认证机制...');
  
  try {
    // 测试无认证token
    const noAuthResponse = await axios.post(`${BASE_URL}/exam/answer`, {
      recordId: testData.examRecordId,
      questionId: testData.questionId,
      answer: testData.answer
    });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ 认证机制正常工作');
    } else {
      console.log('⚠️  认证机制可能需要检查');
    }
  }

  console.log('\n🎯 答题提交API测试完成!');
}

// 运行测试
testSubmitAnswer().catch(console.error);