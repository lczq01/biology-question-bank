// 测试试卷API的问题
const axios = require('axios');

async function testPaperAPI() {
  try {
    console.log('🔍 直接测试试卷API...\n');
    
    // 直接获取试卷详情，使用正确的API路径
    const paperId = '68e13cacdda597c5eaa89b29';
    console.log('试卷ID:', paperId);
    
    // 测试不同的API路径
    const testPaths = [
      '/api/exam-paper/' + paperId,
      '/api/papers/' + paperId,
      '/api/exam-papers/' + paperId
    ];
    
    for (const path of testPaths) {
      console.log(`\n测试路径: ${path}`);
      try {
        const response = await axios.get('http://localhost:3001' + path, {
          headers: { 'Authorization': 'Bearer mock-token-admin' }
        });
        
        console.log('✅ 成功获取数据:');
        console.log('   状态码:', response.status);
        console.log('   数据结构:', Object.keys(response.data));
        console.log('   试卷标题:', response.data.title);
        console.log('   题目数量:', response.data.questions?.length || 0);
        
        if (response.data.questions && response.data.questions.length > 0) {
          console.log('   题目列表:');
          response.data.questions.forEach((q, i) => {
            console.log(`     ${i+1}. ${q.content?.substring(0, 50)}...`);
          });
        } else {
          console.log('   ❌ 试卷中没有题目！');
        }
        
        // 输出完整的响应数据用于调试
        console.log('\n完整响应数据:');
        console.log(JSON.stringify(response.data, null, 2));
        
        break; // 找到正确的API就退出
        
      } catch (error) {
        console.log('❌ 失败:', error.response?.status || error.message);
        if (error.response?.data) {
          console.log('   错误详情:', error.response.data);
        }
      }
    }
    
    // 也测试一下获取所有试卷的API
    console.log('\n🔍 测试获取所有试卷API...');
    try {
      const allPapersResponse = await axios.get('http://localhost:3001/api/exam-paper', {
        headers: { 'Authorization': 'Bearer mock-token-admin' }
      });
      
      console.log('✅ 获取所有试卷成功:');
      console.log('   试卷总数:', allPapersResponse.data.length || 0);
      
      // 找到我们要的试卷
      const targetPaper = allPapersResponse.data.find(p => p.id === paperId);
      if (targetPaper) {
        console.log('\n找到目标试卷:');
        console.log('   ID:', targetPaper.id);
        console.log('   标题:', targetPaper.title);
        console.log('   题目数量:', targetPaper.questions?.length || 0);
        
        if (targetPaper.questions && targetPaper.questions.length > 0) {
          console.log('   题目详情:');
          targetPaper.questions.forEach((q, i) => {
            console.log(`     ${i+1}. ${q.content}`);
            console.log(`        类型: ${q.type}`);
            console.log(`        分值: ${q.points}`);
          });
        }
      } else {
        console.log('❌ 在所有试卷中未找到目标试卷');
      }
      
    } catch (error) {
      console.log('❌ 获取所有试卷失败:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testPaperAPI();