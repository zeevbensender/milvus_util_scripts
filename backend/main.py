from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


# Enable CORS for frontend calls (important for React to connect later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["http://localhost:5174"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"msg": "Milvus Admin Panel backend running"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "uptime": "not implemented",  # you can add a timer later if needed
        "milvus_connected": False     # placeholder until we wire it up
    }
