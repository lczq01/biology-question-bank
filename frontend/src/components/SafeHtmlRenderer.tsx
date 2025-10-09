import React from 'react';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  maxLength?: number;
}

const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ html, className, maxLength }) => {
  // Basic HTML sanitization - in production, use a proper sanitizer library
  const sanitizeHtml = (html: string): string => {
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');

    // Apply maxLength if specified
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...';
    }

    return sanitized;
  };

  const sanitizedHtml = sanitizeHtml(html);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SafeHtmlRenderer;