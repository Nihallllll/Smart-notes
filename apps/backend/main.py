from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return "Health is wealth"

@app.post("/embed")
def embedd():
    pass