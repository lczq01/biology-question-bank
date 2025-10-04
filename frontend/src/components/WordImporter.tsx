import React, { useState } from 'react';
import mammoth from 'mammoth';
import SafeHtmlRenderer from './SafeHtmlRenderer';

interface ParsedQuestion {
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  difficulty: string;
  chapter: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  answer: string;
  explanation: string;
  images: string[];
}

interface WordImporterProps {
  onImport: (questions: ParsedQuestion[]) => void;
  defaultDifficulty?: string;
  defaultChapter?: string;
}

const WordImporter: React.FC<WordImporterProps> = ({
  onImport,
  defaultDifficulty = '中等',
  defaultChapter = '未分类'
}) => {
  const [parsing, setParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  // 上传图片到服务器
  const uploadImageToServer = async (base64Data: string): Promise<string> => {
    try {
      // 将base64转换为Blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      // 创建FormData
      const formData = new FormData();
      formData.append('image', blob, 'word-image.png');
      
      // 上传到服务器
      const uploadResponse = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        return result.imageUrl || result.url || base64Data;
      } else {
        console.warn('图片上传失败，使用base64格式');
        return base64Data;
      }
    } catch (error) {
      console.warn('图片上传出错，使用base64格式:', error);
      return base64Data;
    }
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('请选择.docx格式的Word文档');
      return;
    }

    await parseWordDocument(file);
  };

  // 解析Word文档
  const parseWordDocument = async (file: File) => {
    try {
      setParsing(true);
      console.log('开始解析Word文档:', file.name);

      const arrayBuffer = await file.arrayBuffer();
      
      // 第一步：提取所有图片并上传到服务器
      console.log('=== 第一步：提取图片 ===');
      const imageMap = new Map<string, string>();
      
      // 配置mammoth选项以处理图片
      const options = {
        convertImage: mammoth.images.imgElement(function(image: any) {
          return image.read("base64").then(function(imageBuffer: string) {
            // 生成唯一的临时ID
            const tempId = `temp_img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const base64Image = `data:${image.contentType};base64,${imageBuffer}`;
            
            console.log('提取到图片，临时ID:', tempId);
            
            // 存储图片数据，稍后批量上传
            imageMap.set(tempId, base64Image);
            
            return {
              src: tempId // 使用临时ID作为占位符
            };
          });
        })
      };
      
      // 第二步：解析HTML内容
      console.log('=== 第二步：解析HTML ===');
      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      let htmlContent = result.value;
      
      console.log('解析的HTML内容:', htmlContent);
      console.log('解析消息:', result.messages);
      console.log('提取到的图片数量:', imageMap.size);
      
      // 第三步：批量上传图片并替换URL
      console.log('=== 第三步：上传图片到服务器 ===');
      for (const [tempId, base64Data] of imageMap.entries()) {
        try {
          console.log('正在上传图片:', tempId);
          const serverUrl = await uploadImageToServer(base64Data);
          console.log('图片上传成功，服务器URL:', serverUrl);
          
          // 替换HTML中的临时ID为真实URL
          htmlContent = htmlContent.replace(new RegExp(`src="${tempId}"`, 'g'), `src="${serverUrl}"`);
        } catch (error) {
          console.error('图片上传失败，保留base64格式:', error);
          // 如果上传失败，使用base64格式
          htmlContent = htmlContent.replace(new RegExp(`src="${tempId}"`, 'g'), `src="${base64Data}"`);
        }
      }
      
      console.log('图片URL替换后的HTML:', htmlContent);
      
      // 第四步：解析HTML内容为题目
      console.log('=== 第四步：解析题目 ===');
      const questions = await parseQuestionsFromHtml(htmlContent);
      console.log('解析到题目数量:', questions.length);
      
      if (questions.length === 0) {
        const formatMessage = `未能识别到有效的题目格式。请确保Word文档包含以下格式的题目：

1. 题目内容
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案：A
解析：解析内容`;
        alert(formatMessage);
      }
      
      setParsedQuestions(questions);
      setPreviewOpen(true);
      
    } catch (error) {
      console.error('解析Word文档失败:', error);
      const errorMessage = error instanceof Error ? error.message : '解析Word文档失败，请检查文件格式';
      alert(errorMessage);
    } finally {
      setParsing(false);
    }
  };

  // 从HTML内容解析题目
  const parseQuestionsFromHtml = async (html: string): Promise<ParsedQuestion[]> => {
    const questions: ParsedQuestion[] = [];
    
    console.log('开始解析HTML内容:', html.substring(0, 500) + '...');
    
    // 按段落分割内容，同时处理换行符
    const paragraphs = html.split(/\n+|<\/p>\s*<p>|<br\s*\/?>/).map(p => {
      // 保留图片标签，只清理其他HTML标签
      return p.replace(/<(?!img\s)[^>]+>/g, '').trim();
    }).filter(p => p && p.length > 0);
    
    console.log('解析到段落数量:', paragraphs.length);
    console.log('前5个段落:', paragraphs.slice(0, 5));
    
    let currentQuestion: Partial<ParsedQuestion> = {};
    let questionIndex = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      console.log(`处理段落 ${i}:`, paragraph);
      
      // 检测题目开始（以数字开头）
      if (/^\d+[.、．]\s*/.test(paragraph)) {
        console.log('检测到新题目:', paragraph);
        
        // 保存上一题
        if (currentQuestion.content) {
          const finalized = finalizeQuestion(currentQuestion, questionIndex);
          questions.push(finalized);
          console.log('保存题目:', finalized);
          questionIndex++;
        }
        
        // 去除题号，只保留题目内容
        const questionContent = paragraph.replace(/^\d+[.、．]\s*/, '').trim();
        console.log('去除题号后的题目内容:', questionContent);
        
        // 开始新题 - 暂时设为单选题，后续根据选项和答案动态调整
        currentQuestion = {
          content: questionContent,
          type: 'single_choice', // 默认类型，后续会根据实际内容调整
          difficulty: defaultDifficulty,
          chapter: defaultChapter || '未分类',
          options: [],
          answer: '',
          explanation: '',
          images: []
        };
      }
      // 检测选项（A、B、C、D）
      else if (/^[A-Z][.、．]\s*/.test(paragraph)) {
        console.log('检测到选项:', paragraph);
        if (currentQuestion.options) {
          const optionLetter = paragraph.charAt(0);
          const optionText = paragraph.replace(/^[A-Z][.、．]\s*/, '');
          currentQuestion.options.push({
            id: optionLetter,
            text: optionText,
            isCorrect: false
          });
        }
      }
      // 检测答案（答案：或【答案】）
      else if (/答案[:：]|【答案】/.test(paragraph)) {
        console.log('检测到答案:', paragraph);
        
        // 填空题答案识别（任意文本内容）
        if (currentQuestion.type === 'fill_blank' || (currentQuestion.options && currentQuestion.options.length === 0)) {
          const answerText = paragraph.replace(/答案[:：]\s*|【答案】\s*/, '');
          currentQuestion.answer = answerText;
          currentQuestion.options = []; // 填空题不需要选项
          currentQuestion.type = 'fill_blank';
        }
        else {
          // 选择题答案识别
          const answerMatch = paragraph.match(/答案[:：]\s*([A-Z]+)|【答案】\s*([A-Z]+)/);
          if (answerMatch && currentQuestion.options) {
            const answer = answerMatch[1] || answerMatch[2];
            currentQuestion.answer = answer;
            
            // 标记正确选项
            for (let j = 0; j < answer.length; j++) {
              const optionLetter = answer.charAt(j);
              const option = currentQuestion.options.find(opt => opt.id === optionLetter);
              if (option) {
                option.isCorrect = true;
              }
            }
            
            // 根据答案长度判断题型
            if (answer.length > 1) {
              currentQuestion.type = 'multiple_choice';
            }
          }
        }
      }
      // 检测解析（解析：或【解析】）
      else if (/解析[:：]|【解析】/.test(paragraph)) {
        console.log('检测到解析:', paragraph);
        currentQuestion.explanation = paragraph.replace(/解析[:：]\s*|【解析】\s*/, '');
      }
      // 其他内容可能是题目内容的延续
      else if (currentQuestion.content && currentQuestion.options && currentQuestion.options.length === 0) {
        currentQuestion.content += ' ' + paragraph;
      }
    }
    
    // 保存最后一题
    if (currentQuestion.content) {
      const finalized = finalizeQuestion(currentQuestion, questionIndex);
      questions.push(finalized);
      console.log('保存最后一题:', finalized);
    }
    
    console.log('总共解析到题目数量:', questions.length);
    return questions;
  };

  // 完善题目信息
  const finalizeQuestion = (question: Partial<ParsedQuestion>, index: number): ParsedQuestion => {
    // 智能题型识别逻辑 - 只支持选择题和填空题
    let finalType: 'single_choice' | 'multiple_choice' | 'fill_blank' = 'single_choice';
    
    const content = question.content || '';
    const options = question.options || [];
    const answer = question.answer || '';
    
    // 1. 填空题识别 - 检查题目中是否有空白标记且没有选项
    if ((/_+|（\s*）|【\s*】|\(\s*\)|____+/i.test(content) || /填空/i.test(content)) && 
        options.length === 0) {
      finalType = 'fill_blank';
    }
    // 2. 多选题识别 - 有选项且答案包含多个字母
    else if (options.length > 0 && answer.length > 1 && /^[A-Z]+$/i.test(answer)) {
      finalType = 'multiple_choice';
    }
    // 3. 单选题识别 - 有选项且答案是单个字母
    else if (options.length > 0 && answer.length === 1 && /^[A-Z]$/i.test(answer)) {
      finalType = 'single_choice';
    }
    // 4. 默认处理 - 根据选项数量判断
    else if (options.length > 0) {
      finalType = 'single_choice'; // 有选项默认为单选题
    } else {
      finalType = 'fill_blank'; // 无选项默认为填空题
    }
    
    console.log(`题目 ${index + 1} 智能识别结果:`, {
      content: content.substring(0, 50) + '...',
      optionsCount: options.length,
      answer: answer,
      finalType: finalType
    });
    
    return {
      content: question.content || `题目 ${index + 1}`,
      type: finalType,
      difficulty: question.difficulty || defaultDifficulty,
      chapter: question.chapter || defaultChapter,
      options: question.options || [],
      answer: question.answer || '',
      explanation: question.explanation || '',
      images: question.images || []
    };
  };

  // 确认导入
  const handleConfirmImport = () => {
    onImport(parsedQuestions);
    setPreviewOpen(false);
    setParsedQuestions([]);
  };

  // 取消导入
  const handleCancelImport = () => {
    setPreviewOpen(false);
    setParsedQuestions([]);
  };

  return (
    <div className="word-importer">
      {/* 文件选择按钮 */}
      <div className="mb-4">
        <input
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          disabled={parsing}
          className="hidden"
          id="word-file-input"
        />
        <label
          htmlFor="word-file-input"
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            parsing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {parsing ? '解析中...' : '选择Word文档'}
        </label>
        <p className="mt-2 text-sm text-gray-500">
          支持.docx格式，请确保文档包含标准的题目格式
        </p>
      </div>

      {/* 预览对话框 */}
      {previewOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                导入预览 ({parsedQuestions.length} 道题目)
              </h3>
              
              <div className="max-h-96 overflow-y-auto mb-4">
                {parsedQuestions.map((question, index) => (
                  <div key={index} className="border-b pb-4 mb-4">
                    <div className="font-medium text-gray-900 mb-2">
                      题目 {index + 1}: 
                      <SafeHtmlRenderer html={question.content} />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      类型: {question.type} | 难度: {question.difficulty} | 章节: {question.chapter}
                    </div>
                    {question.options.length > 0 && (
                      <div className="mb-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className={`text-sm ${option.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                            {option.id}. <SafeHtmlRenderer html={option.text} />
                          </div>
                        ))}
                      </div>
                    )}
                    {question.answer && (
                      <div className="text-sm text-blue-600 mb-1">
                        答案: {question.answer}
                      </div>
                    )}
                    {question.explanation && (
                      <div className="text-sm text-gray-600">
                        解析: <SafeHtmlRenderer html={question.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelImport}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  确认导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordImporter;