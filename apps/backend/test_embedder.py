"""
Quick test script for the FastEmbedder with nomic-ai/nomic-embed-text-v1.5 model.
"""

from src.embedder import FastEmbedder


def test_embedder():
    """Test basic embedding functionality."""
    
    print("=" * 60)
    print("Testing FastEmbedder with nomic-ai/nomic-embed-text-v1.5")
    print("=" * 60)
    
    # Initialize embedder
    print("\n1. Initializing embedder...")
    embedder = FastEmbedder(model_name="nomic-ai/nomic-embed-text-v1.5")
    
    # Test single embedding
    print("\n2. Testing single text embedding...")
    text = "The quick brown fox jumps over the lazy dog."
    embedding = embedder.embed(text)
    print(f"   Input: '{text}'")
    print(f"   Output dimensions: {len(embedding)}")
    print(f"   First 5 values: {embedding[:5]}")
    
    # Test batch embedding
    print("\n3. Testing batch embedding...")
    texts = [
        "Artificial intelligence is transforming technology.",
        "Machine learning models process data efficiently.",
        "Python is a popular programming language.",
        "Deep learning requires large datasets.",
    ]
    embeddings = embedder.embed_batch(texts)
    print(f"   Processed {len(embeddings)} texts")
    print(f"   Each embedding has {len(embeddings[0])} dimensions")
    
    # Test similarity (cosine similarity)
    print("\n4. Testing semantic similarity...")
    def cosine_similarity(vec1, vec2):
        """Calculate cosine similarity between two vectors."""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        return dot_product / (magnitude1 * magnitude2)
    
    sim_01 = cosine_similarity(embeddings[0], embeddings[1])
    sim_02 = cosine_similarity(embeddings[0], embeddings[2])
    
    print(f"   Similarity between text 0 and 1 (related): {sim_01:.4f}")
    print(f"   Similarity between text 0 and 2 (unrelated): {sim_02:.4f}")
    
    # Test cache
    print("\n5. Testing cache performance...")
    embedder.embed_batch(texts)  # Second time should hit cache
    stats = embedder.get_cache_stats()
    print(f"   Cache hits: {stats['cache_hits']}")
    print(f"   Cache misses: {stats['cache_misses']}")
    print(f"   Hit rate: {stats['hit_rate']}")
    
    print("\n" + "=" * 60)
    print("✓ All tests completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    test_embedder()
