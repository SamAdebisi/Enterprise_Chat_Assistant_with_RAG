from typing import List
try:
    from rank_bm25 import BM25Okapi
except Exception:  # pragma: no cover
    BM25Okapi = None  # optional dependency guard

class SimpleBM25:
    def __init__(self, docs: List[str]):
        tokens = [d.lower().split() for d in docs]
        self._bm25 = BM25Okapi(tokens) if BM25Okapi and docs else None
        self._tokens = tokens

    def scores(self, query: str) -> List[float]:
        if not self._bm25:
            return [0.0] * len(self._tokens)
        return list(self._bm25.get_scores(query.lower().split()))
