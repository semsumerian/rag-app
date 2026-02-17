import { useState, useEffect } from 'react';
import { Settings as SettingsType, ModelSettings } from '../types';
import { getSettings, updateSettings } from '../services/api';
import FileUploader from './FileUploader';
import DocumentList from './DocumentList';
import { Document } from '../types';
import { getDeepSeekColors } from '../styles/deepseek';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  documents: Document[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  uploading: boolean;
  deleting: string | null;
}

const defaultModelSettings: ModelSettings = {
  url: '',
  modelName: '',
  apiKey: '',
};

export default function Settings({ 
  isOpen, 
  onClose, 
  theme,
  documents,
  onUpload,
  onDelete,
  uploading,
  deleting
}: SettingsProps) {
  const isDark = theme === 'dark';
  
  // DeepSeek colors (unified)
  const colors = {
    ...getDeepSeekColors(isDark),
    bgCard: isDark ? '#2f3033' : '#fafaf5',
    error: '#ef4444',
    success: '#10b981',
  };

  const [settings, setSettings] = useState<SettingsType>({
    llm: { ...defaultModelSettings },
    embedding: { ...defaultModelSettings },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateSettings(settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (model: 'llm' | 'embedding', field: keyof ModelSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [model]: {
        ...prev[model],
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: colors.bgCard,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: colors.text,
          }}>
            Настройки
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textMuted,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.border;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: colors.textMuted,
            }}>
              Loading settings...
            </div>
          ) : (
            <>
              {/* Error/Success Messages */}
              
              {error && (
                <div style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  color: colors.error,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'}`,
                }}>
                  {error}
                </div>
              )}
              
              {success && (
                <div style={{
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  color: colors.success,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'}`,
                }}>
                  {success}
                </div>
              )}

              {/* LLM Settings */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  LLM модель (Чат)
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.textMuted,
                    }}>
                      URL-адрес *
                    </label>
                    <input
                      type="text"
                      value={settings.llm.url}
                      onChange={(e) => handleChange('llm', 'url', e.target.value)}
                      placeholder="http://localhost:1235/v1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: colors.bgInput,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.textMuted,
                    }}>
                      Название модели *
                    </label>
                    <input
                      type="text"
                      value={settings.llm.modelName}
                      onChange={(e) => handleChange('llm', 'modelName', e.target.value)}
                      placeholder="qwen/qwen3-vl-8b"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: colors.bgInput,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.textMuted,
                    }}>
                      API ключ (необязательно)
                    </label>
                    <input
                      type="password"
                      value={settings.llm.apiKey}
                      onChange={(e) => handleChange('llm', 'apiKey', e.target.value)}
                      placeholder="Оставьте пустым если не требуется"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: colors.bgInput,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              
              <div style={{
                height: '1px',
                backgroundColor: colors.border,
                margin: '24px 0',
              }} />

              {/* Embedding Settings */}
              
              <div>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Embedding модель
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.textMuted,
                    }}>
                      URL-адрес *
                    </label>
                    <input
                      type="text"
                      value={settings.embedding.url}
                      onChange={(e) => handleChange('embedding', 'url', e.target.value)}
                      placeholder="http://localhost:1235/v1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: colors.bgInput,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.textMuted,
                    }}>
                      Название модели *
                    </label>
                    <input
                      type="text"
                      value={settings.embedding.modelName}
                      onChange={(e) => handleChange('embedding', 'modelName', e.target.value)}
                      placeholder="text-embedding-qwen3-embedding-0.6b"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: colors.bgInput,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.textMuted,
                    }}>
                      API ключ (необязательно)
                    </label>
                    <input
                      type="password"
                      value={settings.embedding.apiKey}
                      onChange={(e) => handleChange('embedding', 'apiKey', e.target.value)}
                      placeholder="Оставьте пустым если не требуется"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: colors.bgInput,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                backgroundColor: colors.border,
                margin: '24px 0',
              }} />

              {/* Documents Section */}
              <div>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  📁 Документы
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <FileUploader onUpload={onUpload} uploading={uploading} />
                </div>
                
                <DocumentList 
                  documents={documents} 
                  onDelete={onDelete} 
                  deleting={deleting}
                  compact={true}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: colors.textMuted,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.border;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            Отмена
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving || loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: saving || loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!saving && !loading) {
                e.currentTarget.style.backgroundColor = colors.primaryHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </div>
  );
}
