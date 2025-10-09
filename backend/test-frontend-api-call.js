// 测试前端API调用是否能正常工作
const axios = require('axios');

async function testFrontendAPICall() {
  try {
    console.log('=== 测试前端到后端的API调用 ===\n');
    
    const baseURL = 'http://localhost:3001/api';
    
    // 1. 首先获取现有的试卷ID
    console.log('1. 获取试卷列表...');
    try {
      const papersResponse = await axios.get(`${baseURL}/exam-paper/list`, {
        headers: {
          'Authorization': 'Bearer mock-token-admin'
        }
      });
      
      console.log('试卷API响应状态:', papersResponse.status);
      console.log('试卷数据:', papersResponse.data);
      
      if (papersResponse.data && papersResponse.data.data && papersResponse.data.data.length > 0) {
        // 查找类型为 'exam' 的试卷
        const examPaper = papersResponse.data.data.find(paper => paper.type === 'exam');
        if (!examPaper) {
          console.log('✗ 没有找到类型为exam的试卷');
          return;
        }
        
        const paper = examPaper;
        console.log(`✓ 找到exam类型试卷: ${paper.title} (ID: ${paper.id}, 类型: ${paper.type})`);
        
        // 2. 模拟前端创建考试会话的请求
        console.log('\n2. 测试创建考试会话...');
        
        const examSessionData = {
          name: '前端API测试考试_' + Date.now(),
          paperId: paper.id, // 使用前端格式的试卷ID
          duration: 60,
          type: 'on_demand',
          availableFrom: new Date().toISOString(),
          startTime: new Date().toISOString(),
          endTime: new Date('2099-12-31T23:59:59.999Z').toISOString(),
          availableUntil: null,
          status: 'draft',
          settings: {
            allowReview: true,
            shuffleQuestions: false,
            showResults: true,
            maxAttempts: 1,
            passingScore: 60
          }
        };
        
        console.log('发送的数据:', JSON.stringify(examSessionData, null, 2));
        
        const createResponse = await axios.post(`${baseURL}/exam-sessions`, examSessionData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token-admin'
          }
        });
        
        console.log('\n✓ 考试会话创建成功!');
        console.log('响应状态:', createResponse.status);
        console.log('响应数据:', JSON.stringify(createResponse.data, null, 2));
        
        // 3. 验证数据库中是否真的创建了考试会话
        console.log('\n3. 验证数据库中的考试会话...');
        
        const sessionsResponse = await axios.get(`${baseURL}/exam-sessions`, {
          headers: {
            'Authorization': 'Bearer mock-token-admin'
          }
        });
        
        console.log('考试会话列表响应状态:', sessionsResponse.status);
        console.log('考试会话数量:', sessionsResponse.data?.data?.sessions?.length || 0);
        
        if (sessionsResponse.data?.data?.sessions?.length > 0) {
          console.log('✓ 数据库中确实有考试会话了!');
          sessionsResponse.data.data.sessions.forEach((session, index) => {
            console.log(`  ${index + 1}. ${session.name} (状态: ${session.status})`);
          });
        } else {
          console.log('✗ 数据库中仍然没有考试会话');
        }
        
      } else {
        console.log('✗ 没有找到试卷数据');
      }
      
    } catch (error) {
      console.log('✗ 获取试卷失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.response?.data || error.message);
  }
}

testFrontendAPICall();