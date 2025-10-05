const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'mock-token-admin';

const adminApi = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
});

async function checkConflictSessions() {
    console.log('🔍 检查时间冲突的考试会话...');
    
    try {
        // 获取所有考试会话
        const response = await adminApi.get('/exam-sessions');
        const sessions = response.data.data.sessions || [];
        
        console.log(`📊 总共找到 ${sessions.length} 个考试会话`);
        
        // 检查2025-12-01时间段的会话
        const targetDate = '2025-12-01';
        const conflictSessions = sessions.filter(session => {
            const startTime = new Date(session.startTime);
            const endTime = new Date(session.endTime);
            const targetStart = new Date('2025-12-01T10:00:00.000Z');
            const targetEnd = new Date('2025-12-01T11:00:00.000Z');
            
            // 检查时间重叠
            return (startTime < targetEnd && endTime > targetStart);
        });
        
        console.log(`⚠️  在 ${targetDate} 10:00-11:00 时间段发现 ${conflictSessions.length} 个冲突会话:`);
        
        conflictSessions.forEach(session => {
            console.log(`- ${session.name} (${session._id})`);
            console.log(`  开始时间: ${session.startTime}`);
            console.log(`  结束时间: ${session.endTime}`);
            console.log(`  状态: ${session.status}`);
            console.log('');
        });
        
        // 显示所有会话的时间信息
        console.log('\n📅 所有考试会话的时间信息:');
        sessions.forEach(session => {
            console.log(`- ${session.name} (${session._id})`);
            console.log(`  开始: ${session.startTime}`);
            console.log(`  结束: ${session.endTime}`);
            console.log(`  状态: ${session.status}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ 检查过程中发生错误:', error.response?.data?.message || error.message);
    }
}

checkConflictSessions().catch(console.error);