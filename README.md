# Enterprise_Chat_Assistant_with_RAG
Minimal, production-leaning reference for an intranet chatbot using RAG, role-aware answers, and scalable deployment.

## Services
- apps/web: React + Vite
- apps/mobile: Expo React Native
- apps/api: Node.js Express API + JWT + socket.io + Firestore
- apps/inference: FastAPI RAG + FAISS + sentence-transformers + OpenAI
- workers/ingestion-cli: CLI for batch indexing
- workers/neo4j-loader: Optional Neo4j loader

## Quickstart (local)
1) Copy env templates:
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/inference/.env.example apps/inference/.env
   cp workers/ingestion-cli/.env.example workers/ingestion-cli/.env

2) Put your Firebase service account JSON at apps/api/serviceAccount.json.
3) Set OPENAI_API_KEY in apps/inference/.env.
4) Start:
```bash 
   docker compose -f deployments/docker-compose.yml up --build
```

5) Web UI: http://localhost:5173  API: http://localhost:8080  Inference: http://localhost:8000

## First run
- Seed a user: POST http://localhost:8080/auth/seed (disable in prod).
- Upload a doc with roles: use Web UI “Upload” or POST /documents/upload with form-data: file, roles=["sales","all"].
- Ask a question in the chat.

## Cloud Run (one-liner after images exist)
   ```bash 
   ./deployments/cloudrun/deploy.sh
   ```

## Testing
- Basic API ping: curl http://localhost:8080/health
- RAG health: curl http://localhost:8000/health
