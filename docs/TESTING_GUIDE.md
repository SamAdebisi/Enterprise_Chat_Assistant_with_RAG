# Testing Guide

This guide provides comprehensive information about testing the Enterprise Chat Assistant with RAG system.

## Table of Contents

- [Test Overview](#test-overview)
- [Test Setup](#test-setup)
- [API Testing](#api-testing)
- [Inference Service Testing](#inference-service-testing)
- [Frontend Testing](#frontend-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Performance Testing](#performance-testing)
- [Test Data Management](#test-data-management)
- [CI/CD Integration](#cicd-integration)

## Test Overview

The project includes multiple layers of testing:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Service interaction testing
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load and stress testing

## Test Setup

### Prerequisites

```bash
# Install Node.js dependencies
npm install --legacy-peer-deps

# Install Python dependencies
cd apps/inference
pip install -r requirements.txt
pip install pytest pytest-cov

# Install additional test dependencies
pip install pytest-mock pytest-asyncio
```

### Environment Configuration

Create test environment files:

```bash
# .env.test
NODE_ENV=test
DEBUG=true

# apps/api/.env.test
JWT_SECRET=test-jwt-secret
CORS_ORIGIN=http://localhost:3000
INFERENCE_BASE_URL=http://localhost:8000
FIREBASE_PROJECT_ID=test-project

# apps/inference/.env.test
OPENAI_API_KEY=sk-test-key
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
INDEX_DIR=/tmp/test-index
DOCS_DIR=/tmp/test-docs
```

## API Testing

### Unit Tests

```typescript
// apps/api/tests/services/logger.spec.ts
import { logger } from '../src/services/logger';

describe('Logger Service', () => {
  it('should log info messages', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
// apps/api/tests/integration/chat.spec.ts
import request from 'supertest';
import { createServer } from '../src/server';

describe('Chat Integration', () => {
  let app: any;
  let token: string;

  beforeEach(async () => {
    const { app: serverApp } = createServer();
    app = serverApp;
    
    // Setup test user and get token
    token = await getTestToken();
  });

  it('should handle complete chat flow', async () => {
    const response = await request(app)
      .post('/chat/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'What is AI?' });
    
    expect(response.status).toBe(200);
    expect(response.body.answer).toBeDefined();
  });
});
```

### Running API Tests

```bash
# Run all API tests
cd apps/api
npm test

# Run specific test file
npm test -- tests/chat.spec.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Inference Service Testing

### Unit Tests

```python
# apps/inference/app/tests/test_llm.py
import pytest
from unittest.mock import patch, MagicMock
from app.llm import generate

class TestLLMGeneration:
    @patch('app.llm.client')
    def test_successful_generation(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test answer"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = generate("What is AI?", "Context about AI")
        
        assert result == "Test answer"
```

### Integration Tests

```python
# apps/inference/app/tests/test_main.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True

def test_rag_query():
    response = client.post("/rag/query", json={
        "question": "What is AI?",
        "roles": ["sales"]
    })
    assert response.status_code == 200
    assert "answer" in response.json()
```

### Running Inference Tests

```bash
# Run all Python tests
cd apps/inference
python -m pytest app/tests/ -v

# Run with coverage
python -m pytest app/tests/ --cov=app --cov-report=html

# Run specific test file
python -m pytest app/tests/test_llm.py -v

# Run with environment variables
OPENAI_API_KEY=sk-test python -m pytest app/tests/ -v
```

## Frontend Testing

### Component Tests

```typescript
// apps/web/src/components/__tests__/ChatInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  it('should render input field', () => {
    render(<ChatInput onSend={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should call onSend when form is submitted', () => {
    const mockOnSend = jest.fn();
    render(<ChatInput onSend={mockOnSend} />);
    
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Test message' }
    });
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });
});
```

### API Client Tests

```typescript
// apps/web/src/api/__tests__/client.test.ts
import { chatApi } from '../client';
import { mockAxios } from '../../__mocks__/axios';

describe('Chat API Client', () => {
  it('should send chat request', async () => {
    mockAxios.post.mockResolvedValue({
      data: { answer: 'Test answer', sources: [] }
    });

    const result = await chatApi.ask('What is AI?', 'token');
    
    expect(result.answer).toBe('Test answer');
    expect(mockAxios.post).toHaveBeenCalledWith('/chat/ask', {
      question: 'What is AI?'
    });
  });
});
```

### Running Frontend Tests

```bash
# Run React tests
cd apps/web
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Integration Testing

### API + Inference Integration

```typescript
// tests/integration/api-inference.spec.ts
import request from 'supertest';
import { createServer } from '../../apps/api/src/server';

describe('API + Inference Integration', () => {
  let apiApp: any;
  let inferenceApp: any;

  beforeAll(async () => {
    // Start inference service
    inferenceApp = await startInferenceService();
    
    // Start API service
    const { app } = createServer();
    apiApp = app;
  });

  it('should process chat request end-to-end', async () => {
    const response = await request(apiApp)
      .post('/chat/ask')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ question: 'What is AI?' });
    
    expect(response.status).toBe(200);
    expect(response.body.answer).toBeDefined();
    expect(response.body.sources).toBeDefined();
  });
});
```

### Database Integration

```typescript
// tests/integration/database.spec.ts
import { db } from '../../apps/api/src/services/firestore';

describe('Database Integration', () => {
  beforeEach(async () => {
    // Clear test data
    await clearTestData();
  });

  it('should save and retrieve chat turns', async () => {
    const chatId = 'test-chat-123';
    const turn = {
      role: 'user',
      content: 'Test message',
      uid: 'test-user',
      roles: ['sales']
    };

    await saveChatTurn(chatId, turn);
    const savedTurn = await getChatTurn(chatId);
    
    expect(savedTurn.content).toBe('Test message');
  });
});
```

## E2E Testing

### Playwright Setup

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('user can login and ask questions', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Login
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for chat interface
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    
    // Ask question
    await page.fill('[data-testid="question-input"]', 'What is AI?');
    await page.click('[data-testid="ask-button"]');
    
    // Wait for answer
    await expect(page.locator('[data-testid="answer"]')).toBeVisible();
    await expect(page.locator('[data-testid="sources"]')).toBeVisible();
  });

  test('user can upload documents', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Login and navigate to upload
    await login(page);
    
    // Upload file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('tests/fixtures/sample.pdf');
    
    await page.fill('[data-testid="roles-input"]', 'sales,engineering');
    await page.click('[data-testid="upload-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Install Playwright
npm install --save-dev @playwright/test
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test tests/e2e/chat.spec.ts
```

## Performance Testing

### Load Testing with Artillery

```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Chat Load Test"
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/chat/ask"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            question: "What is AI?"
```

### Running Performance Tests

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run tests/performance/load-test.yml

# Run with report
artillery run tests/performance/load-test.yml --output report.json
artillery report report.json
```

## Test Data Management

### Test Fixtures

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  sales: {
    email: 'sales@example.com',
    password: 'password',
    roles: ['sales']
  },
  engineering: {
    email: 'eng@example.com',
    password: 'password',
    roles: ['engineering']
  }
};

// tests/fixtures/documents.ts
export const testDocuments = {
  handbook: {
    filename: 'handbook.pdf',
    content: 'Company handbook content...',
    roles: ['all']
  },
  salesGuide: {
    filename: 'sales-guide.pdf',
    content: 'Sales guide content...',
    roles: ['sales']
  }
};
```

### Database Seeding

```typescript
// tests/helpers/seed.ts
export async function seedTestData() {
  // Create test users
  for (const user of testUsers) {
    await createUser(user);
  }
  
  // Upload test documents
  for (const doc of testDocuments) {
    await uploadDocument(doc);
  }
}

export async function clearTestData() {
  // Clear all test data
  await clearUsers();
  await clearDocuments();
  await clearChats();
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install --legacy-peer-deps
      - run: npm run test:api
        env:
          JWT_SECRET: test-secret
          FIREBASE_PROJECT_ID: test-project

  inference-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v3
        with:
          python-version: '3.9'
      - run: pip install -r apps/inference/requirements.txt
      - run: pip install pytest pytest-cov
      - run: python -m pytest apps/inference/app/tests/ -v
        env:
          OPENAI_API_KEY: sk-test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install --legacy-peer-deps
      - run: npm run build
      - run: npm run start:test &
      - run: npx playwright install
      - run: npx playwright test
```

### Docker Test Environment

```dockerfile
# tests/Dockerfile.test
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Install Playwright
RUN npx playwright install

CMD ["npm", "run", "test:e2e"]
```

## Test Reporting

### Coverage Reports

```bash
# Generate coverage reports
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Test Results

```bash
# Generate test report
npm run test -- --reporter=json --outputFile=test-results.json

# Generate JUnit report
npm run test -- --reporter=junit --outputFile=test-results.xml
```

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Keep tests independent** - no dependencies between tests
4. **Use setup/teardown** for test data management

### Mocking Strategy

1. **Mock external services** (OpenAI, Firebase)
2. **Use dependency injection** for testability
3. **Mock at the right level** - not too high, not too low
4. **Verify mock interactions** when important

### Test Data

1. **Use realistic test data** that matches production
2. **Keep test data minimal** - only what's needed
3. **Use factories** for generating test data
4. **Clean up after tests** to avoid interference

### Performance Considerations

1. **Run tests in parallel** when possible
2. **Use test databases** for integration tests
3. **Mock expensive operations** in unit tests
4. **Profile slow tests** and optimize

## Troubleshooting

### Common Issues

1. **Port conflicts**: Use different ports for test services
2. **Environment variables**: Ensure test env vars are set
3. **Database cleanup**: Clear test data between runs
4. **Async operations**: Use proper async/await patterns

### Debug Tips

```bash
# Run tests with debug output
npm test -- --verbose

# Run single test with debug
npm test -- --testNamePattern="specific test"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Pytest Documentation](https://docs.pytest.org/)
- [Testing Best Practices](https://testingjavascript.com/)

## Changelog

### v1.0.0
- Initial testing guide
- Unit, integration, and E2E test setup
- Performance testing guidelines
- CI/CD integration examples
