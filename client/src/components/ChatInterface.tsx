import React, { useState, useRef, useEffect, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Source } from '../types';
import { streamChat } from '../services/api';
import { ThemeContext } from '../App';
import { getDeepSeekColors } from '../styles/deepseek';

// Icons
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
  </svg>
);

const DocumentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useContext(ThemeContext);

  const isDark = theme === 'dark';
  const colors = getDeepSeekColors(isDark);

  const normalizeFilename = (filename: string): string => {
    if (/[А-Яа-яЁё]/.test(filename)) {
      return filename;
    }

    if (!/[ÐÑ]/.test(filename)) {
      return filename;
    }

    try {
      const bytes = Uint8Array.from(filename, (char) => char.charCodeAt(0) & 0xff);
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return decoded.includes('�') ? filename : decoded;
    } catch {
      return filename;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

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

  // Markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      return !inline ? (
        <pre
          style={{
            backgroundColor: isDark ? '#2f3033' : '#f1f5f9',
            border: `1px solid ${isDark ? '#5a5a69' : '#e2e8f0'}`,
            borderRadius: '8px',
            padding: '16px',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: '20px',
            margin: '12px 0',
          }}
        >
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code
          style={{
            backgroundColor: isDark ? 'rgba(80, 159, 255, 0.15)' : 'rgba(80, 159, 255, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    p({ children }: any) {
      return <p style={{ margin: '0 0 8px 0', lineHeight: '1.5' }}>{children}</p>;
    },
    h1({ children }: any) {
      return <h1 style={{ margin: '8px 0 6px 0', fontSize: '18px', fontWeight: '600' }}>{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 style={{ margin: '6px 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 style={{ margin: '4px 0 2px 0', fontSize: '15px', fontWeight: '600' }}>{children}</h3>;
    },
    ul({ children }: any) {
      return <ul style={{ margin: '6px 0 10px 0', paddingLeft: '18px' }}>{children}</ul>;
    },
    ol({ children }: any) {
      return <ol style={{ margin: '6px 0 10px 0', paddingLeft: '18px' }}>{children}</ol>;
    },
    li({ children }: any) {
      const normalizedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === 'p') {
          const paragraph = child as React.ReactElement<{ style?: React.CSSProperties }>;

          return React.cloneElement(paragraph, {
            style: {
              ...(paragraph.props.style || {}),
              margin: '0'
            }
          });
        }

        return child;
      });

      return <li style={{ margin: '2px 0', lineHeight: '1.5' }}>{normalizedChildren}</li>;
    },
    strong({ children }: any) {
      return <strong style={{ fontWeight: '600' }}>{children}</strong>;
    },
    em({ children }: any) {
      return <em style={{ fontStyle: 'italic' }}>{children}</em>;
    },
    blockquote({ children }: any) {
      return (
        <blockquote
          style={{
            borderLeft: '4px solid #509fff',
            margin: '12px 0',
            padding: '8px 16px',
            backgroundColor: isDark ? 'rgba(80, 159, 255, 0.1)' : 'rgba(80, 159, 255, 0.05)',
            borderRadius: '0 8px 8px 0',
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
            color: '#509fff',
            textDecoration: 'underline',
            cursor: 'pointer',
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
              fontSize: '14px',
            }}
          >
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return <thead style={{ backgroundColor: isDark ? '#2f3033' : '#f1f5f9' }}>{children}</thead>;
    },
    th({ children }: any) {
      return (
        <th
          style={{
            padding: '10px 12px',
            textAlign: 'left',
            borderBottom: `2px solid ${isDark ? '#5a5a69' : '#e2e8f0'}`,
            fontWeight: '600',
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
            borderBottom: `1px solid ${isDark ? '#5a5a69' : '#e2e8f0'}`,
          }}
        >
          {children}
        </td>
      );
    },
    hr() {
      return <hr style={{ border: 'none', borderTop: `1px solid ${isDark ? '#5a5a69' : '#e2e8f0'}`, margin: '16px 0' }} />;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      overflow: 'hidden',
      backgroundColor: colors.bg,
      position: 'relative',
    }}>
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: messages.length === 0 ? '0' : '0 0 140px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: colors.textMuted,
            padding: '20px',
          }}>
            {/* Bot icon and text in one row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: `linear-gradient(135deg, #509fff, #4166d5)`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                boxShadow: '0 10px 25px -5px rgba(80, 159, 255, 0.4)',
                flexShrink: 0,
              }}>
                🤖
              </div>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: '600', 
                color: colors.text,
                margin: 0,
              }}>
                Чем могу помочь?
              </p>
            </div>
            
            {/* Centered Input Field */}
            <div style={{
              width: '100%',
              maxWidth: '700px',
              margin: '0 auto',
            }}>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  backgroundColor: colors.bgInput,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  padding: '12px 16px',
                  boxShadow: isDark 
                    ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Сообщение..."
                  disabled={loading}
                  rows={1}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '16px',
                    outline: 'none',
                    color: colors.text,
                    fontFamily: 'inherit',
                    resize: 'none',
                    minHeight: '24px',
                    maxHeight: '200px',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: loading || !input.trim() ? 'transparent' : colors.primary,
                    color: loading || !input.trim() ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && input.trim()) {
                      e.currentTarget.style.backgroundColor = colors.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && input.trim()) {
                      e.currentTarget.style.backgroundColor = colors.primary;
                    }
                  }}
                >
                  {loading ? (
                    <span style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                  width: '100%',
                  justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-start',
                  paddingLeft: msg.role === 'user' ? '0' : '80px',
                  paddingRight: msg.role === 'user' ? '80px' : '0',
                  boxSizing: 'border-box',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: msg.role === 'user' ? colors.primary : colors.bgSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: msg.role === 'user' ? '16px' : '0',
                  marginRight: msg.role === 'user' ? '0' : '16px',
                  flexShrink: 0,
                  fontSize: '12px',
                  fontWeight: '600',
                  color: msg.role === 'user' ? 'white' : colors.text,
                  marginTop: msg.role === 'assistant' ? '4px' : '4px',
                }}>
                  {msg.role === 'user' ? 'А' : '🤖'}
                </div>

                {/* Message Content */}
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '4px 0',
                    color: colors.text,
                    fontSize: '15px',
                    lineHeight: '1.6',
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                    fontWeight: '400',
                    marginLeft: msg.role === 'user' ? 'auto' : '0',
                    marginRight: msg.role === 'user' ? '0' : 'auto',
                  }}
                >
                  {msg.role === 'user' ? (
                    <div style={{ fontWeight: '500' }}>{msg.content}</div>
                  ) : (
                    <div className="chat-markdown">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {msg.role === 'assistant' && loading && index === messages.length - 1 && (
                    <span style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '16px',
                      backgroundColor: colors.primary,
                      marginLeft: '4px',
                      animation: 'pulse 1s infinite',
                      borderRadius: '2px',
                    }}></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ 
          position: 'absolute',
          bottom: '100px',
          left: '20px',
          right: '20px',
          padding: '12px 16px', 
          backgroundColor: isDark ? 'rgba(80, 159, 255, 0.1)' : 'rgba(80, 159, 255, 0.1)', 
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          zIndex: 10,
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            marginBottom: '6px', 
            color: '#509fff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <DocumentIcon />
            Источники ({sources.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sources.map((source, idx) => {
              const displayFilename = normalizeFilename(source.filename);

              return (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    backgroundColor: isDark ? 'rgba(80, 159, 255, 0.2)' : 'rgba(80, 159, 255, 0.15)',
                    color: isDark ? '#509fff' : '#509fff',
                    borderRadius: '20px',
                    fontWeight: '500',
                    cursor: 'help',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title={source.content.substring(0, 100) + '...'}
                >
                  <DocumentIcon />
                  {displayFilename}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area - Only show at bottom when there are messages */}
      {messages.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 20px 30px 20px',
          background: isDark 
            ? 'linear-gradient(to top, #292a2d 0%, #292a2d 80%, transparent 100%)' 
            : 'linear-gradient(to top, #f1f5f9 0%, #f1f5f9 80%, transparent 100%)',
        }}>
          <div style={{
            width: '100%',
          }}>
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                backgroundColor: colors.bgInput,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: isDark 
                  ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Сообщение..."
                disabled={loading}
                rows={1}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '16px',
                  outline: 'none',
                  color: colors.text,
                  fontFamily: 'inherit',
                  resize: 'none',
                  minHeight: '24px',
                  maxHeight: '200px',
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  padding: '8px 10px',
                  backgroundColor: loading || !input.trim() ? 'transparent' : colors.primary,
                  color: loading || !input.trim() ? colors.textMuted : 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!loading && input.trim()) {
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && input.trim()) {
                    e.currentTarget.style.backgroundColor = colors.primary;
                  }
                }}
              >
                {loading ? (
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <SendIcon />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .chat-markdown > *:first-child {
          margin-top: 0;
        }
        .chat-markdown > *:last-child {
          margin-bottom: 0;
        }
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
