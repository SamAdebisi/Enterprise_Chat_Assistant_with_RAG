import tempfile
from app import main
from app import llm
from app.rag import add_chunks, answer
from app.store import VectorStore
from app.retriever import HybridRetriever

def test_extract_text_md():
    md = b"# Title\n\nHello **world**"
    txt = main.extract_text("readme.md", md)
    assert "Title" in txt and "Hello" in txt

def test_hybrid_retriever_rrf(tmp_path):
    # isolate index dir
    idx_dir = tmp_path / "index"
    idx_dir.mkdir()
    # seed via add_chunks (populates VectorStore used globally)
    add_chunks([
        {"text":"alpha policy sales", "title":"a.md","path":"/tmp/a.md","roles":["sales"]},
        {"text":"beta engineering handbook", "title":"b.md","path":"/tmp/b.md","roles":["engineering"]},
        {"text":"gamma general company info", "title":"c.md","path":"/tmp/c.md","roles":["all"]},
    ])
    store = VectorStore(str(idx_dir))
    r = HybridRetriever(store)
    # with empty new store, no hits; ensures class works on empty
    assert r.hybrid("sales policy", ["sales"], 3) == []

def test_answer_with_mock_llm(monkeypatch):
    def fake_generate(q,c): return "OK [doc]"
    monkeypatch.setattr(llm, "generate", fake_generate)
    add_chunks([{"text":"company policy on sales","title":"policy.md","path":"/tmp/policy.md","roles":["sales"]}])
    resp = answer("What is the policy?", ["sales"], top_k=1)
    assert "OK" in resp["answer"]
    assert resp["sources"]
