import os
import logging
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
from .store import VectorStore
from .llm import generate
from .retriever import HybridRetriever

logger = logging.getLogger(__name__)

EMB_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
INDEX_DIR = os.getenv("INDEX_DIR", "/data/index")
TOP_K_DEFAULT = int(os.getenv("TOP_K", "5"))
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

# Initialize models with error handling
try:
    logger.info(f"Loading embedding model: {EMB_MODEL}")
    _model = SentenceTransformer(EMB_MODEL)
    logger.info("Embedding model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load embedding model: {e}")
    raise

try:
    logger.info(f"Initializing vector store at: {INDEX_DIR}")
    _store = VectorStore(INDEX_DIR)
    _retriever = HybridRetriever(_store)
    logger.info("Vector store initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize vector store: {e}")
    raise

_cross = None
try:
    logger.info(f"Loading rerank model: {RERANK_MODEL}")
    _cross = CrossEncoder(RERANK_MODEL)
    logger.info("Rerank model loaded successfully")
except Exception as e:
    logger.warning(f"Failed to load rerank model (optional): {e}")
    _cross = None

def embed_texts(texts: List[str]) -> np.ndarray:
    """Generate embeddings for texts with error handling."""
    try:
        if not texts:
            return np.array([])
        embs = _model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
        return embs.astype("float32")
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise

def _rerank(question: str, hits: List[Dict]) -> List[Dict]:
    """Rerank hits using cross-encoder if available."""
    if not _cross or not hits: 
        return hits
    try:
        pairs = [(question, h["text"]) for h in hits]
        scores = _cross.predict(pairs)
        ranked = sorted(zip(hits, scores), key=lambda x: x[1], reverse=True)
        return [{**h, "score": float(s)} for h, s in ranked]
    except Exception as e:
        logger.warning(f"Reranking failed, using original order: {e}")
        return hits

def answer(question: str, roles: List[str], top_k: int | None = None) -> Dict:
    """Generate answer using RAG pipeline with comprehensive error handling."""
    try:
        k = top_k or TOP_K_DEFAULT
        
        # Validate inputs
        if not question or not question.strip():
            raise ValueError("Question cannot be empty")
        if not roles:
            roles = ["all"]
        
        logger.info(f"Processing question: {question[:100]}... with roles: {roles}")
        
        # Retrieve relevant documents
        hits = _retriever.hybrid(question, roles, k * 2)
        if not hits:
            logger.warning("No relevant documents found")
            return {
                "answer": "I don't have enough information to answer your question. Please try uploading relevant documents first.",
                "sources": []
            }
        
        # Rerank and limit results
        hits = _rerank(question, hits)[:k]
        
        # Build context
        context = "\n\n".join([f"[{h.get('title','doc')}] {h['text']}" for h in hits])
        
        # Generate answer
        ans = generate(question, context)
        
        # Format sources
        sources = [{
            "title": h.get("title", "doc"), 
            "score": h.get("score", 0.0), 
            "path": h.get("path"), 
            "roles": h.get("roles", [])
        } for h in hits]
        
        logger.info(f"Generated answer with {len(sources)} sources")
        return {"answer": ans, "sources": sources}
        
    except Exception as e:
        logger.error(f"RAG answer generation failed: {e}")
        raise

def add_chunks(chunks: List[Dict]):
    """Add document chunks to the vector store with error handling."""
    try:
        if not chunks:
            logger.warning("No chunks provided for indexing")
            return
        
        logger.info(f"Adding {len(chunks)} chunks to index")
        
        texts = [c["text"] for c in chunks]
        metas = [{
            "title": c.get("title"), 
            "path": c.get("path"), 
            "roles": c.get("roles", ["all"]), 
            "text": c["text"]
        } for c in chunks]
        
        embs = embed_texts(texts)
        _store.add(embs, metas)
        
        # Refresh BM25 index
        from .retriever import HybridRetriever
        global _retriever
        _retriever = HybridRetriever(_store)
        
        logger.info(f"Successfully indexed {len(chunks)} chunks")
        
    except Exception as e:
        logger.error(f"Failed to add chunks to index: {e}")
        raise
