const axios = require('axios');

async function getValidSessionId() {
  try {
    const response = await axios.get('http://localhost:3001/api/exam-sessions', {
      headers: { 'Authorization': 'Bearer mock-token-admin' }
    });
    
    const sessions = response.data.data.sessions;
    console.log('前3个考试会话信息:');
    
    for (let i = 0; i < Math.min(3, sessions.length); i++) {
      const session = sessions[i];
      const id = session._id;
      console.log(`${i + 1}. ID: ${id} (长度: ${id.length})`);
      console.log(`   标题: ${session.name}`);
      console.log(`   状态: ${session.status}`);
      
      if (id.length === 24) {
        console.log('   ✅ 有效的ObjectId格式');
      } else {
        console.log('   ❌ 无效的ObjectId格式，截取前24位');
        console.log(`   修正后ID: ${id.substring(0, 24)}`);
      }
      console.log('');
    }
    
    // 返回第一个会话的ID（修正为24位）
    const firstId = sessions[0]._id;
    const validId = firstId.length > 24 ? firstId.substring(0, 24) : firstId;
    console.log(`建议使用的测试ID: ${validId}`);
    
  } catch (error) {
    console.error('获取考试会话失败:', error.message);
  }
}

getValidSessionId();