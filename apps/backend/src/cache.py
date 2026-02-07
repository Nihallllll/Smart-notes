"""
Simple in-memory cache for embedding vectors.
"""

from typing import Optional, List, Dict
import hashlib


class EmbeddingCache:
    """In-memory cache for storing computed embeddings."""
    
    def __init__(self):
        self._cache: Dict[str, List[float]] = {}
    
    def _hash_key(self, text: str) -> str:
        """Generate a hash key for text."""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def get(self, text: str) -> Optional[List[float]]:
        """Retrieve cached embedding for text."""
        key = self._hash_key(text)
        return self._cache.get(key)
    
    def set(self, text: str, embedding: List[float]) -> None:
        """Store embedding in cache."""
        key = self._hash_key(text)
        self._cache[key] = embedding
    
    def clear(self) -> None:
        """Clear all cached embeddings."""
        self._cache.clear()
    
    def stats(self) -> int:
        """Return number of cached embeddings."""
        return len(self._cache)
