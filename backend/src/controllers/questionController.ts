import { Request, Response } from 'express';
import Question, { IQuestion, QuestionType, DifficultyLevel } from '../models/Question';

// 创建题目
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      type,
      difficulty,
      chapter,
      section,
      keywords,
      options,
      correctAnswer,
      explanation,
      points,
      imageUrl
    } = req.body;

    // 验证必填字段
    if (!title || !content || !type || !difficulty || !chapter) {
      return res.status(400).json({
        success: false,
        message: '标题、内容、类型、难度和章节为必填项'
      });
    }

    // 验证题目类型
    if (!Object.values(QuestionType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的题目类型'
      });
    }

    // 验证难度等级
    if (!Object.values(DifficultyLevel).includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: '无效的难度等级'
      });
    }

    const question = new Question({
      title,
      content,
      type,
      difficulty,
      subject: '生物',
      chapter,
      section,
      keywords: keywords || [],
      options,
      correctAnswer,
      explanation,
      points: points || 5,
      imageUrl,
      createdBy: req.user!.userId
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: '题目创建成功',
      data: question
    });
  } catch (error: any) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建题目失败'
    });
  }
};

// 获取题目列表
export const getQuestions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      difficulty,
      chapter,
      section,
      keywords,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const query: any = { isActive: true };

    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (chapter) query.chapter = chapter;
    if (section) query.section = section;
    if (keywords) {
      const keywordArray = (keywords as string).split(',').map(k => k.trim());
      query.keywords = { $in: keywordArray };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // 查询题目
    const questions = await Question.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 获取总数
    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error: any) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: '获取题目列表失败'
    });
  }
};

// 获取单个题目
export const getQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id)
      .populate('createdBy', 'username');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error: any) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: '获取题目失败'
    });
  }
};

// 更新题目
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 查找题目
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查权限（只有创建者或管理员可以修改）
    if (question.createdBy.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此题目'
      });
    }

    // 更新题目
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    res.json({
      success: true,
      message: '题目更新成功',
      data: updatedQuestion
    });
  } catch (error: any) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新题目失败'
    });
  }
};

// 删除题目（软删除）
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 查找题目
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查权限（只有创建者或管理员可以删除）
    if (question.createdBy.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此题目'
      });
    }

    // 软删除（设置为不活跃）
    question.isActive = false;
    await question.save();

    res.json({
      success: true,
      message: '题目删除成功'
    });
  } catch (error: any) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: '删除题目失败'
    });
  }
};

// 获取题目统计信息
export const getQuestionStats = async (req: Request, res: Response) => {
  try {
    const stats = await Question.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              count: 1
            }
          },
          byChapter: {
            $push: {
              chapter: '$chapter',
              count: 1
            }
          }
        }
      }
    ]);

    // 处理统计数据
    const typeStats: { [key: string]: number } = {};
    const difficultyStats: { [key: string]: number } = {};
    const chapterStats: { [key: string]: number } = {};

    if (stats.length > 0) {
      stats[0].byType.forEach((item: any) => {
        typeStats[item.type] = (typeStats[item.type] || 0) + 1;
      });

      stats[0].byDifficulty.forEach((item: any) => {
        difficultyStats[item.difficulty] = (difficultyStats[item.difficulty] || 0) + 1;
      });

      stats[0].byChapter.forEach((item: any) => {
        chapterStats[item.chapter] = (chapterStats[item.chapter] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        total: stats.length > 0 ? stats[0].total : 0,
        byType: typeStats,
        byDifficulty: difficultyStats,
        byChapter: chapterStats
      }
    });
  } catch (error: any) {
    console.error('Get question stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
};

// 批量导入题目
export const batchImportQuestions = async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的题目数组'
      });
    }

    const createdQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const questionData = {
          ...questions[i],
          createdBy: req.user!.userId,
          subject: '生物'
        };

        const question = new Question(questionData);
        await question.save();
        createdQuestions.push(question);
      } catch (error: any) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `成功导入 ${createdQuestions.length} 道题目`,
      data: {
        created: createdQuestions.length,
        errors: errors.length,
        errorDetails: errors
      }
    });
  } catch (error: any) {
    console.error('Batch import questions error:', error);
    res.status(500).json({
      success: false,
      message: '批量导入失败'
    });
  }
};