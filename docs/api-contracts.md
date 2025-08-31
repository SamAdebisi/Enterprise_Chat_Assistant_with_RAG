# API Contracts

## POST /auth/login
Body: `{ email, password }` → `{ token, user }`

## POST /chat/ask
Headers: `Authorization: Bearer <jwt>`
Body: `{ question, chatId? }` → `{ chatId, answer, sources[] }`

## POST /documents/upload
Form-data: `file`, `roles="all,sales"`
→ `{ ok: true, index: { chunks } }`

## GET /health
→ `{ ok: true }`
