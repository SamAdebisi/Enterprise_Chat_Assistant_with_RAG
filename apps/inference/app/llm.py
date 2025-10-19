import os
import logging
from dotenv import load_dotenv
from openai import OpenAI
from typing import Optional

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Initialize client lazily to avoid import-time issues
client = None

def get_client():
    global client
    if client is None:
        client = OpenAI(api_key=OPENAI_API_KEY)
    return client

SYSTEM = (
    "You are a helpful assistant that answers questions based on the provided context. "
    "Always cite your sources using [title] format. "
    "If the context doesn't contain enough information to answer the question, "
    "say 'I don't have enough information to answer this question based on the provided context.' "
    "Be concise but comprehensive in your answers."
)

def generate(question: str, context: str) -> str:
    """Generate answer using OpenAI with comprehensive error handling."""
    try:
        if not question or not question.strip():
            raise ValueError("Question cannot be empty")
        
        if not context or not context.strip():
            logger.warning("Empty context provided for question")
            return "I don't have enough information to answer this question."
        
        messages = [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Question:\n{question}\n\nContext:\n{context}\n\nAnswer succinctly with citations."}
        ]
        
        logger.info(f"Generating answer for question: {question[:100]}...")
        
        resp = get_client().chat.completions.create(
            model="gpt-4o-mini", 
            messages=messages, 
            temperature=0.2,
            max_tokens=1000
        )
        
        answer = resp.choices[0].message.content
        if not answer:
            logger.warning("Empty response from OpenAI")
            return "I don't know."
        
        logger.info(f"Generated answer: {answer[:100]}...")
        return answer
        
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return f"I encountered an error while generating an answer: {str(e)}"
