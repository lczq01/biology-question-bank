# 统一数据模型和API结构设计（增强版）

## 1. 设计概述

基于深入的需求分析和架构讨论，设计一个统一的数据模型，将试卷属性直接嵌入考试模型中，实现试卷与考试的完全合并。设计遵循以下原则：

### 1.1 设计原则
- **简单优于复杂**：避免过度工程化，专注核心需求
- **扩展性预留**：为未来功能（闪卡、AI）预留合理接口
- **配置化驱动**：通过配置而非硬编码实现功能切换
- **演进式架构**：支持系统功能的渐进式扩展

### 1.2 分阶段实施策略
- **阶段1**：核心考试功能（当前阶段）
- **阶段2**：预览功能完善
- **阶段3**：在线考试功能优化
- **阶段4**：闪卡和AI功能扩展

## 2. 统一数据模型设计

### 2.1 核心模型：Exam（考试）

```typescript
// 考试类型定义（简化版本）
enum ExamType {
  STANDARD = 'standard'          // 标准考试类型（统一类型）
}

// 考试状态定义
enum ExamStatus {
  DRAFT = 'draft',              // 草稿
  PUBLISHED = 'published',      // 已发布
  ACTIVE = 'active',            // 进行中
  COMPLETED = 'completed',      // 已完成
  ARCHIVED = 'archived'         // 已归档
}

// 题目配置接口
interface QuestionConfig {
  questionId: Types.ObjectId;
  order: number;
  points: number;
  required?: boolean;
}

// 考试设置接口（基于讨论优化）
interface ExamSettings {
  // 核心设置（必须配置）
  countToGrade: boolean;        // 是否计入成绩
  allowRetry: boolean;          // 是否允许重考
  showAnswers: boolean;         // 是否显示答案和解析
  timeLimit: number;           // 考试时长（分钟，0表示不限时）
  
  // 高级设置（可选配置）
  shuffleQuestions: boolean;    // 随机题目顺序
  shuffleOptions: boolean;      // 随机选项顺序
  allowReview: boolean;         // 允许回顾已答题目
  showScore: boolean;          // 显示分数
  maxAttempts: number;         // 最大尝试次数（0表示不限）
  passingScore: number;        // 及格分数
  
  // 参与者控制
  whitelist: string[];         // 白名单（空表示所有人可参与）
  blacklist: string[];         // 黑名单
  
  // 扩展配置（预留）
  extensions?: {
    flashcard?: {
      autoGenerate: boolean;    // 自动生成错题闪卡
      includeCorrect: boolean;  // 包含答对的题目
    };
    ai?: {
      enableAnalysis: boolean;  // AI分析功能
      enableRecommendation: boolean; // AI推荐功能
    };
    analytics?: {
      trackTime: boolean;       // 跟踪答题时间
      trackConfidence: boolean; // 跟踪自信度（未来功能）
    };
  };
}

// 考试统计接口
interface ExamStats {
  totalParticipants: number;    // 总参与人数
  completedCount: number;       // 完成人数
  averageScore: number;         // 平均分
  passRate: number;             // 通过率
  averageTime: number;          // 平均用时
  totalAttempts: number;        // 总尝试次数
}

// 考试文档接口（增强版）
interface IExamDocument extends Document {
  // 基本信息
  name: string;                 // 考试名称
  description?: string;         // 考试描述
  type: ExamType;              // 考试类型
  status: ExamStatus;          // 考试状态
  
  // 试卷属性（直接嵌入）
  questions: QuestionConfig[]; // 题目配置
  totalPoints: number;         // 总分
  totalQuestions: number;      // 总题数
  
  // 考试配置
  settings: ExamSettings;      // 考试设置
  stats: ExamStats;            // 考试统计
  
  // 时间管理（简化设计）
  startTime?: Date;            // 开始时间（可选，为空表示立即开始）
  endTime?: Date;              // 结束时间（可选，为空表示无限期）
  
  // 权限管理
  creatorId: Types.ObjectId;   // 创建者ID
  
  // 扩展数据（为未来功能预留）
  metadata?: {
    knowledgePoints?: string[]; // 关联知识点
    difficulty?: number;        // 整体难度评估
    estimatedTime?: number;     // 预估完成时间
    tags?: string[];           // 标签分类
  };
  
  // 版本控制
  version: number;             // 数据模型版本
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Mongoose Schema定义

```typescript
// 题目配置Schema
const QuestionConfigSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, '题目ID不能为空']
  },
  order: {
    type: Number,
    required: [true, '题目顺序不能为空'],
    min: [1, '题目顺序至少为1']
  },
  points: {
    type: Number,
    required: [true, '题目分值不能为空'],
    min: [1, '题目分值至少为1'],
    max: [100, '题目分值最多为100']
  },
  required: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// 考试设置Schema（增强版）
const ExamSettingsSchema = new Schema({
  // 核心设置
  countToGrade: { type: Boolean, default: true },
  allowRetry: { type: Boolean, default: false },
  showAnswers: { type: Boolean, default: false },
  timeLimit: { type: Number, default: 0, min: 0, max: 600 },
  
  // 高级设置
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  allowReview: { type: Boolean, default: true },
  showScore: { type: Boolean, default: true },
  maxAttempts: { type: Number, default: 1, min: 0, max: 10 },
  passingScore: { type: Number, default: 60, min: 0, max: 100 },
  
  // 参与者控制
  whitelist: { type: [String], default: [] },
  blacklist: { type: [String], default: [] },
  
  // 扩展配置（预留，默认关闭）
  extensions: {
    flashcard: {
      autoGenerate: { type: Boolean, default: false },
      includeCorrect: { type: Boolean, default: false }
    },
    ai: {
      enableAnalysis: { type: Boolean, default: false },
      enableRecommendation: { type: Boolean, default: false }
    },
    analytics: {
      trackTime: { type: Boolean, default: true },
      trackConfidence: { type: Boolean, default: false }
    }
  }
}, { _id: false });

// 考试统计Schema
const ExamStatsSchema = new Schema({
  totalParticipants: { type: Number, default: 0, min: 0 },
  completedCount: { type: Number, default: 0, min: 0 },
  averageScore: { type: Number, default: 0, min: 0, max: 100 },
  passRate: { type: Number, default: 0, min: 0, max: 100 },
  averageTime: { type: Number, default: 0, min: 0 },
  totalAttempts: { type: Number, default: 0, min: 0 }
}, { _id: false });

// 统一考试Schema
const ExamSchema = new Schema<IExamDocument>({
  name: {
    type: String,
    required: [true, '考试名称不能为空'],
    trim: true,
    maxlength: [100, '考试名称最多100个字符']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, '考试描述最多500个字符']
  },
  
  type: {
    type: String,
    enum: Object.values(ExamType),
    default: ExamType.SCHEDULED,
    required: true
  },
  
  status: {
    type: String,
    enum: Object.values(ExamStatus),
    default: ExamStatus.DRAFT,
    required: true
  },
  
  // 原试卷属性
  questions: {
    type: [QuestionConfigSchema],
    required: [true, '题目配置不能为空'],
    validate: {
      validator: function(questions: QuestionConfig[]) {
        return questions.length > 0;
      },
      message: '至少需要配置一个题目'
    }
  },
  
  totalPoints: {
    type: Number,
    required: [true, '总分不能为空'],
    min: [1, '总分至少为1'],
    max: [1000, '总分最多为1000']
  },
  
  totalQuestions: {
    type: Number,
    required: [true, '总题数不能为空'],
    min: [1, '总题数至少为1'],
    max: [200, '总题数最多为200']
  },
  
  // 考试时长现在在settings中定义
  
  // 原考试会话属性
  settings: {
    type: ExamSettingsSchema,
    required: [true, '考试设置不能为空'],
    default: () => ({})
  },
  
  stats: {
    type: ExamStatsSchema,
    default: () => ({})
  },
  
  // 时间安排（简化版本）
  startTime: {
    type: Date,
    required: false
  },
  
  endTime: {
    type: Date,
    required: false,
    validate: {
      validator: function(this: IExamDocument, endTime: Date) {
        if (this.startTime && endTime) {
          return endTime > this.startTime;
        }
        return true;
      },
      message: '结束时间必须晚于开始时间'
    }
  },
  
  participants: {
    type: [String],
    default: []
  },
  
  // 权限管理
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建者ID不能为空']
  },
  
  // 扩展数据（预留）
  metadata: {
    knowledgePoints: { type: [String], default: [] },
    difficulty: { type: Number, min: 1, max: 5, default: 3 },
    estimatedTime: { type: Number, min: 0, default: 0 },
    tags: { type: [String], default: [] }
  },
  
  // 版本控制
  version: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true,
  // 添加索引优化
  index: {
    creatorId: 1,
    status: 1,
    type: 1,
    'startTime': 1,
    'endTime': 1
  }
});

// 添加虚拟字段
ExamSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         (!this.startTime || this.startTime <= now) &&
         (!this.endTime || this.endTime >= now);
});

// 添加实例方法
ExamSchema.methods.canUserParticipate = function(userId: string) {
  const { whitelist, blacklist } = this.settings;
  
  // 检查黑名单
  if (blacklist.includes(userId)) return false;
  
  // 检查白名单（空白名单表示所有人可参与）
  if (whitelist.length === 0) return true;
  
  return whitelist.includes(userId);
};
```

## 3. 统一API结构设计

### 3.1 核心API端点

```
/api/exams
├── GET    /exams                    # 获取考试列表（分页、筛选、排序）
├── POST   /exams                    # 创建新考试
├── GET    /exams/:id                # 获取考试详情
├── PUT    /exams/:id                # 更新考试信息
├── DELETE /exams/:id                # 删除考试
├── POST   /exams/:id/publish        # 发布考试
├── POST   /exams/:id/archive        # 归档考试
│
├── /exams/:id/participants
│   ├── GET    /participants         # 获取参与者列表
│   ├── POST   /participants         # 添加参与者
│   ├── DELETE /participants/:userId # 移除参与者
│   └── PUT    /participants/batch   # 批量更新参与者
│
├── /exams/:id/preview
│   ├── POST   /preview              # 开始预览
│   ├── GET    /preview/:sessionId   # 获取预览进度
│   ├── POST   /preview/:sessionId/answer  # 提交预览答案
│   └── POST   /preview/:sessionId/submit  # 提交预览
│
├── /exams/:id/attempts
│   ├── POST   /attempts             # 开始考试
│   ├── GET    /attempts/:attemptId  # 获取考试进度
│   ├── POST   /attempts/:attemptId/answer  # 提交答案
│   
│   └── POST   /attempts/:attemptId/submit  # 提交考试
│
└── /exams/:id/results
    ├── GET    /results              # 获取考试结果列表
    ├── GET    /results/:resultId    # 获取详细结果
    ├── POST   /results/:resultId/review  # 申请复查
    └── PUT    /results/:resultId/grade   # 手动评分
```

### 3.2 API请求/响应示例

#### 3.2.1 创建考试

**请求：**
```http
POST /api/exams
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "生物学期中考试",
  "description": "测试学生对生物学基础知识的掌握情况",
  "type": "standard",
  "questions": [
    {
      "questionId": "64a1b2c3d4e5f6a7b8c9d0e1",
      "order": 1,
      "points": 10,
      "required": true
    }
  ],
  "totalPoints": 100,
  "totalQuestions": 10,
  "timeLimit": 120,
  "settings": {
    "allowReview": true,
    "showScore": true,
    "maxAttempts": 1,
    "passingScore": 60
  },
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "participants": ["user1", "user2"]
}
```

**响应：**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "_id": "64b2c3d4e5f6a7b8c9d0e1f2",
    "name": "生物学期中考试",
    "type": "scheduled",
    "status": "draft",
    "totalPoints": 100,
    "totalQuestions": 10,
    "timeLimit": 120,
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

#### 3.2.2 获取考试列表

**请求：**
```http
GET /api/exams?page=1&limit=10&status=published&type=scheduled
Authorization: Bearer {token}
```

**响应：**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "exams": [
      {
        "_id": "64b2c3d4e5f6a7b8c9d0e1f2",
        "name": "生物学期中考试",
        "type": "standard",
        "status": "published",
        "totalPoints": 100,
        "totalQuestions": 10,
        "timeLimit": 120,
        "startTime": "2024-01-15T09:00:00Z",
        "endTime": "2024-01-15T11:00:00Z",
        "stats": {
          "totalParticipants": 50,
          "completedCount": 45,
          "averageScore": 78.5,
          "passRate": 90
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## 4. 数据迁移策略

### 4.1 迁移步骤

1. **创建新模型**：实现统一的Exam模型
2. **数据迁移脚本**：将Paper和ExamSession数据合并到Exam模型
3. **API兼容层**：提供临时兼容API，支持新旧系统并行运行
4. **前端逐步迁移**：逐步更新前端调用逻辑
5. **清理旧数据**：确认迁移成功后删除旧模型

### 4.2 迁移脚本示例

```javascript
// 数据迁移脚本
async function migrateData() {
  // 1. 迁移试卷数据
  const papers = await Paper.find({});
  for (const paper of papers) {
    await Exam.create({
      name: paper.title,
      description: paper.description,
      type: ExamType.STANDARD,
      questions: paper.questions,
      totalPoints: paper.config.totalPoints,
      totalQuestions: paper.config.totalQuestions,
      timeLimit: paper.config.timeLimit,
      settings: {
        allowReview: paper.config.allowReview,
        shuffleQuestions: paper.config.shuffleQuestions,
        shuffleOptions: paper.config.shuffleOptions
      },
      creatorId: paper.createdBy,
      createdAt: paper.createdAt,
      updatedAt: paper.updatedAt
    });
  }
  
  // 2. 迁移考试会话数据
  const sessions = await ExamSession.find({}).populate('paperId');
  for (const session of sessions) {
    await Exam.create({
      name: session.name,
      description: session.description,
      type: ExamType.STANDARD,
      status: session.status,
      questions: session.paperId.questions,
      totalPoints: session.paperId.config.totalPoints,
      totalQuestions: session.paperId.config.totalQuestions,
      timeLimit: session.duration,
      settings: session.settings,
      startTime: session.startTime,
      endTime: session.endTime,
      availableFrom: session.availableFrom,
      availableUntil: session.availableUntil,
      participants: session.participants,
      creatorId: session.creatorId,
      stats: session.stats,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  }
}
```

## 5. 预期收益

### 5.1 性能提升
- **减少数据库查询**：消除N+1查询问题
- **简化数据访问**：单次查询获取完整考试信息
- **降低网络开销**：减少API调用次数

### 5.2 开发简化
- **统一数据模型**：简化业务逻辑
- **减少代码重复**：消除试卷和考试之间的重复代码
- **简化权限管理**：统一权限控制逻辑

### 5.3 数据一致性
- **消除数据冗余**：避免配置信息重复存储
- **确保数据同步**：配置变更立即生效
- **简化数据维护**：统一的数据管理界面

## 6. 实施计划

### 阶段1：模型设计和API规划（当前阶段）
- ✅ 完成数据模型分析
- ✅ 设计统一数据模型
- ✅ 规划API结构

### 阶段2：后端实现
- 实现统一Exam模型
- 开发新的API端点
- 实现数据迁移脚本

### 阶段3：前端迁移
- 更新前端API调用
- 调整UI组件逻辑
- 测试功能完整性

### 阶段4：部署和验证
- 数据迁移执行
- 系统功能验证
- 性能监控优化

通过这个统一的数据模型和API结构设计，将显著提升系统的性能、可维护性和开发效率。