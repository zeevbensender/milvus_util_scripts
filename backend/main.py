# Entry point for FastAPI

from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def read_root():
    return {"msg": "Milvus Admin Panel backend running"}
