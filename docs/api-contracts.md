# API Contracts

All endpoints are served from the Express API (`apps/api`). The OpenAPI-style snippets below document payloads and HTTP status codes. Clients should additionally listen on the Socket.IO namespace for realtime events:

- `typing` – Emitted with `{ chatId }` when inference begins streaming.
- `answer` – Emitted with `{ chatId, answer, sources[] }` once the assistant turn is available.
- `error` – Emitted with `{ chatId, error }` when inference fails (HTTP response mirrors the message).

## Authentication

### `POST /auth/login`

| Aspect     | Details |
| ---------- | ------- |
| Body       | `{ "email": string, "password": string }`
| Success    | `200 OK` with `{ "token": string, "user": { uid, email, roles[] } }`
| Errors     | `401` invalid credentials, `400` malformed payload |

Use the returned JWT in the `Authorization: Bearer <token>` header for subsequent calls. Tokens expire after 12h by default.

### `POST /auth/seed`

Seeds two demo users (sales + engineering) for local development. **Disabled in hardened deployments.** Returns `{ ok: true }`.

## Chat

### `POST /chat/ask`

| Aspect     | Details |
| ---------- | ------- |
| Headers    | `Authorization: Bearer <token>` |
| Body       | `{ "question": string, "chatId"?: string }` |
| Success    | `200 OK` with `{ chatId, answer, sources[] }` |
| Validation | `400` if `question` is empty |
| Upstream   | `502` when inference service returns an error |

- `chatId` is optional; reuse it to continue a conversation thread. When omitted, the API generates `chat_<uid>_<timestamp>`.
- `sources[]` entries have `{ title, path?, roles[], score? }` to surface citations in clients.

## Document Ingestion

### `POST /documents/upload`

| Aspect     | Details |
| ---------- | ------- |
| Headers    | `Authorization: Bearer <token>` |
| Body       | `multipart/form-data` with `file` (single document) and `roles` (comma-separated, defaults to `all`) |
| Success    | `200 OK` with `{ ok: true, index: { ok: true, chunks: number } }` |
| Errors     | `400` missing file, `502` inference ingest failure |

Uploads stream to the inference service, which writes content to `DOCS_DIR` and churns embeddings via `add_chunks`. The API removes the temporary upload once forwarding succeeds.

## Health Checks

### `GET /health`
Returns `{ ok: true }` and is used by Docker healthchecks, k8s probes, and smoke tests.
