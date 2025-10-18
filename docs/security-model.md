# Security Model

## Identity & Access Management

- **Authentication** – Users sign in with email/password during pilots; production deployments should swap to SSO (e.g., Firebase Auth with SAML). On success the API issues a JWT containing `uid`, `email`, and `roles[]` claims.
- **Authorization** – Every retrieval call (`rag_query`) is filtered by role metadata before fusion. Metadata tags should mirror the organization’s RBAC model. Documents tagged with `all` remain globally visible.

## Data Protection

- **Transport** – All public endpoints should be fronted by HTTPS (Cloud Run or ingress controller). WebSockets inherit TLS from the same origin.
- **At Rest** –
  - Firestore handles encryption-at-rest for chat history.
  - Vector index (`meta.jsonl` + FAISS) and document corpus (`DOCS_DIR`) should be placed on encrypted disks (GCE persistent disks, Secrets Manager, or managed Filestore with CMEK).
  - Secrets are injected via Cloud Run environment variables or Kubernetes Secrets. The Terraform module in `infra/terraform` provisions Secret Manager entries for JWT and OpenAI keys.

## Auditing & Monitoring

- API logs include timestamps and request identifiers (extend `services/logger.ts` for centralized logging platforms).
- Firestore stores each chat turn with `FieldValue.serverTimestamp()` to support chronological audit trails.
- Incorporate Cloud Logging metrics to detect anomalous traffic (e.g., brute-force attempts on `/auth/login`).

## Hardening Recommendations

- Disable `/auth/seed` in non-development environments.
- Replace password auth with IdP integration and short-lived JWTs signed by a managed key service.
- Periodically purge `meta.jsonl` entries that no longer correspond to valid documents to avoid dangling data exposure.
- Use Web Application Firewall (Cloud Armor) to shield API and inference services from volumetric attacks.
