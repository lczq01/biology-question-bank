import { Router } from 'express';
import { enhancedMockQuestionService } from '../utils/enhancedMockQuestions';

const router = Router();

// 获取题目列表 - 增强版筛选功能
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // 构建筛选条件对象
    const filters = {
      search: req.query.search as string,
      type: req.query.type as string,
      types: req.query.types as string, // 支持多题型筛选
      difficulty: req.query.difficulty as string,
      difficulties: req.query.difficulties as string, // 支持多难度筛选
      chapter: req.query.chapter as string,
      chapters: req.query.chapters as string, // 支持多章节筛选
      keywords: req.query.keywords as string,
      pointsMin: req.query.pointsMin as string,
      pointsMax: req.query.pointsMax as string,
      sortBy: req.query.sortBy as string || 'createdAt', // 排序字段
      sortOrder: req.query.sortOrder as string || 'desc', // 排序方向
      createdAfter: req.query.createdAfter as string, // 创建时间筛选
      createdBefore: req.query.createdBefore as string
    };

    const result = await enhancedMockQuestionService.getQuestions(page, limit, filters);

    res.json(result);
  } catch (error) {
    console.error('获取题目列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取题目列表失败'
    });
  }
});

// 获取筛选选项
router.get('/filter-options', async (req, res) => {
  try {
    const result = await enhancedMockQuestionService.getFilterOptions();
    res.json(result);
  } catch (error) {
    console.error('获取筛选选项错误:', error);
    res.status(500).json({
      success: false,
      message: '获取筛选选项失败'
    });
  }
});

// 获取章节列表
router.get('/chapters', async (req, res) => {
  try {
    const result = await enhancedMockQuestionService.getFilterOptions();
    res.json({
      success: true,
      data: {
        chapters: result.data?.chapters || []
      }
    });
  } catch (error) {
    console.error('获取章节列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取章节列表失败'
    });
  }
});

// 根据ID获取题目
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;


    const result = await enhancedMockQuestionService.getQuestionById(id);


    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('获取题目详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取题目详情失败'
    });
  }
});

// 创建题目
router.post('/', async (req, res) => {
  try {
    const questionData = req.body;


    const result = await enhancedMockQuestionService.createQuestion(questionData);


    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('创建题目错误:', error);
    res.status(500).json({
      success: false,
      message: '创建题目失败'
    });
  }
});

// 更新题目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;


    const result = await enhancedMockQuestionService.updateQuestion(id, updateData);


    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('更新题目错误:', error);
    res.status(500).json({
      success: false,
      message: '更新题目失败'
    });
  }
});

// 删除题目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;


    const result = await enhancedMockQuestionService.deleteQuestion(id);


    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('删除题目错误:', error);
    res.status(500).json({
      success: false,
      message: '删除题目失败'
    });
  }
});

// 获取题目统计信息
router.get('/stats/overview', async (req, res) => {
  try {


    const result = await enhancedMockQuestionService.getStats();


    res.json(result);
  } catch (error) {
    console.error('获取题目统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取题目统计失败'
    });
  }
});

export default router;