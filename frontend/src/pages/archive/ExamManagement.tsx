import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Divider,
  Paper,
  FormControlLabel,
  Switch,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Tooltip,
  IconButton,
  Collapse,
  Stack,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Schedule as TimeIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  QuestionAnswer as QuestionIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Drafts as DraftIcon,
  Publish as PublishIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { examApi } from '../../utils/examApi';
interface ExamPaper {
  id: string;
  title: string;
  questions: any[];
  totalPoints: number;
  totalQuestions: number;
  type: string;
  createdAt: string;
}

interface ExamSession {
  _id: string;
  name: string;
  status: string;
  type?: 'scheduled' | 'on_demand'; // 考试类型
  paperId: {
    _id: string;
    title: string;
  } | null;
  startTime: string;
  endTime: string;
  availableFrom?: string; // 随时考试可用开始时间
  availableUntil?: string; // 随时考试可用结束时间
  duration: number;
  participants: any[];
  settings: {
    allowReview?: boolean;
    shuffleQuestions?: boolean;
    showResults?: boolean;
    passingScore?: number;
  };
  createdAt: string;
  createdBy: string;
}

interface ExamFormData {
  title: string;
  examPaperId: string;
  type: 'scheduled' | 'on_demand'; // 考试类型
  duration: number;
  startTime: string;
  endTime: string;
  availableFrom: string;  // 随时考试可用开始时间
  availableUntil: string; // 随时考试可用结束时间

  isTimed: boolean;
  shuffleQuestions: boolean;
  showResults: boolean;
  passingScore: number;
}

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // 状态管理
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ExamSession | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [batchStatusMenuAnchor, setBatchStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentSessionForStatus, setCurrentSessionForStatus] = useState<string | null>(null);
  
  // 筛选相关状态
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    examPaperId: '',
    type: 'scheduled', // 默认为定时考试
    duration: 60,
    startTime: '',
    endTime: '',
    availableFrom: '',
    availableUntil: '',

    isTimed: true,
    shuffleQuestions: true,
    showResults: true,
    passingScore: 60
  });

  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [immediateStart, setImmediateStart] = useState<boolean>(false);
  const [editImmediateStart, setEditImmediateStart] = useState<boolean>(false);

  // 编辑表单数据
  const [editFormData, setEditFormData] = useState<ExamFormData>({
    title: '',
    examPaperId: '',
    type: 'scheduled', // 默认为定时考试
    duration: 60,
    startTime: '',
    endTime: '',
    availableFrom: '',
    availableUntil: '',

    isTimed: true,
    shuffleQuestions: true,
    showResults: true,
    passingScore: 60
  });



  // 简化的考试状态选项 - 只显示两个状态给管理员
  const statusOptions = [
    { value: 'draft', label: '未发布', icon: <DraftIcon />, color: 'default' },
    { value: 'published', label: '已发布', icon: <PublishIcon />, color: 'primary' }
  ];

  // 获取试卷列表
  const fetchExamPapers = async () => {
    try {
      const response = await examApi.getExams();
      const result = await response.json();

      if (result.success) {
        setExamPapers(result.data || []);
      } else {
        setError(result.message || '获取试卷列表失败');
      }
    } catch (error) {
      console.error('获取试卷列表失败:', error);
      setError('获取试卷列表失败，请稍后重试');
    }
  };

  // 获取考试会话列表
  const fetchExamSessions = async () => {
    try {
      // 直接使用mock token，不检查登录状态
      
      const response = await examApi.getExams();

      const result = await response.json();

      if (result.success) {
        setExamSessions(result.data?.sessions || []);
      } else {
        setError(result.message || '获取考试列表失败');
      }
    } catch (error) {
      console.error('获取考试列表失败:', error);
      setError('获取考试列表失败，请稍后重试');
    }
  };

  // 初始化数据
  const initializeData = async () => {
    setLoading(true);
    await Promise.all([fetchExamPapers(), fetchExamSessions()]);
    setLoading(false);
  };

  // 处理表单变化
  const handleInputChange = (field: keyof ExamFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'duration' || field === 'passingScore' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  // 处理Select组件变化
  const handleSelectChange = (field: keyof ExamFormData) => (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理开关变化
  const handleSwitchChange = (field: keyof ExamFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  // 处理试卷选择
  const handlePaperSelect = (paperId: string) => {
    setFormData(prev => ({ ...prev, examPaperId: paperId }));
    const paper = examPapers.find(p => p.id === paperId);
    setSelectedPaper(paper || null);
  };

  // 处理状态更新 - 智能状态转换
  const handleStatusChange = async (examId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      // 找到当前考试会话
      const currentExam = examSessions.find(exam => exam._id === examId);
      if (!currentExam) {
        setError('找不到指定的考试');
        return;
      }

      let targetStatus = newStatus.toLowerCase();
      
      // 如果是发布操作，统一发送 published 状态，让后端智能处理
      if (newStatus.toLowerCase() === 'published') {
        targetStatus = 'published';
        // 后端会根据考试类型和时间设置自动决定最终状态（published 或 active）
      }
      
      const response = await examApi.updateExamStatus(examId, targetStatus);

      const result = await response.json();

      if (result.success) {
        // 使用后端返回的实际状态更新本地状态
        const actualStatus = result.data?.status || targetStatus;
        
        setExamSessions(prev => prev.map(exam => 
          exam._id === examId 
            ? { 
                ...exam, 
                status: actualStatus,
                // 如果后端返回了更新的时间信息，也要同步
                ...(result.data?.availableFrom && { availableFrom: result.data.availableFrom }),
                ...(result.data?.startTime && { startTime: result.data.startTime })
              }
            : exam
        ));
        
        // 显示后端返回的消息，或根据实际状态生成消息
        const message = result.message || '状态更新成功';
        
        setSuccess(message);
        setError(null);
        console.log('状态更新成功:', message, '实际状态:', actualStatus);
      } else {
        setError(result.message || '状态更新失败');
        console.error('状态更新失败:', result.message);
      }
    } catch (error) {
      console.error('状态更新错误:', error);
      setError('状态更新失败，请稍后重试');
    } finally {
      setLoading(false);
      setStatusMenuAnchor(null);
      setCurrentSessionForStatus(null);
    }
  };

  // 获取简化的状态显示信息 - 将后端多状态映射到前端两状态
  const getStatusInfo = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    // 将后端的多个状态映射到前端的两个状态
    if (normalizedStatus === 'draft') {
      return { label: '未发布', color: 'default' as const };
    } else {
      // published, active, completed, expired, cancelled 都显示为"已发布"
      return { label: '已发布', color: 'success' as const };
    }
  };

  // 简化的状态转换逻辑 - 只允许发布和取消发布
  const getAvailableStatusTransitions = (currentStatus: string) => {
    const normalizedStatus = currentStatus.toLowerCase();
    
    if (normalizedStatus === 'draft') {
      // 未发布状态可以发布
      return ['published'];
    } else {
      // 已发布状态可以取消发布（回到草稿）
      return ['draft'];
    }
  };

  // 提交表单
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.title.trim()) {
      setError('请输入考试标题');
      return;
    }

    if (!formData.examPaperId) {
      setError('请选择试卷');
      return;
    }

    if (formData.isTimed && formData.duration <= 0) {
      setError('考试时长必须大于0分钟');
      return;
    }

    // 根据考试类型进行不同的验证
    if (formData.type === 'scheduled') {
      if (!formData.startTime) {
        setError('请设置考试开始时间');
        return;
      }
      
      const startTime = new Date(formData.startTime);
      const now = new Date();
      if (startTime <= now) {
        setError('考试开始时间必须晚于当前时间');
        return;
      }
    } else if (formData.type === 'on_demand') {
      if (!formData.availableFrom) {
        setError('请设置考试开始时间');
        return;
      }
      
      const availableFrom = new Date(formData.availableFrom);
      const now = new Date();
      
      // 对于立即开始的考试，允许开始时间是当前时间或稍早
      if (!immediateStart && availableFrom <= now) {
        setError('开始时间必须晚于当前时间，或者勾选"立即开始"');
        return;
      }
      
      // 如果设置了结束时间，进行相关验证
      if (formData.availableUntil) {
        const availableUntil = new Date(formData.availableUntil);
        
        if (availableFrom >= availableUntil) {
          setError('开始时间必须早于结束时间');
          return;
        }
        
        if (availableUntil <= now) {
          setError('结束时间必须晚于当前时间');
          return;
        }
      }
    }

    try {
      let examSessionData: any = {
        name: formData.title,
        paperId: formData.examPaperId,
        duration: formData.duration,
        type: formData.type,
        settings: {
          allowReview: formData.showResults,
          shuffleQuestions: formData.shuffleQuestions,
          showResults: formData.showResults,

          passingScore: formData.passingScore
        }
      };

      // 根据考试类型设置不同的时间字段和状态
      if (formData.type === 'scheduled') {
        // 定时考试：设置开始时间和结束时间
        const startTime = new Date(formData.startTime);
        const endTime = new Date(startTime.getTime() + formData.duration * 60 * 1000);
        
        examSessionData.startTime = formData.startTime;
        examSessionData.endTime = endTime.toISOString();
        examSessionData.status = 'draft'; // 定时考试创建后也是draft状态，需要手动发布
      } else if (formData.type === 'on_demand') {
        // 随时考试：设置可用时间窗口
        const availableFrom = new Date(formData.availableFrom);
        const now = new Date();
        
        examSessionData.availableFrom = formData.availableFrom;
        examSessionData.startTime = availableFrom.toISOString();
        
        // 只有在设置了结束时间时才添加相关字段
        if (formData.availableUntil && formData.availableUntil.trim() !== '') {
          const availableUntil = new Date(formData.availableUntil);
          examSessionData.availableUntil = formData.availableUntil;
          examSessionData.endTime = availableUntil.toISOString();
        } else {
          // 没有结束时间限制时，使用一个很远的未来时间作为endTime（后端可能需要这个字段）
          const farFuture = new Date('2099-12-31T23:59:59.999Z');
          examSessionData.availableUntil = null;
          examSessionData.endTime = farFuture.toISOString();
        }
        
        // 随时考试创建后默认为draft状态，不自动发布
        // 管理员需要手动发布考试，发布时才根据开始时间设置相应状态
        examSessionData.status = 'draft';
      }

      // 直接使用mock token，不检查登录状态
      const response = await examApi.createExam(examSessionData);

      const result = await response.json();

      if (result.success) {
        setSuccess('考试创建成功！');
        setError(null);
        
        // 清空表单
        setFormData({
          title: '',
          examPaperId: '',
          duration: 60,

          type: 'scheduled',
          startTime: '',
          endTime: '',
          availableFrom: '',
          availableUntil: '',
          isTimed: true,
          shuffleQuestions: true,
          showResults: true,
          passingScore: 60
        });
        setSelectedPaper(null);
        setShowCreateForm(false);
        
        // 刷新考试列表
        fetchExamSessions();
      } else {
        setError(result.message || '创建考试失败');
      }
    } catch (error) {
      console.error('创建考试失败:', error);
      setError('创建考试失败，请稍后重试');
    }
  };



  // 删除考试
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这个考试吗？此操作不可恢复。')) {
      return;
    }

    try {
      // 直接使用mock token，不检查登录状态
      const response = await examApi.deleteExam(sessionId);

      const result = await response.json();

      if (result.success) {
        setSuccess('考试删除成功');
        setError(null);
        fetchExamSessions(); // 重新获取列表
      } else {
        setError(`删除失败：${result.message}`);
      }
    } catch (error) {
      console.error('删除考试失败:', error);
      setError('删除考试失败，请稍后重试');
    }
  };

  // 编辑考试
  const handleEditSession = (session: ExamSession) => {
    setEditingSession(session);
    
    // 检查是否是远未来时间（表示无结束时间限制）
    const isFarFuture = (dateString: string) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      return date.getFullYear() >= 2099;
    };

    setEditFormData({
      title: session.name,
      examPaperId: session.paperId?._id || '',
      duration: session.duration,
      type: session.type || 'scheduled',
      startTime: getLocalDateTime(new Date(session.startTime)),
      endTime: (session.type === 'scheduled') ? getLocalDateTime(new Date(session.endTime)) : '',
      availableFrom: session.availableFrom ? getLocalDateTime(new Date(session.availableFrom)) : '',
      availableUntil: (session.availableUntil && session.availableUntil !== null && !isFarFuture(session.availableUntil)) 
        ? getLocalDateTime(new Date(session.availableUntil)) 
        : '',

      isTimed: true,
      shuffleQuestions: session.settings?.shuffleQuestions || false,
      showResults: session.settings?.showResults || false,
      passingScore: session.settings?.passingScore || 60
    });
    setEditDialogOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingSession) return;

    try {
      let updateData: any = {
        name: editFormData.title,
        paperId: editFormData.examPaperId,
        duration: editFormData.duration,
        type: editFormData.type,
        settings: {

          allowReview: editFormData.showResults,
          shuffleQuestions: editFormData.shuffleQuestions,
          showResults: editFormData.showResults,
          passingScore: editFormData.passingScore
        }
      };

      // 根据考试类型设置不同的时间字段
      if (editFormData.type === 'scheduled') {
        // 定时考试：设置开始时间和结束时间
        const startTime = new Date(editFormData.startTime);
        const endTime = new Date(startTime.getTime() + editFormData.duration * 60 * 1000);
        
        updateData.startTime = editFormData.startTime;
        updateData.endTime = endTime.toISOString();
      } else if (editFormData.type === 'on_demand') {
        // 随时考试：设置可用时间窗口
        updateData.availableFrom = editFormData.availableFrom;
        updateData.startTime = editFormData.availableFrom;
        updateData.type = 'on_demand';
        
        // 处理可选的结束时间
        if (editFormData.availableUntil && editFormData.availableUntil.trim() !== '') {
          updateData.availableUntil = editFormData.availableUntil;
          updateData.endTime = editFormData.availableUntil;
        } else {
          updateData.availableUntil = null;
        }
      }

      const response = await examApi.updateExam(editingSession._id, updateData);
      const result = await response.json();

      if (result.success) {
        setSuccess('考试更新成功！考试已保存为草稿状态，您可以手动发布。');
        setError(null);
        setEditDialogOpen(false);
        setEditingSession(null);
        fetchExamSessions();
      } else {
        setError(result.message || '更新考试失败');
      }
    } catch (error) {
      console.error('更新考试失败:', error);
      setError('更新考试失败，请稍后重试');
    }
  };



  // 批量更新状态
  const handleBatchUpdateStatus = async (newStatus: string) => {
    if (selectedSessions.length === 0) {
      setError('请先选择要更新的考试');
      return;
    }

    try {
      const response = await examApi.batchUpdateExamStatus(selectedSessions, newStatus);
      const result = await response.json();

      if (result.success) {
        setSuccess(`已批量更新 ${selectedSessions.length} 个考试的状态`);
        setError(null);
        setSelectedSessions([]);
        fetchExamSessions();
      } else {
        setError(result.message || '批量更新失败');
      }
    } catch (error) {
      console.error('批量更新失败:', error);
      setError('批量更新失败，请稍后重试');
    }
    
    setBatchStatusMenuAnchor(null);
  };

  // 批量删除考试
  const handleBatchDelete = async () => {
    if (selectedSessions.length === 0) {
      setError('请先选择要删除的考试');
      return;
    }

    const confirmed = window.confirm(`确定要删除选中的 ${selectedSessions.length} 个考试吗？此操作不可撤销。`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const promises = selectedSessions.map(sessionId =>
        examApi.deleteExam(sessionId)
      );

      const results = await Promise.all(promises);
      const failedCount = results.filter(result => !result.ok).length;
      
      if (failedCount === 0) {
        setSuccess(`成功删除 ${selectedSessions.length} 个考试`);
        setError(null);
      } else {
        setError(`删除完成，${failedCount} 个考试删除失败`);
      }
      
      setSelectedSessions([]);
      fetchExamSessions();
    } catch (error) {
      console.error('批量删除失败:', error);
      setError('批量删除失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理选择
  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    const currentPageSessions = getPaginatedExamSessions();
    const currentPageIds = currentPageSessions.map(session => session._id);
    const allCurrentPageSelected = currentPageIds.every(id => selectedSessions.includes(id));
    
    if (allCurrentPageSelected) {
      // 取消选择当前页的所有项目
      setSelectedSessions(selectedSessions.filter(id => !currentPageIds.includes(id)));
    } else {
      // 选择当前页的所有项目
      const newSelected = [...selectedSessions];
      currentPageIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedSessions(newSelected);
    }
  };

  // 处理编辑表单变化
  const handleEditInputChange = (field: keyof ExamFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setEditFormData(prev => ({
      ...prev,
      [field]: field === 'duration' || field === 'passingScore' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  // 处理编辑开关变化
  const handleEditSwitchChange = (field: keyof ExamFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };



  // 筛选逻辑
  const getFilteredExamSessions = () => {
    let filtered = [...examSessions];

    // 按名称搜索
    if (searchText.trim()) {
      filtered = filtered.filter(session => 
        session.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 按状态筛选
    if (statusFilter !== 'all') {
      if (statusFilter === 'draft') {
        filtered = filtered.filter(session => session.status.toLowerCase() === 'draft');
      } else if (statusFilter === 'published') {
        filtered = filtered.filter(session => session.status.toLowerCase() !== 'draft');
      }
    }

    // 按时间筛选
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.createdAt);
        
        switch (timeFilter) {
          case 'today':
            return sessionDate >= today;
          case 'week':
            return sessionDate >= thisWeekStart;
          case 'month':
            return sessionDate >= thisMonthStart;
          case 'custom':
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
              return sessionDate >= startDate && sessionDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // 分页逻辑
  const getPaginatedExamSessions = () => {
    const filtered = getFilteredExamSessions();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // 计算总页数
  const getTotalPages = () => {
    const filtered = getFilteredExamSessions();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedSessions([]); // 清空选择
  };

  // 处理每页显示数量变化
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 重置到第一页
    setSelectedSessions([]); // 清空选择
  };

  // 清空筛选条件
  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setTimeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 获取简化的状态标签
  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'draft') {
      return { label: '未发布', color: 'default' as const };
    } else {
      // published, active, completed, expired, cancelled 都显示为"已发布"
      return { label: '已发布', color: 'success' as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    initializeData();
  }, []);

  // 设置默认开始和结束时间
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (!formData.startTime) {
      setFormData(prev => ({
        ...prev,
        startTime: getLocalDateTime(now)
      }));
    }
    
    if (!formData.endTime) {
      setFormData(prev => ({
        ...prev,
        endTime: getLocalDateTime(tomorrow)
      }));
    }
  }, []);

  // 获取本地时间字符串（解决时区问题）
  const getLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 处理考试类型变化，设置默认时间
  useEffect(() => {
    if (formData.type === 'on_demand' && !formData.availableFrom) {
      const now = new Date();
      
      setFormData(prev => ({
        ...prev,
        availableFrom: getLocalDateTime(now),
        availableUntil: '' // 默认不设置结束时间
      }));
      setImmediateStart(true);
    }
  }, [formData.type]);

  // 处理编辑表单考试类型变化
  useEffect(() => {
    if (editFormData.type === 'on_demand' && !editFormData.availableFrom) {
      const now = new Date();
      
      setEditFormData(prev => ({
        ...prev,
        availableFrom: getLocalDateTime(now),
        availableUntil: editFormData.availableUntil || '' // 保持原有结束时间或为空
      }));
      setEditImmediateStart(true);
    }
  }, [editFormData.type]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'white' }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            考试管理
          </Typography>
          <Typography>加载中...</Typography>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* 顶部导航栏 */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 hover:bg-green-600 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">考试管理</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-100">欢迎, {user?.username}</span>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              控制台
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* 筛选区域 */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mr: 2 }}>
                筛选条件
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={clearFilters}
                sx={{ color: '#666' }}
              >
                清空筛选
              </Button>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {/* 搜索框 */}
              <TextField
                fullWidth
                size="small"
                label="搜索考试名称"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="输入考试名称进行搜索"
              />
              
              {/* 状态筛选 */}
              <FormControl fullWidth size="small">
                <InputLabel>状态筛选</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="状态筛选"
                >
                  <MenuItem value="all">全部状态</MenuItem>
                  <MenuItem value="draft">未发布</MenuItem>
                  <MenuItem value="published">已发布</MenuItem>
                </Select>
              </FormControl>
              
              {/* 时间筛选 */}
              <FormControl fullWidth size="small">
                <InputLabel>时间筛选</InputLabel>
                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  label="时间筛选"
                >
                  <MenuItem value="all">全部时间</MenuItem>
                  <MenuItem value="today">今天</MenuItem>
                  <MenuItem value="week">本周</MenuItem>
                  <MenuItem value="month">本月</MenuItem>
                  <MenuItem value="custom">自定义时间</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* 自定义时间范围 */}
            {timeFilter === 'custom' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="开始日期"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="结束日期"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}
            
            {/* 筛选结果统计 */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                共找到 {getFilteredExamSessions().length} 个考试
              </Typography>
              {(searchText || statusFilter !== 'all' || timeFilter !== 'all') && (
                <Chip
                  label="已应用筛选"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 操作按钮区域 */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              考试列表
            </Typography>
            
            {selectedSessions.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`已选择 ${selectedSessions.length} 项`} 
                  color="primary" 
                  size="small" 
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => setBatchStatusMenuAnchor(e.currentTarget)}
                    sx={{ borderColor: '#666', color: '#666' }}
                  >
                    批量状态
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleBatchDelete}
                    sx={{ borderColor: '#f44336', color: '#f44336' }}
                  >
                    批量删除
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateForm(!showCreateForm)}
              sx={{
                background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c, #4caf50)'
                }
              }}
            >
              {showCreateForm ? '取消创建' : '创建新考试'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* 创建考试表单 */}
        <Collapse in={showCreateForm}>
          <Card sx={{ mb: 4, border: '2px solid #4caf50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AssignmentIcon sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                  创建新考试
                </Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* 左侧基本信息 */}
                  <Box>
                    <TextField
                      fullWidth
                      label="考试标题"
                      value={formData.title}
                      onChange={handleInputChange('title')}
                      margin="normal"
                      required
                      placeholder="请输入考试标题"
                    />

                    <FormControl fullWidth margin="normal" required>
                      <InputLabel>选择试卷</InputLabel>
                      <Select
                        value={formData.examPaperId}
                        onChange={(e) => handlePaperSelect(e.target.value)}
                        label="选择试卷"
                      >
                        {examPapers.map((paper) => (
                          <MenuItem key={paper.id} value={paper.id}>
                            {paper.title} ({paper.totalQuestions}题, {paper.totalPoints}分)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* 右侧设置 */}
                  <Box>
                    <TextField
                      fullWidth
                      label="考试时长（分钟）"
                      type="number"
                      value={formData.duration}
                      onChange={handleInputChange('duration')}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="最大尝试次数"

                    />

                    {/* 考试类型选择 */}
                    <FormControl fullWidth margin="normal">
                      <InputLabel>考试类型</InputLabel>
                      <Select
                        value={formData.type}
                        onChange={handleSelectChange('type')}
                        label="考试类型"
                      >
                        <MenuItem value="scheduled">定时考试</MenuItem>
                        <MenuItem value="on_demand">随时考试</MenuItem>
                      </Select>
                    </FormControl>

                    {/* 定时考试的时间设置 */}
                    {formData.type === 'scheduled' && (
                      <>
                        <TextField
                          fullWidth
                          label="考试开始时间"
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={handleInputChange('startTime')}
                          margin="normal"
                          InputLabelProps={{ shrink: true }}
                        />
                        
                        {/* 显示自动计算的结束时间 */}
                        {formData.startTime && formData.duration > 0 && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>考试结束时间：</strong>
                              {(() => {
                                const startTime = new Date(formData.startTime);
                                const endTime = new Date(startTime.getTime() + formData.duration * 60 * 1000);
                                return endTime.toLocaleString('zh-CN');
                              })()}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}

                    {/* 随时考试的可用时间窗口设置 */}
                    {formData.type === 'on_demand' && (
                      <>
                        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                          <strong>随时考试说明：</strong>学生可以在您设置的时间范围内随时开始考试，每次考试时长为 {formData.duration} 分钟。
                        </Alert>
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={immediateStart}
                              onChange={(e) => {
                                setImmediateStart(e.target.checked);
                                if (e.target.checked) {
                                  // 立即开始时，清空开始时间，发布时才设置
                                  setFormData(prev => ({
                                    ...prev,
                                    availableFrom: '',
                                    availableUntil: '' // 清空结束时间，表示无限制
                                  }));
                                }
                              }}
                              color="primary"
                            />
                          }
                          label="立即开始（发布时自动开始，无结束时间限制）"
                          sx={{ mb: 1 }}
                        />
                        
                        {!immediateStart && (
                          <TextField
                            fullWidth
                            label="开始时间"
                            type="datetime-local"
                            value={formData.availableFrom}
                            onChange={handleInputChange('availableFrom')}
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            helperText="学生可以开始考试的时间"
                            required
                          />
                        )}
                        
                        {immediateStart && (
                          <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                            <Typography variant="body2">
                              <strong>立即开始模式：</strong>当您点击"发布考试"时，系统将自动记录发布时刻作为考试开始时间，学生立即可以参加考试。
                            </Typography>
                          </Alert>
                        )}
                        
                        <TextField
                          fullWidth
                          label="结束时间（可选）"
                          type="datetime-local"
                          value={formData.availableUntil}
                          onChange={handleInputChange('availableUntil')}
                          margin="normal"
                          InputLabelProps={{ shrink: true }}
                          helperText="留空表示无结束时间限制，学生可以随时开始考试"
                        />
                        
                        {!immediateStart && formData.availableFrom && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1, border: '1px solid #4caf50' }}>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                              ✓ 考试时间设置完成
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formData.availableUntil ? (
                                <>
                                  学生可以在 {new Date(formData.availableFrom).toLocaleString('zh-CN')} 
                                  至 {new Date(formData.availableUntil).toLocaleString('zh-CN')} 期间随时开始考试
                                </>
                              ) : (
                                <>
                                  学生可以从 {new Date(formData.availableFrom).toLocaleString('zh-CN')} 开始随时参加考试，无结束时间限制
                                </>
                              )}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
=======
                  </Box>
                </Box>

                {/* 考试选项 */}
                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.shuffleQuestions}
                        onChange={handleSwitchChange('shuffleQuestions')}
                      />
                    }
                    label="题目随机排序"
                  />


                </Box>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{
                      background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #388e3c, #4caf50)'
                      }
                    }}
                  >
                    创建考试
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowCreateForm(false)}
                    sx={{ borderColor: '#666', color: '#666' }}
                  >
                    取消
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Collapse>

        {/* 考试列表 */}
        <Card>
          <CardContent>
            {examSessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  暂无考试
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  点击"创建新考试"按钮开始创建您的第一个考试
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={(() => {
                            const currentPageSessions = getPaginatedExamSessions();
                            const currentPageIds = currentPageSessions.map(session => session._id);
                            return currentPageSessions.length > 0 && currentPageIds.every(id => selectedSessions.includes(id));
                          })()}
                          indeterminate={(() => {
                            const currentPageSessions = getPaginatedExamSessions();
                            const currentPageIds = currentPageSessions.map(session => session._id);
                            const selectedCount = currentPageIds.filter(id => selectedSessions.includes(id)).length;
                            return selectedCount > 0 && selectedCount < currentPageIds.length;
                          })()}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell><strong>考试名称</strong></TableCell>
                      <TableCell><strong>类型</strong></TableCell>
                      <TableCell><strong>状态</strong></TableCell>
                      <TableCell><strong>参与者</strong></TableCell>
                      <TableCell><strong>创建时间</strong></TableCell>
                      <TableCell><strong>操作</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedExamSessions().map((session) => {
                      const statusInfo = getStatusLabel(session.status);
                      return (
                        <TableRow 
                          key={session._id} 
                          hover
                          selected={selectedSessions.includes(session._id)}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedSessions.includes(session._id)}
                              onChange={() => handleSelectSession(session._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {session.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(session.type || 'scheduled') === 'on_demand' ? '随时考试' : '定时考试'}
                              size="small"
                              color={(session.type || 'scheduled') === 'on_demand' ? 'warning' : 'info'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="点击切换状态">
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size="small"
                                onClick={(e) => {
                                  setCurrentSessionForStatus(session._id);
                                  setStatusMenuAnchor(e.currentTarget);
                                }}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.8,
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>{session.participants?.length || 0} 人</TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {formatDate(session.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="预览考试">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/preview/start/${session._id}`)}
                                  sx={{ color: '#4caf50' }}
                                >
                                  <PreviewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="编辑考试">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditSession(session)}
                                  sx={{ color: '#2196f3' }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="删除考试">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteSession(session._id)}
                                  sx={{ color: '#f44336' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              )}

              {/* 分页导航 */}
              {getFilteredExamSessions().length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mt: 3, 
                  px: 2,
                  py: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      每页显示：
                    </Typography>
                    <Select
                      size="small"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      sx={{ minWidth: 80 }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                    <Typography variant="body2" color="text.secondary">
                      共 {getFilteredExamSessions().length} 个考试，第 {currentPage} / {getTotalPages()} 页
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Pagination
                      count={getTotalPages()}
                      page={currentPage}
                      onChange={(_, page) => handlePageChange(page)}
                      color="primary"
                      size="medium"
                      showFirstButton
                      showLastButton
                      siblingCount={1}
                      boundaryCount={1}
                    />
                  </Stack>
                </Box>
              )}
          </CardContent>
        </Card>



        {/* 编辑考试对话框 */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
            color: 'white',
            fontWeight: 'bold'
          }}>
            编辑考试
          </DialogTitle>
          
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* 左侧基本信息 */}
              <Box>
                <TextField
                  fullWidth
                  label="考试标题"
                  value={editFormData.title}
                  onChange={handleEditInputChange('title')}
                  margin="normal"
                  required
                />

                <FormControl fullWidth margin="normal" required>
                  <InputLabel>选择试卷</InputLabel>
                  <Select
                    value={editFormData.examPaperId}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, examPaperId: e.target.value }))}
                    label="选择试卷"
                  >
                    {examPapers.map((paper) => (
                      <MenuItem key={paper.id} value={paper.id}>
                        {paper.title} ({paper.totalQuestions}题, {paper.totalPoints}分)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* 右侧设置 */}
              <Box>
                {/* 考试类型选择 */}
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>考试类型</InputLabel>
                  <Select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value as 'scheduled' | 'on_demand' }))}
                    label="考试类型"
                  >
                    <MenuItem value="scheduled">定时考试</MenuItem>
                    <MenuItem value="on_demand">随时考试</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="考试时长（分钟）"
                  type="number"
                  value={editFormData.duration}
                  onChange={handleEditInputChange('duration')}
                  margin="normal"
                />



                {/* 根据考试类型显示不同的时间字段 */}
                {editFormData.type === 'scheduled' ? (
                  <>
                    <TextField
                      fullWidth
                      label="考试开始时间"
                      type="datetime-local"
                      value={editFormData.startTime}
                      onChange={handleEditInputChange('startTime')}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />

                    {/* 显示自动计算的结束时间 */}
                    {editFormData.startTime && editFormData.duration > 0 && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>考试结束时间：</strong>
                          {(() => {
                            const startTime = new Date(editFormData.startTime);
                            const endTime = new Date(startTime.getTime() + editFormData.duration * 60 * 1000);
                            return endTime.toLocaleString('zh-CN');
                          })()}
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                      <strong>随时考试说明：</strong>学生可以在您设置的时间范围内随时开始考试，每次考试时长为 {editFormData.duration} 分钟。
                    </Alert>
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editImmediateStart}
                          onChange={(e) => {
                            setEditImmediateStart(e.target.checked);
                            if (e.target.checked) {
                              // 立即开始时，清空开始时间，发布时才设置
                              setEditFormData(prev => ({
                                ...prev,
                                availableFrom: '',
                                availableUntil: '' // 清空结束时间，表示无限制
                              }));
                            }
                          }}
                          color="primary"
                        />
                      }
                      label="立即开始（发布时自动开始，无结束时间限制）"
                      sx={{ mb: 1 }}
                    />

                    {!editImmediateStart && (
                      <TextField
                        fullWidth
                        label="开始时间"
                        type="datetime-local"
                        value={editFormData.availableFrom}
                        onChange={handleEditInputChange('availableFrom')}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        helperText="学生可以开始考试的时间"
                        required
                      />
                    )}
                    
                    {editImmediateStart && (
                      <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                        <Typography variant="body2">
                          <strong>立即开始模式：</strong>当您点击"发布考试"时，系统将自动记录发布时刻作为考试开始时间，学生立即可以参加考试。
                        </Typography>
                      </Alert>
                    )}

                    <TextField
                      fullWidth
                      label="结束时间（可选）"
                      type="datetime-local"
                      value={editFormData.availableUntil}
                      onChange={handleEditInputChange('availableUntil')}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      helperText="留空表示无结束时间限制，学生可以随时开始考试"
                    />
                    
                    {!editImmediateStart && editFormData.availableFrom && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1, border: '1px solid #4caf50' }}>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                          ✓ 考试时间设置完成
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {editFormData.availableUntil ? (
                            <>
                              学生可以在 {new Date(editFormData.availableFrom).toLocaleString('zh-CN')} 
                              至 {new Date(editFormData.availableUntil).toLocaleString('zh-CN')} 期间随时开始考试
                            </>
                          ) : (
                            <>
                              学生可以从 {new Date(editFormData.availableFrom).toLocaleString('zh-CN')} 开始随时参加考试，无结束时间限制
                            </>
                          )}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>

            {/* 考试选项 */}
            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.shuffleQuestions}
                    onChange={handleEditSwitchChange('shuffleQuestions')}
                  />
                }
                label="题目随机排序"
              />
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit">
              取消
            </Button>
            <Button onClick={handleSaveEdit} color="primary" variant="contained">
              保存更改
            </Button>
          </DialogActions>
        </Dialog>

        {/* 简化的状态更新菜单 */}
        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor)}
          onClose={() => setStatusMenuAnchor(null)}
        >
          {currentSessionForStatus && (() => {
            const currentSession = examSessions.find(s => s._id === currentSessionForStatus);
            const currentStatus = currentSession?.status.toLowerCase();
            const availableTransitions = getAvailableStatusTransitions(currentStatus || '');
            
            return availableTransitions.map((targetStatus) => {
              const statusOption = statusOptions.find(opt => opt.value === targetStatus);
              if (!statusOption) return null;
              
              return (
                <MenuItem
                  key={statusOption.value}
                  onClick={() => handleStatusChange(currentSessionForStatus, statusOption.value)}
                >
                  <ListItemIcon>
                    {statusOption.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={currentStatus === 'draft' ? '发布考试' : '取消发布'}
                  />
                </MenuItem>
              );
            });
          })()}
        </Menu>

        {/* 简化的批量状态更新菜单 */}
        <Menu
          anchorEl={batchStatusMenuAnchor}
          open={Boolean(batchStatusMenuAnchor)}
          onClose={() => setBatchStatusMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => handleBatchUpdateStatus('published')}
          >
            <ListItemIcon>
              <PublishIcon />
            </ListItemIcon>
            <ListItemText primary="批量发布考试" />
          </MenuItem>
          <MenuItem
            onClick={() => handleBatchUpdateStatus('draft')}
          >
            <ListItemIcon>
              <DraftIcon />
            </ListItemIcon>
            <ListItemText primary="批量取消发布" />
          </MenuItem>
        </Menu>
      </Container>
    </div>
  );
};

export default ExamManagement;