from typing import List, Tuple, Any
try:
    from sentence_transformers import CrossEncoder
except Exception:  # pragma: no cover
    CrossEncoder = None

class OptionalCrossEncoder:
    def __init__(self, model_name: str | None):
        self._enc = CrossEncoder(model_name) if (model_name and CrossEncoder) else None

    def predict(self, pairs: List[Tuple[str, str]]) -> List[float]:
        if not self._enc:
            return [0.0] * len(pairs)
        return list(self._enc.predict(pairs))
