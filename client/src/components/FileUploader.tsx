import React, { useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { ThemeContext } from '../App';
import { getDeepSeekColors } from '../styles/deepseek';

interface FileUploaderProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, uploading }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !uploading) {
      const file = acceptedFiles[0];
      console.log('File selected:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type);
      onUpload(file);
    }
  }, [onUpload, uploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    disabled: uploading,
    multiple: false
  });

  // Цвета DeepSeek (unified)
  const baseColors = getDeepSeekColors(isDark);
  const colors = {
    ...baseColors,
    borderActive: '#509fff',
    bgActive: isDark ? 'rgba(80, 159, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)',
  };

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? colors.borderActive : colors.border}`,
        borderRadius: '12px',
        padding: '48px 24px',
        textAlign: 'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        backgroundColor: isDragActive ? colors.bgActive : colors.bg,
        opacity: uploading ? 0.6 : 1,
        transition: 'all 0.3s ease'
      }}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${colors.border}`,
              borderTopColor: colors.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
          <p style={{ color: colors.text, fontSize: '16px', margin: 0 }}>Обработка файла...</p>
        </div>
      ) : isDragActive ? (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '48px' }}>📁</span>
          </div>
          <p style={{ color: colors.primary, fontSize: '18px', fontWeight: '600', margin: 0 }}>Отпустите файл здесь...</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '48px' }}>📄</span>
          </div>
          <p style={{ 
            marginBottom: '12px', 
            fontSize: '16px', 
            color: colors.text,
            fontWeight: '500'
          }}>
            Перетащите файлы сюда или кликните для выбора
          </p>
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
            Поддерживаемые форматы: PDF, DOC, DOCX, TXT
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
