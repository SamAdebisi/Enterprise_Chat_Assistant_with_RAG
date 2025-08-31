# Enterprise Chat Assistant with RAG
Minimal, production-leaning reference for an intranet chatbot using RAG, role-aware answers, and scalable deployment.

## Services
- frontend/web: React + Vite
- frontend/mobile: Expo React Native
- backend/api: Node.js Express API + JWT + socket.io + Firestore
- backend/inference: FastAPI RAG + FAISS + sentence-transformers + OpenAI
- backend/ingestion: CLI for batch indexing
- backend/graph: Optional Neo4j loader

## Quickstart (local)
1) Copy env templates:
   cp .env.example .env
   cp backend/api/.env.example backend/api/.env
   cp backend/inference/.env.example backend/inference/.env
   cp backend/ingestion/.env.example backend/ingestion/.env
2) Put your Firebase service account JSON at backend/api/serviceAccount.json.
3) Set OPENAI_API_KEY in backend/inference/.env.
4) docker compose up --build
5) Web UI: http://localhost:5173  API: http://localhost:8080  Inference: http://localhost:8000

## First run
- Seed a user: POST http://localhost:8080/auth/seed (dangerous in prod).
- Upload a doc with roles: use Web UI “Upload” or POST /documents/upload with form-data: file, roles=["sales","all"].
- Ask a question in the chat.

## Cloud Run (one-liner after images exist)
./deployments/cloudrun/deploy.sh

## Testing
- Basic API ping: curl http://localhost:8080/health
- RAG health: curl http://localhost:8000/health