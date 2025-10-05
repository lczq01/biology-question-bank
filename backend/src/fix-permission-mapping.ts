// 修复权限映射问题
import { connectDatabase } from './utils/database';
import { UserRole } from './types/user.types';

async function fixPermissionMapping() {
  console.log('🔧 开始修复权限映射问题...\n');

  try {
    await connectDatabase({
      uri: 'mongodb://localhost:27017/biology_question_bank',
      options: {}
    });
    console.log('✅ 数据库连接成功');

    // 检查权限映射配置
    const { ROLE_PERMISSIONS, ExamManagementPermission } = await import('./types/exam-management.types');
    
    console.log('当前ROLE_PERMISSIONS键:', Object.keys(ROLE_PERMISSIONS));
    console.log('UserRole.ADMIN:', UserRole.ADMIN);
    console.log('UserRole.STUDENT:', UserRole.STUDENT);
    
    // 创建修复后的权限映射函数
    const getRolePermissions = (role: UserRole) => {
      const roleKey = role.toLowerCase() as keyof typeof ROLE_PERMISSIONS;
      return ROLE_PERMISSIONS[roleKey] || [];
    };
    
    // 测试权限检查
    const adminPermissions = getRolePermissions(UserRole.ADMIN);
    const studentPermissions = getRolePermissions(UserRole.STUDENT);
    const requiredPermission = ExamManagementPermission.READ_SESSION;
    
    console.log(`管理员权限数量: ${adminPermissions.length}`);
    console.log(`学生权限数量: ${studentPermissions.length}`);
    console.log(`管理员有READ_SESSION权限: ${adminPermissions.includes(requiredPermission)}`);
    console.log(`学生有READ_SESSION权限: ${studentPermissions.includes(requiredPermission)}`);
    
    if (adminPermissions.includes(requiredPermission) && studentPermissions.includes(requiredPermission)) {
      console.log('\n🎉 权限映射修复成功！');
    } else {
      console.log('\n❌ 权限映射仍有问题');
    }

  } catch (error) {
    console.error('❌ 权限映射检查失败:', error);
  }
}

fixPermissionMapping().catch(console.error);