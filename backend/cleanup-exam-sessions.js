const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'mock-token-admin';

const adminApi = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
});

async function cleanupExamSessions() {
    console.log('🔄 清理所有考试会话...');
    
    try {
        // 获取所有考试会话
        const response = await adminApi.get('/exam-sessions');
        const sessions = response.data.data.sessions || [];
        
        console.log(`📊 找到 ${sessions.length} 个考试会话`);
        
        // 删除所有考试会话
        for (const session of sessions) {
            try {
                await adminApi.delete(`/exam-sessions/${session._id}`);
                console.log(`✅ 删除考试会话: ${session.name} (${session._id})`);
            } catch (error) {
                console.log(`❌ 删除考试会话失败: ${session._id} - ${error.response?.data?.message || error.message}`);
            }
        }
        
        console.log('✅ 考试会话清理完成');
        
    } catch (error) {
        console.error('❌ 清理过程中发生错误:', error.response?.data?.message || error.message);
    }
}

cleanupExamSessions().catch(console.error);