import React, { useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { ThemeContext } from '../App';

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
      'text/plain': ['.txt']
    },
    disabled: uploading,
    multiple: false
  });

  // Цвета в зависимости от темы
  const colors = isDark ? {
    border: '#475569',
    borderActive: '#6366f1',
    bg: '#0f172a',
    bgActive: 'rgba(99, 102, 241, 0.1)',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    primary: '#6366f1'
  } : {
    border: '#cbd5e1',
    borderActive: '#6366f1',
    bg: '#f8fafc',
    bgActive: 'rgba(99, 102, 241, 0.05)',
    text: '#1e293b',
    textMuted: '#64748b',
    primary: '#6366f1'
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
            Поддерживаемые форматы: PDF, DOCX, TXT
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
