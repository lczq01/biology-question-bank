# API调用关系图分析

## 1. 后端API端点概览

### 1.1 试卷管理API (`/api/exam-paper`)
- **GET /api/exam-paper/presets** - 获取预设组卷配置
- **POST /api/exam-paper/generate/preset/:presetName** - 使用预设配置生成试卷
- **POST /api/exam-paper/generate/custom** - 使用自定义配置生成试卷
- **GET /api/exam-paper/analysis** - 获取题目统计信息
- **POST /api/exam-paper/validate-config** - 验证组卷配置可行性
- **POST /api/exam-paper/create** - 手动创建试卷
- **GET /api/exam-paper/list** - 获取试卷列表
- **GET /api/exam-paper/:id** - 获取单个试卷详情
- **DELETE /api/exam-paper/:id** - 删除试卷

### 1.2 考试会话API (`/api/exam-sessions`)
- **GET /api/exam-sessions** - 获取考试会话列表
- **GET /api/exam-sessions/available** - 获取可参与的考试会话
- **GET /api/exam-sessions/status-rules** - 获取状态转换规则
- **GET /api/exam-sessions/statistics/system** - 获取系统统计数据
- **PATCH /api/exam-sessions/batch-status** - 批量更新状态
- **GET /api/exam-sessions/:id/statistics** - 获取会话统计数据
- **GET /api/exam-sessions/:id/participants-statistics** - 获取参与者统计数据
- **GET /api/exam-sessions/:id/participants** - 获取参与者列表
- **POST /api/exam-sessions/:id/participants** - 添加参与者
- **DELETE /api/exam-sessions/:id/participants** - 移除参与者
- **POST /api/exam-sessions/:id/participants/batch-add** - 批量添加参与者
- **POST /api/exam-sessions/:id/participants/batch-remove** - 批量移除参与者
- **GET /api/exam-sessions/:id/student-view** - 学生视角详情
- **GET /api/exam-sessions/:id/questions** - 获取考试题目
- **POST /api/exam-sessions/:id/join** - 加入考试会话
- **POST /api/exam-sessions/:id/start** - 开始考试
- **GET /api/exam-sessions/:id/progress** - 获取考试进度
- **POST /api/exam-sessions/:id/preview-start** - 开始预览考试
- **POST /api/exam-sessions/:id/preview-answer** - 提交预览答案
- **POST /api/exam-sessions/:id/preview-batch-answer** - 批量提交预览答案
- **POST /api/exam-sessions/:id/preview-submit** - 提交预览考试
- **GET /api/exam-sessions/:id/preview-progress** - 获取预览进度
- **GET /api/exam-sessions/:id/preview-result/:previewId** - 获取预览结果
- **GET /api/exam-sessions/:id** - 获取会话详情
- **POST /api/exam-sessions** - 创建考试会话
- **PUT /api/exam-sessions/:id** - 更新考试会话
- **PATCH /api/exam-sessions/:id/status** - 更新会话状态
- **DELETE /api/exam-sessions/:id** - 删除考试会话

### 1.3 其他相关API
- **GET /api/questions** - 获取题目列表
- **GET /api/auth/me** - 获取当前用户信息
- **GET /api/exam/result/:recordId** - 获取考试结果
- **POST /api/exam/complete** - 完成考试

## 2. 前端API调用关系

### 2.1 考试管理页面 (`ExamManagement.tsx`)
- **GET /api/exam-paper/list** - 获取试卷列表
- **GET /api/exam-sessions?limit=50** - 获取考试会话列表
- **PATCH /api/exam-sessions/:id/status** - 更新会话状态
- **POST /api/exam-sessions** - 创建考试会话
- **DELETE /api/exam-sessions/:id** - 删除考试会话
- **PUT /api/exam-sessions/:id** - 更新考试会话
- **PATCH /api/exam-sessions/batch-status** - 批量更新状态

### 2.2 预览功能 (`PreviewStartPage.tsx`, `PreviewExamPage.tsx`)
- **GET /api/exam-sessions/:id** - 获取考试会话详情
- **GET /api/exam-paper/:id** - 获取试卷详情
- **POST /api/exam-sessions/:id/preview-start** - 开始预览考试
- **POST /api/exam-sessions/:id/preview-answer** - 提交预览答案
- **POST /api/exam-sessions/:id/preview-submit** - 提交预览考试
- **GET /api/exam-sessions/:id/preview-progress** - 获取预览进度
- **GET /api/exam-sessions/:id/preview-result/:previewId** - 获取预览结果

### 2.3 题目管理 (`QuestionManagement.tsx`)
- **GET /api/questions** - 获取题目列表
- **GET /api/questions/chapters** - 获取章节列表
- **DELETE /api/questions/:id** - 删除题目

### 2.4 考试答题 (`ExamTaking.tsx`)
- **GET /api/exam-sessions/:id** - 获取会话详情
- **GET /api/exam-sessions/:id/progress** - 获取考试进度
- **POST /api/exam-sessions/answer** - 提交答案
- **POST /api/exam/complete** - 完成考试

## 3. 调用关系图

```
试卷管理模块
├── 试卷列表 (GET /api/exam-paper/list)
├── 试卷详情 (GET /api/exam-paper/:id)
├── 创建试卷 (POST /api/exam-paper/create)
└── 删除试卷 (DELETE /api/exam-paper/:id)

考试会话模块
├── 会话管理
│   ├── 会话列表 (GET /api/exam-sessions)
│   ├── 会话详情 (GET /api/exam-sessions/:id)
│   ├── 创建会话 (POST /api/exam-sessions)
│   └── 删除会话 (DELETE /api/exam-sessions/:id)
├── 预览功能
│   ├── 开始预览 (POST /api/exam-sessions/:id/preview-start)
│   ├── 提交答案 (POST /api/exam-sessions/:id/preview-answer)
│   └── 获取结果 (GET /api/exam-sessions/:id/preview-result/:previewId)
└── 正式考试
    ├── 加入考试 (POST /api/exam-sessions/:id/join)
    ├── 开始考试 (POST /api/exam-sessions/:id/start)
    └── 提交考试 (POST /api/exam/complete)

题目管理模块
├── 题目列表 (GET /api/questions)
├── 题目详情 (GET /api/questions/:id)
└── 题目操作 (POST/PUT/DELETE /api/questions)
```

## 4. 数据流向分析

### 4.1 试卷创建流程
```
前端 → POST /api/exam-paper/create → 后端 → 保存到MongoDB → 返回试卷ID
```

### 4.2 考试会话创建流程
```
前端 → POST /api/exam-sessions → 后端 → 关联试卷ID → 保存会话 → 返回会话ID
```

### 4.3 预览考试流程
```
前端 → POST /api/exam-sessions/:id/preview-start → 后端 → 创建预览记录 → 返回预览ID
前端 → POST /api/exam-sessions/:id/preview-answer → 后端 → 保存答案 → 返回结果
前端 → POST /api/exam-sessions/:id/preview-submit → 后端 → 计算成绩 → 返回最终结果
```

### 4.4 正式考试流程
```
前端 → POST /api/exam-sessions/:id/join → 后端 → 验证权限 → 返回会话信息
前端 → POST /api/exam-sessions/:id/start → 后端 → 创建考试记录 → 返回考试ID
前端 → POST /api/exam-sessions/answer → 后端 → 保存答案 → 返回确认
前端 → POST /api/exam/complete → 后端 → 计算成绩 → 返回结果
```

## 5. 架构问题识别

### 5.1 当前架构问题
1. **试卷和考试分离**：试卷管理独立于考试会话，导致数据冗余
2. **API端点分散**：试卷和考试相关API分布在不同的路由文件中
3. **权限管理复杂**：需要同时管理试卷和考试的权限
4. **数据一致性**：试卷修改后，已创建的考试会话无法同步更新

### 5.2 合并优化建议
1. **统一数据模型**：将试卷属性直接嵌入考试会话模型
2. **简化API结构**：合并试卷和考试相关的API端点
3. **统一权限管理**：基于考试会话的统一权限控制
4. **实时配置更新**：考试设置可实时修改，无需重新创建试卷

## 6. 测试验证结果

### 6.1 API健康检查
- ✅ GET /api/health - 后端服务正常运行
- ✅ GET /api/exam-paper/list - 返回20份试卷数据
- ✅ GET /api/exam-sessions - 返回12个考试会话数据
- ✅ GET /api/questions - 返回30个题目数据

### 6.2 系统状态
- 后端服务：正常运行 (localhost:3001)
- 数据库连接：正常 (MongoDB)
- 权限系统：已简化为管理员和学生两种角色
- 预览功能：基础结构已搭建完成

## 7. 下一步重构计划

基于以上分析，建议按照以下顺序进行重构：

1. **数据模型合并**：将试卷属性整合到考试会话模型
2. **API端点重构**：合并试卷和考试相关的API
3. **前端适配**：更新前端调用逻辑
4. **权限统一**：简化权限管理系统
5. **功能验证**：确保所有功能正常运作

此分析为后续的重构工作提供了完整的技术基础。