import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageUpload, 
  currentImage, 
  className = '' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const imageUrl = result.data.url;
        setPreviewUrl(`http://localhost:3001${imageUrl}`);
        onImageUpload(imageUrl);

      } else {
        alert(result.message || '图片上传失败');
      }
    } catch (error) {
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onImageUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-upload-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {previewUrl ? (
        <div className="image-preview" style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={previewUrl}
            alt="预览图片"
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
              objectFit: 'cover'
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onClick={handleUploadClick}
          style={{
            width: '200px',
            height: '120px',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: '#fafafa',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.borderColor = '#2196F3';
              e.currentTarget.style.backgroundColor = '#f0f8ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.currentTarget.style.borderColor = '#ccc';
              e.currentTarget.style.backgroundColor = '#fafafa';
            }
          }}
        >
          {uploading ? (
            <>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #2196F3',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '8px'
              }} />
              <span style={{ color: '#666', fontSize: '14px' }}>上传中...</span>
            </>
          ) : (
            <>
              <div style={{ 
                fontSize: '32px', 
                color: '#ccc', 
                marginBottom: '8px' 
              }}>📷</div>
              <span style={{ color: '#666', fontSize: '14px' }}>点击上传图片</span>
              <span style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                支持 JPG、PNG 格式，最大 5MB
              </span>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;