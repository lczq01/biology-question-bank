# 考试管理API接口文档

## 概述

考试管理API提供完整的考试会话管理功能，包括创建、查询、更新、删除考试会话，以及考试状态管理和统计分析。

## 基础信息

- **Base URL**: `/api/exam-sessions`
- **认证方式**: JWT Token
- **内容类型**: `application/json`
- **API版本**: v1.0

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## API端点

### 1. 创建考试会话

**POST** `/api/exam-sessions`

创建新的考试会话。

#### 请求头
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求体
```json
{
  "name": "期中考试",
  "description": "高一生物期中考试",
  "paperId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "duration": 120,
  "settings": {
    "allowReview": true,
    "shuffleQuestions": false,
    "shuffleOptions": false,
    "showResults": true,
    "allowRetake": false,
    "maxAttempts": 1,
    "passingScore": 60,
    "autoGrade": true,
    "preventCheating": false
  }
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "name": "期中考试",
    "description": "高一生物期中考试",
    "paperId": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "高一生物期中试卷",
      "type": "exam",
      "totalQuestions": 20,
      "totalPoints": 100
    },
    "creatorId": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b2",
      "username": "teacher1",
      "email": "teacher1@example.com"
    },
    "status": "draft",
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "duration": 120,
    "settings": {
      "allowReview": true,
      "shuffleQuestions": false,
      "shuffleOptions": false,
      "showResults": true,
      "allowRetake": false,
      "maxAttempts": 1,
      "passingScore": 60,
      "autoGrade": true,
      "preventCheating": false
    },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "message": "考试会话创建成功"
}
```

### 2. 获取考试会话列表

**GET** `/api/exam-sessions`

获取考试会话列表，支持分页和筛选。

#### 查询参数
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10, 最大: 100)
- `status`: 状态筛选 (`draft`, `published`, `active`, `completed`, `cancelled`)
- `creatorId`: 创建者筛选
- `paperId`: 试卷筛选
- `startDate`: 开始日期筛选 (ISO date)
- `endDate`: 结束日期筛选 (ISO date)
- `keyword`: 关键词搜索
- `sortBy`: 排序字段 (`createdAt`, `startTime`, `name`)
- `sortOrder`: 排序方向 (`asc`, `desc`)

#### 请求示例
```
GET /api/exam-sessions?page=1&limit=10&status=published&sortBy=startTime&sortOrder=desc
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "期中考试",
        "status": "published",
        "paperId": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "title": "高一生物期中试卷"
        },
        "startTime": "2024-01-15T09:00:00.000Z",
        "endTime": "2024-01-15T11:00:00.000Z",
        "statistics": {
          "totalParticipants": 25,
          "completedCount": 23,
          "averageScore": 78.5,
          "passingRate": 0.87
        }
      }
    ],
    "pagination": {
      "current": 1,
      "total": 3,
      "pageSize": 10,
      "totalItems": 25
    }
  },
  "message": "获取考试会话列表成功"
}
```

### 3. 获取考试会话详情

**GET** `/api/exam-sessions/:id`

获取单个考试会话的详细信息。

#### 响应示例
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "name": "期中考试",
    "description": "高一生物期中考试",
    "paperId": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "高一生物期中试卷",
      "type": "exam",
      "totalQuestions": 20,
      "totalPoints": 100
    },
    "status": "published",
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "duration": 120,
    "settings": {
      "allowReview": true,
      "shuffleQuestions": false,
      "shuffleOptions": false,
      "showResults": true,
      "allowRetake": false,
      "maxAttempts": 1,
      "passingScore": 60,
      "autoGrade": true,
      "preventCheating": false
    },
    "statistics": {
      "totalParticipants": 25,
      "completedCount": 23,
      "averageScore": 78.5,
      "passingRate": 0.87
    }
  },
  "message": "获取考试会话详情成功"
}
```

### 4. 更新考试会话

**PUT** `/api/exam-sessions/:id`

更新考试会话信息。

#### 请求体
```json
{
  "name": "期中考试（修订版）",
  "description": "高一生物期中考试 - 已修订",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z",
  "duration": 120,
  "settings": {
    "allowReview": false,
    "showResults": false
  }
}
```

### 5. 更新考试状态

**PATCH** `/api/exam-sessions/:id/status`

更新考试会话状态（发布、激活、取消等）。

#### 请求体
```json
{
  "status": "published",
  "reason": "考试准备完毕，正式发布"
}
```

### 6. 删除考试会话

**DELETE** `/api/exam-sessions/:id`

删除考试会话。

#### 响应示例
```json
{
  "success": true,
  "message": "考试会话删除成功"
}
```

### 7. 获取考试统计

**GET** `/api/exam-sessions/:id/statistics`

获取考试会话的详细统计信息。

#### 响应示例
```json
{
  "success": true,
  "data": {
    "sessionId": "60f7b3b3b3b3b3b3b3b3b3b4",
    "sessionName": "期中考试",
    "totalParticipants": 25,
    "completedCount": 23,
    "inProgressCount": 1,
    "notStartedCount": 1,
    "averageScore": 78.5,
    "highestScore": 95,
    "lowestScore": 42,
    "passingRate": 0.87,
    "averageTimeUsed": 105,
    "questionStatistics": [
      {
        "questionId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "questionText": "细胞膜的主要成分是什么？",
        "correctRate": 0.92,
        "averageTimeSpent": 45
      }
    ],
    "scoreDistribution": [
      {
        "range": "90-100",
        "count": 5,
        "percentage": 0.20
      },
      {
        "range": "80-89",
        "count": 8,
        "percentage": 0.32
      }
    ]
  },
  "message": "获取考试统计成功"
}
```

### 8. 获取考试参与者

**GET** `/api/exam-sessions/:id/participants`

获取考试会话的参与者列表。

#### 查询参数
- `page`: 页码
- `limit`: 每页数量
- `status`: 状态筛选
- `sortBy`: 排序字段 (`score`, `timeUsed`, `submitTime`)
- `sortOrder`: 排序方向

#### 响应示例
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
        "studentId": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
          "username": "student1",
          "email": "student1@example.com"
        },
        "status": "submitted",
        "score": 85,
        "accuracy": 0.85,
        "timeUsed": 110,
        "startTime": "2024-01-15T09:05:00.000Z",
        "endTime": "2024-01-15T10:55:00.000Z",
        "submitTime": "2024-01-15T10:55:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 3,
      "pageSize": 10,
      "totalItems": 25
    }
  },
  "message": "获取参与者列表成功"
}
```

## 状态转换规则

考试会话状态转换必须遵循以下规则：

```
draft → published → active → completed
  ↓         ↓         ↓
cancelled cancelled cancelled
```

- **draft**: 草稿状态，可以编辑所有信息
- **published**: 已发布，学生可以看到但不能开始
- **active**: 激活状态，学生可以参加考试
- **completed**: 已完成，考试结束
- **cancelled**: 已取消，任何状态都可以取消

## 权限说明

- **管理员**: 拥有所有权限
- **教师**: 可以管理自己创建的考试会话
- **学生**: 只能查看已发布的考试会话

## 错误代码

| 错误代码 | 描述 |
|---------|------|
| INVALID_INPUT | 输入参数无效 |
| UNAUTHORIZED | 未登录 |
| FORBIDDEN | 权限不足 |
| SESSION_NOT_FOUND | 考试会话不存在 |
| INVALID_STATUS_TRANSITION | 无效的状态转换 |
| PAPER_NOT_FOUND | 试卷不存在 |
| SESSION_TIME_CONFLICT | 考试时间冲突 |

## 使用示例

### 创建并发布考试的完整流程

```javascript
// 1. 创建考试会话
const createResponse = await fetch('/api/exam-sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '期末考试',
    paperId: 'paper_id',
    startTime: '2024-01-20T09:00:00.000Z',
    endTime: '2024-01-20T11:00:00.000Z',
    duration: 120
  })
});

const session = await createResponse.json();

// 2. 发布考试
await fetch(`/api/exam-sessions/${session.data._id}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'published'
  })
});

// 3. 激活考试（考试开始时）
await fetch(`/api/exam-sessions/${session.data._id}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'active'
  })
});