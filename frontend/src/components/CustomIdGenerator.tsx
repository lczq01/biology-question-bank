import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { ContentCopy, CheckCircle, Warning, Error, Lightbulb } from '@mui/icons-material';

// 模块配置
const MODULE_CONFIG = {
  'bx01': { 
    name: '必修1《分子与细胞》', 
    chapters: 6,
    sections: [2, 5, 3, 2, 4, 3] // 每章的节数
  },
  'bx02': { 
    name: '必修2《遗传与进化》', 
    chapters: 6,
    sections: [2, 3, 4, 2, 3, 4] // 每章的节数
  },
  'xz01': { 
    name: '选择性必修1《稳态与调节》', 
    chapters: 5,
    sections: [2, 5, 3, 4, 4] // 每章的节数
  },
  'xz02': { 
    name: '选择性必修2《生物与环境》', 
    chapters: 4,
    sections: [3, 3, 5, 3] // 每章的节数
  },
  'xz03': { 
    name: '选择性必修3《生物技术与工程》', 
    chapters: 4,
    sections: [3, 3, 4, 3] // 每章的节数
  }
} as const;

type ModuleCode = keyof typeof MODULE_CONFIG;

// ID验证结果接口
interface IdValidationResult {
  isValid: boolean;
  error?: string;
  conflictType?: 'format' | 'duplicate';
  existingKnowledgePoint?: {
    _id: string;
    name: string;
    customId: string;
  };
  suggestions?: string[];
}

// ID冲突检测状态
interface ConflictDetectionState {
  isChecking: boolean;
  result: IdValidationResult | null;
  suggestions: string[];
}

interface CustomIdGeneratorProps {
  onCustomIdGenerated?: (customId: string) => void;
  initialValues?: {
    module?: ModuleCode;
    chapter?: number;
    section?: number;
    sequence?: number;
  };
  excludeId?: string; // 编辑时排除的ID
}

const CustomIdGenerator: React.FC<CustomIdGeneratorProps> = ({
  onCustomIdGenerated,
  initialValues,
  excludeId
}) => {
  const [module, setModule] = useState<ModuleCode>(initialValues?.module || 'bx01');
  const [chapter, setChapter] = useState<number>(initialValues?.chapter || 1);
  const [section, setSection] = useState<number>(initialValues?.section || 1);
  const [sequence, setSequence] = useState<number>(initialValues?.sequence || 1);
  const [generatedId, setGeneratedId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // ID冲突检测状态
  const [conflictDetection, setConflictDetection] = useState<ConflictDetectionState>({
    isChecking: false,
    result: null,
    suggestions: []
  });

  // API调用函数
  const validateCustomIdAPI = useCallback(async (customId: string): Promise<IdValidationResult> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/knowledge-points/validate-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          customId,
          excludeId 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          isValid: data.isValid,
          error: data.error,
          conflictType: data.conflictType,
          existingKnowledgePoint: data.existingKnowledgePoint
        };
      } else {
        return {
          isValid: false,
          error: data.message || '验证失败'
        };
      }
    } catch (error) {
      console.error('ID验证失败:', error);
      return {
        isValid: false,
        error: '网络错误，无法验证ID'
      };
    }
  }, [excludeId]);

  // 获取ID建议
  const getIdSuggestions = useCallback(async (moduleCode: string, chapterCode: number, sectionCode: number): Promise<string[]> => {
    try {
      const response = await fetch(`/api/knowledge-points/id-suggestions?moduleCode=${moduleCode}&chapterCode=${chapterCode}&sectionCode=${sectionCode}&count=5`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.suggestions || [];
      }
      return [];
    } catch (error) {
      console.error('获取ID建议失败:', error);
      return [];
    }
  }, []);

  // 生成章节选项
  const chapterOptions = Array.from(
    { length: MODULE_CONFIG[module].chapters }, 
    (_, i) => i + 1
  );

  // 生成节选项（基于当前选择的章）
  const sectionOptions = Array.from(
    { length: MODULE_CONFIG[module].sections[chapter - 1] || 0 }, 
    (_, i) => i + 1
  );

  // 生成customId
  const generateCustomId = () => {
    const chapterStr = chapter.toString().padStart(2, '0');
    const sectionStr = section.toString().padStart(2, '0');
    const sequenceStr = sequence.toString().padStart(3, '0');
    return `${module}-${chapterStr}-${sectionStr}-${sequenceStr}`;
  };

  // 验证customId格式
  const validateCustomId = (customId: string): boolean => {
    const pattern = /^(bx01|bx02|xz01|xz02|xz03)-(\d{2})-(\d{2})-(\d{3})$/;
    return pattern.test(customId);
  };

  // 实时ID冲突检测（防抖）
  const checkIdConflict = useCallback(async (customId: string) => {
    if (!customId || !validateCustomId(customId)) {
      setConflictDetection(prev => ({
        ...prev,
        isChecking: false,
        result: null
      }));
      return;
    }

    setConflictDetection(prev => ({
      ...prev,
      isChecking: true
    }));

    try {
      const result = await validateCustomIdAPI(customId);
      const suggestions = await getIdSuggestions(module, chapter, section);
      
      setConflictDetection({
        isChecking: false,
        result,
        suggestions
      });
    } catch (error) {
      console.error('ID冲突检测失败:', error);
      setConflictDetection({
        isChecking: false,
        result: {
          isValid: false,
          error: '检测失败，请稍后重试'
        },
        suggestions: []
      });
    }
  }, [validateCustomIdAPI, getIdSuggestions, module, chapter, section]);

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 使用建议的ID
  const useSuggestedId = (suggestedId: string) => {
    const parsed = parseCustomId(suggestedId);
    if (parsed) {
      setModule(parsed.module as ModuleCode);
      setChapter(parsed.chapter);
      setSection(parsed.section);
      setSequence(parsed.sequence);
    }
  };

  // 解析customId
  const parseCustomId = (customId: string) => {
    const regex = /^([a-z]{2}\d{2})-(\d{2})-(\d{2})-(\d{3,})$/;
    const match = customId.match(regex);
    
    if (!match) return null;
    
    const [, module, chapterStr, sectionStr, sequenceStr] = match;
    const chapter = parseInt(chapterStr, 10);
    const section = parseInt(sectionStr, 10);
    const sequence = parseInt(sequenceStr, 10);
    
    return {
      module,
      chapter,
      section,
      sequence
    };
  };

  // 生成ID
  const handleGenerate = () => {
    const newId = generateCustomId();
    setGeneratedId(newId);
    onCustomIdGenerated?.(newId);
  };

  // 使用生成的ID
  const handleUseId = () => {
    if (generatedId && validateCustomId(generatedId)) {
      onCustomIdGenerated?.(generatedId);
    }
  };

  // 组件挂载时生成初始ID
  useEffect(() => {
    if (initialValues) {
      const initialId = generateCustomId();
      setGeneratedId(initialId);
      onCustomIdGenerated?.(initialId);
    }
  }, []);

  // 当章变化时重置节为1
  useEffect(() => {
    setSection(1);
  }, [chapter]);

  // 当模块变化时重置章和节为1
  useEffect(() => {
    setChapter(1);
    setSection(1);
  }, [module]);

  // 当参数变化时重新生成ID
  useEffect(() => {
    if (module && chapter && section && sequence) {
      const newId = generateCustomId();
      setGeneratedId(newId);
    }
  }, [module, chapter, section, sequence]);

  // 实时ID冲突检测（防抖）
  useEffect(() => {
    if (!generatedId) return;

    const timeoutId = setTimeout(() => {
      checkIdConflict(generatedId);
    }, 500); // 500ms防抖

    return () => clearTimeout(timeoutId);
  }, [generatedId, checkIdConflict]);

  const isValid = validateCustomId(generatedId);
  const hasConflict = conflictDetection.result && !conflictDetection.result.isValid;
  const isAvailable = isValid && !hasConflict;

  return (
    <Card className="w-full max-w-md">
      <CardContent>
        <Typography variant="h6" className="mb-4 font-semibold text-gray-800">
          CustomId 生成器
        </Typography>

        <div className="space-y-4">
          {/* 模块选择 */}
          <div>
            <FormControl fullWidth size="small">
              <InputLabel>选择模块</InputLabel>
              <Select
                value={module}
                label="选择模块"
                onChange={(e) => setModule(e.target.value as ModuleCode)}
              >
                {Object.entries(MODULE_CONFIG).map(([code, config]) => (
                  <MenuItem key={code} value={code}>
                    {config.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* 章节选择 */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <FormControl fullWidth size="small">
                <InputLabel>章</InputLabel>
                <Select
                  value={chapter}
                  label="章"
                  onChange={(e) => setChapter(Number(e.target.value))}
                >
                  {chapterOptions.map((chap) => (
                    <MenuItem key={chap} value={chap}>
                      第{chap}章
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="flex-1">
              <FormControl fullWidth size="small">
                <InputLabel>节</InputLabel>
                <Select
                  value={section}
                  label="节"
                  onChange={(e) => setSection(Number(e.target.value))}
                >
                  {sectionOptions.map((sect) => (
                    <MenuItem key={sect} value={sect}>
                      第{sect}节
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          {/* 序号输入 */}
          <div>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="序号"
              value={sequence}
              onChange={(e) => setSequence(Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1, max: 999 }}
            />
          </div>

          {/* 生成的ID显示 */}
          <div>
            <Box className="flex items-center space-x-2">
              <TextField
                fullWidth
                size="small"
                label="生成的 CustomId"
                value={generatedId}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Tooltip title={copied ? '已复制' : '复制'}>
                      <IconButton
                        size="small"
                        onClick={copyToClipboard}
                        color={copied ? 'success' : 'primary'}
                      >
                        {copied ? <CheckCircle /> : <ContentCopy />}
                      </IconButton>
                    </Tooltip>
                  )
                }}
              />
            </Box>
          </div>

          {/* ID验证和冲突检测状态 */}
          <div>
            {generatedId && (
              <div className="space-y-2">
                {/* 格式验证 */}
                <Alert 
                  severity={isValid ? 'success' : 'error'}
                  className="text-sm"
                >
                  {isValid ? (
                    <span>✓ CustomId 格式正确</span>
                  ) : (
                    <span>✗ CustomId 格式不正确</span>
                  )}
                </Alert>

                {/* 冲突检测状态 */}
                {isValid && (
                  <div>
                    {conflictDetection.isChecking ? (
                      <Alert severity="info" className="text-sm">
                        <Box className="flex items-center space-x-2">
                          <CircularProgress size={16} />
                          <span>正在检测ID冲突...</span>
                        </Box>
                      </Alert>
                    ) : conflictDetection.result ? (
                      <Alert 
                        severity={conflictDetection.result.isValid ? 'success' : 'warning'}
                        className="text-sm"
                        icon={conflictDetection.result.isValid ? <CheckCircle /> : <Warning />}
                      >
                        {conflictDetection.result.isValid ? (
                          <span>✓ ID可用，无冲突</span>
                        ) : (
                          <div>
                            <div className="font-medium">⚠ ID冲突检测</div>
                            <div className="text-sm mt-1">{conflictDetection.result.error}</div>
                            {conflictDetection.result.existingKnowledgePoint && (
                              <div className="text-sm mt-1 text-gray-600">
                                已被知识点使用: {conflictDetection.result.existingKnowledgePoint.name}
                              </div>
                            )}
                          </div>
                        )}
                      </Alert>
                    ) : null}
                  </div>
                )}

                {/* ID建议 */}
                {hasConflict && conflictDetection.suggestions.length > 0 && (
                  <div>
                    <Alert severity="info" className="text-sm">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="text-blue-500 mt-0.5" fontSize="small" />
                        <div className="flex-1">
                          <div className="font-medium mb-2">建议使用以下可用ID:</div>
                          <List dense className="py-0">
                            {conflictDetection.suggestions.slice(0, 3).map((suggestion, index) => (
                              <ListItem 
                                key={index} 
                                className="px-0 py-1"
                                secondaryAction={
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => useSuggestedId(suggestion)}
                                    className="text-xs"
                                  >
                                    使用
                                  </Button>
                                }
                              >
                                <ListItemText 
                                  primary={suggestion}
                                  className="text-sm"
                                />
                              </ListItem>
                            ))}
                          </List>
                        </div>
                      </div>
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 格式说明 */}
          <div>
            <Box className="bg-gray-50 p-3 rounded">
              <Typography variant="caption" className="text-gray-600 block mb-2">
                CustomId 格式说明：
              </Typography>
              <div className="space-y-1">
                <Chip 
                  label="模块编码" 
                  size="small" 
                  variant="outlined" 
                  className="mr-1"
                />
                <Chip 
                  label="章编号" 
                  size="small" 
                  variant="outlined" 
                  className="mr-1"
                />
                <Chip 
                  label="节编号" 
                  size="small" 
                  variant="outlined" 
                  className="mr-1"
                />
                <Chip 
                  label="序号" 
                  size="small" 
                  variant="outlined" 
                />
                <Typography variant="caption" className="text-gray-600 block mt-2">
                  示例：bx01-01-01-001
                </Typography>
              </div>
            </Box>
          </div>

          {/* 操作按钮 */}
          <div>
            <Box className="flex space-x-2">
              <Button
                variant="contained"
                onClick={handleGenerate}
                className="flex-1"
              >
                重新生成
              </Button>
              <Button
                variant="outlined"
                onClick={handleUseId}
                disabled={!isValid || hasConflict}
                className="flex-1"
              >
                使用此ID
              </Button>
            </Box>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomIdGenerator;