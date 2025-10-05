import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">高中生物题库系统</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                欢迎, <span className="font-medium">{user?.username}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {user?.role === 'admin' ? '管理员' : '学生'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 bg-gray-50 min-h-screen">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              欢迎使用高中生物题库系统
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {user?.role === 'admin' ? '管理员控制面板' : '学生学习平台'}
            </p>
            
            {/* 功能卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {user?.role === 'admin' ? (
                <>
                  <div 
                    onClick={() => handleNavigate('/questions')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">题目管理</h3>
                    <p className="text-gray-600">查看、编辑和管理题库中的题目</p>
                  </div>
                  
                  <div 
                    onClick={() => handleNavigate('/document-import')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">题目创建</h3>
                    <p className="text-gray-600">手动创建题目或从Word文档批量导入</p>
                  </div>
                  
                  <div 
                    onClick={() => handleNavigate('/knowledge-points')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">知识点管理</h3>
                    <p className="text-gray-600">管理生物学科知识点体系和分类</p>
                  </div>
                  
                  <div 
                    onClick={() => handleNavigate('/exam-management')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">试卷管理</h3>
                    <p className="text-gray-600">查看和管理已生成的试卷</p>
                  </div>
                  
                  <div 
                    onClick={() => handleNavigate('/exam-management-new')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">考试管理</h3>
                    <p className="text-gray-600">创建、编辑和管理在线考试</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">用户管理</h3>
                    <p className="text-gray-600">管理学生和教师账户</p>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    onClick={() => handleNavigate('/exam-list')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">在线考试</h3>
                    <p className="text-gray-600">参加在线考试测试</p>
                  </div>
                  
                  <div 
                    onClick={() => handleNavigate('/knowledge-points-view')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">知识点浏览</h3>
                    <p className="text-gray-600">浏览和学习生物学科知识点</p>
                  </div>
                  
                  <div 
                    onClick={() => handleNavigate('/exam/history')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">成绩统计</h3>
                    <p className="text-gray-600">查看考试成绩和学习进度</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;