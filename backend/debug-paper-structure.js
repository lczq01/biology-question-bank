// 调试试卷数据结构
const axios = require('axios');

async function debugPaperStructure() {
  try {
    console.log('🔍 检查试卷在数据库中的实际结构...\n');
    
    const paperId = '68e13cacdda597c5eaa89b29';
    const response = await axios.get('http://localhost:3001/api/exam-paper/' + paperId, {
      headers: { 'Authorization': 'Bearer mock-token-admin' }
    });
    
    console.log('试卷数据结构：');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.questions) {
      console.log('\n题目详细结构：');
      response.data.data.questions.forEach((q, i) => {
        console.log(`题目 ${i + 1} 的所有字段：`);
        console.log(Object.keys(q));
        console.log('内容字段：', q.content);
        console.log('类型字段：', q.type);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

debugPaperStructure();