import React, { useContext } from 'react';
import { ThemeContext } from '../App';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const isDark = theme === 'dark';
  
  const currentTheme = {
    border: isDark ? '#334155' : '#e2e8f0',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    text: isDark ? '#f1f5f9' : '#1e293b'
  };

  return (
    <button
      onClick={toggleTheme}
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
      title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      <span className="theme-text">{isDark ? 'Светлая' : 'Темная'}</span>
    </button>
  );
};

export default ThemeToggle;
