import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Collapse,
  IconButton
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CustomIdGenerator from './CustomIdGenerator';
import { 
  KnowledgePoint, 
  KnowledgePointFormData, 
  FormErrors
} from '../types/knowledgePoint';

// 组件属性接口
interface KnowledgePointFormProps {
  knowledgePoint?: KnowledgePoint;
  onSubmit: (data: KnowledgePointFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  readOnly?: boolean;
}

const KnowledgePointForm: React.FC<KnowledgePointFormProps> = ({
  knowledgePoint,
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false
}) => {
  // 表单状态
  const [formData, setFormData] = useState<KnowledgePointFormData>({
    name: '',
    description: '',
    chapter: '',
    customId: '',
    parentId: '',
    relatedIds: []
  });

  // 错误状态
  const [errors, setErrors] = useState<FormErrors>({});

  // CustomIdGenerator展开状态
  const [showIdGenerator, setShowIdGenerator] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (knowledgePoint) {
      setFormData({
        name: knowledgePoint.name || '',
        description: knowledgePoint.description || '',
        chapter: knowledgePoint.chapter || '',
        customId: knowledgePoint.customId || '',
        parentId: knowledgePoint.parentId || '',
        relatedIds: knowledgePoint.relatedIds || []
      });
    }
  }, [knowledgePoint]);

  // 处理输入变化
  const handleInputChange = (field: keyof KnowledgePointFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 处理customId生成
  const handleCustomIdGenerated = (customId: string) => {
    setFormData(prev => ({
      ...prev,
      customId: customId
    }));
    
    // 清除customId错误
    if (errors.customId) {
      setErrors(prev => ({
        ...prev,
        customId: undefined
      }));
    }
  };

  // 切换ID生成器显示
  const toggleIdGenerator = () => {
    setShowIdGenerator(!showIdGenerator);
  };

  // 处理富文本编辑器变化
  const handleQuillChange = (field: keyof KnowledgePointFormData) => (value: string) => {
    handleInputChange(field, value);
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '知识点名称不能为空';
    }

    if (!formData.chapter.trim()) {
      newErrors.chapter = '请输入所属章节';
    }

    if (!formData.description.trim()) {
      newErrors.description = '知识点描述不能为空';
    }

    // 验证customId格式
    if (formData.customId && formData.customId.trim()) {
      const customIdPattern = /^(bx01|bx02|xz01|xz02|xz03)-(\d{2})-(\d{2})-(\d{3})$/;
      if (!customIdPattern.test(formData.customId)) {
        newErrors.customId = 'customId格式不正确，应为：模块-章-节-序号 (如：bx01-01-01-001)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // 富文本编辑器配置
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <Box className="p-4">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div>
          <Typography variant="h6" className="font-semibold mb-4">
            基本信息
          </Typography>
          <div className="grid grid-cols-1 gap-4">
            <TextField
              fullWidth
              label="知识点名称"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              disabled={readOnly}
              required
            />
            <TextField
              fullWidth
              label="所属章节"
              value={formData.chapter}
              onChange={(e) => handleInputChange('chapter', e.target.value)}
              error={!!errors.chapter}
              helperText={errors.chapter}
              disabled={readOnly}
              required
              placeholder="例如：分子与细胞、遗传与进化等"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Typography variant="subtitle2" className="font-medium">
                  自定义ID
                </Typography>
                <IconButton
                  size="small"
                  onClick={toggleIdGenerator}
                  className="text-blue-600"
                >
                  {showIdGenerator ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </div>
              
              <TextField
                fullWidth
                label="自定义ID"
                value={formData.customId}
                onChange={(e) => handleInputChange('customId', e.target.value)}
                error={!!errors.customId}
                helperText={errors.customId || "格式：模块-章-节-序号 (如：bx01-01-01-001)"}
                disabled={readOnly}
                placeholder="例如：bx01-01-01-001"
              />
              
              <Collapse in={showIdGenerator && !readOnly}>
                <div className="mt-2">
                  <CustomIdGenerator
                    onCustomIdGenerated={handleCustomIdGenerated}
                    initialValues={{
                      module: 'bx01',
                      chapter: 1,
                      sequence: 1
                    }}
                  />
                </div>
              </Collapse>
            </div>
            <div>
              <Typography variant="subtitle1" className="font-semibold mb-2">
                知识点描述 *
              </Typography>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleQuillChange('description')}
                modules={quillModules}
                readOnly={readOnly}
                style={{ minHeight: '150px' }}
                placeholder="请输入知识点的详细描述..."
              />
              {errors.description && (
                <Typography color="error" variant="caption" className="mt-1 block">
                  {errors.description}
                </Typography>
              )}
            </div>
            <TextField
              fullWidth
              label="父知识点ID"
              value={formData.parentId}
              onChange={(e) => handleInputChange('parentId', e.target.value)}
              disabled={readOnly}
              placeholder="可选，用于建立层级关系"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onCancel} variant="outlined">
            取消
          </Button>
          {!readOnly && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? '保存中...' : knowledgePoint ? '更新' : '创建'}
            </Button>
          )}
        </div>
      </div>
    </Box>
  );
};

export default KnowledgePointForm;