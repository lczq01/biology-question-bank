// 测试学生端考试功能
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
          console.log('');
        });
        
        // 选择第一个可用的考试进行测试
        const testExam = availableExams[0];
        console.log(`选择考试进行测试: ${testExam.name} (ID: ${testExam._id})`);
        
        // 2. 测试获取考试详情（学生视角）
        console.log('\n2. 获取学生视角的考试详情...');
        try {
          const examDetailResponse = await axios.get(`${baseURL}/exam-sessions/${testExam._id}/student-view`, {
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
            const startExamResponse = await axios.post(`${baseURL}/exam-sessions/${testExam._id}/start`, {}, {
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
            
            // 4. 测试获取考试进度
            console.log('\n4. 测试获取考试进度...');
            try {
              const progressResponse = await axios.get(`${baseURL}/exam-sessions/${testExam._id}/progress`, {
                headers: {
                  'Authorization': studentToken
                }
              });
              
              console.log('✓ 考试进度API响应状态:', progressResponse.status);
              const progress = progressResponse.data.data;
              console.log('考试进度信息:');
              console.log(`  剩余时间: ${progress.remainingTime}分钟`);
              console.log(`  已答题数: ${progress.answeredQuestions}/${progress.totalQuestions}`);
              console.log(`  完成百分比: ${progress.completionPercentage}%`);
              
              // 5. 测试提交答案
              console.log('\n5. 测试提交答案...');
              
              // 构造一个示例答案
              const sampleAnswers = {};
              if (examDetail.paperId?.questions?.length > 0) {
                const firstQuestion = examDetail.paperId.questions[0];
                if (firstQuestion.type === 'single_choice' && firstQuestion.options?.length > 0) {
                  sampleAnswers[firstQuestion._id] = firstQuestion.options[0].id; // 选择第一个选项
                  console.log(`准备提交答案: 题目${firstQuestion._id} -> 选项${firstQuestion.options[0].id}`);
                }
              }
              
              try {
                const submitResponse = await axios.post(`${baseURL}/exam-sessions/${testExam._id}/submit-answers`, {
                  answers: sampleAnswers
                }, {
                  headers: {
                    'Authorization': studentToken,
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log('✓ 提交答案API响应状态:', submitResponse.status);
                console.log('答案提交结果:', submitResponse.data.message || '提交成功');
                
                // 6. 测试完成考试
                console.log('\n6. 测试完成考试...');
                try {
                  const finishResponse = await axios.post(`${baseURL}/exam-sessions/${testExam._id}/finish`, {}, {
                    headers: {
                      'Authorization': studentToken
                    }
                  });
                  
                  console.log('✓ 完成考试API响应状态:', finishResponse.status);
                  const result = finishResponse.data.data;
                  if (result) {
                    console.log('考试结果:');
                    console.log(`  总分: ${result.totalScore || '计算中'}`);
                    console.log(`  得分: ${result.score || '计算中'}`);
                    console.log(`  正确率: ${result.accuracy || '计算中'}%`);
                  }
                  
                  console.log('\n🎉 学生端考试功能测试完成！');
                  console.log('\n✅ 测试结果总结:');
                  console.log('  ✓ 学生能够正常获取考试列表');
                  console.log('  ✓ 学生能够查看考试详情和题目');
                  console.log('  ✓ 学生能够成功开始考试');
                  console.log('  ✓ 学生能够查看考试进度');
                  console.log('  ✓ 学生能够提交答案');
                  console.log('  ✓ 学生能够完成考试并查看结果');
                  console.log('\n🎯 学生端考试体验完全正常！');
                  
                } catch (error) {
                  console.log('完成考试失败:', error.response?.data?.message || error.message);
                }
                
              } catch (error) {
                console.log('提交答案失败:', error.response?.data?.message || error.message);
              }
              
            } catch (error) {
              console.log('获取考试进度失败:', error.response?.data?.message || error.message);
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