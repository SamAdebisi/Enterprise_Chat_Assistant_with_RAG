import os, sys
sys.path.insert(0, os.path.abspath("apps/inference/app"))

from app import main, llm
from app.rag import add_chunks, answer
from app.retriever import HybridRetriever
from app.store import VectorStore

def test_extract_text_md():
    md = b"# Title\n\nHello **world**"
    txt = main.extract_text("readme.md", md)
    assert "Title" in txt and "Hello" in txt

def test_hybrid_empty_store(tmp_path):
    store = VectorStore(str(tmp_path))
    r = HybridRetriever(store)
    assert r.hybrid("sales policy", ["sales"], 3) == []

def test_answer_with_mock_llm(monkeypatch):
    def fake_generate(q,c): return "OK [doc]"
    monkeypatch.setattr(llm, "generate", fake_generate)
    add_chunks([{"text":"company policy on sales","title":"policy.md","path":"/tmp/policy.md","roles":["sales"]}])
    resp = answer("What is the policy?", ["sales"], top_k=1)
    assert "OK" in resp["answer"]
    assert resp["sources"]
