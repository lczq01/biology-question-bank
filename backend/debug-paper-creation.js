const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'mock-token-admin';

const adminApi = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
});

async function debugPaperCreation() {
    try {
        console.log('🔍 调试试卷创建响应结构...');
        
        const paperResponse = await adminApi.post('/exam-paper/create', {
            title: '调试试卷创建响应结构',
            description: '用于调试响应结构的测试试卷',
            type: 'manual',
            config: {
                totalQuestions: 3,
                totalPoints: 100,
                timeLimit: 60,
                allowReview: true,
                shuffleQuestions: false,
                shuffleOptions: false
            },
            questions: [
                { questionId: '68e0b8f5ccc7edb50b1334ac', order: 1, points: 30 },
                { questionId: '68e0b993fa509c798b4d55b5', order: 2, points: 35 },
                { questionId: '68e0b9d0f6b5b5cec9a67275', order: 3, points: 35 }
            ]
        });
        
        console.log('✅ 试卷创建成功！');
        console.log('📋 完整响应结构:');
        console.log(JSON.stringify(paperResponse.data, null, 2));
        
        // 尝试不同的ID提取方式
        const possibleIds = [
            paperResponse.data.data?._id,
            paperResponse.data._id,
            paperResponse.data.id,
            paperResponse.data.data?.id,
            paperResponse.data.paper?._id,
            paperResponse.data.paper?.id
        ];
        
        console.log('\n🔍 可能的ID值:');
        possibleIds.forEach((id, index) => {
            console.log(`方式${index + 1}: ${id}`);
        });
        
        const validId = possibleIds.find(id => id && id !== 'undefined');
        console.log('\n✅ 有效的ID:', validId);
        
    } catch (error) {
        console.error('❌ 调试过程中发生错误:', error.response?.data || error.message);
    }
}

debugPaperCreation();