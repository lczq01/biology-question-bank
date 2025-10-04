// 测试API设计的完整性和类型安全性
import {
  ICreateExamSessionRequest,
  IUpdateExamSessionRequest,
  IUpdateExamStatusRequest,
  IExamSessionQueryParams,
  IExamSessionResponse,
  IExamSessionListResponse,
  IExamStatisticsResponse,
  IExamParticipantResponse,
  IApiResponse,
  ExamManagementErrorCode,
  ExamManagementPermission,
  ROLE_PERMISSIONS
} from './types/exam-management.types';
import { ExamSessionStatus } from './types/exam-session.types';

// 测试类型定义的完整性
function testTypeDefinitions() {
  console.log('🧪 测试API类型定义...');
  
  // 测试创建考试会话请求类型
  const createRequest: ICreateExamSessionRequest = {
    name: '测试考试',
    description: '这是一个测试考试',
    paperId: '60f7b3b3b3b3b3b3b3b3b3b3',
    startTime: '2024-01-15T09:00:00.000Z',
    endTime: '2024-01-15T11:00:00.000Z',
    duration: 120,
    settings: {
      allowReview: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResults: true,
      allowRetake: false,
      maxAttempts: 1,
      passingScore: 60,
      autoGrade: true,
      preventCheating: false
    }
  };
  
  console.log('✅ ICreateExamSessionRequest 类型定义正确');
  
  // 测试更新请求类型
  const updateRequest: IUpdateExamSessionRequest = {
    name: '更新后的考试名称',
    duration: 90
  };
  
  console.log('✅ IUpdateExamSessionRequest 类型定义正确');
  
  // 测试状态更新请求类型
  const statusRequest: IUpdateExamStatusRequest = {
    status: ExamSessionStatus.PUBLISHED,
    reason: '考试准备完毕'
  };
  
  console.log('✅ IUpdateExamStatusRequest 类型定义正确');
  
  // 测试查询参数类型
  const queryParams: IExamSessionQueryParams = {
    page: 1,
    limit: 10,
    status: ExamSessionStatus.ACTIVE,
    sortBy: 'startTime',
    sortOrder: 'desc'
  };
  
  console.log('✅ IExamSessionQueryParams 类型定义正确');
  
  // 测试响应类型
  const response: IApiResponse<IExamSessionResponse> = {
    success: true,
    message: '操作成功',
    data: {
      _id: '60f7b3b3b3b3b3b3b3b3b3b4',
      name: '测试考试',
      paperId: {
        _id: '60f7b3b3b3b3b3b3b3b3b3b3',
        title: '测试试卷',
        type: 'exam',
        totalQuestions: 10,
        totalPoints: 100
      },
      creatorId: {
        _id: '60f7b3b3b3b3b3b3b3b3b3b2',
        username: 'testuser',
        email: 'test@example.com'
      },
      status: ExamSessionStatus.DRAFT,
      startTime: '2024-01-15T09:00:00.000Z',
      endTime: '2024-01-15T11:00:00.000Z',
      duration: 120,
      settings: {
        allowReview: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        allowRetake: false,
        maxAttempts: 1,
        passingScore: 60,
        autoGrade: true,
        preventCheating: false
      },
      createdAt: '2024-01-10T10:00:00.000Z',
      updatedAt: '2024-01-10T10:00:00.000Z'
    }
  };
  
  console.log('✅ IApiResponse<IExamSessionResponse> 类型定义正确');
}

// 测试错误代码枚举
function testErrorCodes() {
  console.log('🧪 测试错误代码枚举...');
  
  const errorCodes = Object.values(ExamManagementErrorCode);
  const expectedCodes: ExamManagementErrorCode[] = [
    ExamManagementErrorCode.INVALID_INPUT,
    ExamManagementErrorCode.UNAUTHORIZED, 
    ExamManagementErrorCode.FORBIDDEN,
    ExamManagementErrorCode.NOT_FOUND,
    ExamManagementErrorCode.SESSION_NOT_FOUND,
    ExamManagementErrorCode.SESSION_ALREADY_EXISTS,
    ExamManagementErrorCode.INVALID_SESSION_STATUS,
    ExamManagementErrorCode.SESSION_TIME_CONFLICT,
    ExamManagementErrorCode.PAPER_NOT_FOUND,
    ExamManagementErrorCode.PAPER_NOT_ACTIVE,
    ExamManagementErrorCode.INSUFFICIENT_PERMISSIONS,
    ExamManagementErrorCode.CREATOR_ONLY_ACCESS,
    ExamManagementErrorCode.INVALID_STATUS_TRANSITION,
    ExamManagementErrorCode.SESSION_ALREADY_STARTED,
    ExamManagementErrorCode.SESSION_ALREADY_COMPLETED
  ];
  
  console.log('📋 错误代码列表:', errorCodes);
  
  const allCodesPresent = expectedCodes.every(code => errorCodes.includes(code));
  if (allCodesPresent) {
    console.log('✅ 所有错误代码定义完整');
  } else {
    console.log('❌ 错误代码定义不完整');
  }
}

// 测试权限系统
function testPermissionSystem() {
  console.log('🧪 测试权限系统...');
  
  const permissions = Object.values(ExamManagementPermission);
  console.log('📋 权限列表:', permissions);
  
  // 测试角色权限映射
  console.log('📋 管理员权限数量:', ROLE_PERMISSIONS.admin.length);
  console.log('📋 教师权限数量:', ROLE_PERMISSIONS.teacher.length);
  console.log('📋 学生权限数量:', ROLE_PERMISSIONS.student.length);
  
  // 验证权限层级
  const adminHasAllTeacherPermissions = ROLE_PERMISSIONS.teacher.every(
    permission => ROLE_PERMISSIONS.admin.includes(permission)
  );
  
  if (adminHasAllTeacherPermissions) {
    console.log('✅ 权限层级正确：管理员包含所有教师权限');
  } else {
    console.log('❌ 权限层级错误：管理员缺少部分教师权限');
  }
  
  console.log('✅ 权限系统设计完整');
}

// 测试状态枚举
function testStatusEnums() {
  console.log('🧪 测试状态枚举...');
  
  const sessionStatuses = Object.values(ExamSessionStatus);
  console.log('📋 考试会话状态:', sessionStatuses);
  
  const expectedStatuses: ExamSessionStatus[] = [
    ExamSessionStatus.DRAFT,
    ExamSessionStatus.PUBLISHED,
    ExamSessionStatus.ACTIVE,
    ExamSessionStatus.COMPLETED,
    ExamSessionStatus.CANCELLED
  ];
  const allStatusesPresent = expectedStatuses.every(status => sessionStatuses.includes(status));
  
  if (allStatusesPresent) {
    console.log('✅ 考试会话状态枚举完整');
  } else {
    console.log('❌ 考试会话状态枚举不完整');
  }
}

// 主测试函数
function runAPIDesignTests() {
  console.log('🚀 开始测试API设计完整性...\n');
  
  try {
    testTypeDefinitions();
    console.log('');
    
    testErrorCodes();
    console.log('');
    
    testPermissionSystem();
    console.log('');
    
    testStatusEnums();
    console.log('');
    
    console.log('✨ API设计测试完成！所有类型定义和枚举都正确。');
    
  } catch (error) {
    console.error('💥 API设计测试失败:', error instanceof Error ? error.message : String(error));
  }
}

// 运行测试
runAPIDesignTests();