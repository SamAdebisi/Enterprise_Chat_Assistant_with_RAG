import re

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120):
  words = re.split(r"(\s+)", text)
  chunks, cur, cur_len = [], [], 0
  for tok in words:
      cur.append(tok); cur_len += len(tok)
      if cur_len >= chunk_size:
          s = "".join(cur).strip()
          if s: chunks.append(s)
          back = "".join(cur)[-overlap:]
          cur, cur_len = [back], len(back)
  if cur:
      s = "".join(cur).strip()
      if s: chunks.append(s)
  return [c for c in chunks if c]
