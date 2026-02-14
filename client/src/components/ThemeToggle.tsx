import React, { useContext } from 'react';
import { ThemeContext } from '../App';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '10px 16px',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        color: isDark ? '#f1f5f9' : '#1e293b',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
      }}
      title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      <span style={{ fontSize: '18px' }}>{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? 'Светлая' : 'Темная'}</span>
    </button>
  );
};

export default ThemeToggle;
