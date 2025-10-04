// 文本处理工具函数

/**
 * 从HTML字符串中提取纯文本
 * @param html HTML字符串
 * @returns 纯文本字符串
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  // 创建一个临时的DOM元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 获取纯文本内容
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * 截断文本并添加省略号
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  
  const cleanText = stripHtmlTags(text);
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  return cleanText.substring(0, maxLength) + '...';
};

/**
 * 格式化关键词显示
 * @param keywords 关键词数组或字符串
 * @returns 格式化的关键词字符串
 */
export const formatKeywords = (keywords: string[] | string): string => {
  if (!keywords) return '';
  
  if (Array.isArray(keywords)) {
    return keywords.join(', ');
  }
  
  return keywords;
};