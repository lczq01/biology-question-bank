import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  maxLength?: number;
}

const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ 
  html, 
  className = '', 
  maxLength 
}) => {
  // 清理HTML内容，防止XSS攻击
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'br', 'span', 'div', 'img'],
    ALLOWED_ATTR: ['style', 'class', 'src', 'alt', 'width', 'height', 'title']
  });

  // 如果需要截断文本
  let displayHtml = cleanHtml;
  if (maxLength && cleanHtml.length > maxLength) {
    // 简单的文本截断（保留HTML结构）
    const textContent = cleanHtml.replace(/<[^>]*>/g, '');
    if (textContent.length > maxLength) {
      displayHtml = textContent.substring(0, maxLength) + '...';
    }
  }

  return (
    <div 
      className={`safe-html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: displayHtml }}
      style={{
        // 为嵌入的图片添加样式
        '--img-max-width': '100%',
        '--img-max-height': '300px'
      } as React.CSSProperties}
    />
  );
};

export default SafeHtmlRenderer;