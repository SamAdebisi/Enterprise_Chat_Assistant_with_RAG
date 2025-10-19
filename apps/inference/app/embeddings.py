import os
import logging
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

EMB_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Initialize model with error handling
try:
    logger.info(f"Loading embedding model: {EMB_MODEL}")
    _model = SentenceTransformer(EMB_MODEL)
    logger.info("Embedding model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load embedding model: {e}")
    raise

def embed_texts(texts: list[str]) -> np.ndarray:
    """Generate embeddings for texts with error handling."""
    try:
        if not texts:
            return np.array([])
        embs = _model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
        return embs.astype("float32")
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise
