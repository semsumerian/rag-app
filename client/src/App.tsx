import { useState, useEffect, createContext, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import Settings from './components/Settings';
import { getDocuments, deleteDocument, uploadFile } from './services/api';
import { Document } from './types';
import { getDeepSeekColors } from './styles/deepseek';
import {
  CHAT_SESSIONS_STORAGE_KEY,
  CHAT_SESSIONS_UPDATED_EVENT,
  StoredChatSession,
  createChatSession,
  deleteChatSession,
  renameChatSession,
  readChatSessions,
  writeChatSessions,
} from './utils/chatSessions';

// Theme types
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {}
});

const getIsMobileLayout = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(max-width: 900px)').matches;
};

const formatSessionTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Icons as components
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const MoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobileLayout);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => !getIsMobileLayout());
  const [chatSessions, setChatSessions] = useState<StoredChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');

    const updateLayout = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);

      if (!mobile) {
        setSidebarOpen(true);
      }
    };

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);

    return () => {
      mediaQuery.removeEventListener('change', updateLayout);
    };
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('rag_theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage
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

  const refreshChatSessions = useCallback(() => {
    const sessions = readChatSessions();

    if (sessions.length === 0) {
      const hasStoredSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY) !== null;

      if (!hasStoredSessions) {
        const initialSession = createChatSession();
        writeChatSessions([initialSession]);
        setChatSessions([initialSession]);
        setActiveSessionId(initialSession.id);
        return;
      }

      setChatSessions([]);
      setActiveSessionId('');
      return;
    }

    setChatSessions(sessions);
    setActiveSessionId((prev) => (sessions.some((session) => session.id === prev) ? prev : sessions[0].id));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    refreshChatSessions();
  }, [isAuthenticated, refreshChatSessions]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-session-menu]')) {
        setMenuSessionId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key !== CHAT_SESSIONS_STORAGE_KEY) {
        return;
      }

      refreshChatSessions();
    };

    const handleInternalUpdate = () => {
      refreshChatSessions();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener(CHAT_SESSIONS_UPDATED_EVENT, handleInternalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener(CHAT_SESSIONS_UPDATED_EVENT, handleInternalUpdate);
    };
  }, [isAuthenticated, refreshChatSessions]);

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

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('rag_auth');
    localStorage.removeItem(CHAT_SESSIONS_STORAGE_KEY);
    setChatSessions([]);
    setActiveSessionId('');
    setIsAuthenticated(false);
  };

  const handleNewChat = () => {
    const newSession = createChatSession();
    const existingSessions = readChatSessions();
    writeChatSessions([newSession, ...existingSessions]);
    setActiveSessionId(newSession.id);
    setMenuSessionId(null);

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMenuSessionId(null);

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleRenameSession = (sessionId: string, currentTitle: string) => {
    setMenuSessionId(null);
    const nextTitle = window.prompt('Введите новое название чата', currentTitle);

    if (nextTitle === null) {
      return;
    }

    renameChatSession(sessionId, nextTitle);
    refreshChatSessions();
  };

  const ensureActiveSession = useCallback((): string => {
    if (activeSessionId) {
      return activeSessionId;
    }

    const sessions = readChatSessions();

    if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
      return sessions[0].id;
    }

    const newSession = createChatSession();
    writeChatSessions([newSession]);
    setChatSessions([newSession]);
    setActiveSessionId(newSession.id);

    return newSession.id;
  }, [activeSessionId]);

  const handleDeleteSession = (sessionId: string, title: string) => {
    setMenuSessionId(null);
    const confirmed = window.confirm(`Удалить чат "${title}"?`);
    if (!confirmed) {
      return;
    }

    const remainingSessions = deleteChatSession(sessionId);

    if (activeSessionId === sessionId) {
      setActiveSessionId(remainingSessions[0]?.id || '');
    }

    refreshChatSessions();
  };

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await uploadFile(file);
      setDocuments(prev => [...prev, result.document]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
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
      setError(err instanceof Error ? err.message : 'Ошибка удаления документа');
    } finally {
      setDeleting(null);
    }
  };

  // Helper function for Russian pluralization
  const getDocumentCountText = (count: number): string => {
    if (count === 0) return '0 документов';
    if (count === 1) return '1 документ';
    if (count >= 2 && count <= 4) return `${count} документа`;
    return `${count} документов`;
  };

  const isDark = theme === 'dark';

  // Theme colors - DeepSeek style (unified)
  const colors = getDeepSeekColors(isDark);

  if (!isAuthenticated) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <Login onLogin={handleLogin} />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div 
        className="app-container"
        style={{ 
          display: 'flex',
          height: '100vh',
          backgroundColor: colors.bg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          color: colors.text,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Sidebar */}
        <aside 
          style={{
            width: isMobile ? '280px' : (sidebarOpen ? '260px' : '0'),
            minWidth: isMobile ? '280px' : (sidebarOpen ? '260px' : '0'),
            backgroundColor: colors.bgSidebar,
            borderRight: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.25s ease, width 0.25s ease, min-width 0.25s ease',
            overflow: 'hidden',
            position: isMobile ? 'fixed' : 'relative',
            top: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            bottom: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 40 : 'auto',
            transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
            pointerEvents: isMobile && !sidebarOpen ? 'none' : 'auto',
            boxShadow: isMobile && sidebarOpen ? '0 16px 40px rgba(0, 0, 0, 0.35)' : 'none',
          }}
        >
          {/* Sidebar Header */}
          <div style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            {/* Left side: Bot Icon + Samson Chat */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
            }}>
              {/* Bot Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                background: `linear-gradient(135deg, ${colors.primary}, #8b5cf6)`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                🤖
              </div>
              
              {/* Samson Chat Text */}
              <span style={{
                fontSize: '20px',
                fontWeight: '600',
                color: colors.text,
              }}>
                Samson Chat
              </span>
            </div>
            
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: colors.textMuted,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgHover;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textMuted;
              }}
              title="Закрыть боковую панель"
            >
              <MenuIcon />
            </button>
          </div>
          
          {/* New Chat Button - below header */}
          <div style={{
            padding: '0 16px 12px 16px',
          }}>
            <button
              onClick={handleNewChat}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                backgroundColor: colors.bgActive,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgActive;
              }}
            >
              <span style={{ width: '100%', textAlign: 'center' }}>+ Новый чат</span>
            </button>
          </div>

          <div style={{
            flex: 1,
            minHeight: 0,
            padding: '0 12px 12px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {chatSessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <div
                  key={session.id}
                  style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '10px',
                    backgroundColor: isActive ? colors.bgActive : 'transparent',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = colors.bgHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <button
                    onClick={() => handleSelectSession(session.id)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 'none',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: isActive ? colors.text : colors.textSecondary,
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : '500',
                      color: 'inherit',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {session.title}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: colors.textMuted,
                    }}>
                      {formatSessionTime(session.updatedAt)}
                    </span>
                  </button>

                  <button
                    data-session-menu
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuSessionId((prev) => (prev === session.id ? null : session.id));
                    }}
                    title="Меню чата"
                    style={{
                      width: '28px',
                      height: '28px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bgHover;
                      e.currentTarget.style.color = colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    <MoreIcon />
                  </button>

                  {menuSessionId === session.id && (
                    <div
                      data-session-menu
                      style={{
                        position: 'absolute',
                        top: '36px',
                        right: '8px',
                        minWidth: '170px',
                        backgroundColor: colors.bgSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.45)' : '0 10px 30px rgba(0, 0, 0, 0.16)',
                        overflow: 'hidden',
                        zIndex: 20,
                      }}
                    >
                      <button
                        data-session-menu
                        onClick={() => handleRenameSession(session.id, session.title)}
                        style={{
                          width: '100%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: colors.text,
                          padding: '10px 12px',
                          fontSize: '13px',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bgHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Переименовать
                      </button>

                      <button
                        data-session-menu
                        onClick={() => handleDeleteSession(session.id, session.title)}
                        style={{
                          width: '100%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          padding: '10px 12px',
                          fontSize: '13px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderTop: `1px solid ${colors.border}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Удалить чат
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div style={{
            padding: '12px',
            marginTop: 'auto',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: colors.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgHover;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              <span style={{ flexShrink: 0 }}>
                {isDark ? <SunIcon /> : <MoonIcon />}
              </span>
              <span>{isDark ? 'Светлая тема' : 'Темная тема'}</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                if (isMobile) {
                  setSidebarOpen(false);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: colors.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgHover;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              <span style={{ flexShrink: 0 }}>
                <SettingsIcon />
              </span>
              <span>Параметры</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: colors.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgHover;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              <span style={{ flexShrink: 0 }}>
                <LogoutIcon />
              </span>
              <span>Выйти</span>
            </button>

            {/* User Profile - at the bottom */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              marginTop: '8px',
              borderTop: `1px solid ${colors.border}`,
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
              }}>
                A
              </div>
              <div style={{
                flex: 1,
                overflow: 'hidden',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  admin
                </div>
                <div style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                }}>
                  {getDocumentCountText(documents.length)}
                </div>
              </div>
            </div>

          </div>
        </aside>

        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              zIndex: 30,
            }}
          />
        )}

        {/* Main Content */}
        <main style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Header */}
          <header style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            backgroundColor: colors.bg,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              {(isMobile || !sidebarOpen) && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: colors.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgHover;
                    e.currentTarget.style.color = colors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.textMuted;
                  }}
                  title="Открыть боковую панель"
                >
                  <MenuIcon />
                </button>
              )}

              {isMobile && (
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}>
                  Samson Chat
                </span>
              )}
            </div>
          </header>

          {/* Error Toast */}
          {error && (
            <div style={{ 
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              padding: '12px 20px', 
              borderRadius: '8px', 
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {error}
            </div>
          )}

          {/* Chat Container */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <ChatInterface
              isMobile={isMobile}
              sessionId={activeSessionId}
              onEnsureSession={ensureActiveSession}
            />
          </div>
        </main>

        {/* Settings Modal */}
        <Settings 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          theme={theme}
          documents={documents}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading}
          deleting={deleting}
        />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
