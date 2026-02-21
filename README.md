# RAG Application - Техническая документация

## Обзор системы

RAG (Retrieval-Augmented Generation) Application - это полнофункциональное веб-приложение для интеллектуальной работы с документами через LLM модели. Система позволяет загружать документы (PDF, DOC, DOCX, TXT), индексировать их содержимое и вести осмысленный диалог с AI, который опирается на контекст загруженных документов.

## Архитектура системы

### Структура проекта

```
RAG/
├── rag-app/
│   ├── server/          # Backend (Node.js + Express + TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts              # Точка входа сервера
│   │   │   ├── config.ts             # Конфигурация
│   │   │   ├── routes/               # API endpoints
│   │   │   │   ├── upload.ts         # Загрузка документов
│   │   │   │   ├── documents.ts      # Управление документами
│   │   │   │   └── chat.ts           # Чат с RAG
│   │   │   └── services/             # Бизнес-логика
│   │   │       ├── documentProcessor.ts  # Парсинг документов
│   │   │       ├── chunking.ts       # Разбиение на чанки
│   │   │       ├── embedding.ts      # Генерация эмбеддингов
│   │   │       ├── vectorStore.ts    # Векторное хранилище
│   │   │       ├── llm.ts            # Интеграция с LLM
│   │   │       └── documentStore.ts  # Хранилище документов
│   │   └── data/                     # Локальное хранилище
│   └── client/          # Frontend (React + TypeScript + Vite)
│       ├── src/
│       │   ├── App.tsx               # Главный компонент
│       │   ├── components/
│       │   │   ├── Login.tsx         # Авторизация
│       │   │   ├── FileUploader.tsx  # Загрузка файлов
│       │   │   ├── DocumentList.tsx  # Список документов
│       │   │   ├── ChatInterface.tsx # Интерфейс чата
│       │   │   └── ThemeToggle.tsx   # Переключатель темы
│       │   └── services/
│       │       └── api.ts            # HTTP клиент
│       └── index.html
```

## Технологический стек

### Backend
- **Node.js** + **Express** - веб-сервер
- **TypeScript** - типизация
- **Multer** - загрузка файлов
- **PDF-parse** + **Mammoth** - парсинг PDF и DOCX
- **OpenAI SDK** - интеграция с LLM API
- **JS-Tiktoken** - токенизация текста
- **UUID** - генерация идентификаторов

### Frontend
- **React 18** - UI фреймворк
- **TypeScript** - типизация
- **Vite** - сборщик
- **React-Dropzone** - drag & drop загрузка
- **React-Markdown** + **Remark-GFM** - рендеринг Markdown
- **CSS-in-JS** - стилизация (inline styles)

### AI/ML компоненты
- **LLM**: Qwen/Qwen3-VL-8B (или любая OpenAI-compatible модель)
- **Embeddings**: text-embedding-qwen3-embedding-0.6b
- **Vector Store**: In-memory с косинусным сходством
- **Chunking**: 1024 токена с перекрытием 100 токенов

## Принцип работы RAG

### 1. Загрузка и обработка документов

```
Пользователь загружает файл (PDF/DOCX/TXT)
    ↓
Сервер сохраняет файл в ./data/uploads/
    ↓
DocumentProcessor извлекает текст
    ↓
ChunkingService разбивает текст на чанки (1024 токена)
    ↓
EmbeddingService генерирует векторы для каждого чанка
    ↓
VectorStore сохраняет чанки с эмбеддингами (JSON)
    ↓
DocumentStore сохраняет метаданные документа
```

### 2. Поиск релевантного контекста

```
Пользователь задает вопрос в чате
    ↓
Генерация эмбеддинга для вопроса
    ↓
Косинусное сходство с векторами в хранилище
    ↓
Выбор топ-5 наиболее релевантных чанков
    ↓
Формирование контекста из найденных чанков
```

### 3. Генерация ответа

```
Системный промпт + контекст из документов + история чата + вопрос
    ↓
Отправка в LLM API (streaming)
    ↓
Потоковая передача ответа клиенту (SSE)
    ↓
Рендеринг Markdown в интерфейсе
```

## API Endpoints

### Документы
- `POST /api/upload` - загрузка файла
- `GET /api/documents` - список документов
- `DELETE /api/documents/:id` - удаление документа

### Чат
- `POST /api/chat` - отправка сообщения (SSE streaming)
  - Request: `{ message: string, history: ChatMessage[] }`
  - Response: Server-Sent Events с типами:
    - `sources` - найденные источники
    - `chunk` - часть ответа
    - `done` - завершение
    - `error` - ошибка

## Безопасность

### Аутентификация
- Простая HTTP Basic Auth
- Сохранение в localStorage
- Защита роутов на клиенте

### Сетевая безопасность
- Локальные порты (3000, 5173) недоступны извне
- Внешний доступ через Cloudflare Tunnel (HTTPS)
- Временные URL туннеля

## Конфигурация

### server/src/config.ts
```typescript
{
  lmStudio: {
    baseURL: process.env.LM_STUDIO_URL || 'http://localhost:1235/v1',
    llmModel: process.env.LLM_MODEL || 'qwen/qwen3-vl-8b',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-qwen3-embedding-0.6b'
  },
  server: {
    port: 3000,
    uploadDir: './data/uploads'
  },
  vectorDB: {
    path: './data/chromadb',
    tableName: 'documents'
  },
  chunking: {
    chunkSize: 1024,
    overlap: 100
  }
}
```

## Функциональные возможности

### Реализованные фичи

1. **Загрузка документов**
   - Поддержка PDF, DOC, DOCX, TXT
   - Drag & drop интерфейс
   - Прогресс загрузки

2. **Управление документами**
   - Просмотр списка
   - Удаление с подтверждением
   - Отображение размера и даты

3. **Чат с AI**
   - Streaming ответы
   - Markdown рендеринг (заголовки, списки, код, таблицы)
   - История диалога
   - Отображение источников

4. **Темизация**
   - Темная/светлая тема
   - Сохранение в localStorage
   - Плавные переходы

5. **Адаптивность**
   - Desktop (2 колонки)
   - Tablet (1-2 колонки)
   - Mobile (1 колонка)

## Запуск системы

### Требования
- macOS / Linux / Windows 10/11
- Node.js LTS
- LM Studio с запущенным API
- (Опционально) cloudflared для внешнего доступа

Проверка окружения:

```bash
node -v
npm -v
```

### Запуск на macOS/Linux

Откройте два терминала.

Терминал 1 (сервер):

```bash
cd /Users/semen/RAG/rag-app/server
npm install
npm run dev
```

Терминал 2 (клиент):

```bash
cd /Users/semen/RAG/rag-app/client
npm install
npm run dev
```

После запуска откройте:

```text
http://localhost:5173
```

Проверка сервера:

```text
http://localhost:3000/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

### Туннель (опционально)

```bash
cloudflared tunnel --url http://localhost:5173
```

### Запуск на Windows

```powershell
cd C:\Users\<username>\RAG\rag-app\server
npm install
npm run dev

cd C:\Users\<username>\RAG\rag-app\client
npm install
npm run dev
```

Для Windows команда туннеля:

```powershell
cloudflared.exe tunnel --url http://localhost:5173
```

### Частые проблемы на macOS

1. `npm: command not found`
   - Установите Node.js LTS и перезапустите Terminal.

2. `EACCES` в `~/.npm`
   - Исправьте права и повторите установку зависимостей:

```bash
sudo chown -R "$(id -u):$(id -g)" ~/.npm
```

3. `Cannot find module @rollup/rollup-darwin-arm64`
   - Переустановите зависимости клиента:

```bash
cd /Users/semen/RAG/rag-app/client
rm -rf node_modules package-lock.json
npm install
```
