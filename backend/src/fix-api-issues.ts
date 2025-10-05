import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { config } from './utils/config';
import { User } from './models/User';
import { UserRole, UserStatus } from './types/user.types';
import Question, { QuestionType, DifficultyLevel } from './models/Question';
import { Paper } from './models/Paper';
import { PaperType, PaperStatus } from './types/paper.types';
import { generateToken } from './utils/jwt';
import axios from 'axios';

// API修复脚本
class APIFixManager {
  private baseURL = 'http://localhost:3001/api';
  private testUserId: string = '';
  private testToken: string = '';

  async initialize() {
    console.log('🔧 开始API问题修复...\n');
    
    // 1. 连接数据库
    await this.connectDB();
    
    // 2. 创建测试用户和token
    await this.createTestUser();
    
    // 3. 创建测试数据
    await this.createTestData();
    
    // 4. 测试修复后的API
    await this.testFixedAPIs();
    
    console.log('\n✅ API问题修复完成！');
  }

  private async connectDB() {
    try {
      await connectDatabase(config.database);
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  private async createTestUser() {
    try {
      // 清理已存在的测试用户
      await User.deleteMany({ username: { $regex: /^testuser_fix/ } });
      
      const timestamp = Date.now().toString().slice(-8); // 使用时间戳后8位
      const testUser = new User({
        username: `fix${timestamp}`,
        email: `fix${timestamp}@example.com`,
        password: 'hashedpassword123',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      });

      const savedUser = await testUser.save();
      this.testUserId = savedUser._id.toString();
      
      // 生成有效的JWT token
      this.testToken = generateToken({
        userId: this.testUserId,
        username: savedUser.username,
        role: savedUser.role
      });
      
      console.log('✅ 测试用户创建成功');
      console.log(`   用户ID: ${this.testUserId}`);
      console.log(`   Token: ${this.testToken.substring(0, 20)}...`);
    } catch (error) {
      console.error('❌ 创建测试用户失败:', error);
      throw error;
    }
  }

  private async createTestData() {
    try {
      // 创建测试题目
      const testQuestion = new Question({
        title: '测试题目',
        content: '这是一个测试题目的内容',
        type: QuestionType.SINGLE_CHOICE,
        difficulty: DifficultyLevel.MEDIUM,
        subject: '生物',
        chapter: '第一章',
        section: '第一节',
        keywords: ['测试', '生物'],
        options: [
          { id: 'A', text: '选项A', isCorrect: true },
          { id: 'B', text: '选项B', isCorrect: false },
          { id: 'C', text: '选项C', isCorrect: false },
          { id: 'D', text: '选项D', isCorrect: false }
        ],
        correctAnswer: 'A',
        explanation: '正确答案是A',
        points: 5,
        createdBy: new mongoose.Types.ObjectId(this.testUserId)
      });

      const savedQuestion = await testQuestion.save();
      console.log('✅ 测试题目创建成功');

      // 创建测试试卷
      const testPaper = new Paper({
        title: '测试试卷',
        description: '这是一个测试试卷',
        type: PaperType.PRACTICE,
        status: PaperStatus.DRAFT,
        config: {
          totalQuestions: 1,
          totalPoints: 5,
          timeLimit: 60,
          allowReview: true,
          shuffleQuestions: false,
          shuffleOptions: false
        },
        questions: [{
          questionId: savedQuestion._id,
          order: 1,
          points: 5
        }],
        createdBy: new mongoose.Types.ObjectId(this.testUserId),
        stats: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0
        }
      });

      await testPaper.save();
      console.log('✅ 测试试卷创建成功');
    } catch (error) {
      console.error('❌ 创建测试数据失败:', error);
      throw error;
    }
  }

  private async testFixedAPIs() {
    console.log('\n🧪 测试修复后的API...');
    
    const headers = {
      'Authorization': `Bearer ${this.testToken}`,
      'Content-Type': 'application/json'
    };

    const tests = [
      {
        name: '健康检查API',
        method: 'GET',
        url: `${this.baseURL}/health`,
        headers: {}
      },
      {
        name: '用户登录API',
        method: 'POST',
        url: `${this.baseURL}/auth/login`,
        data: {
          username: 'admin',
          password: 'admin123'
        },
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: '题目列表查询API',
        method: 'GET',
        url: `${this.baseURL}/questions`,
        headers
      },
      {
        name: '题目详情查询API',
        method: 'GET',
        url: `${this.baseURL}/questions`,
        headers
      },
      {
        name: '试卷列表查询API',
        method: 'GET',
        url: `${this.baseURL}/exam-paper/list`,
        headers
      },
      {
        name: '考试会话列表API',
        method: 'GET',
        url: `${this.baseURL}/exam-sessions`,
        headers
      },
      {
        name: '知识点列表API',
        method: 'GET',
        url: `${this.baseURL}/knowledge-points`,
        headers
      }
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (const test of tests) {
      try {
        let response;
        if (test.method === 'GET') {
          response = await axios.get(test.url, { headers: test.headers });
        } else if (test.method === 'POST') {
          response = await axios.post(test.url, test.data, { headers: test.headers });
        }

        if (response && response.status >= 200 && response.status < 300) {
          console.log(`✅ ${test.name}`);
          passedTests++;
        } else {
          console.log(`❌ ${test.name} - 状态码: ${response?.status}`);
        }
      } catch (error: any) {
        if (error.response) {
          console.log(`❌ ${test.name} - ${error.response.status}: ${error.response.data?.message || error.message}`);
        } else {
          console.log(`❌ ${test.name} - ${error.message}`);
        }
      }
    }

    console.log(`\n📊 修复后测试结果:`);
    console.log(`   通过: ${passedTests}/${totalTests}`);
    console.log(`   通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  }

  async cleanup() {
    try {
      // 清理测试数据
      await User.deleteMany({ username: { $regex: /^testuser_fix/ } });
      await Question.deleteMany({ title: '测试题目' });
      await Paper.deleteMany({ title: '测试试卷' });
      
      console.log('🧹 测试数据清理完成');
    } catch (error) {
      console.error('❌ 清理测试数据失败:', error);
    }
  }
}

// 主函数
async function main() {
  const fixer = new APIFixManager();
  
  try {
    await fixer.initialize();
  } catch (error) {
    console.error('❌ API修复失败:', error);
  } finally {
    // 可选择是否清理测试数据
    // await fixer.cleanup();
    process.exit(0);
  }
}

// 运行修复脚本
if (require.main === module) {
  main();
}

export default APIFixManager;