import os
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM = (
  "Answer using only provided context. If unsure, say you don't know. "
  "Always cite sources as [title]."
)

def generate(question: str, context: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": f"Question:\n{question}\n\nContext:\n{context}\n\nAnswer succinctly with citations."}
    ]
    resp = client.chat.completions.create(model="gpt-4o-mini", messages=messages, temperature=0.2)
    return resp.choices[0].message.content or "I don't know."
