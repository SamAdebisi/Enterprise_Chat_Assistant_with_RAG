import os, glob, io, argparse, json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from pypdf import PdfReader
from docx import Document as Docx
from markdown import markdown
from bs4 import BeautifulSoup

def chunk_text(text, size=800, overlap=120):
    out, i = [], 0
    while i < len(text):
        out.append(text[i:i+size])
        i += size - overlap
    return [o.strip() for o in out if o.strip()]

def extract(path: str) -> str:
    name = path.lower()
    with open(path, "rb") as f:
        data = f.read()
    if name.endswith(".pdf"):
        rd = PdfReader(io.BytesIO(data))
        return "\n".join([p.extract_text() or "" for p in rd.pages])
    if name.endswith(".docx"):
        d = Docx(io.BytesIO(data))
        return "\n".join([p.text for p in d.paragraphs])
    if name.endswith(".md") or name.endswith(".markdown"):
        html = markdown(data.decode("utf-8", errors="ignore"))
        return BeautifulSoup(html, "html.parser").get_text("\n")
    return data.decode("utf-8", errors="ignore")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--docs", default=os.getenv("DOCS_DIR", "./docs"))
    ap.add_argument("--index", default=os.getenv("INDEX_DIR", "./index"))
    ap.add_argument("--roles", default=os.getenv("ROLES", "all"))
    ap.add_argument("--model", default=os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
    args = ap.parse_args()

    os.makedirs(args.index, exist_ok=True)
    meta_path = os.path.join(args.index, "meta.jsonl")
    idx_path = os.path.join(args.index, "index.faiss")
    metas, vectors = [], []

    model = SentenceTransformer(args.model)
    for path in glob.glob(os.path.join(args.docs, "**/*.*"), recursive=True):
        if os.path.isdir(path): continue
        text = extract(path)
        ch = chunk_text(text)
        roles = args.roles.split(",")
        for t in ch:
            metas.append({"title": os.path.basename(path), "path": path, "roles": roles, "text": t})
            vectors.append(t)

    if not vectors:
        print("no docs"); return

    embs = model.encode(vectors, convert_to_numpy=True, normalize_embeddings=True).astype("float32")
    index = faiss.IndexFlatIP(embs.shape[1]); index.add(embs)
    faiss.write_index(index, idx_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        for m in metas: f.write(json.dumps(m, ensure_ascii=False) + "\n")
    print(f"ok: {len(metas)} chunks")

if __name__ == "__main__":
    main()
