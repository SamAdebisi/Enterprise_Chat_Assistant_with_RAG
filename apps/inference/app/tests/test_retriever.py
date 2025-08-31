from app.rag import add_chunks
from app.retriever import HybridRetriever
from app.store import VectorStore
import tempfile, shutil

def test_hybrid_rrf_role_filtering():
    tmp = tempfile.mkdtemp()
    try:
        store = VectorStore(tmp)
        # seed via direct add_chunks so embeddings exist in global store too
        add_chunks([
            {"text":"sales handbook policy", "title":"sales.md","path":"/tmp/sales.md","roles":["sales"]},
            {"text":"engineering handbook", "title":"eng.md","path":"/tmp/eng.md","roles":["engineering"]},
            {"text":"company info", "title":"info.md","path":"/tmp/info.md","roles":["all"]},
        ])
        r = HybridRetriever(store)
        hits = r.hybrid("sales policy", ["sales"], 3)
        titles = [h["title"] for h in hits]
        assert "sales.md" in titles
        assert "eng.md" not in titles  # filtered by roles
    finally:
        shutil.rmtree(tmp)
