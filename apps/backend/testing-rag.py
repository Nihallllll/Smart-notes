import json
import math
import os
from typing import List, Dict

from dotenv import load_dotenv
from langchain_litellm import ChatLiteLLM

from src.embedder import FastEmbedder


STORE_PATH = os.path.join(os.path.dirname(__file__), "local_vectors.json")


def load_store() -> Dict:
	if not os.path.exists(STORE_PATH):
		return {"docs": []}
	with open(STORE_PATH, "r", encoding="utf-8") as f:
		return json.load(f)


def save_store(store: Dict) -> None:
	with open(STORE_PATH, "w", encoding="utf-8") as f:
		json.dump(store, f, ensure_ascii=True)


def l2_normalize(vec: List[float]) -> List[float]:
	norm = math.sqrt(sum(v * v for v in vec)) or 1.0
	return [v / norm for v in vec]


def add_documents(embedder: FastEmbedder, texts: List[str]) -> None:
	store = load_store()
	vectors = embedder.embed_batch(texts)
	for text, vec in zip(texts, vectors):
		store["docs"].append({"text": text, "vector": l2_normalize(vec)})
	save_store(store)


def search(query: str, embedder: FastEmbedder, k: int = 3) -> List[str]:
	store = load_store()
	if not store["docs"]:
		return []

	q_vec = l2_normalize(embedder.embed(query))
	scored = []
	for doc in store["docs"]:
		score = sum(a * b for a, b in zip(q_vec, doc["vector"]))
		scored.append((score, doc["text"]))

	scored.sort(reverse=True, key=lambda item: item[0])
	return [text for _, text in scored[:k]]


def main() -> None:
	load_dotenv()
	embedder = FastEmbedder()

	# Add some local content to the store (run once or append over time).
	add_documents(
		embedder,
		[
			"My name is Nihal Rajak.",
			"Smart Notes helps store and search knowledge.",
			"RAG retrieves relevant chunks before calling the LLM.",
		],
	)

	chat = ChatLiteLLM(model="gemini/gemini-2.5-flash")

	user_query = "Who is Nihal?"
	context_chunks = search(user_query, embedder, k=3)
	context = "\n\n".join(context_chunks)

	prompt = (
		"Use the context to answer the question.\n\n"
		f"Context:\n{context}\n\n"
		f"Question: {user_query}"
	)

	res = chat.invoke(prompt)
	print(res.content)


if __name__ == "__main__":
	main()