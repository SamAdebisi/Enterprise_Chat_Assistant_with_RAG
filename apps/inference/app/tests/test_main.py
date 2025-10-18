import pytest
import tempfile
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app, extract_text

client = TestClient(app)

class TestHealthEndpoint:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert "timestamp" in data

class TestRAGQuery:
    @patch('app.main.answer')
    def test_successful_query(self, mock_answer):
        mock_answer.return_value = {
            "answer": "Test answer",
            "sources": [{"title": "Test Doc", "score": 0.9}]
        }
        
        response = client.post("/rag/query", json={
            "question": "What is AI?",
            "roles": ["sales"],
            "top_k": 5
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "Test answer"
        assert len(data["sources"]) == 1
        mock_answer.assert_called_once_with("What is AI?", ["sales"], 5)

    @patch('app.main.answer')
    def test_query_with_default_params(self, mock_answer):
        mock_answer.return_value = {
            "answer": "Test answer",
            "sources": []
        }
        
        response = client.post("/rag/query", json={
            "question": "What is AI?"
        })
        
        assert response.status_code == 200
        mock_answer.assert_called_once_with("What is AI?", ["all"], None)

    @patch('app.main.answer')
    def test_query_failure(self, mock_answer):
        mock_answer.side_effect = Exception("RAG service error")
        
        response = client.post("/rag/query", json={
            "question": "What is AI?",
            "roles": ["sales"]
        })
        
        assert response.status_code == 500
        data = response.json()
        assert "RAG query failed" in data["detail"]

class TestDocumentIngestion:
    @patch('app.main.add_chunks')
    @patch('app.main.chunk_text')
    def test_successful_upload_pdf(self, mock_chunk_text, mock_add_chunks):
        mock_chunk_text.return_value = ["chunk1", "chunk2", "chunk3"]
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(b"PDF content")
            tmp.flush()
            
            with open(tmp.name, "rb") as f:
                response = client.post("/rag/ingest", 
                    files={"file": ("test.pdf", f, "application/pdf")},
                    data={"roles": "sales,engineering"}
                )
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["chunks"] == 3
        assert "duration" in data
        
        mock_chunk_text.assert_called_once()
        mock_add_chunks.assert_called_once()
        
        # Clean up
        os.unlink(tmp.name)

    @patch('app.main.add_chunks')
    @patch('app.main.chunk_text')
    def test_successful_upload_docx(self, mock_chunk_text, mock_add_chunks):
        mock_chunk_text.return_value = ["chunk1", "chunk2"]
        
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(b"DOCX content")
            tmp.flush()
            
            with open(tmp.name, "rb") as f:
                response = client.post("/rag/ingest", 
                    files={"file": ("test.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                    data={"roles": "all"}
                )
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["chunks"] == 2
        
        # Clean up
        os.unlink(tmp.name)

    @patch('app.main.add_chunks')
    @patch('app.main.chunk_text')
    def test_successful_upload_markdown(self, mock_chunk_text, mock_add_chunks):
        mock_chunk_text.return_value = ["chunk1"]
        
        with tempfile.NamedTemporaryFile(suffix=".md", delete=False) as tmp:
            tmp.write(b"# Markdown content")
            tmp.flush()
            
            with open(tmp.name, "rb") as f:
                response = client.post("/rag/ingest", 
                    files={"file": ("test.md", f, "text/markdown")},
                    data={"roles": "engineering"}
                )
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["chunks"] == 1
        
        # Clean up
        os.unlink(tmp.name)

    def test_file_too_large(self):
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        
        response = client.post("/rag/ingest", 
            files={"file": ("large.pdf", large_content, "application/pdf")},
            data={"roles": "all"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "File too large" in data["detail"]

    def test_invalid_file_type(self):
        response = client.post("/rag/ingest", 
            files={"file": ("test.exe", b"executable content", "application/octet-stream")},
            data={"roles": "all"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "Invalid file type" in data["detail"]

    @patch('app.main.extract_text')
    def test_no_text_content(self, mock_extract_text):
        mock_extract_text.return_value = ""
        
        response = client.post("/rag/ingest", 
            files={"file": ("empty.pdf", b"PDF content", "application/pdf")},
            data={"roles": "all"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "No text content found" in data["detail"]

    @patch('app.main.chunk_text')
    def test_no_valid_chunks(self, mock_chunk_text):
        mock_chunk_text.return_value = []
        
        response = client.post("/rag/ingest", 
            files={"file": ("test.pdf", b"PDF content", "application/pdf")},
            data={"roles": "all"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "No valid chunks extracted" in data["detail"]

    @patch('app.main.add_chunks')
    def test_ingestion_failure(self, mock_add_chunks):
        mock_add_chunks.side_effect = Exception("Indexing failed")
        
        response = client.post("/rag/ingest", 
            files={"file": ("test.pdf", b"PDF content", "application/pdf")},
            data={"roles": "all"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert "Document ingestion failed" in data["detail"]

class TestTextExtraction:
    def test_extract_pdf_text(self):
        # Mock PDF content
        with patch('app.main.PdfReader') as mock_reader:
            mock_page = MagicMock()
            mock_page.extract_text.return_value = "PDF text content"
            mock_reader.return_value.pages = [mock_page]
            
            result = extract_text("test.pdf", b"PDF content")
            assert result == "PDF text content"

    def test_extract_docx_text(self):
        with patch('app.main.Docx') as mock_docx:
            mock_paragraph = MagicMock()
            mock_paragraph.text = "DOCX text content"
            mock_docx.return_value.paragraphs = [mock_paragraph]
            
            result = extract_text("test.docx", b"DOCX content")
            assert result == "DOCX text content"

    def test_extract_markdown_text(self):
        with patch('app.main.markdown') as mock_markdown, \
             patch('app.main.BeautifulSoup') as mock_soup:
            mock_markdown.return_value = "<h1>Title</h1><p>Content</p>"
            mock_soup.return_value.get_text.return_value = "Title\nContent"
            
            result = extract_text("test.md", b"# Title\nContent")
            assert result == "Title\nContent"

    def test_extract_plain_text(self):
        result = extract_text("test.txt", b"Plain text content")
        assert result == "Plain text content"

    def test_extract_text_failure(self):
        with patch('app.main.PdfReader') as mock_reader:
            mock_reader.side_effect = Exception("PDF parsing failed")
            
            with pytest.raises(Exception) as exc_info:
                extract_text("test.pdf", b"PDF content")
            assert "Failed to extract text" in str(exc_info.value)

class TestGlobalErrorHandling:
    def test_global_exception_handler(self):
        with patch('app.main.answer') as mock_answer:
            mock_answer.side_effect = Exception("Unexpected error")
            
            response = client.post("/rag/query", json={
                "question": "What is AI?"
            })
            
            assert response.status_code == 500
            data = response.json()
            assert "Internal server error" in data["error"]

    def test_global_exception_handler_debug_mode(self):
        with patch.dict(os.environ, {"DEBUG": "true"}):
            with patch('app.main.answer') as mock_answer:
                mock_answer.side_effect = Exception("Unexpected error")
                
                response = client.post("/rag/query", json={
                    "question": "What is AI?"
                })
                
                assert response.status_code == 500
                data = response.json()
                assert "detail" in data
