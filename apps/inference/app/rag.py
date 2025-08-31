import os
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
from .store import VectorStore
from .llm import generate
from .retriever import HybridRetriever

EMB_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
INDEX_DIR = os.getenv("INDEX_DIR", "/data/index")
TOP_K_DEFAULT = int(os.getenv("TOP_K", "5"))
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

_model = SentenceTransformer(EMB_MODEL)
_store = VectorStore(INDEX_DIR)
_retriever = HybridRetriever(_store)
_cross = None
try:
    _cross = CrossEncoder(RERANK_MODEL)
except Exception:
    _cross = None  # optional

def embed_texts(texts: List[str]) -> np.ndarray:
    embs = _model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
    return embs.astype("float32")

def _rerank(question: str, hits: List[Dict]) -> List[Dict]:
    if not _cross or not hits: return hits
    pairs = [(question, h["text"]) for h in hits]
    scores = _cross.predict(pairs)
    ranked = sorted(zip(hits, scores), key=lambda x: x[1], reverse=True)
    return [{**h, "score": float(s)} for h, s in ranked]

def answer(question: str, roles: List[str], top_k: int | None = None) -> Dict:
    k = top_k or TOP_K_DEFAULT
    hits = _retriever.hybrid(question, roles, k * 2)
    hits = _rerank(question, hits)[:k]
    context = "\n\n".join([f"[{h.get('title','doc')}] {h['text']}" for h in hits])
    ans = generate(question, context)
    sources = [{"title": h.get("title", "doc"), "score": h["score"], "path": h.get("path"), "roles": h.get("roles", [])} for h in hits]
    return {"answer": ans, "sources": sources}

def add_chunks(chunks: List[Dict]):
    texts = [c["text"] for c in chunks]
    metas = [{"title": c.get("title"), "path": c.get("path"), "roles": c.get("roles", ["all"]), "text": c["text"]} for c in chunks]
    embs = embed_texts(texts)
    _store.add(embs, metas)
    # refresh BM25
    from .retriever import HybridRetriever
    global _retriever
    _retriever = HybridRetriever(_store)
