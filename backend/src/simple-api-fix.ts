// 简化版API修复脚本
import axios from 'axios';
import { connectDatabase } from './utils/database';
import mongoose from 'mongoose';

async function fixRemainingAPIIssues() {
  console.log('🔧 开始修复剩余API问题...\n');

  try {
    await connectDatabase({
      uri: 'mongodb://localhost:27017/biology_question_bank',
      options: {}
    });
    console.log('✅ 数据库连接成功\n');

    const baseURL = 'http://localhost:3001/api';
    const adminToken = 'mock-token-admin';

    // 1. 修复题目ID问题
    console.log('1️⃣ 修复题目ID问题:');
    console.log('-----------------------------------');
    
    // 获取已注册的Question模型
    const Question = mongoose.models.Question || require('./models/Question').default;
    
    // 检查数据库中的题目数据结构
    const questions = await Question.find({}).limit(5);
    console.log(`📊 数据库中共有 ${await Question.countDocuments()} 个题目`);
    
    if (questions.length > 0) {
      const firstQuestion = questions[0];
      console.log(`📋 第一个题目的完整数据结构:`);
      console.log(`   _id: ${firstQuestion._id}`);
      console.log(`   title: ${firstQuestion.title}`);
      console.log(`   type: ${firstQuestion.type}`);
      
      // 测试题目详情API
      try {
        const questionDetailResponse = await axios.get(`${baseURL}/questions/${firstQuestion._id}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          timeout: 5000
        });
        console.log(`✅ 题目详情API正常工作`);
      } catch (error: any) {
        console.log(`❌ 题目详情API失败: ${error.response?.data?.message || error.message}`);
        
        // 检查题目列表API返回的数据格式
        try {
          const questionsListResponse = await axios.get(`${baseURL}/questions`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            timeout: 5000
          });
          
          const returnedQuestions = questionsListResponse.data.data?.questions || [];
          if (returnedQuestions.length > 0) {
            console.log(`📋 API返回的第一个题目数据结构:`);
            const firstReturnedQuestion = returnedQuestions[0];
            console.log(`   ID字段: ${firstReturnedQuestion.id || firstReturnedQuestion._id || '未找到'}`);
            console.log(`   标题: ${firstReturnedQuestion.title || '未找到'}`);
            console.log(`   类型: ${firstReturnedQuestion.type || '未找到'}`);
          }
        } catch (listError: any) {
          console.log(`❌ 题目列表API也失败: ${listError.message}`);
        }
      }
    } else {
      console.log('⚠️ 数据库中没有题目数据');
    }

    // 2. 修复试卷API路径问题
    console.log('\n2️⃣ 修复试卷API路径问题:');
    console.log('-----------------------------------');
    
    // 测试不同的试卷API路径
    const paperAPIPaths = [
      '/exam-paper',
      '/exam-papers', 
      '/papers'
    ];
    
    let workingPaperAPI = null;
    
    for (const path of paperAPIPaths) {
      try {
        const response = await axios.get(`${baseURL}${path}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          timeout: 5000
        });
        console.log(`✅ 试卷API路径 "${path}" 工作正常`);
        workingPaperAPI = path;
        break;
      } catch (error: any) {
        console.log(`❌ 试卷API路径 "${path}" 失败: ${error.response?.data?.message || error.message}`);
      }
    }
    
    if (!workingPaperAPI) {
      console.log('❌ 没有找到工作的试卷API路径，检查数据库中的试卷数据...');
      
      // 获取已注册的Paper模型
      const Paper = mongoose.models.Paper || require('./models/Paper').default;
      
      // 检查数据库中的试卷数据
      const papers = await Paper.find({}).limit(3);
      console.log(`📊 数据库中共有 ${await Paper.countDocuments()} 个试卷`);
      
      if (papers.length > 0) {
        console.log(`📋 数据库中的试卷数据结构:`);
        papers.forEach((paper: any, index: number) => {
          console.log(`   试卷${index + 1}: ${paper._id} - ${paper.title}`);
        });
      }
    }

    // 3. 验证考试会话API
    console.log('\n3️⃣ 验证考试会话API:');
    console.log('-----------------------------------');
    
    try {
      const examSessionsResponse = await axios.get(`${baseURL}/exam-sessions`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        timeout: 5000
      });
      console.log(`✅ 考试会话API正常工作`);
    } catch (error: any) {
      console.log(`❌ 考试会话API失败: ${error.response?.data?.message || error.message}`);
    }

    // 4. 验证考试结果API
    console.log('\n4️⃣ 验证考试结果API:');
    console.log('-----------------------------------');
    
    const examResultAPIs = [
      '/exam/history',
      '/exam/statistics'
    ];
    
    for (const api of examResultAPIs) {
      try {
        const response = await axios.get(`${baseURL}${api}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          timeout: 5000
        });
        console.log(`✅ ${api} API正常工作`);
      } catch (error: any) {
        console.log(`❌ ${api} API失败: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 API问题诊断完成！');
    
    // 生成修复建议
    console.log('\n💡 修复建议:');
    console.log('-----------------------------------');
    console.log('1. 如果题目详情API失败，检查题目ID字段映射');
    console.log('2. 如果试卷API全部失败，检查路由配置文件');
    console.log('3. 确保所有API路由正确注册到Express应用');
    console.log('4. 验证认证中间件是否正确处理mock token');

  } catch (error) {
    console.error('❌ 诊断过程失败:', error);
  }
}

fixRemainingAPIIssues().catch(console.error);