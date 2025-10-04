import { Request, Response } from 'express';
import KnowledgePoint, { IKnowledgePoint } from '../models/KnowledgePoint';
import { AuthRequest } from '../middleware/auth';
import { 
  validateCustomId, 
  generateNextSequence, 
  parseCustomId,
  getAllModules,
  MODULE_CODES 
} from '../utils/customIdUtils';

// 创建知识点
export const createKnowledgePoint = async (req: AuthRequest, res: Response) => {
  try {
    console.log('收到创建知识点请求');
    console.log('请求体:', req.body);
    console.log('请求体类型:', typeof req.body);
    
    const {
      name,
      description,
      chapter,
      parentId = '',
      relatedIds = [],
      customId
    } = req.body;

    console.log('解析后的字段:', { name, description, chapter, parentId, relatedIds, customId });

    // 验证必填字段
    if (!name || !description || !chapter) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段：名称、描述、章节'
      });
    }

    // 验证customId（如果提供）
    if (customId) {
      const validation = validateCustomId(customId);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: `自定义ID验证失败: ${validation.error}`
        });
      }

      // 检查customId是否已存在
      const existingKnowledgePoint = await KnowledgePoint.findByCustomId(customId);
      if (existingKnowledgePoint) {
        return res.status(400).json({
          success: false,
          message: `自定义ID "${customId}" 已存在，请使用其他ID`
        });
      }
    }

    // 创建知识点
    const knowledgePointData: any = {
      name: name.trim(),
      description: description.trim(),
      chapter: chapter.trim(),
      parentId: parentId.trim() || '',
      relatedIds: Array.isArray(relatedIds) ? relatedIds : []
    };

    if (customId) {
      knowledgePointData.customId = customId.trim();
    }

    const knowledgePoint = new KnowledgePoint(knowledgePointData);

    console.log('准备保存的知识点数据:', knowledgePoint.toObject());

    await knowledgePoint.save();

    console.log('知识点保存成功:', knowledgePoint._id);

    res.status(201).json({
      success: true,
      message: '知识点创建成功',
      data: knowledgePoint
    });
  } catch (error) {
    console.error('创建知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '创建知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 获取ID建议
export const getIdSuggestions = async (req: Request, res: Response) => {
  try {
    const { moduleCode, chapterCode, sectionCode, count = 5 } = req.query;

    if (!moduleCode || !chapterCode || !sectionCode) {
      return res.status(400).json({
        success: false,
        message: '请提供模块代码、章代码和节代码'
      });
    }

    // 验证模块代码
    if (!MODULE_CODES[moduleCode as keyof typeof MODULE_CODES]) {
      return res.status(400).json({
        success: false,
        message: '无效的模块代码'
      });
    }

    const chapterStr = parseInt(chapterCode as string).toString().padStart(2, '0');
    const sectionStr = parseInt(sectionCode as string).toString().padStart(2, '0');
    const prefix = `${moduleCode}-${chapterStr}-${sectionStr}-`;
    
    // 获取当前章节下所有已存在的customId
    const existingKnowledgePoints = await KnowledgePoint.find({
      customId: { $regex: `^${prefix}`, $options: 'i' }
    }).select('customId');

    const existingIds = existingKnowledgePoints
      .map(kp => kp.customId)
      .filter((id): id is string => Boolean(id));

    // 生成建议的ID列表
    const suggestions = [];
    const requestedCount = Math.min(parseInt(count as string), 20); // 最多20个建议
    
    for (let i = 0; i < requestedCount; i++) {
      const nextSequence = generateNextSequence(
        moduleCode as string,
        parseInt(chapterCode as string),
        parseInt(sectionCode as string),
        existingIds
      );
      
      const suggestedId = `${moduleCode}-${chapterStr}-${sectionStr}-${nextSequence.toString().padStart(3, '0')}`;
      suggestions.push(suggestedId);
      existingIds.push(suggestedId); // 避免重复建议
    }

    res.json({
      success: true,
      data: {
        moduleCode,
        chapterCode,
        sectionCode,
        prefix,
        existingCount: existingKnowledgePoints.length,
        suggestions,
        requestedCount
      }
    });
  } catch (error) {
    console.error('获取ID建议失败:', error);
    res.status(500).json({
      success: false,
      message: '获取ID建议失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 获取知识点列表
export const getKnowledgePoints = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      chapter = '',
      parentId,
      customId,
      moduleCode
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { customId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (chapter) {
      query.chapter = { $regex: chapter, $options: 'i' };
    }
    
    if (parentId) {
      query.parentId = parentId;
    }

    if (customId) {
      query.customId = customId;
    }

    // 根据模块代码筛选
    if (moduleCode && MODULE_CODES[moduleCode as keyof typeof MODULE_CODES]) {
      query.customId = { $regex: `^${moduleCode}-`, $options: 'i' };
    }

    // 获取知识点列表
    const knowledgePoints = await KnowledgePoint
      .find(query)
      .sort({ customId: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 获取总数
    const total = await KnowledgePoint.countDocuments(query);

    res.json({
      success: true,
      data: {
        knowledgePoints,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('获取知识点列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识点列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 根据ID获取知识点
export const getKnowledgePointById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const knowledgePoint = await KnowledgePoint.findById(id);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    res.json({
      success: true,
      data: knowledgePoint
    });
  } catch (error) {
    console.error('获取知识点详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识点详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 更新知识点
export const updateKnowledgePoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      chapter,
      parentId = '',
      relatedIds = [],
      customId
    } = req.body;

    // 验证必填字段
    if (!name || !description || !chapter) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段：名称、描述、章节'
      });
    }

    // 验证customId（如果提供）
    if (customId) {
      const validation = validateCustomId(customId);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: `自定义ID验证失败: ${validation.error}`
        });
      }

      // 检查customId是否已被其他知识点使用
      const existingKnowledgePoint = await KnowledgePoint.findByCustomId(customId);
      if (existingKnowledgePoint && existingKnowledgePoint._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: `自定义ID "${customId}" 已被其他知识点使用，请使用其他ID`
        });
      }
    }

    const updateData: any = {
      name: name.trim(),
      description: description.trim(),
      chapter: chapter.trim(),
      parentId: parentId.trim() || '',
      relatedIds: Array.isArray(relatedIds) ? relatedIds : []
    };

    if (customId !== undefined) {
      updateData.customId = customId ? customId.trim() : undefined;
    }

    const knowledgePoint = await KnowledgePoint.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    res.json({
      success: true,
      message: '知识点更新成功',
      data: knowledgePoint
    });
  } catch (error) {
    console.error('更新知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '更新知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 删除知识点
export const deleteKnowledgePoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const knowledgePoint = await KnowledgePoint.findByIdAndDelete(id);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    res.json({
      success: true,
      message: '知识点删除成功'
    });
  } catch (error) {
    console.error('删除知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '删除知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 获取知识点树结构
export const getKnowledgeTree = async (req: Request, res: Response) => {
  try {
    const knowledgePoints = await KnowledgePoint
      .find({})
      .sort({ chapter: 1, createdAt: 1 });

    res.json({
      success: true,
      data: knowledgePoints
    });
  } catch (error) {
    console.error('获取知识点树失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识点树失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 添加相关知识点
export const addRelatedPoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { relatedId } = req.body;

    if (!relatedId) {
      return res.status(400).json({
        success: false,
        message: '请提供相关知识点ID'
      });
    }

    const knowledgePoint = await KnowledgePoint.findById(id);
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    if (!knowledgePoint.relatedIds.includes(relatedId)) {
      knowledgePoint.relatedIds.push(relatedId);
      await knowledgePoint.save();
    }

    res.json({
      success: true,
      message: '添加相关知识点成功',
      data: knowledgePoint
    });
  } catch (error) {
    console.error('添加相关知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '添加相关知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 移除相关知识点
export const removeRelatedPoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { relatedId } = req.body;

    if (!relatedId) {
      return res.status(400).json({
        success: false,
        message: '请提供相关知识点ID'
      });
    }

    const knowledgePoint = await KnowledgePoint.findById(id);
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    knowledgePoint.relatedIds = knowledgePoint.relatedIds.filter(
      (relId: string) => relId !== relatedId
    );
    await knowledgePoint.save();

    res.json({
      success: true,
      message: '移除相关知识点成功',
      data: knowledgePoint
    });
  } catch (error) {
    console.error('移除相关知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '移除相关知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 获取知识点统计信息
export const getKnowledgePointStats = async (req: Request, res: Response) => {
  try {
    const total = await KnowledgePoint.countDocuments({});
    const chapterStats = await KnowledgePoint.aggregate([
      {
        $group: {
          _id: '$chapter',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // 添加模块统计
    const moduleStats = await KnowledgePoint.aggregate([
      {
        $match: { customId: { $exists: true, $ne: null } }
      },
      {
        $addFields: {
          moduleCode: { $substr: ['$customId', 0, 4] }
        }
      },
      {
        $group: {
          _id: '$moduleCode',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        total,
        chapterStats,
        moduleStats
      }
    });
  } catch (error) {
    console.error('获取知识点统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识点统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 根据customId获取知识点
export const getKnowledgePointByCustomId = async (req: Request, res: Response) => {
  try {
    const { customId } = req.params;
    
    const knowledgePoint = await KnowledgePoint.findByCustomId(customId);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    res.json({
      success: true,
      data: knowledgePoint
    });
  } catch (error) {
    console.error('根据customId获取知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '根据customId获取知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 生成下一个可用的customId
export const generateNextCustomId = async (req: Request, res: Response) => {
  try {
    const { moduleCode, chapterCode, sectionCode } = req.query;

    if (!moduleCode || !chapterCode || !sectionCode) {
      return res.status(400).json({
        success: false,
        message: '请提供模块代码、章代码和节代码'
      });
    }

    // 验证模块代码
    if (!MODULE_CODES[moduleCode as keyof typeof MODULE_CODES]) {
      return res.status(400).json({
        success: false,
        message: '无效的模块代码'
      });
    }

    // 获取当前章节下所有已存在的customId
    const chapterStr = parseInt(chapterCode as string).toString().padStart(2, '0');
    const sectionStr = parseInt(sectionCode as string).toString().padStart(2, '0');
    const prefix = `${moduleCode}-${chapterStr}-${sectionStr}-`;
    
    const existingKnowledgePoints = await KnowledgePoint.find({
      customId: { $regex: `^${prefix}`, $options: 'i' }
    }).select('customId');

    const existingIds = existingKnowledgePoints
      .map(kp => kp.customId)
      .filter((id): id is string => Boolean(id));

    const nextSequence = generateNextSequence(
      moduleCode as string,
      parseInt(chapterCode as string),
      parseInt(sectionCode as string),
      existingIds
    );

    const nextCustomId = `${moduleCode}-${chapterStr}-${sectionStr}-${nextSequence.toString().padStart(3, '0')}`;

    res.json({
      success: true,
      data: {
        nextCustomId,
        moduleCode,
        chapterCode,
        sectionCode,
        sequenceNumber: nextSequence,
        existingCount: existingIds.length
      }
    });
  } catch (error) {
    console.error('生成下一个customId失败:', error);
    res.status(500).json({
      success: false,
      message: '生成下一个customId失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 获取模块信息
export const getModuleInfo = async (req: Request, res: Response) => {
  try {
    const modules = Object.entries(MODULE_CODES).map(([code, info]) => ({
      code,
      name: info.name,
      chapters: info.chapters,
      sections: info.sections
    }));

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('获取模块信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模块信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 验证customId
export const validateCustomIdEndpoint = async (req: Request, res: Response) => {
  try {
    const { customId } = req.body;

    if (!customId) {
      return res.status(400).json({
        success: false,
        message: '请提供customId'
      });
    }

    const validation = validateCustomId(customId);
    
    if (validation.isValid) {
      // 检查是否已存在
      const existingKnowledgePoint = await KnowledgePoint.findByCustomId(customId);
      if (existingKnowledgePoint) {
        return res.json({
          success: false,
          isValid: false,
          error: 'customId已存在',
          existingKnowledgePoint: {
            _id: existingKnowledgePoint._id,
            name: existingKnowledgePoint.name
          }
        });
      }

      // 解析customId信息
      const parsed = parseCustomId(customId);
      
      res.json({
        success: true,
        isValid: true,
        parsed
      });
    } else {
      res.json({
        success: false,
        isValid: false,
        error: validation.error
      });
    }
  } catch (error) {
    console.error('验证customId失败:', error);
    res.status(500).json({
      success: false,
      message: '验证customId失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 批量检测ID冲突
export const batchCheckIdConflicts = async (req: Request, res: Response) => {
  try {
    const { customIds } = req.body;

    if (!Array.isArray(customIds) || customIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供customId数组'
      });
    }

    const results = await Promise.all(
      customIds.map(async (customId: string) => {
        const validation = validateCustomId(customId);
        
        if (!validation.isValid) {
          return {
            customId,
            isValid: false,
            error: validation.error,
            conflictType: 'format'
          };
        }

        const existingKnowledgePoint = await KnowledgePoint.findByCustomId(customId);
        if (existingKnowledgePoint) {
          return {
            customId,
            isValid: false,
            error: 'customId已存在',
            conflictType: 'duplicate',
            existingKnowledgePoint: {
              _id: existingKnowledgePoint._id,
              name: existingKnowledgePoint.name
            }
          };
        }

        return {
          customId,
          isValid: true,
          parsed: parseCustomId(customId)
        };
      })
    );

    const conflicts = results.filter(result => !result.isValid);
    const valid = results.filter(result => result.isValid);

    res.json({
      success: true,
      data: {
        total: customIds.length,
        valid: valid.length,
        conflicts: conflicts.length,
        results,
        conflictSummary: {
          formatErrors: conflicts.filter(c => c.conflictType === 'format').length,
          duplicates: conflicts.filter(c => c.conflictType === 'duplicate').length
        }
      }
    });
  } catch (error) {
    console.error('批量检测ID冲突失败:', error);
    res.status(500).json({
      success: false,
      message: '批量检测ID冲突失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};