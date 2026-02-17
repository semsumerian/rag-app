import React, { useState, useContext } from 'react';
import { ThemeContext } from '../App';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useContext(ThemeContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('rag_auth', 'true');
      onLogin();
    } else {
      setError('Неверный логин или пароль');
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  // Цвета DeepSeek
  const colors = isDark ? {
    bg: '#292a2d',
    bgGradient: 'linear-gradient(135deg, #292a2d 0%, #2f3033 50%, #292a2d 100%)',
    card: '#2f3033',
    cardBorder: '#5a5a69',
    text: '#ffffff',
    textMuted: '#9ca3af',
    inputBg: '#404045',
    inputBorder: '#5a5a69',
    inputBorderFocus: '#509fff',
    primary: '#509fff',
    primaryHover: '#4166d5',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)'
  } : {
    bg: '#f5f5f0',
    bgGradient: 'linear-gradient(135deg, #f5f5f0 0%, #ebebe5 50%, #f5f5f0 100%)',
    card: '#fafaf5',
    cardBorder: '#d4d4cf',
    text: '#2d2d2d',
    textMuted: '#737373',
    inputBg: '#ffffff',
    inputBorder: '#d4d4cf',
    inputBorderFocus: '#4f46e5',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.bgGradient,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        backgroundColor: colors.card,
        padding: '48px',
        borderRadius: '16px',
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: isDark 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
      }}>
        {/* Декоративный градиент сверху */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
          }}>
            🤖
          </div>
          <h1 style={{
            margin: '0 0 8px 0',
            color: colors.text,
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            transition: 'color 0.3s ease'
          }}>
            Samson Chat
          </h1>
          <p style={{
            color: colors.textMuted,
            margin: 0,
            fontSize: '15px',
            transition: 'color 0.3s ease'
          }}>
            Введите учетные данные для доступа
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: colors.errorBg,
            border: `1px solid ${colors.error}`,
            color: colors.error,
            padding: '14px 16px',
            borderRadius: '10px',
            marginBottom: '24px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: colors.textMuted,
              fontWeight: '500',
              fontSize: '14px',
              transition: 'color 0.3s ease'
            }}>
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: colors.text,
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.inputBorderFocus;
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.inputBorder;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: colors.textMuted,
              fontWeight: '500',
              fontSize: '14px',
              transition: 'color 0.3s ease'
            }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: colors.text,
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.inputBorderFocus;
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.inputBorder;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: '100%',
              padding: '16px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !username || !password ? 0.6 : 1,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
            }}
            onMouseEnter={(e) => {
              if (!loading && username && password) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(99, 102, 241, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(99, 102, 241, 0.39)';
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Вход...
              </span>
            ) : 'Войти'}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;
