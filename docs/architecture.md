# Architecture
- **Web (React)** talks to **API (Express)** via REST/WebSocket.
- **API** authenticates with JWT, persists to Firestore, proxies to **Inference (FastAPI)**.
- **Inference** runs RAG: BM25 + Vector + RRF (+ optional cross-encoder).
- **Storage**: FAISS index + meta.jsonl on persistent volume.
- **Deploy**: docker-compose local, Cloud Run, or GKE.
