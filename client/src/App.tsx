import React, { useState, useEffect, createContext, useContext } from 'react';
import FileUploader from './components/FileUploader';
import DocumentList from './components/DocumentList';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import ThemeToggle from './components/ThemeToggle';
import { uploadFile, getDocuments, deleteDocument } from './services/api';
import { Document } from './types';

// Определение типов темы
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {}
});

// Темы
const themes = {
  dark: {
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    bgCard: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    success: '#10b981',
    info: '#3b82f6'
  },
  light: {
    bg: '#f8fafc',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    success: '#10b981',
    info: '#3b82f6'
  }
};

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>('dark');

  // Загрузка темы из localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('rag_theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    }
  }, []);

  // Сохранение темы в localStorage
  useEffect(() => {
    localStorage.setItem('rag_theme', theme);
  }, [theme]);

  useEffect(() => {
    const auth = localStorage.getItem('rag_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
    }
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await uploadFile(file);
      setDocuments(prev => [...prev, result.document]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('rag_auth');
    setIsAuthenticated(false);
  };

  const currentTheme = themes[theme];

  if (!isAuthenticated) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <Login onLogin={handleLogin} />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: currentTheme.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: currentTheme.text,
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: currentTheme.bgSecondary, 
          color: currentTheme.text, 
          padding: '16px 20px', 
          borderBottom: `1px solid ${currentTheme.border}`,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0
            }}>
              📚
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(16px, 2.5vw, 20px)', fontWeight: '700', whiteSpace: 'nowrap' }}>RAG Application</h1>
              <p style={{ 
                margin: '2px 0 0 0', 
                color: currentTheme.textMuted, 
                fontSize: 'clamp(11px, 1.5vw, 13px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Загружайте документы и общайтесь с ними через AI
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <ThemeToggle />
            
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: currentTheme.textMuted,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.border;
                e.currentTarget.style.color = currentTheme.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = currentTheme.textMuted;
              }}
            >
              <span>🚪</span> <span className="logout-text">Выйти</span>
            </button>
          </div>
        </header>

        <main style={{ 
          maxWidth: '1600px', 
          margin: '0 auto', 
          padding: '16px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Error */}
          {error && (
            <div style={{ 
              backgroundColor: currentTheme.errorBg, 
              color: currentTheme.error, 
              padding: '12px 16px', 
              borderRadius: '10px', 
              marginBottom: '16px',
              border: `1px solid ${currentTheme.error}`,
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ marginRight: '8px' }}>⚠️</span>
              {error}
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '16px',
            alignItems: 'stretch'
          }}>
            {/* Left column - Upload, Documents & Info */}
            <div id="left-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                backgroundColor: currentTheme.bgCard, 
                padding: '20px', 
                borderRadius: '12px', 
                border: `1px solid ${currentTheme.border}`,
                boxShadow: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 0.3s ease, border-color 0.3s ease'
              }}>
                <h2 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📤</span> Загрузка документов
                </h2>
                <FileUploader onUpload={handleUpload} uploading={uploading} />
              </div>

              <div style={{ 
                backgroundColor: currentTheme.bgCard, 
                padding: '20px', 
                borderRadius: '12px', 
                border: `1px solid ${currentTheme.border}`,
                boxShadow: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 0.3s ease, border-color 0.3s ease'
              }}>
                <DocumentList 
                  documents={documents} 
                  onDelete={handleDelete} 
                  deleting={deleting} 
                />
              </div>

              {/* Info - теперь под загруженными документами */}
              <div style={{ 
                backgroundColor: currentTheme.bgSecondary, 
                padding: '20px', 
                borderRadius: '12px',
                border: `1px solid ${currentTheme.border}`,
                transition: 'background-color 0.3s ease, border-color 0.3s ease'
              }}>
                <h3 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: currentTheme.text
                }}>
                  ℹ️ Информация о системе
                </h3>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  color: currentTheme.textMuted,
                  fontSize: '13px'
                }}>
                  <div style={{ 
                    padding: '10px 14px', 
                    backgroundColor: currentTheme.bg, 
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}>
                    <strong style={{ color: currentTheme.primary }}>LLM:</strong> qwen/qwen3-vl-8b
                  </div>
                  <div style={{ 
                    padding: '10px 14px', 
                    backgroundColor: currentTheme.bg, 
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}>
                    <strong style={{ color: currentTheme.primary }}>Embedding:</strong> text-embedding-qwen3-embedding-0.6b
                  </div>
                  <div style={{ 
                    padding: '10px 14px', 
                    backgroundColor: currentTheme.bg, 
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}>
                    <strong style={{ color: currentTheme.primary }}>Чанкинг:</strong> 1024 токена, перекрытие 100
                  </div>
                  <div style={{ 
                    padding: '10px 14px', 
                    backgroundColor: currentTheme.bg, 
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}>
                    <strong style={{ color: currentTheme.primary }}>Хранилище:</strong> JSON + in-memory
                  </div>
                  <div style={{ 
                    padding: '10px 14px', 
                    backgroundColor: currentTheme.bg, 
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}>
                    <strong style={{ color: currentTheme.primary }}>Форматы:</strong> PDF, DOCX, TXT
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Chat */}
            <div id="chat-column" style={{ 
              backgroundColor: currentTheme.bgCard, 
              padding: '20px', 
              borderRadius: '12px', 
              border: `1px solid ${currentTheme.border}`,
              boxShadow: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              minHeight: '500px',
              maxHeight: 'calc(100vh - 140px)',
              overflow: 'hidden',
              transition: 'background-color 0.3s ease, border-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h2 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0
              }}>
                <span>💬</span> Чат с документами
              </h2>
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <ChatInterface />
              </div>
            </div>
          </div>
        </main>

        <style>{`
          @media (max-width: 768px) {
            .logout-text {
              display: none;
            }
          }
          
          @media (max-width: 480px) {
            header {
              padding: 12px 16px !important;
            }
            
            main {
              padding: 12px !important;
            }
            
            h1 {
              font-size: 16px !important;
            }
            
            header p {
              display: none;
            }
          }

          /* Выравнивание высоты чата с левой колонкой */
          @media (min-width: 768px) {
            #chat-column {
              height: auto !important;
            }
          }
        `}</style>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
