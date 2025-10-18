from app.utils import chunk_text

def test_chunking_overlap_and_size():
    txt = " ".join(["word"]*500)  # ~2000+ chars
    chunks = chunk_text(txt, chunk_size=200, overlap=50)
    assert len(chunks) > 1
    # overlap present
    assert chunks[0][-50:] in chunks[1]
    # no empties
    assert all(c.strip() for c in chunks)
