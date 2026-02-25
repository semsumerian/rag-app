import { ChatMessage } from '../types';

export const CHAT_SESSIONS_STORAGE_KEY = 'rag_chat_sessions_v1';
export const CHAT_SESSIONS_UPDATED_EVENT = 'rag-chat-sessions-updated';

export interface StoredChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

const DEFAULT_SESSION_TITLE = 'Новый чат';

const sanitizeSessionTitle = (title: string): string => {
  const normalized = title.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return DEFAULT_SESSION_TITLE;
  }

  return normalized.length > 80 ? `${normalized.slice(0, 80)}...` : normalized;
};

const isValidChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as ChatMessage;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string'
  );
};

const isValidStoredSession = (value: unknown): value is StoredChatSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<StoredChatSession>;

  return (
    typeof session.id === 'string' &&
    typeof session.title === 'string' &&
    typeof session.updatedAt === 'string' &&
    Array.isArray(session.messages) &&
    session.messages.every(isValidChatMessage)
  );
};

const createSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const sanitizeSession = (session: StoredChatSession): StoredChatSession => ({
  id: session.id,
  title: sanitizeSessionTitle(session.title || DEFAULT_SESSION_TITLE),
  updatedAt: session.updatedAt,
  messages: session.messages.filter(isValidChatMessage),
});

export const deriveSessionTitle = (messages: ChatMessage[], fallback: string = DEFAULT_SESSION_TITLE): string => {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.content.trim().length > 0);

  if (!firstUserMessage) {
    return fallback;
  }

  const normalized = firstUserMessage.content.trim().replace(/\s+/g, ' ');
  return normalized.length > 48 ? `${normalized.slice(0, 48)}...` : normalized;
};

export const readChatSessions = (): StoredChatSession[] => {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { sessions?: unknown };
    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];

    return sessions
      .filter(isValidStoredSession)
      .map(sanitizeSession)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('Failed to read chat sessions from storage:', error);
    return [];
  }
};

export const writeChatSessions = (sessions: StoredChatSession[]): void => {
  const normalized = sessions
    .map(sanitizeSession)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  try {
    localStorage.setItem(
      CHAT_SESSIONS_STORAGE_KEY,
      JSON.stringify({
        sessions: normalized,
        updatedAt: new Date().toISOString(),
      })
    );

    window.dispatchEvent(new Event(CHAT_SESSIONS_UPDATED_EVENT));
  } catch (error) {
    console.error('Failed to write chat sessions to storage:', error);
  }
};

export const createChatSession = (title: string = DEFAULT_SESSION_TITLE): StoredChatSession => ({
  id: createSessionId(),
  title: sanitizeSessionTitle(title),
  messages: [],
  updatedAt: new Date().toISOString(),
});

export const getChatSessionById = (sessionId: string): StoredChatSession | undefined => {
  return readChatSessions().find((session) => session.id === sessionId);
};

const areMessagesEqual = (a: ChatMessage[], b: ChatMessage[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((message, index) => {
    const other = b[index];
    return message.role === other.role && message.content === other.content;
  });
};

export const ensureChatSession = (sessionId: string): StoredChatSession => {
  const existing = getChatSessionById(sessionId);
  if (existing) {
    return existing;
  }

  const created: StoredChatSession = {
    id: sessionId,
    title: DEFAULT_SESSION_TITLE,
    messages: [],
    updatedAt: new Date().toISOString(),
  };

  writeChatSessions([created, ...readChatSessions()]);
  return created;
};

export const updateChatSessionMessages = (sessionId: string, messages: ChatMessage[]): void => {
  const sessions = readChatSessions();
  const sessionIndex = sessions.findIndex((session) => session.id === sessionId);

  const now = new Date().toISOString();
  const existing = sessionIndex >= 0 ? sessions[sessionIndex] : undefined;
  const currentTitle = existing?.title || DEFAULT_SESSION_TITLE;
  const nextTitle = deriveSessionTitle(messages, currentTitle);

  if (existing && areMessagesEqual(existing.messages, messages) && existing.title === nextTitle) {
    return;
  }

  const nextSession: StoredChatSession = {
    id: sessionId,
    title: nextTitle,
    messages,
    updatedAt: now,
  };

  if (sessionIndex >= 0) {
    sessions[sessionIndex] = nextSession;
  } else {
    sessions.push(nextSession);
  }

  writeChatSessions(sessions);
};

export const renameChatSession = (sessionId: string, title: string): StoredChatSession[] => {
  const sessions = readChatSessions();
  const targetIndex = sessions.findIndex((session) => session.id === sessionId);

  if (targetIndex < 0) {
    return sessions;
  }

  const nextTitle = sanitizeSessionTitle(title);

  if (sessions[targetIndex].title === nextTitle) {
    return sessions;
  }

  sessions[targetIndex] = {
    ...sessions[targetIndex],
    title: nextTitle,
    updatedAt: new Date().toISOString(),
  };

  writeChatSessions(sessions);
  return sessions;
};

export const deleteChatSession = (sessionId: string): StoredChatSession[] => {
  const nextSessions = readChatSessions().filter((session) => session.id !== sessionId);
  writeChatSessions(nextSessions);
  return nextSessions;
};
