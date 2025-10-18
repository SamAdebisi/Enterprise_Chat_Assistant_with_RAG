# API Reference

## Overview

This document provides comprehensive API reference for the Enterprise Chat Assistant with RAG system.

## Base URLs

- **Local Development**: `http://localhost:8080`
- **Production**: Configured via environment variables

## Authentication

All API endpoints (except `/health` and `/auth/login`) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health Check

#### `GET /health`

Check the health status of the API service.

**Response:**
```json
{
  "ok": true,
  "timestamp": 1640995200.123
}
```

**Status Codes:**
- `200 OK` - Service is healthy

---

### Authentication

#### `POST /auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "user123",
    "email": "user@company.com",
    "roles": ["sales", "engineering"]
  }
}
```

**Status Codes:**
- `200 OK` - Authentication successful
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Malformed request

#### `POST /auth/seed`

Seed demo users for development (disabled in production).

**Response:**
```json
{
  "ok": true
}
```

**Status Codes:**
- `200 OK` - Users seeded successfully

---

### Chat

#### `POST /chat/ask`

Ask a question to the RAG system.

**Request Body:**
```json
{
  "question": "What is the company policy on remote work?",
  "chatId": "optional-chat-id"
}
```

**Response:**
```json
{
  "chatId": "chat_user123_1640995200",
  "answer": "Based on the company handbook, remote work is allowed up to 3 days per week...",
  "sources": [
    {
      "title": "Employee Handbook",
      "score": 0.95,
      "path": "/docs/handbook.pdf",
      "roles": ["all"]
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Question answered successfully
- `400 Bad Request` - Invalid question (empty or too long)
- `401 Unauthorized` - Missing or invalid token
- `502 Bad Gateway` - Inference service unavailable

**Validation:**
- Question must be between 1-1000 characters
- Question cannot be empty or only whitespace

---

### Documents

#### `POST /documents/upload`

Upload and index a document for RAG.

**Request:** `multipart/form-data`

**Form Fields:**
- `file` (required): The document file
- `roles` (optional): Comma-separated list of roles (default: "all")

**Supported File Types:**
- PDF (`.pdf`)
- Word documents (`.docx`)
- Markdown (`.md`, `.markdown`)
- Plain text (`.txt`)

**File Size Limit:** 10MB

**Response:**
```json
{
  "ok": true,
  "index": {
    "ok": true,
    "chunks": 15,
    "duration": 2.34
  }
}
```

**Status Codes:**
- `200 OK` - Document uploaded and indexed successfully
- `400 Bad Request` - Invalid file type, size, or content
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Indexing failed

**Validation:**
- File size must be ≤ 10MB
- File type must be supported
- File must contain extractable text content

---

## WebSocket Events

The API also supports real-time communication via WebSocket connections.

### Connection

Connect to the WebSocket at: `ws://localhost:8080`

### Events

#### `typing`
Emitted when the system starts processing a question.

**Payload:**
```json
{
  "chatId": "chat_user123_1640995200"
}
```

#### `answer`
Emitted when an answer is ready.

**Payload:**
```json
{
  "chatId": "chat_user123_1640995200",
  "answer": "Based on the company handbook...",
  "sources": [...]
}
```

#### `error`
Emitted when an error occurs during processing.

**Payload:**
```json
{
  "chatId": "chat_user123_1640995200",
  "error": "Inference service unavailable"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "requestId": "req-12345"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Route not found
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Upstream service error

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production deployments.

---

## Request/Response Headers

### Request Headers

- `Authorization: Bearer <token>` - Required for authenticated endpoints
- `Content-Type: application/json` - For JSON requests
- `Content-Type: multipart/form-data` - For file uploads

### Response Headers

- `X-Request-ID: <uuid>` - Unique request identifier
- `Content-Type: application/json` - For JSON responses

---

## Examples

### Complete Chat Flow

1. **Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@company.com", "password": "pass1234"}'
```

2. **Ask Question:**
```bash
curl -X POST http://localhost:8080/chat/ask \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the company policy on remote work?"}'
```

3. **Upload Document:**
```bash
curl -X POST http://localhost:8080/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@handbook.pdf" \
  -F "roles=sales,hr"
```

### WebSocket Example (JavaScript)

```javascript
const socket = io('http://localhost:8080');

socket.on('typing', (data) => {
  console.log('System is typing...', data.chatId);
});

socket.on('answer', (data) => {
  console.log('Answer received:', data.answer);
  console.log('Sources:', data.sources);
});

socket.on('error', (data) => {
  console.error('Error:', data.error);
});
```

---

## SDKs and Client Libraries

### JavaScript/TypeScript

```typescript
class ChatClient {
  constructor(private baseUrl: string, private token: string) {}
  
  async ask(question: string, chatId?: string) {
    const response = await fetch(`${this.baseUrl}/chat/ask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question, chatId })
    });
    return response.json();
  }
}
```

### Python

```python
import requests

class ChatClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def ask(self, question: str, chat_id: str = None):
        response = requests.post(
            f'{self.base_url}/chat/ask',
            headers=self.headers,
            json={'question': question, 'chatId': chat_id}
        )
        return response.json()
```

---

## Changelog

### v1.0.0
- Initial API release
- Basic chat functionality
- Document upload and indexing
- WebSocket support for real-time updates
- Role-based access control
