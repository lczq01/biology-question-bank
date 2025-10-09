import express from 'express';
import { Types } from 'mongoose';
import { Exam } from '../models/Exam';
import { enhancedMockQuestionService } from '../utils/enhancedMockQuestions';
import { ExamPaperService, ExamPaperConfig, presetConfigs, ExamPaperGenerationError } from '../utils/examPaperGenerator';
import { mockAuthenticate } from '../middleware/mockAuth';

const router = express.Router();

// 所有路由都需要认证
router.use(mockAuthenticate);

// 获取考试列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const exams = await Exam.find(filter)
      .select('title description type status startTime endTime duration config stats createdAt')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    
    const total = await Exam.countDocuments(filter);
    
    res.json({
      success: true,
      data: exams,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试列表失败'
    });
  }
});

// 获取可用的考试（学生视角）
router.get('/available', async (req, res) => {
  try {
    const now = new Date();
    const studentId = req.user?.userId || 'unknown';
    
    const exams = await Exam.find({
      $or: [
        { participants: { $size: 0 } },
        { participants: studentId }
      ],
      status: { $in: ['published', 'active'] }
    });
    
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('获取可用考试失败:', error);
    res.status(500).json({
      success: false,
      message: '获取可用考试失败'
    });
  }
});

// 创建新的考试
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      type = 'assessment',
      startTime,
      endTime,
      duration,
      examDuration,
      config,
      questions,
      whitelist = [],
      blacklist = [],
      allowRetake = false,
      showAnswers = true,
      countToGrade = true,
      randomizeQuestions = false,
      randomizeOptions = false,
      allowReview = true
    } = req.body;
    
    if (!title || !config) {
      return res.status(400).json({
        success: false,
        message: '考试标题和配置不能为空'
      });
    }
    
    const newExam = new Exam({
      title,
      description,
      type,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      examDuration: examDuration || duration || 0,
      config,
      questions: questions || [],
      whitelist: whitelist.map((id: string) => new Types.ObjectId(id)),
      blacklist: blacklist.map((id: string) => new Types.ObjectId(id)),
      allowRetake,
      showAnswers,
      countToGrade,
      randomizeQuestions,
      randomizeOptions,
      allowReview,
      createdBy: new Types.ObjectId(req.user?.userId || '67f8a1b2c3d4e5f6a7b8c9d0'),
      status: 'draft'
    });
    
    const savedExam = await newExam.save();
    
    res.status(201).json({
      success: true,
      data: savedExam,
      message: '考试创建成功'
    });
  } catch (error) {
    console.error('创建考试失败:', error);
    res.status(500).json({
      success: false,
      message: '创建考试失败'
    });
  }
});

// 使用预设配置生成考试
router.post('/generate/preset/:presetName', async (req, res) => {
  try {
    const { presetName } = req.params;
    const { title, description, startTime, endTime, duration = 120 } = req.body;
    
    if (!presetConfigs.hasOwnProperty(presetName)) {
      return res.status(400).json({
        success: false,
        message: `未找到预设配置: ${presetName}`
      });
    }
    
    const questionsResult = await enhancedMockQuestionService.getQuestions(1, 1000, {});
    
    if (!questionsResult.success) {
      return res.status(500).json({
        success: false,
        message: '获取题目数据失败'
      });
    }
    
    const difficultyMap: { [key: string]: string } = {
      '简单': 'easy',
      '中等': 'medium', 
      '困难': 'hard'
    };
    
    const normalizedQuestions = (questionsResult.data?.questions || []).map(q => ({
      ...q,
      difficulty: difficultyMap[q.difficulty] || q.difficulty
    }));
    
    const examPaperService = new ExamPaperService(normalizedQuestions);
    const examPaper = examPaperService.generateWithPreset(
      presetName as keyof typeof presetConfigs,
      req.user?.userId || 'unknown',
      title
    );
    
    // 创建考试
    const newExam = new Exam({
      title: title || `预设考试 - ${presetName}`,
      description: description || `使用${presetName}预设配置生成的考试`,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      duration,
      config: {
        totalQuestions: examPaper.totalQuestions,
        totalPoints: examPaper.totalPoints,
        timeLimit: duration,
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: examPaper.questions.map((q: any, index: number) => ({
        questionId: new Types.ObjectId(q.questionId),
        order: index + 1,
        points: q.points || 5
      })),
      createdBy: new Types.ObjectId(req.user?.userId || '67f8a1b2c3d4e5f6a7b8c9d0'),
      status: 'draft'
    });
    
    const savedExam = await newExam.save();
    
    res.json({
      success: true,
      data: savedExam,
      message: '考试生成成功'
    });
  } catch (error) {
    console.error('生成考试失败:', error);
    
    if (error instanceof ExamPaperGenerationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: '生成考试失败'
    });
  }
});

// 使用自定义配置生成考试
router.post('/generate/custom', async (req, res) => {
  try {
    const { config, title, description, startTime, endTime, duration = 120 } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: '缺少组卷配置参数'
      });
    }
    
    const questionsResult = await enhancedMockQuestionService.getQuestions(1, 1000, {});
    
    if (!questionsResult.success) {
      return res.status(500).json({
        success: false,
        message: '获取题目数据失败'
      });
    }
    
    const difficultyMap: { [key: string]: string } = {
      '简单': 'easy',
      '中等': 'medium', 
      '困难': 'hard'
    };
    
    const normalizedQuestions = (questionsResult.data?.questions || []).map(q => ({
      ...q,
      difficulty: difficultyMap[q.difficulty] || q.difficulty
    }));
    
    const examPaperService = new ExamPaperService(normalizedQuestions);
    const examPaper = examPaperService.generateWithCustomConfig(
      config as ExamPaperConfig,
      req.user?.userId || 'unknown',
      title
    );
    
    // 创建考试
    const newExam = new Exam({
      title: title || '自定义配置考试',
      description: description || '使用自定义配置生成的考试',
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      duration,
      config: {
        totalQuestions: examPaper.totalQuestions,
        totalPoints: examPaper.totalPoints,
        timeLimit: duration,
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: examPaper.questions.map((q: any, index: number) => ({
        questionId: new Types.ObjectId(q.questionId),
        order: index + 1,
        points: q.points || 5
      })),
      createdBy: new Types.ObjectId(req.user?.userId || '67f8a1b2c3d4e5f6a7b8c9d0'),
      status: 'draft'
    });
    
    const savedExam = await newExam.save();
    
    res.json({
      success: true,
      data: savedExam,
      message: '考试生成成功'
    });
  } catch (error) {
    console.error('生成考试失败:', error);
    
    if (error instanceof ExamPaperGenerationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      message: '生成考试失败'
    });
  }
});

// 获取单个考试详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的考试ID格式'
      });
    }
    
    const exam = await Exam.findById(id).lean();
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }
    
    // 获取题目详情
    const questionsResult = await enhancedMockQuestionService.getQuestions(1, 1000, {});
    const allQuestions = questionsResult.success ? questionsResult.data?.questions || [] : [];
    
    const processedQuestions = (exam as any).questions.map((questionConfig: any, index: number) => {
      const questionId = questionConfig.questionId;
      const questionIdStr = questionId ? questionId.toString() : '';
      
      let questionData = null;
      
      // 多种匹配策略
      questionData = allQuestions.find((q: any) => q.id === questionIdStr || q._id === questionIdStr);
      
      if (!questionData && questionIdStr.length > 10) {
        const estimatedId = (30 - index).toString();
        questionData = allQuestions.find((q: any) => q.id === estimatedId);
        
        if (!questionData) {
          for (let offset = -2; offset <= 2; offset++) {
            const testId = (30 - index + offset).toString();
            questionData = allQuestions.find((q: any) => q.id === testId);
            if (questionData) break;
          }
        }
      }
      
      if (!questionData && questionIdStr.length === 24) {
        const hash = questionIdStr.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const mappedId = ((hash % 30) + 1).toString();
        questionData = allQuestions.find((q: any) => q.id === mappedId);
      }
      
      if (!questionData) {
        return {
          _id: `missing-${index + 1}`,
          content: '题目已被删除或不存在',
          type: 'single_choice',
          options: [],
          correctAnswer: '',
          explanation: '',
          difficulty: 'medium',
          chapter: '未知',
          knowledgePoint: '未知',
          points: questionConfig.points || 5,
          order: questionConfig.order || (index + 1)
        };
      }
      
      return {
        _id: questionData.id,
        content: questionData.content || '',
        type: questionData.type || 'single_choice',
        options: questionData.options || [],
        correctAnswer: questionData.correctAnswer || '',
        explanation: questionData.explanation || '',
        difficulty: questionData.difficulty || 'medium',
        chapter: questionData.chapter || '未分类',
        knowledgePoint: (questionData as any).knowledgePoint || '',
        points: questionConfig.points || questionData.points || 5,
        order: questionConfig.order || (index + 1)
      };
    });
    
    processedQuestions.sort((a: any, b: any) => a.order - b.order);
    
    const formattedExam = {
      ...exam,
      questions: processedQuestions
    };
    
    res.json({
      success: true,
      data: formattedExam
    });
  } catch (error) {
    console.error('获取考试详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试详情失败'
    });
  }
});

// 更新考试
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的考试ID格式'
      });
    }
    
    const exam = await Exam.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }
    
    res.json({
      success: true,
      data: exam,
      message: '考试更新成功'
    });
  } catch (error) {
    console.error('更新考试失败:', error);
    res.status(500).json({
      success: false,
      message: '更新考试失败'
    });
  }
});

// 更新考试状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的考试ID格式'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '状态不能为空'
      });
    }
    
    const exam = await Exam.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }
    
    res.json({
      success: true,
      data: exam,
      message: '考试状态更新成功'
    });
  } catch (error) {
    console.error('更新考试状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新考试状态失败'
    });
  }
});

// 批量更新考试状态
router.patch('/batch-status', async (req, res) => {
  try {
    const { examIds, status } = req.body;
    
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '考试ID列表不能为空'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '状态不能为空'
      });
    }
    
    const validIds = examIds.filter(id => Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有有效的考试ID'
      });
    }
    
    const result = await Exam.updateMany(
      { _id: { $in: validIds } },
      { status }
    );
    
    res.json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      },
      message: `成功更新 ${result.modifiedCount} 个考试状态`
    });
  } catch (error) {
    console.error('批量更新考试状态失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新考试状态失败'
    });
  }
});

// 删除考试
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的考试ID格式'
      });
    }
    
    const exam = await Exam.findByIdAndDelete(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }
    
    res.json({
      success: true,
      message: '考试删除成功'
    });
  } catch (error) {
    console.error('删除考试失败:', error);
    res.status(500).json({
      success: false,
      message: '删除考试失败'
    });
  }
});

// 验证学生是否可以参加考试
router.get('/:id/can-participate', async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.userId || 'unknown';
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的考试ID格式'
      });
    }
    
    const exam = await Exam.findById(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }
    
    const result = (exam as any).participants.length === 0 || (exam as any).participants.includes(studentId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('验证考试参与权限失败:', error);
    res.status(500).json({
      success: false,
      message: '验证考试参与权限失败'
    });
  }
});

export default router;