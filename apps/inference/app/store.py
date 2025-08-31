import os, json
from typing import List, Dict, Any
import numpy as np
import faiss

class VectorStore:
    def __init__(self, index_dir: str):
        self.index_dir = index_dir
        os.makedirs(index_dir, exist_ok=True)
        self.index_path = os.path.join(index_dir, "index.faiss")
        self.meta_path = os.path.join(index_dir, "meta.jsonl")
        self._index = None
        self._meta: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(self.index_path):
            self._index = faiss.read_index(self.index_path)
        if os.path.exists(self.meta_path):
            with open(self.meta_path, "r", encoding="utf-8") as f:
                self._meta = [json.loads(l) for l in f]

    def _save(self):
        if self._index:
            faiss.write_index(self._index, self.index_path)
        with open(self.meta_path, "w", encoding="utf-8") as f:
            for m in self._meta: f.write(json.dumps(m, ensure_ascii=False) + "\n")

    def add(self, embeddings: np.ndarray, metas: List[Dict[str, Any]]):
        if self._index is None:
            self._index = faiss.IndexFlatIP(embeddings.shape[1])
        faiss.normalize_L2(embeddings)
        self._index.add(embeddings.astype("float32"))
        self._meta.extend(metas)
        self._save()

    def search(self, query_vec: np.ndarray, top_k: int, roles: List[str]):
        if self._index is None or self._index.ntotal == 0:
            return []
        faiss.normalize_L2(query_vec)
        D, I = self._index.search(query_vec.astype("float32"), top_k * 4)
        out = []
        for idx, score in zip(I[0], D[0]):
            if idx < 0: continue
            m = self._meta[idx]
            allowed = set(m.get("roles", ["all"]))
            if "all" in allowed or allowed.intersection(set(roles)):
                out.append({**m, "score": float(score), "_idx": idx})
            if len(out) >= top_k:
                break
        return out

    def all_texts(self):
        return [m.get("text","") for m in self._meta]

    def all_meta(self):
        return self._meta
