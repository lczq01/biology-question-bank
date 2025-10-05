const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'mock-token-admin';

const adminApi = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
});

async function checkActiveSessions() {
    console.log('🔍 检查当前活跃的考试会话...');
    
    try {
        const response = await adminApi.get('/exam-sessions?status=active&limit=50');
        const sessions = response.data.data.sessions || response.data.data;
        
        console.log(`📊 找到 ${sessions.length} 个活跃的考试会话:`);
        
        sessions.forEach((session, index) => {
            console.log(`\n${index + 1}. 会话: ${session.name}`);
            console.log(`   ID: ${session._id}`);
            console.log(`   开始时间: ${session.startTime}`);
            console.log(`   结束时间: ${session.endTime}`);
            console.log(`   状态: ${session.status}`);
        });
        
        // 建议一个安全的时间段
        const now = new Date();
        const safeStartTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2小时后
        console.log(`\n💡 建议使用时间段:`);
        console.log(`   开始时间: ${safeStartTime.toISOString()}`);
        console.log(`   结束时间: ${new Date(safeStartTime.getTime() + 60 * 60 * 1000).toISOString()}`);
        
    } catch (error) {
        console.error('❌ 检查会话失败:', error.response?.data?.message || error.message);
    }
}

checkActiveSessions().catch(console.error);