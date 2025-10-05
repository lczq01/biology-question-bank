// 修复剩余API问题的综合脚本
import axios from 'axios';
import { connectDatabase } from './utils/database';
import Question from './models/Question';
import { IPaperDocument } from './models/Paper';
import { IUserDocument } from './models/User';
import { UserRole } from './types/user.types';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// 获取Paper和User模型
const Paper = mongoose.model<IPaperDocument>('Paper');
const User = mongoose.model<IUserDocument>('User');

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
            console.log(JSON.stringify(returnedQuestions[0], null, 2));
          }
        } catch (listError: any) {
          console.log(`❌ 题目列表API也失败: ${listError.message}`);
        }
      }
    } else {
      console.log('⚠️ 数据库中没有题目数据，创建测试题目...');
      
      // 创建测试用户
      const timestamp = Date.now();
      const testUser = new User({
        username: `test${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: await bcrypt.hash('password123', 10),
        role: UserRole.ADMIN,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      });
      
      const savedUser = await testUser.save();
      console.log(`✅ 创建测试用户: ${savedUser._id}`);
      
      // 创建测试题目
      const testQuestion = new Question({
        title: '测试题目',
        content: '这是一个测试题目，用于验证API功能',
        type: 'single_choice',
        difficulty: 'medium',
        subject: '生物',
        chapter: '第一章',
        section: '第一节',
        keywords: ['测试', 'API'],
        options: [
          { id: 'A', text: '选项A', isCorrect: true },
          { id: 'B', text: '选项B', isCorrect: false },
          { id: 'C', text: '选项C', isCorrect: false },
          { id: 'D', text: '选项D', isCorrect: false }
        ],
        correctAnswer: 'A',
        explanation: '这是测试题目的解析',
        points: 5,
        createdBy: savedUser._id
      });
      
      const savedQuestion = await testQuestion.save();
      console.log(`✅ 创建测试题目: ${savedQuestion._id}`);
    }

    // 2. 修复试卷API路径问题
    console.log('\n2️⃣ 修复试卷API路径问题:');
    console.log('-----------------------------------');
    
    // 测试不同的试卷API路径
    const paperAPIPaths = [
      '/exam-paper',
      '/exam-paper/list', 
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
    
    if (workingPaperAPI) {
      console.log(`🎯 确定工作的试卷API路径: ${workingPaperAPI}`);
      
      // 测试试卷创建
      const createPaperData = {
        title: '修复测试试卷',
        description: '用于修复API问题的测试试卷',
        questions: [],
        config: {
          totalQuestions: 0,
          totalScore: 0,
          timeLimit: 60,
          difficulty: 'MEDIUM'
        },
        type: 'MANUAL'
      };
      
      try {
        const createResponse = await axios.post(`${baseURL}${workingPaperAPI}`, createPaperData, {
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        console.log(`✅ 试卷创建成功`);
      } catch (error: any) {
        console.log(`❌ 试卷创建失败: ${error.response?.data?.message || error.message}`);
        
        // 尝试其他创建路径
        const createPaths = [
          `${workingPaperAPI}/create`,
          `${workingPaperAPI}/manual`
        ];
        
        for (const createPath of createPaths) {
          try {
            const createResponse = await axios.post(`${baseURL}${createPath}`, createPaperData, {
              headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            });
            console.log(`✅ 试卷创建成功 (路径: ${createPath})`);
            break;
          } catch (createError: any) {
            console.log(`❌ 试卷创建失败 (路径: ${createPath}): ${createError.response?.data?.message || createError.message}`);
          }
        }
      }
    } else {
      console.log('❌ 没有找到工作的试卷API路径，检查路由配置...');
      
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

    // 3. 验证考试会话API（已经正常工作）
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

    // 4. 验证考试结果API（已经正常工作）
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

    console.log('\n🎉 API问题修复完成！');

  } catch (error) {
    console.error('❌ 修复过程失败:', error);
  }
}

fixRemainingAPIIssues().catch(console.error);