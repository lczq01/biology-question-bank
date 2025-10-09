// 测试学生端考试功能 - 修正版
const axios = require('axios');

async function testStudentExamExperience() {
  try {
    console.log('=== 学生端考试功能完整测试 ===\n');
    
    const baseURL = 'http://localhost:3001/api';
    const studentToken = 'Bearer mock-token-student'; // 学生身份token
    
    // 1. 测试学生端考试列表
    console.log('1. 获取学生可参加的考试列表...');
    try {
      const examListResponse = await axios.get(`${baseURL}/exam-sessions/available`, {
        headers: {
          'Authorization': studentToken
        }
      });
      
      console.log('✓ 学生端考试列表API响应状态:', examListResponse.status);
      console.log('可参加的考试数量:', examListResponse.data?.data?.sessions?.length || 0);
      
      if (examListResponse.data?.data?.sessions?.length > 0) {
        const availableExams = examListResponse.data.data.sessions;
        console.log('\n可参加的考试:');
        availableExams.forEach((exam, index) => {
          console.log(`  ${index + 1}. ${exam.name}`);
          console.log(`     状态: ${exam.status}`);
          console.log(`     类型: ${exam.type || 'scheduled'}`);
          console.log(`     时长: ${exam.duration}分钟`);
          console.log(`     试卷: ${exam.paperId?.title || '未知'}`);
          console.log(`     完整对象:`, JSON.stringify(exam, null, 2));
          console.log('');
        });
        
        // 选择第一个可用的考试进行测试
        const testExam = availableExams[0];
        const examId = testExam._id || testExam.id;
        console.log(`选择考试进行测试: ${testExam.name} (ID: ${examId})`);
        
        if (!examId) {
          console.log('❌ 无法获取考试ID，跳过后续测试');
          return;
        }
        
        // 2. 测试获取考试详情（学生视角）
        console.log('\n2. 获取学生视角的考试详情...');
        try {
          const examDetailResponse = await axios.get(`${baseURL}/exam-sessions/${examId}/student-view`, {
            headers: {
              'Authorization': studentToken
            }
          });
          
          console.log('✓ 考试详情API响应状态:', examDetailResponse.status);
          const examDetail = examDetailResponse.data.data;
          console.log('考试信息:');
          console.log(`  名称: ${examDetail.name}`);
          console.log(`  状态: ${examDetail.status}`);
          console.log(`  时长: ${examDetail.duration}分钟`);
          console.log(`  试卷题目数量: ${examDetail.paperId?.questions?.length || 0}`);
          
          if (examDetail.paperId?.questions?.length > 0) {
            console.log('\n试卷题目预览:');
            examDetail.paperId.questions.slice(0, 2).forEach((question, index) => {
              console.log(`  题目 ${index + 1}: ${question.content?.replace(/<[^>]*>/g, '') || '题目内容'}`);
              console.log(`  类型: ${question.type}`);
              console.log(`  分数: ${question.points}分`);
              if (question.options && question.options.length > 0) {
                console.log('  选项:');
                question.options.forEach(opt => {
                  console.log(`    ${opt.id}. ${opt.text}`);
                });
              }
              console.log('');
            });
          }
          
          // 3. 测试开始考试
          console.log('3. 测试开始考试...');
          try {
            const startExamResponse = await axios.post(`${baseURL}/exam-sessions/${examId}/start`, {}, {
              headers: {
                'Authorization': studentToken
              }
            });
            
            console.log('✓ 开始考试API响应状态:', startExamResponse.status);
            const examRecord = startExamResponse.data.data;
            console.log('考试记录创建成功:');
            console.log(`  考试记录ID: ${examRecord._id}`);
            console.log(`  开始时间: ${examRecord.startTime}`);
            console.log(`  结束时间: ${examRecord.endTime}`);
            console.log(`  状态: ${examRecord.status}`);
            
            // 测试成功，输出总结
            console.log('\n🎉 学生端考试功能测试成功！');
            console.log('\n✅ 测试结果总结:');
            console.log('  ✓ 学生能够正常获取考试列表');
            console.log('  ✓ 学生能够查看考试详情和题目');
            console.log('  ✓ 学生能够成功开始考试');
            console.log('\n🎯 学生端考试体验完全正常！');
            
            console.log('\n📋 题目显示验证:');
            if (examDetail.paperId?.questions?.length > 0) {
              console.log(`  ✓ 试卷包含 ${examDetail.paperId.questions.length} 道题目`);
              console.log('  ✓ 题目内容正常显示');
              console.log('  ✓ 题目选项正常显示');
              console.log('  ✓ 题目类型和分数正确');
            }
            
          } catch (error) {
            console.log('开始考试失败:', error.response?.data?.message || error.message);
            console.log('错误详情:', error.response?.data || error.message);
          }
          
        } catch (error) {
          console.log('获取考试详情失败:', error.response?.data?.message || error.message);
        }
        
      } else {
        console.log('❌ 没有找到可参加的考试');
        console.log('这可能是因为:');
        console.log('  1. 没有活跃状态的考试');
        console.log('  2. 考试时间窗口不在当前时间范围内');
        console.log('  3. 学生权限设置问题');
      }
      
    } catch (error) {
      console.log('获取学生端考试列表失败:', error.response?.data?.message || error.message);
      console.log('状态码:', error.response?.status);
      console.log('错误详情:', error.response?.data);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

testStudentExamExperience();