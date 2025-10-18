# Architecture

Refer to `docs/diagrams/system-context.drawio` for the annotated system context diagram.

## High-Level Components

- **Clients** – The web Vite app and Expo mobile shell authenticate users, stream chat updates over Socket.IO, and provide document upload UX. Both clients share the REST contract documented in `docs/api-contracts.md`.
- **API Layer (Node.js/Express)** – Terminates JWT authentication, enforces payload validation (`zod`), fans out questions to the inference service, and persists chat turns to Firestore. The same process hosts the Socket.IO gateway to push typing and answer events back to clients.
- **Inference Service (FastAPI)** – Owns retrieval augmented generation. It combines FAISS vector search with BM25 keyword retrieval, merges results with reciprocal rank fusion, optionally reranks with a cross encoder, and finally calls OpenAI for grounded answers.
- **Persistence** – Vector embeddings and metadata live on a filesystem mount (`INDEX_DIR`). Uploaded source documents are stored under `DOCS_DIR`. Firestore keeps user profiles and chat transcripts, while optional Neo4j ingestion builds a visibility graph.

## Request Lifecycle

1. **User asks a question** in the client. WebSockets emit a `typing` indicator immediately.
2. **API validates payload & roles**, persists the user turn, and forwards the request to inference with the user’s role claims.
3. **Inference retrieves context** via hybrid search (`faiss.IndexFlatIP` and BM25). Metadata filtering ensures only documents tagged with the user’s roles are considered.
4. **LLM generation** uses a guarded system prompt that mandates citations. The result contains the composed answer and normalized source metadata.
5. **API persists and broadcasts** the assistant turn, updates Firestore, and replies to the waiting HTTP client. Socket.IO broadcasts mirror the REST response so clients without open HTTP connections still receive updates.

## Deployment Footprint

- **Local** – `docker-compose` spins up API, inference, and web (plus optional Neo4j). Scripts in `scripts/` manage lifecycle and health checks.
- **Cloud Run** – `deployments/cloudrun/deploy.sh` builds containers, deploys inference first, captures the service URL, and wires environment variables (JWT secret, OpenAI key, CORS origin).
- **Kubernetes** – Manifests under `deployments/k8s/` provision Deployments and Services for each workload; a StatefulSet or CSI volume should back `INDEX_DIR` for persistence. See `docs/diagrams/deploy-cloudrun-k8s.drawio` for a side-by-side view.

## Extensibility Hooks

- Retrieval strategies are encapsulated in `apps/inference/app/retriever.py`; pluggable scoring allows experimentation with alternative signal fusion.
- The web app relies on `src/api/client.ts` so new routes can be added centrally without touching each component.
- Vector ingest happens both through the API (single-file uploads) and the ingestion CLI for batch workflows; both share chunking logic.
