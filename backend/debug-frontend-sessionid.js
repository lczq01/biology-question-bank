const axios = require('axios');

async function debugSessionIds() {
  try {
    console.log('=== 调试前端获取的考试会话ID ===');
    
    const response = await axios.get('http://localhost:3001/api/exam-sessions/available?limit=50', {
      headers: {
        'Authorization': 'Bearer mock-token-student',
        'Content-Type': 'application/json'
      }
    });
    
    const sessions = response.data?.data?.sessions || [];
    console.log('获取到的考试会话数量:', sessions.length);
    
    sessions.forEach((session, index) => {
      console.log(`\n会话 ${index + 1}:`);
      console.log('  ID:', session.id);
      console.log('  名称:', session.name);
      console.log('  状态:', session.status);
      console.log('  类型:', session.examType);
      
      if (session.name.includes('发大水')) {
        console.log('  ⭐ 这是"发大水发大水"考试！');
        console.log('  ID长度:', session.id?.length);
        console.log('  ID类型:', typeof session.id);
      }
    });
    
  } catch (error) {
    console.error('获取考试列表失败:', error.message);
  }
}

debugSessionIds();