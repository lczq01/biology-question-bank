import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '请输入内容...',
  height = '200px'
}) => {
  const quillRef = useRef<ReactQuill>(null);
  
  // 调试：打印接收到的value


  // 自定义工具栏配置
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'formula'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background',
    'align', 'script', 'code-block', 'formula'
  ];

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-editor {
          min-height: ${height};
          font-size: 14px;
          line-height: 1.6;
        }
        
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid #e0e0e0;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          border-radius: 8px 8px 0 0;
          background: #fafafa;
        }
        
        .rich-text-editor .ql-container {
          border-bottom: 1px solid #e0e0e0;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          border-radius: 0 0 8px 8px;
          background: white;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #999;
          font-style: normal;
        }
        
        .rich-text-editor .ql-snow .ql-tooltip {
          z-index: 1000;
        }
      `}</style>
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;