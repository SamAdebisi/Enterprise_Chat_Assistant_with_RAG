import os, io, logging
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .schemas import QueryRequest, QueryResponse
from .rag import answer, add_chunks
from .utils import chunk_text
from pypdf import PdfReader
from docx import Document as Docx
from markdown import markdown
from bs4 import BeautifulSoup
import time
from typing import Dict, Any

PORT = int(os.getenv("PORT", "8000"))
DOCS_DIR = os.getenv("DOCS_DIR", "/data/docs")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Enterprise Chat Assistant with RAG - Inference")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc) if os.getenv("DEBUG") else "An error occurred"}
    )

@app.get("/health")
def health():
    return {"ok": True, "timestamp": time.time()}

@app.post("/rag/query", response_model=QueryResponse)
def rag_query(req: QueryRequest):
    start_time = time.time()
    logger.info(f"RAG query started: {req.question[:100]}...")
    
    try:
        result = answer(req.question, req.roles, req.top_k)
        duration = time.time() - start_time
        logger.info(f"RAG query completed in {duration:.2f}s, sources: {len(result.sources)}")
        return result
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"RAG query failed after {duration:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

@app.post("/rag/ingest")
async def rag_ingest(file: UploadFile, roles: str = Form("all")):
    start_time = time.time()
    logger.info(f"Document ingestion started: {file.filename}")
    
    try:
        # Validate file size (10MB limit)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.md', '.txt', '.markdown']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
        
        os.makedirs(DOCS_DIR, exist_ok=True)
        dst = os.path.join(DOCS_DIR, file.filename)
        
        # Save file
        with open(dst, "wb") as f:
            f.write(content)
        
        # Extract and chunk text
        text = extract_text(file.filename, content)
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text content found in file")
        
        chunks = [{"text": t, "title": file.filename, "path": dst, "roles": roles.split(",") or ["all"]}
                  for t in chunk_text(text)]
        
        if not chunks:
            raise HTTPException(status_code=400, detail="No valid chunks extracted from file")
        
        # Add to index
        add_chunks(chunks)
        
        duration = time.time() - start_time
        logger.info(f"Document ingestion completed: {file.filename}, {len(chunks)} chunks in {duration:.2f}s")
        
        return {"ok": True, "chunks": len(chunks), "duration": duration}
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Document ingestion failed: {file.filename} after {duration:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=f"Document ingestion failed: {str(e)}")

def extract_text(name: str, content: bytes) -> str:
    """Extract text from various file formats with error handling."""
    try:
        n = name.lower()
        if n.endswith(".pdf"):
            rd = PdfReader(io.BytesIO(content))
            return "\n".join([(p.extract_text() or "") for p in rd.pages])
        elif n.endswith(".docx"):
            d = Docx(io.BytesIO(content))
            return "\n".join([p.text for p in d.paragraphs])
        elif n.endswith(".md") or n.endswith(".markdown"):
            html = markdown(content.decode("utf-8", errors="ignore"))
            soup = BeautifulSoup(html, "html.parser")
            return soup.get_text("\n")
        else:
            return content.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Text extraction failed for {name}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from {name}: {str(e)}")
