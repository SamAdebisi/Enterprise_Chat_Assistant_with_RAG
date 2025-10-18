import numpy as np
import tempfile, os, shutil
from app.store import VectorStore

def test_add_and_search_with_roles():
    tmp = tempfile.mkdtemp()
    try:
        vs = VectorStore(tmp)
        embs = np.eye(3, dtype="float32")  # 3 vectors, dim=3
        metas = [
            {"text":"a", "title":"A", "roles":["sales"]},
            {"text":"b", "title":"B", "roles":["engineering"]},
            {"text":"c", "title":"C", "roles":["all"]},
        ]
        vs.add(embs, metas)

        q = np.array([[1,0,0]], dtype="float32")
        hits_sales = vs.search(q, 5, roles=["sales"])
        titles_sales = [h["title"] for h in hits_sales]
        assert "A" in titles_sales
        assert "B" not in titles_sales  # blocked by role
        assert "C" in titles_sales      # all is allowed

        # reload from disk
        vs2 = VectorStore(tmp)
        hits_reload = vs2.search(q, 2, roles=["sales"])
        assert hits_reload
    finally:
        shutil.rmtree(tmp)
