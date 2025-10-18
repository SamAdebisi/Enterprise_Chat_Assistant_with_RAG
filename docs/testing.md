# Testing Strategy

## Automated Suites

| Layer | Command | Coverage |
| ----- | ------- | -------- |
| API (Jest) | `npm --prefix apps/api test` | Route validation, auth, chat happy-path, upload proxying. |
| Inference (Pytest) | `pytest apps/inference/app/tests` | Chunking, FAISS indexing, retriever fusion, FastAPI health. |
| Ingestion CLI (Pytest) | `pytest workers/ingestion-cli/tests` *(add if extended)* | End-to-end chunking and embedding generation. |

> Tip: run `npm install` / `pip install -r requirements.txt` inside the respective packages before executing tests.

## Manual QA

- Follow the E2E checklist in `tests/e2e/chat_flow.md` after every major change.
- Smoke test the mobile client on iOS/Android simulators whenever API contracts change.
- Validate that role-based filtering works by asking the same question as `alice@company.com` (sales) vs. `bob@company.com` (engineering).

## Quality Gates

- **Linting** – Add ESLint for the API/web packages and Ruff/Black for inference when integrating into CI.
- **Type Safety** – TypeScript is compiled with `strict: true`. Do not suppress errors by casting to `any`; update types in `src/types.ts` or API clients instead.
- **Regression Benchmarks** – Maintain a prompt/answer fixture set once production data is available. Use it to compare citation accuracy and latency between releases.

## CI Recommendations

1. Install dependencies using `pnpm i --frozen-lockfile` (or npm/yarn as appropriate).
2. Run format/lint steps.
3. Execute API Jest suite and inference Pytest suite in parallel.
4. Build Docker images using the templates in `infra/docker/` to ensure manifests stay correct.
5. Publish coverage reports to the dashboard of choice.
