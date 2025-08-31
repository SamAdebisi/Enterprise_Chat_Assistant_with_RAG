# RAG Design
- Embed with `sentence-transformers/all-MiniLM-L6-v2`.
- Retrieve hybrid: BM25 (rank-bm25) + FAISS inner-product.
- Fuse with RRF (K=60). Optional cross-encoder rerank (`cross-encoder/ms-marco-MiniLM-L-6-v2`).
- Prompt constrains LLM to provided context. Citations by `[title]`.
