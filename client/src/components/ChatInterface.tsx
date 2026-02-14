import React, { useState, useRef, useEffect, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Source } from '../types';
import { streamChat } from '../services/api';
import { ThemeContext } from '../App';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useContext(ThemeContext);

  const isDark = theme === 'dark';

  // Цвета в зависимости от темы
  const colors = isDark ? {
    bg: '#0f172a',
    bgMessageUser: '#6366f1',
    bgMessageBot: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    primary: '#6366f1',
    sourcesBg: 'rgba(99, 102, 241, 0.1)',
    sourcesText: '#818cf8',
    inputBg: '#1e293b',
    inputBorder: '#475569',
    buttonBg: '#10b981',
    buttonHover: '#059669',
    codeBg: '#1e293b',
    codeBorder: '#334155',
    inlineCodeBg: 'rgba(99, 102, 241, 0.2)'
  } : {
    bg: '#f8fafc',
    bgMessageUser: '#6366f1',
    bgMessageBot: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    primary: '#6366f1',
    sourcesBg: '#fef3c7',
    sourcesText: '#92400e',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    buttonBg: '#10b981',
    buttonHover: '#059669',
    codeBg: '#f1f5f9',
    codeBorder: '#e2e8f0',
    inlineCodeBg: 'rgba(99, 102, 241, 0.1)'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setSources([]);

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      const stream = streamChat(userMessage, messages);
      let fullResponse = '';

      for await (const chunk of stream) {
        if (chunk.type === 'sources') {
          setSources(chunk.sources || []);
        } else if (chunk.type === 'chunk') {
          fullResponse += chunk.content;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: fullResponse };
            return updated;
          });
        } else if (chunk.type === 'done') {
          break;
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: 'assistant', 
          content: '❌ Произошла ошибка при генерации ответа. Пожалуйста, попробуйте снова.' 
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  // Markdown компоненты с кастомными стилями
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <pre
          style={{
            backgroundColor: colors.codeBg,
            border: `1px solid ${colors.codeBorder}`,
            borderRadius: '8px',
            padding: '16px',
            overflow: 'auto',
            fontSize: '13px',
            lineHeight: '1.5',
            margin: '12px 0'
          }}
        >
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code
          style={{
            backgroundColor: colors.inlineCodeBg,
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    p({ children }: any) {
      return <p style={{ margin: '8px 0', lineHeight: '1.6' }}>{children}</p>;
    },
    h1({ children }: any) {
      return <h1 style={{ margin: '16px 0 12px 0', fontSize: '20px', fontWeight: '700' }}>{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 style={{ margin: '14px 0 10px 0', fontSize: '18px', fontWeight: '600' }}>{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 style={{ margin: '12px 0 8px 0', fontSize: '16px', fontWeight: '600' }}>{children}</h3>;
    },
    ul({ children }: any) {
      return <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>;
    },
    ol({ children }: any) {
      return <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>;
    },
    li({ children }: any) {
      return <li style={{ margin: '4px 0', lineHeight: '1.6' }}>{children}</li>;
    },
    strong({ children }: any) {
      return <strong style={{ fontWeight: '700' }}>{children}</strong>;
    },
    em({ children }: any) {
      return <em style={{ fontStyle: 'italic' }}>{children}</em>;
    },
    blockquote({ children }: any) {
      return (
        <blockquote
          style={{
            borderLeft: `4px solid ${colors.primary}`,
            margin: '12px 0',
            padding: '8px 16px',
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
            borderRadius: '0 8px 8px 0'
          }}
        >
          {children}
        </blockquote>
      );
    },
    a({ children, href }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: colors.primary,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          {children}
        </a>
      );
    },
    table({ children }: any) {
      return (
        <div style={{ overflow: 'auto', margin: '12px 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}
          >
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return <thead style={{ backgroundColor: colors.codeBg }}>{children}</thead>;
    },
    th({ children }: any) {
      return (
        <th
          style={{
            padding: '10px 12px',
            textAlign: 'left',
            borderBottom: `2px solid ${colors.border}`,
            fontWeight: '600'
          }}
        >
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td
          style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          {children}
        </td>
      );
    },
    hr() {
      return <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: '16px 0' }} />;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      overflow: 'hidden',
      backgroundColor: colors.bg,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '20px',
          transition: 'background-color 0.3s ease',
          maxHeight: '100%'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: colors.textMuted, 
            marginTop: '100px',
            transition: 'color 0.3s ease'
          }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 20px',
              background: `linear-gradient(135deg, ${colors.primary}, #8b5cf6)`,
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px'
            }}>
              💬
            </div>
            <p style={{ fontSize: '18px', marginBottom: '10px', fontWeight: '500', color: colors.text }}>
              Добро пожаловать в RAG чат!
            </p>
            <p style={{ fontSize: '14px' }}>Загрузите документы и задайте вопрос</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '16px'
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.role === 'user' ? colors.bgMessageUser : colors.bgMessageBot,
                  color: msg.role === 'user' ? 'white' : colors.text,
                  border: msg.role === 'user' ? 'none' : `1px solid ${colors.border}`,
                  wordBreak: 'break-word',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  boxShadow: msg.role === 'user' 
                    ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
                    : isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease'
                }}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
                {msg.role === 'assistant' && loading && index === messages.length - 1 && (
                  <span style={{ 
                    display: 'inline-block',
                    width: '8px',
                    height: '16px',
                    backgroundColor: colors.primary,
                    marginLeft: '4px',
                    animation: 'pulse 1s infinite',
                    borderRadius: '2px'
                  }}></span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ 
          padding: '14px 20px', 
          backgroundColor: colors.sourcesBg, 
          borderTop: `1px solid ${colors.border}`,
          maxHeight: '120px', 
          overflow: 'auto',
          flexShrink: 0,
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            marginBottom: '8px', 
            color: colors.sourcesText,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>📚</span>
            Источники ({sources.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sources.map((source, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#fbbf24',
                  color: isDark ? '#c7d2fe' : '#78350f',
                  borderRadius: '20px',
                  fontWeight: '500',
                  cursor: 'help'
                }}
                title={source.content.substring(0, 100) + '...'}
              >
                {source.filename} ({(source.relevance * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          padding: '16px 20px',
          backgroundColor: colors.bgMessageBot,
          borderTop: `1px solid ${colors.border}`,
          gap: '12px',
          flexShrink: 0,
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Введите ваш вопрос..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 18px',
            backgroundColor: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: '24px',
            fontSize: '15px',
            outline: 'none',
            color: colors.text,
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primary;
            e.target.style.boxShadow = `0 0 0 3px ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.inputBorder;
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.buttonBg,
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading && input.trim()) {
              e.currentTarget.style.backgroundColor = colors.buttonHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonBg;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
        >
          {loading ? (
            <span style={{
              display: 'inline-block',
              width: '18px',
              height: '18px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          ) : 'Отправить'}
        </button>
      </form>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
