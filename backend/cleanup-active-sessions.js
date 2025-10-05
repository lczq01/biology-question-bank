const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'mock-token-admin';

const adminApi = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
});

async function cleanupActiveSessions() {
    console.log('🧹 清理活跃的考试会话...');
    
    try {
        // 获取所有活跃会话
        const response = await adminApi.get('/exam-sessions?status=active&limit=50');
        const sessions = response.data.data.sessions || response.data.data;
        
        console.log(`📊 找到 ${sessions.length} 个活跃的考试会话`);
        
        // 尝试删除每个会话
        for (const session of sessions) {
            try {
                await adminApi.delete(`/exam-sessions/${session._id}`);
                console.log(`✅ 删除会话: ${session.name} (${session._id})`);
            } catch (error) {
                console.log(`❌ 无法删除会话: ${session.name} - ${error.response?.data?.message || error.message}`);
            }
        }
        
        console.log('🎉 清理完成！');
        
    } catch (error) {
        console.error('❌ 清理失败:', error.response?.data?.message || error.message);
    }
}

cleanupActiveSessions().catch(console.error);