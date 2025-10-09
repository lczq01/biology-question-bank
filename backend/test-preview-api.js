/**
 * 预览考试API功能测试脚本
 * 测试完整的预览考试流程：开始→答题→提交→查看结果
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3001/api';
const TEST_EXAM_SESSION_ID = '68e3be17ce22cb4a5f1b9c69'; // 正确的24字符ObjectId
const TEST_USER = {
  id: 'test-admin-001',
  username: 'admin',
  role: 'admin'
};

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer mock-token-${TEST_USER.role}` // 使用mock认证
  }
});

// 测试数据
const testAnswers = [
  {
    questionId: '507f1f77bcf86cd799439012',
    userAnswer: 'A',
    questionType: 'single_choice'
  },
  {
    questionId: '507f1f77bcf86cd799439013', 
    userAnswer: ['A', 'C'],
    questionType: 'multiple_choice'
  },
  {
    questionId: '507f1f77bcf86cd799439014',
    userAnswer: '细胞膜',
    questionType: 'fill_blank'
  }
];

// 测试结果统计
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 辅助函数
function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
  }
  console.log('');
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function logError(message, error) {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  console.log('');
}

// 主测试函数
async function runPreviewAPITests() {
  console.log('🚀 开始预览考试API功能测试\n');
  console.log(`测试目标: ${BASE_URL}`);
  console.log(`考试会话ID: ${TEST_EXAM_SESSION_ID}`);
  console.log(`测试用户: ${TEST_USER.username} (${TEST_USER.role})\n`);

  let previewId = null;

  try {
    // 测试1: 开始预览考试
    logInfo('测试1: 开始预览考试');
    try {
      const startResponse = await api.post(`/exam-sessions/${TEST_EXAM_SESSION_ID}/preview-start`);
      
      if (startResponse.status === 200 && startResponse.data.success) {
        previewId = startResponse.data.data.previewRecord.previewId;
        logTest('开始预览考试', true, `预览ID: ${previewId}`);
        logInfo(`返回数据: ${JSON.stringify(startResponse.data, null, 2)}`);
      } else {
        logTest('开始预览考试', false, '响应格式不正确');
      }
    } catch (error) {
      logTest('开始预览考试', false, `请求失败: ${error.message}`);
      logError('开始预览考试失败', error);
      return; // 如果开始预览失败，后续测试无法进行
    }

    // 测试2: 获取预览考试进度
    logInfo('测试2: 获取预览考试进度');
    try {
      const progressResponse = await api.get(`/exam-sessions/${TEST_EXAM_SESSION_ID}/preview-progress`, {
        params: { previewId }
      });
      
      if (progressResponse.status === 200 && progressResponse.data.success) {
        logTest('获取预览考试进度', true, `进度: ${progressResponse.data.data.progress}%`);
        logInfo(`返回数据: ${JSON.stringify(progressResponse.data, null, 2)}`);
      } else {
        logTest('获取预览考试进度', false, '响应格式不正确');
      }
    } catch (error) {
      logTest('获取预览考试进度', false, `请求失败: ${error.message}`);
      logError('获取预览考试进度失败', error);
    }

    // 测试3: 提交单个预览答案
    logInfo('测试3: 提交单个预览答案');
    try {
      const singleAnswerData = {
        previewId,
        questionId: testAnswers[0].questionId,
        answer: testAnswers[0].userAnswer,
        questionType: testAnswers[0].questionType
      };

      const singleAnswerResponse = await api.post(`/exam-sessions/${TEST_EXAM_SESSION_ID}/preview-answer`, singleAnswerData);
      
      if (singleAnswerResponse.status === 200 && singleAnswerResponse.data.success) {
        logTest('提交单个预览答案', true, '答案提交成功');
        logInfo(`返回数据: ${JSON.stringify(singleAnswerResponse.data, null, 2)}`);
      } else {
        logTest('提交单个预览答案', false, '响应格式不正确');
      }
    } catch (error) {
      logTest('提交单个预览答案', false, `请求失败: ${error.message}`);
      logError('提交单个预览答案失败', error);
    }

    // 测试4: 批量提交预览答案
    logInfo('测试4: 批量提交预览答案');
    try {
      const batchAnswerData = {
        previewId,
        answers: testAnswers.slice(1) // 提交剩余的答案
      };

      const batchAnswerResponse = await api.post(`/exam-sessions/${TEST_EXAM_SESSION_ID}/preview-batch-answer`, batchAnswerData);
      
      if (batchAnswerResponse.status === 200 && batchAnswerResponse.data.success) {
        logTest('批量提交预览答案', true, `批量提交${testAnswers.slice(1).length}个答案`);
        logInfo(`返回数据: ${JSON.stringify(batchAnswerResponse.data, null, 2)}`);
      } else {
        logTest('批量提交预览答案', false, '响应格式不正确');
      }
    } catch (error) {
      logTest('批量提交预览答案', false, `请求失败: ${error.message}`);
      logError('批量提交预览答案失败', error);
    }

    // 测试5: 提交预览考试
    logInfo('测试5: 提交预览考试');
    try {
      const submitData = {
        previewId
      };

      const submitResponse = await api.post(`/exam-sessions/${TEST_EXAM_SESSION_ID}/preview-submit`, submitData);
      
      if (submitResponse.status === 200 && submitResponse.data.success) {
        logTest('提交预览考试', true, '考试提交成功');
        logInfo(`返回数据: ${JSON.stringify(submitResponse.data, null, 2)}`);
      } else {
        logTest('提交预览考试', false, '响应格式不正确');
      }
    } catch (error) {
      logTest('提交预览考试', false, `请求失败: ${error.message}`);
      logError('提交预览考试失败', error);
    }

    // 测试6: 查看预览考试结果
    logInfo('测试6: 查看预览考试结果');
    try {
      const resultResponse = await api.get(`/exam-sessions/${TEST_EXAM_SESSION_ID}/preview-result/${previewId}`);
      
      if (resultResponse.status === 200 && resultResponse.data.success) {
        const result = resultResponse.data.data;
        logTest('查看预览考试结果', true, `总分: ${result.totalScore}, 正确率: ${result.accuracy}%`);
        logInfo(`返回数据: ${JSON.stringify(resultResponse.data, null, 2)}`);
      } else {
        logTest('查看预览考试结果', false, '响应格式不正确');
      }
    } catch (error) {
      logTest('查看预览考试结果', false, `请求失败: ${error.message}`);
      logError('查看预览考试结果失败', error);
    }

  } catch (error) {
    logError('测试过程中发生未预期的错误', error);
  }

  // 输出测试总结
  console.log('📊 测试总结');
  console.log('='.repeat(50));
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  console.log('\n🎉 预览考试API功能测试完成!');
}

// 错误处理测试
async function runErrorHandlingTests() {
  console.log('\n🔍 开始错误处理测试\n');

  // 测试无效的考试会话ID
  logInfo('测试: 无效的考试会话ID');
  try {
    await api.post('/exam-sessions/invalid-id/preview-start');
    logTest('无效考试会话ID处理', false, '应该返回错误但没有');
  } catch (error) {
    if (error.response && error.response.status >= 400) {
      logTest('无效考试会话ID处理', true, `正确返回错误状态: ${error.response.status}`);
    } else {
      logTest('无效考试会话ID处理', false, '错误处理不正确');
    }
  }

  // 测试无效的预览ID
  logInfo('测试: 无效的预览ID');
  try {
    await api.get(`/exam-sessions/${TEST_EXAM_SESSION_ID}/preview-result/invalid-preview-id`);
    logTest('无效预览ID处理', false, '应该返回错误但没有');
  } catch (error) {
    if (error.response && error.response.status >= 400) {
      logTest('无效预览ID处理', true, `正确返回错误状态: ${error.response.status}`);
    } else {
      logTest('无效预览ID处理', false, '错误处理不正确');
    }
  }
}

// 执行所有测试
async function runAllTests() {
  console.log('🧪 预览考试API完整测试套件');
  console.log('='.repeat(60));
  console.log(`开始时间: ${new Date().toLocaleString()}\n`);

  await runPreviewAPITests();
  await runErrorHandlingTests();

  console.log(`\n结束时间: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));
}

// 启动测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  runPreviewAPITests,
  runErrorHandlingTests,
  runAllTests
};