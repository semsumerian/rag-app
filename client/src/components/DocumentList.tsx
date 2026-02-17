import React, { useContext } from 'react';
import { Document } from '../types';
import { ThemeContext } from '../App';
import { getDeepSeekColors } from '../styles/deepseek';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  deleting: string | null;
  compact?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete, deleting, compact }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  // Цвета DeepSeek (unified)
  const baseColors = getDeepSeekColors(isDark);
  const colors = {
    ...baseColors,
    bgCard: isDark ? '#2f3033' : '#fafaf5',
    error: '#ef4444',
    errorHover: '#dc2626'
  };

  if (documents.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '48px', 
        color: colors.textMuted,
        backgroundColor: colors.bg,
        borderRadius: '12px',
        border: `1px dashed ${colors.border}`,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
        <p style={{ margin: 0, fontSize: '16px' }}>Нет загруженных документов</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.7 }}>Загрузите первый документ выше</p>
      </div>
    );
  }

  // Компактный режим для sidebar
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        {documents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: colors.textMuted,
            fontSize: '13px'
          }}>
            Нет документов
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                backgroundColor: colors.bg,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.2s ease',
                gap: '8px'
              }}
            >
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ 
                  fontSize: '13px',
                  fontWeight: '500', 
                  color: colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  📄 {doc.originalName}
                </div>
                <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
                  {formatFileSize(doc.size)}
                </div>
              </div>
              
              <button
                onClick={() => onDelete(doc.id)}
                disabled={deleting === doc.id}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  color: colors.error,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleting === doc.id ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: deleting === doc.id ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (deleting !== doc.id) {
                    e.currentTarget.style.backgroundColor = colors.error;
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.error;
                }}
                title="Удалить"
              >
                {deleting === doc.id ? '⏳' : '🗑️'}
              </button>
            </div>
          ))
        )}
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ 
        margin: '0 0 20px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        transition: 'color 0.3s ease'
      }}>
        Загруженные документы <span style={{ 
          color: colors.primary,
          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '14px'
        }}>{documents.length}</span>
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              backgroundColor: colors.bg,
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: '500', 
                marginBottom: '6px',
                color: colors.text,
                fontSize: '15px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                📄 {doc.originalName}
              </div>
              <div style={{ fontSize: '13px', color: colors.textMuted }}>
                {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleString('ru-RU')}
              </div>
            </div>
            
            <button
              onClick={() => onDelete(doc.id)}
              disabled={deleting === doc.id}
              style={{
                padding: '10px 18px',
                backgroundColor: deleting === doc.id ? colors.border : 'transparent',
                color: deleting === doc.id ? colors.textMuted : colors.error,
                border: `1px solid ${deleting === doc.id ? colors.border : colors.error}`,
                borderRadius: '8px',
                cursor: deleting === doc.id ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                marginLeft: '16px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (deleting !== doc.id) {
                  e.currentTarget.style.backgroundColor = colors.error;
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.error;
              }}
            >
              {deleting === doc.id ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }} />
                  Удаление...
                </span>
              ) : '🗑️ Удалить'}
            </button>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DocumentList;
