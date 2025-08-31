import os, io
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from .schemas import QueryRequest, QueryResponse
from .rag import answer, add_chunks
from .utils import chunk_text
from pypdf import PdfReader
from docx import Document as Docx
from markdown import markdown
from bs4 import BeautifulSoup

PORT = int(os.getenv("PORT", "8000"))
DOCS_DIR = os.getenv("DOCS_DIR", "/data/docs")

app = FastAPI(title="Enterprise Chat Assistant with RAG - Inference")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/rag/query", response_model=QueryResponse)
def rag_query(req: QueryRequest):
    return answer(req.question, req.roles, req.top_k)

@app.post("/rag/ingest")
async def rag_ingest(file: UploadFile, roles: str = Form("all")):
    content = await file.read()
    os.makedirs(DOCS_DIR, exist_ok=True)
    dst = os.path.join(DOCS_DIR, file.filename)
    with open(dst, "wb") as f:
        f.write(content)

    text = extract_text(file.filename, content)
    chunks = [{"text": t, "title": file.filename, "path": dst, "roles": roles.split(",") or ["all"]}
              for t in chunk_text(text)]
    add_chunks(chunks)
    return {"ok": True, "chunks": len(chunks)}

def extract_text(name: str, content: bytes) -> str:
    n = name.lower()
    if n.endswith(".pdf"):
        rd = PdfReader(io.BytesIO(content))
        return "\n".join([(p.extract_text() or "") for p in rd.pages])
    if n.endswith(".docx"):
        d = Docx(io.BytesIO(content))
        return "\n".join([p.text for p in d.paragraphs])
    if n.endswith(".md") or n.endswith(".markdown"):
        html = markdown(content.decode("utf-8", errors="ignore"))
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text("\n")
    return content.decode("utf-8", errors="ignore")
