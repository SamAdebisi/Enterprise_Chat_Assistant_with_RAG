# Developer Guide

This guide provides comprehensive information for developers working on the Enterprise Chat Assistant with RAG system.

## Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Code Architecture](#code-architecture)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Inference Service Development](#inference-service-development)
- [Testing](#testing)
- [Code Style and Standards](#code-style-and-standards)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Contributing](#contributing)

## Project Structure

```
Enterprise_Chat_Assistant_with_RAG/
├── apps/
│   ├── api/                    # Node.js Express API
│   │   ├── src/
│   │   │   ├── config.ts       # Configuration
│   │   │   ├── index.ts        # Entry point
│   │   │   ├── server.ts       # Server setup
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   └── types.ts        # TypeScript types
│   │   ├── tests/              # Test files
│   │   └── package.json
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── api/            # API client
│   │   │   └── types.ts        # TypeScript types
│   │   └── package.json
│   ├── mobile/                 # React Native app
│   └── inference/              # Python FastAPI service
│       ├── app/
│       │   ├── main.py         # FastAPI app
│       │   ├── rag.py          # RAG implementation
│       │   ├── llm.py          # LLM integration
│       │   ├── store.py        # Vector store
│       │   ├── retriever.py    # Hybrid retrieval
│       │   └── tests/          # Test files
│       └── requirements.txt
├── docs/                       # Documentation
├── infra/                      # Infrastructure code
├── scripts/                    # Utility scripts
└── tests/                      # Integration tests
```

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker 20.10+
- Git

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Enterprise_Chat_Assistant_with_RAG
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install
   
   # Install API dependencies
   cd apps/api && npm install && cd ../..
   
   # Install web dependencies
   cd apps/web && npm install && cd ../..
   
   # Install inference dependencies
   cd apps/inference && pip install -r requirements.txt && cd ../..
   ```

3. **Configure environment**:
   ```bash
   # Copy environment files
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/inference/.env.example apps/inference/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. **Set up Firebase**:
   - Create a Firebase project
   - Enable Firestore
   - Download service account key as `apps/api/serviceAccount.json`

5. **Start development servers**:
   ```bash
   # Start all services
   npm run dev
   
   # Or start individually
   npm run dev:api      # API server
   npm run dev:web       # Web frontend
   npm run dev:inference # Inference service
   ```

## Code Architecture

### API Service (Node.js/Express)

The API service follows a layered architecture:

```
┌─────────────────┐
│   Routes        │ ← HTTP endpoints
├─────────────────┤
│   Middleware    │ ← Authentication, logging, validation
├─────────────────┤
│   Services      │ ← Business logic
├─────────────────┤
│   Data Layer    │ ← Firestore, external APIs
└─────────────────┘
```

**Key Components:**

- **Routes**: Handle HTTP requests and responses
- **Middleware**: Authentication, logging, error handling
- **Services**: Business logic for chat, documents, auth
- **Data Layer**: Firestore integration, external API calls

**Example Route Structure:**
```typescript
// apps/api/src/routes/chat.ts
export default (io: Server) => {
  const router = Router();
  
  router.post("/ask", requireAuth, async (req, res) => {
    // Route logic
  });
  
  return router;
};
```

### Web Frontend (React/TypeScript)

The frontend uses React with TypeScript and follows component-based architecture:

```
┌─────────────────┐
│   Pages         │ ← Route components
├─────────────────┤
│   Components    │ ← Reusable UI components
├─────────────────┤
│   API Client    │ ← HTTP client
├─────────────────┤
│   Services      │ ← Business logic
└─────────────────┘
```

**Key Components:**

- **Pages**: Route-level components (Login, Chat)
- **Components**: Reusable UI components (Message, ChatInput)
- **API Client**: HTTP client for backend communication
- **Services**: Business logic and state management

### Inference Service (Python/FastAPI)

The inference service handles RAG operations:

```
┌─────────────────┐
│   FastAPI App   │ ← HTTP endpoints
├─────────────────┤
│   RAG Pipeline  │ ← Answer generation
├─────────────────┤
│   Retrieval     │ ← Document retrieval
├─────────────────┤
│   Vector Store  │ ← Embedding storage
└─────────────────┘
```

**Key Components:**

- **FastAPI App**: HTTP endpoints and request handling
- **RAG Pipeline**: Question answering with context
- **Retrieval**: Hybrid search (vector + keyword)
- **Vector Store**: FAISS index for embeddings

## API Development

### Adding New Endpoints

1. **Create route file**:
   ```typescript
   // apps/api/src/routes/new-feature.ts
   import { Router } from "express";
   import { requireAuth } from "../middleware/auth.js";
   
   const router = Router();
   
   router.get("/endpoint", requireAuth, async (req, res) => {
     // Implementation
   });
   
   export default router;
   ```

2. **Register route**:
   ```typescript
   // apps/api/src/server.ts
   import newFeature from "./routes/new-feature.js";
   
   app.use("/new-feature", newFeature);
   ```

3. **Add tests**:
   ```typescript
   // apps/api/tests/new-feature.spec.ts
   describe("New Feature", () => {
     it("should handle requests", async () => {
       // Test implementation
     });
   });
   ```

### Middleware Development

```typescript
// apps/api/src/middleware/validation.ts
import { Request, Response, NextFunction } from "express";

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validation logic
    next();
  };
};
```

### Service Development

```typescript
// apps/api/src/services/new-service.ts
export class NewService {
  async processData(data: any): Promise<any> {
    // Business logic
  }
}
```

## Frontend Development

### Component Development

```typescript
// apps/web/src/components/NewComponent.tsx
import React, { useState } from 'react';

interface NewComponentProps {
  title: string;
  onAction: (value: string) => void;
}

export default function NewComponent({ title, onAction }: NewComponentProps) {
  const [value, setValue] = useState('');
  
  return (
    <div>
      <h2>{title}</h2>
      <input 
        value={value} 
        onChange={(e) => setValue(e.target.value)} 
      />
      <button onClick={() => onAction(value)}>
        Submit
      </button>
    </div>
  );
}
```

### API Client Development

```typescript
// apps/web/src/api/new-feature.ts
import { apiClient } from './client';

export interface NewFeatureRequest {
  data: string;
}

export interface NewFeatureResponse {
  result: string;
}

export const newFeatureApi = {
  async processData(request: NewFeatureRequest): Promise<NewFeatureResponse> {
    const response = await apiClient.post('/new-feature/process', request);
    return response.data;
  }
};
```

### State Management

```typescript
// apps/web/src/hooks/useNewFeature.ts
import { useState, useEffect } from 'react';
import { newFeatureApi } from '../api/new-feature';

export function useNewFeature() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const processData = async (input: string) => {
    setLoading(true);
    try {
      const result = await newFeatureApi.processData({ data: input });
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, processData };
}
```

## Inference Service Development

### Adding New RAG Features

```python
# apps/inference/app/new_feature.py
from fastapi import APIRouter
from .schemas import NewFeatureRequest, NewFeatureResponse

router = APIRouter()

@router.post("/new-feature", response_model=NewFeatureResponse)
def new_feature_endpoint(request: NewFeatureRequest):
    # Implementation
    return NewFeatureResponse(result="processed")
```

### Custom Retrieval Methods

```python
# apps/inference/app/custom_retriever.py
from typing import List, Dict
from .store import VectorStore

class CustomRetriever:
    def __init__(self, store: VectorStore):
        self.store = store
    
    def custom_search(self, query: str, filters: Dict) -> List[Dict]:
        # Custom retrieval logic
        pass
```

### Model Integration

```python
# apps/inference/app/custom_model.py
from sentence_transformers import SentenceTransformer

class CustomModel:
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name)
    
    def encode(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts)
```

## Testing

### Unit Tests

```typescript
// apps/api/tests/services/chat.spec.ts
import { ChatService } from '../../src/services/chat';

describe('ChatService', () => {
  it('should process messages', async () => {
    const service = new ChatService();
    const result = await service.processMessage('Hello');
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// apps/api/tests/integration/chat-flow.spec.ts
import request from 'supertest';
import { createServer } from '../../src/server';

describe('Chat Flow', () => {
  it('should handle complete chat flow', async () => {
    const { app } = createServer();
    
    // Login
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    const token = loginResponse.body.token;
    
    // Ask question
    const chatResponse = await request(app)
      .post('/chat/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'What is AI?' });
    
    expect(chatResponse.status).toBe(200);
    expect(chatResponse.body.answer).toBeDefined();
  });
});
```

### E2E Tests

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('user can ask questions', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Login
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // Ask question
  await page.fill('[data-testid="question-input"]', 'What is AI?');
  await page.click('[data-testid="ask-button"]');
  
  // Wait for answer
  await expect(page.locator('[data-testid="answer"]')).toBeVisible();
});
```

## Code Style and Standards

### TypeScript/JavaScript

```typescript
// Use interfaces for type definitions
interface User {
  id: string;
  email: string;
  roles: string[];
}

// Use async/await for promises
async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// Use const assertions for immutable data
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = typeof ROLES[number];
```

### Python

```python
# Use type hints
from typing import List, Dict, Optional

def process_documents(docs: List[Dict[str, str]]) -> Optional[Dict[str, int]]:
    """Process documents and return statistics."""
    if not docs:
        return None
    
    return {
        'total': len(docs),
        'processed': len([d for d in docs if d.get('content')])
    }

# Use dataclasses for structured data
from dataclasses import dataclass

@dataclass
class Document:
    title: str
    content: str
    roles: List[str]
```

### Code Formatting

```bash
# JavaScript/TypeScript
npm run lint
npm run format

# Python
black apps/inference/
isort apps/inference/
flake8 apps/inference/
```

## Debugging

### API Debugging

```typescript
// Add debug logging
import { logger } from '../services/logger';

export const debugRoute = (req: Request, res: Response) => {
  logger.debug('Route called', { 
    method: req.method, 
    url: req.url,
    body: req.body 
  });
  
  // Implementation
};
```

### Frontend Debugging

```typescript
// Use React DevTools
import { useState, useEffect } from 'react';

export function DebugComponent() {
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    console.log('Component mounted', debugInfo);
  }, [debugInfo]);
  
  return <div>Debug info: {JSON.stringify(debugInfo)}</div>;
}
```

### Inference Service Debugging

```python
# Add debug logging
import logging

logger = logging.getLogger(__name__)

def debug_function(data):
    logger.debug(f"Processing data: {data}")
    
    try:
        result = process_data(data)
        logger.debug(f"Result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error processing data: {e}")
        raise
```

## Performance Optimization

### API Performance

```typescript
// Use connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Implement caching
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });

export const getCachedData = async (key: string) => {
  let data = cache.get(key);
  if (!data) {
    data = await fetchData(key);
    cache.set(key, data);
  }
  return data;
};
```

### Frontend Performance

```typescript
// Use React.memo for expensive components
import React, { memo } from 'react';

export const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Use useMemo for expensive calculations
import { useMemo } from 'react';

export function DataProcessor({ items }) {
  const processedData = useMemo(() => {
    return items.map(item => expensiveProcessing(item));
  }, [items]);
  
  return <div>{/* Render processed data */}</div>;
}
```

### Inference Performance

```python
# Use batch processing
def process_batch(texts: List[str], batch_size: int = 32) -> List[str]:
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_results = process_batch_items(batch)
        results.extend(batch_results)
    return results

# Use model caching
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_embedding(text: str) -> np.ndarray:
    return model.encode([text])[0]
```

## Contributing

### Git Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes**:
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. **Push and create PR**:
   ```bash
   git push origin feature/new-feature
   ```

### Code Review Process

1. **Self-review**: Check your code before submitting
2. **Run tests**: Ensure all tests pass
3. **Update documentation**: Update relevant docs
4. **Submit PR**: Create pull request with description

### Commit Message Format

```
type(scope): description

Examples:
feat(api): add new chat endpoint
fix(web): resolve login issue
docs(readme): update installation guide
test(inference): add unit tests for RAG
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Resources

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Architecture Overview](./architecture.md)

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)
- [Python Debugger](https://docs.python.org/3/library/pdb.html)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Support

For questions or issues:

1. Check existing documentation
2. Search existing issues
3. Create new issue with detailed description
4. Contact development team

## Changelog

### v1.0.0
- Initial developer guide
- Code architecture documentation
- Development setup instructions
- Testing guidelines
- Performance optimization tips
