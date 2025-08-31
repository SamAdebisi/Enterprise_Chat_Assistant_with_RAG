from pydantic import BaseModel
from typing import List, Dict, Any

class QueryRequest(BaseModel):
    question: str
    roles: List[str] = ["all"]
    top_k: int | None = None
    chat_id: str | None = None
    user_id: str | None = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
