import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import QuestionManagement from '../pages/QuestionManagement';
import QuestionForm from '../pages/QuestionForm';
import QuestionFilter from '../pages/QuestionFilter';
import ExamPaperGeneration from '../pages/ExamPaperGeneration';
import ExamPaperManagement from '../pages/ExamPaperManagement';
import DocumentImport from '../pages/DocumentImport';
import ExamCreation from '../pages/ExamCreation';
import ExamList from '../pages/ExamList';
import KnowledgePointManagement from '../pages/KnowledgePointManagement';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// 公共路由组件（已登录用户重定向到仪表板）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/questions" 
        element={
          <ProtectedRoute>
            <QuestionManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/questions/new" 
        element={
          <ProtectedRoute>
            <QuestionForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/questions/edit/:id" 
        element={
          <ProtectedRoute>
            <QuestionForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/question-filter" 
        element={
          <ProtectedRoute>
            <QuestionFilter />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-paper-generation" 
        element={
          <ProtectedRoute>
            <ExamPaperGeneration />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-management" 
        element={
          <ProtectedRoute>
            <ExamPaperManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-creation" 
        element={
          <ProtectedRoute>
            <ExamCreation />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-list" 
        element={
          <ProtectedRoute>
            <ExamList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/document-import" 
        element={
          <ProtectedRoute>
            <DocumentImport />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/knowledge-points" 
        element={
          <ProtectedRoute>
            <KnowledgePointManagement />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;