# Operations Guide

## Runtime Monitoring

| Component | Health Endpoint | Suggested Probe | Notes |
| --------- | ---------------- | ---------------- | ----- |
| API       | `GET /health`    | Cloud Run/Ingress HTTP probe every 30s | Verify Firestore connectivity via periodic canary query. |
| Inference | `GET /health`    | Liveness probe every 20s | Alert if latency > 8 s P95 or if FAISS index size shrinks unexpectedly. |
| Web       | Static assets    | Synthetic check via `curl` | Validate build hash header matches CI output. |

- Use Cloud Logging or Prometheus scrapers for request latency, error rate, and upload volume.
- Enable OpenAI usage alerts to monitor token consumption.

## Scaling & Performance

- **API instances** – Scale between 0–3 on Cloud Run. CPU-bound spikes usually come from document uploads; consider moving ingestion to a background worker if throughput increases.
- **Inference** – Provision ≥2 vCPUs and 2Gi memory. Warm caches by issuing a dummy query at deploy time to prime embeddings.
- **Vector Index** – When running on Kubernetes, mount a persistent volume (SSD class recommended). Rebuild the BM25 corpus nightly if documents churn heavily.

## Backups & Recovery

- **Firestore** – Configure automatic exports to GCS or use the Firestore managed backup feature.
- **Vector index** – Snapshot the `meta.jsonl` and `index.faiss` files to object storage after each ingestion batch. The ingestion CLI can rebuild from raw documents if snapshots are unavailable.
- **Documents** – Treat `DOCS_DIR` as the system of record for uploaded knowledge. Mirror to a cloud bucket with lifecycle rules.

## Runbooks

1. **Inference errors (502)**
   - Check Cloud Run logs for OpenAI quota errors.
   - Validate that `OPENAI_API_KEY` is set and has remaining credits.
   - Restart the inference service to rebuild the FAISS index if corrupt.
2. **Users missing documents**
   - Confirm document roles include the user’s role.
   - Inspect `meta.jsonl` for the document entry; re-upload if missing.
   - Use Neo4j loader to visualize role visibility edges for debugging.
3. **Slow responses**
   - Profile retrieval by enabling the optional cross-encoder only for top-N requests.
   - Increase `TOP_K` cautiously; too large values slow down LLM prompts.

## Configuration Matrix

| Environment | Auth Mode | Storage | Notes |
| ----------- | --------- | ------- | ----- |
| Local       | Password/JWT | Host bind mounts under `data/` | Ideal for quick experimentation. |
| Staging     | Firebase Auth (SAML) | Managed Filestore | Mirror production topology with smaller quotas. |
| Production  | SSO + short-lived JWT | GCS + Firestore backups | Enforce WAF and secret rotation.
