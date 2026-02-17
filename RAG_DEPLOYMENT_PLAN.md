# План развертывания RAG на корпоративной инфраструктуре (Linux + Docker/Compose + Kubernetes)

## Рекомендуемый подход

- Сохранить текущий стек: React + Node/Express.
- Убрать зависимость от LM Studio и перейти на автономные OpenAI-compatible сервисы в инфраструктуре.
- Заменить in-memory/JSON векторное хранилище на production-решение (Qdrant или Postgres + pgvector).
- Внедрить корпоративную аутентификацию и авторизацию (SSO + ACL).

---

## Целевая архитектура

- `rag-ui` (статический фронт) через Ingress (`/rag`)
- `rag-api` (Node/Express) через Ingress (`/rag/api`)
- `openai-gateway` (Nginx/Envoy):
  - `/v1/chat/completions` -> `llm` (vLLM/TGI/llama.cpp server)
  - `/v1/embeddings` -> `embeddings` (TEI/отдельный vLLM)
- `vector-db`:
  - Qdrant (предпочтительно для быстрого старта), либо
  - Postgres + pgvector (если Postgres корпоративный стандарт)
- `metadata-db`: Postgres (документы, ACL, статусы)
- `object-storage`: MinIO/S3 (оригиналы файлов)
- Опционально: `ingest-worker` + очередь (Redis/RabbitMQ), `Tika/OCR` для сканов

---

## Этапы внедрения

## Этап 1 - Пилот в Kubernetes

1. Развернуть:
   - `rag-ui`, `rag-api`, `llm`, `embeddings`, `openai-gateway`
2. Подключить `rag-api` к gateway:
   - `LM_STUDIO_URL=http://openai-gateway:PORT/v1`
   - `LLM_MODEL`, `EMBEDDING_MODEL` через env
3. Настроить Ingress:
   - TLS
   - поддержка SSE (streaming chat)
   - upload size / timeout

---

## Этап 2 - Безопасность (обязательно до промышленного запуска)

1. Удалить клиентскую псевдо-авторизацию (`localStorage admin/admin`)
2. Подключить SSO (OIDC/SAML через корпоративный IdP)
3. Внедрить ACL:
   - метки доступа на документ/чанк
   - фильтрация retrieval по группам пользователя
4. Добавить аудит:
   - кто загружал/спрашивал/какие источники использовались

---

## Этап 3 - Данные и масштабирование

1. Миграция с JSON vector store на Qdrant/pgvector
2. Разделение хранения:
   - файлы -> S3/MinIO
   - метаданные -> Postgres
   - эмбеддинги -> vector-db
3. Асинхронный ingestion:
   - `POST /upload` возвращает `jobId`
   - обработка документов в worker
   - frontend показывает статусы

---

## Этап 4 - Качество RAG

1. Тюнинг chunking/top-k/контекста
2. Опционально добавить reranker
3. Внедрить контроль качества:
   - latency
   - answer groundedness
   - доля ответов с корректными источниками

---

## Задачи DevOps

- GPU-инфраструктура в Kubernetes:
  - NVIDIA device plugin
  - labels/taints для GPU-нод
  - requests/limits `nvidia.com/gpu`
- PVC/volumes для кешей моделей и данных
- Секреты:
  - DB credentials, storage keys, internal endpoints
- Мониторинг:
  - liveness/readiness probes
  - базовые метрики и алерты для `rag-api`, model-serving и vector-db

---

## Почему этот вариант оптимален

- Минимум изменений в существующем коде (быстрый путь в корпоративный пилот)
- Соответствие вашей платформе (Linux + Docker/Compose + Kubernetes)
- Переход от "домашнего" прототипа к управляемому enterprise-сервису
- Возможность поэтапного развития без полной переписи на старте

---

## Следующее решение

Выбрать, где запускать LLM/embeddings:

1. Внутри Kubernetes на GPU-нодах (предпочтительно при наличии GPU в кластере)
2. На отдельном GPU-сервере (Docker/Compose), а k8s - для UI/API/DB

Оба сценария поддерживаются; для пилота обычно выбирают тот, где проще получить стабильный GPU-доступ.
