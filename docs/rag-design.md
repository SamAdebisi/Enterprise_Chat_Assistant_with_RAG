# Retrieval-Augmented Generation Design

## Embeddings & Chunking

- Default embedding model: `sentence-transformers/all-MiniLM-L6-v2`. Override via `EMBEDDING_MODEL`.
- Text is chunked at ~800 characters with 120-character overlap (`apps/inference/app/utils.py`). The overlap preserves semantic continuity.
- Chunk metadata contains `title`, filesystem `path`, textual content, and `roles` for access control.

## Hybrid Retrieval Pipeline

1. **Vector Search (FAISS)** – All embeddings are stored in an `IndexFlatIP` index. Query vectors are normalized (L2) to turn inner product into cosine similarity.
2. **Keyword Search (BM25)** – `rank_bm25.BM25Okapi` is hydrated from the same chunk corpus. Tokens are lowercased and split on whitespace; extend this by swapping in custom tokenization if required.
3. **Reciprocal Rank Fusion** – Vector and keyword results are merged with RRF (`k = 60`). This handles cases where either retriever misses relevant context. The fused list is truncated to `top_k` (caller-provided or default `TOP_K` env).
4. **Optional Cross-Encoder** – When `RERANK_MODEL` is set, `sentence_transformers.CrossEncoder` further reranks the fused shortlist. This step is best-effort; the system still returns answers if the model is unavailable.

See `docs/diagrams/rag-sequence.drawio` for the sequence view.

## Generation & Guardrails

- `apps/inference/app/llm.py` wraps `OpenAI` `.chat.completions.create` with a minimal system prompt: restrict answers to provided context, express uncertainty, and cite `[title]` tokens.
- Temperature is fixed at `0.2` for determinism. Expose as an environment variable if response diversity is needed.
- Answer payload includes `sources[]` with top-level metadata so clients can render citations or link back to the original document path.

## Index Maintenance

- `add_chunks` writes metadata to `meta.jsonl` and appends vectors to FAISS. The in-memory HybridRetriever is rebuilt on-the-fly after ingestion to keep BM25 in sync.
- The ingestion CLI (`workers/ingestion-cli/ingest.py`) shares chunking logic to support batch jobs. Both CLI and API ingestion write to the same format, enabling interchangeability.
- Neo4j loader (`workers/neo4j-loader`) can mirror the index into a role graph for advanced analytics or governance queries.
