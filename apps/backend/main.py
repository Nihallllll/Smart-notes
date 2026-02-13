from fastapi import FastAPI
from dataclasses import dataclass
app = FastAPI()

@dataclass
class Chunk:
    text :str
    chunk_index : int
    token_count :int
    doc_id : str
    url :str

@app.get("/health")
def health():
    return "Health is wealth"

@app.post("/embed")
def embedd(chunk :Chunk):
    pass