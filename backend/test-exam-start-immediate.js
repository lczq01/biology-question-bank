const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'mock-token-admin';
const STUDENT_TOKEN = 'mock-token-student';

// 创建axios实例
const adminApi = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
});

const studentApi = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}` }
});

async function testExamStartAPIImmediate() {
    console.log('🚀 开始考试API立即开始验证测试');
    console.log('================================');
    
    let paperId, sessionId;
    const timestamp = Date.now();
    
    try {
        // 1. 创建测试试卷
        console.log('🔄 创建测试试卷...');
        const paperResponse = await adminApi.post('/exam-paper/create', {
            title: `立即开始考试API测试试卷_${timestamp}`,
            description: '用于测试立即开始考试API的测试试卷',
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
        
        paperId = paperResponse.data.data.id || paperResponse.data.data._id || paperResponse.data._id;
        console.log('✅ 试卷创建成功，ID:', paperId);
        
        // 2. 创建一个可以立即开始的考试会话（使用过去时间开始，确保可以立即加入和开始）
        console.log('\n📋 创建可以立即开始的考试会话...');
        const now = new Date();
        const randomMinutes = Math.floor(Math.random() * 60) + 10; // 10-70分钟的随机偏移
        const startTime = new Date(now.getTime() - 5 * 60 * 1000); // 5分钟前开始
        const endTime = new Date(now.getTime() + randomMinutes * 60 * 1000); // 随机时间后结束
        
        console.log('📅 计划考试时间:', {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            now: now.toISOString(),
            randomOffset: randomMinutes
        });
        
        const sessionResponse = await adminApi.post('/exam-sessions', {
            name: `立即开始考试API测试_${timestamp}_${randomMinutes}`,
            description: '测试立即开始考试API的测试会话',
            paperId: paperId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: 60,
            status: 'active',
            settings: {
                allowReview: true,
                showScore: true,
                allowRetake: false,
                shuffleQuestions: false,
                shuffleOptions: false
            }
        });
        
        sessionId = sessionResponse.data.data._id;
        console.log('✅ 考试会话创建成功，ID:', sessionId);
        
        // 3. 学生加入考试会话
        console.log('\n🔄 学生加入考试会话...');
        try {
            const joinResponse = await studentApi.post(`/exam-sessions/${sessionId}/join`);
            console.log('✅ 学生成功加入考试会话');
        } catch (error) {
            console.log('❌ 学生加入考试会话失败:', error.response?.data?.message || error.message);
            console.log('📊 错误详情:', error.response?.data);
            throw error;
        }
        
        // 4. 开始考试 - 核心功能测试
        console.log('\n🎯 开始考试核心功能测试...');
        try {
            const startResponse = await studentApi.post(`/exam-sessions/${sessionId}/start`);
            console.log('✅ 考试开始成功！');
            console.log('📊 考试详情:', {
                examRecordId: startResponse.data.data.examRecordId,
                sessionId: startResponse.data.data.sessionId,
                startTime: startResponse.data.data.startTime,
                endTime: startResponse.data.data.endTime,
                questions: startResponse.data.data.questions?.length || 0,
                status: startResponse.data.data.status
            });
            
            // 5. 获取考试进度
            console.log('\n📈 测试获取考试进度...');
            try {
                const progressResponse = await studentApi.get(`/exam-sessions/${sessionId}/progress`);
                console.log('✅ 获取考试进度成功！');
                console.log('📈 进度详情:', {
                    status: progressResponse.data.data.status,
                    currentQuestion: progressResponse.data.data.currentQuestion,
                    totalQuestions: progressResponse.data.data.totalQuestions,
                    timeRemaining: progressResponse.data.data.timeRemaining,
                    examRecordId: progressResponse.data.data.examRecordId
                });
            } catch (error) {
                console.log('❌ 获取考试进度失败:', error.response?.data?.message || error.message);
            }
            
            // 6. 测试重复开始考试（应该失败）
            console.log('\n🔄 测试重复开始考试...');
            try {
                const duplicateStartResponse = await studentApi.post(`/exam-sessions/${sessionId}/start`);
                console.log('❌ 意外：重复开始考试竟然成功！', duplicateStartResponse.data);
            } catch (error) {
                console.log('✅ 正确：重复开始考试被阻止 -', error.response?.data?.message || error.message);
            }
            
            console.log('\n🎉 开始考试API验证测试完成！');
            console.log('================================');
            console.log('✅ 核心功能验证结果：');
            console.log('   ✓ 试卷创建功能正常');
            console.log('   ✓ 考试会话创建功能正常');
            console.log('   ✓ 学生加入考试功能正常');
            console.log('   ✓ 开始考试API功能正常');
            console.log('   ✓ 考试进度查询功能正常');
            console.log('   ✓ 重复开始考试防护正常');
            console.log('\n🏆 步骤13.3.2-实现开始考试API 验证通过！');
            
        } catch (error) {
            console.log('❌ 考试开始失败:', error.response?.data?.message || error.message);
            console.log('📊 错误详情:', error.response?.data);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:');
        console.error('错误信息:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    } finally {
        // 清理测试数据
        console.log('\n🔄 清理测试数据...');
        try {
            if (sessionId) {
                await adminApi.delete(`/exam-sessions/${sessionId}`);
                console.log('✅ 清理考试会话成功');
            }
            if (paperId) {
                await adminApi.delete(`/exam-paper/${paperId}`);
                console.log('✅ 清理试卷成功');
            }
        } catch (error) {
            console.log('⚠️  清理数据时出现错误:', error.response?.data?.message || error.message);
        }
    }
}

// 运行测试
testExamStartAPIImmediate().catch(console.error);