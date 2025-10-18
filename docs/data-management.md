# Data & Index Management

## Document Lifecycle

- Uploaded files are stored under `DOCS_DIR` with sanitized filenames.
- Metadata recorded in `meta.jsonl` includes `roles`, enabling downstream ACL enforcement.
- To remove a document:
  1. Delete the file from `DOCS_DIR`.
  2. Remove corresponding entries from `meta.jsonl` (or rebuild the index using the ingestion CLI).
  3. Optionally delete associated chat transcripts from Firestore.

## Ingestion CLI

Located in `workers/ingestion-cli/`.

```bash
python ingest.py --docs ./seed_files --index ./data/index --roles sales,engineering
```

- Produces `index.faiss` and `meta.jsonl` consistent with the inference service.
- Use this for bulk backfills or scheduled reingestion tasks.

## Neo4j Loader

`workers/neo4j-loader/load_graph.py` populates a relationship graph for governance or analytics.

```bash
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USER=neo4j \
NEO4J_PASSWORD=pass \
python load_graph.py
```

Each document becomes a `Document` node connected via `VISIBLE_TO` relationships to `Group` nodes built from the `roles` list.

## Index Maintenance Tips

- Periodically re-embed documents when models improve. Store embedding model version in metadata if you need to mix versions.
- For large corpora, consider sharding indexes per department to keep FAISS search latency low.
- Monitor `index.faiss` file size; sudden drops may indicate ingestion failures.

## Compliance Considerations

- Tag documents with the most restrictive role required.
- Maintain an audit log of uploads (`apps/api/src/routes/documents.ts` can emit to a SIEM after successful ingestion).
- If documents contain PII or financial data, integrate a DLP scan before accepting uploads.
