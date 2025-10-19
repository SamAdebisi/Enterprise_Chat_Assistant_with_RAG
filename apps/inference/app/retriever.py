import os
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi
from .store import VectorStore
from .embeddings import embed_texts

RRF_K = int(os.getenv("RRF_K", "60"))

class HybridRetriever:
    def __init__(self, store: VectorStore):
        self.store = store
        self._bm25 = None
        self._bm25_tokens = None
        self._build_bm25()

    def _build_bm25(self):
        texts = self.store.all_texts()
        self._bm25_tokens = [t.lower().split() for t in texts]
        self._bm25 = BM25Okapi(self._bm25_tokens) if texts else None

    def refresh(self):
        self._build_bm25()

    def _bm25_search(self, question: str, top_k: int, roles: List[str]) -> List[Tuple[int, float]]:
        if not self._bm25: return []
        scores = self._bm25.get_scores(question.lower().split())
        metas = self.store.all_meta()
        pairs = []
        for i, sc in enumerate(scores):
            m = metas[i]
            allowed = set(m.get("roles",["all"]))
            if "all" in allowed or allowed.intersection(set(roles)):
                pairs.append((i, float(sc)))
        pairs.sort(key=lambda x: x[1], reverse=True)
        return pairs[: top_k * 4]

    def _vector_search(self, question: str, top_k: int, roles: List[str]) -> List[Tuple[int,float]]:
        q_vec = embed_texts([question])
        hits = self.store.search(q_vec, top_k, roles)
        return [(h["_idx"], float(h["score"])) for h in hits]

    def hybrid(self, question: str, roles: List[str], top_k: int) -> List[Dict[str, Any]]:
        bm25_hits = self._bm25_search(question, top_k, roles)
        vec_hits = self._vector_search(question, top_k, roles)
        score_map = {}
        for rank, (idx, _sc) in enumerate(bm25_hits):
            score_map[idx] = score_map.get(idx, 0.0) + 1.0 / (RRF_K + rank + 1)
        for rank, (idx, _sc) in enumerate(vec_hits):
            score_map[idx] = score_map.get(idx, 0.0) + 1.0 / (RRF_K + rank + 1)
        merged = sorted(score_map.items(), key=lambda x: x[1], reverse=True)[: top_k]
        metas = self.store.all_meta()
        return [{**metas[idx], "score": float(sc), "_idx": idx} for idx, sc in merged]
