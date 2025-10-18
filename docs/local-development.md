# Local Development Handbook

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop (for containerized stack)
- `pnpm` *(optional but recommended for workspaces)*

## Install Dependencies

```bash
pnpm install --recursive
pip install -r apps/inference/requirements.txt
```

## Running Services Locally

### Docker Compose (recommended)

```bash
scripts/dev-up.sh
scripts/wait-for.sh http://localhost:8080/health
scripts/wait-for.sh http://localhost:8000/health
```

Visit the web UI at http://localhost:5173 and seed demo users via `scripts/seed-demo.sh`.

### Manual Processes

- **API**
  ```bash
  cd apps/api
  npm install
  npm run dev
  ```
- **Inference**
  ```bash
  cd apps/inference
  pip install -r requirements.txt
  uvicorn app.main:app --reload
  ```
- **Web**
  ```bash
  cd apps/web
  npm install
  npm run dev -- --host
  ```

## Environment Variables

Copy `.env.example` files in the root services:

```bash
cp .env.example .env             # root orchestrator
cp apps/api/.env.example apps/api/.env
cp apps/inference/.env.example apps/inference/.env
```

Set `OPENAI_API_KEY` before launching inference. For local experiments you can stub the LLM by monkeypatching `llm.generate` during tests.

## Data Directories

Local runs write to `data/`:

- `data/docs` – Uploaded documents.
- `data/index` – FAISS index + metadata.

Mounts are shared between API and inference in Docker. Remove individual files to trigger reingestion.

## Frontend Tooling

- TypeScript strict mode is enabled; run `npm run build` to catch type issues.
- Socket.IO connects automatically; no manual configuration required during development.
- Use React DevTools and `vite --host` for LAN testing on physical devices.

## Troubleshooting

- **Socket connection fails** – Ensure `VITE_API_BASE` points to the API host and that firewalls allow port 8080.
- **Inference import errors** – Install system dependencies (`build-essential`) or run inside Docker where they’re preinstalled.
- **OpenAI quota** – Use the `fake_generate` monkeypatch in tests or set `OPENAI_API_KEY` to a valid key.
