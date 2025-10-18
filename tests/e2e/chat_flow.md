# Chat Flow Checklist

1. Start services locally via `scripts/dev-up.sh` or `docker compose -f deployments/docker-compose.yml up`.
2. Seed demo accounts: `scripts/seed-demo.sh` (defaults to http://localhost:8080).
3. Log in to the web app as `alice@company.com` / `pass1234`.
4. Upload a document with restricted roles (e.g., `sales` only) and ensure indexing confirmation appears.
5. Ask a question permitted for the role you logged in with; verify:
   - Streaming “typing” indicator shows while inference runs.
   - Final response renders with citations matching uploaded documents.
   - Socket error banner remains hidden.
6. Repeat the question from a user with a different role to confirm access control (e.g., `bob@company.com` should not see `sales` documents).
7. Inspect Firestore for chat transcripts and vector index metadata to confirm persistence.
