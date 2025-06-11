from fastapi import APIRouter, Query
from pydantic import BaseModel
from pymilvus import connections
from pymilvus.exceptions import MilvusException

router = APIRouter(prefix="/api/milvus")

class PingResponse(BaseModel):
    status: str
    connected: bool
    host: str
    port: int

@router.get("/ping", response_model=PingResponse)
def ping_milvus(
    host: str = Query("localhost"),
    port: int = Query(19530)
):
    print(f"Ping Milvus - Host: {host}; Port: {port}")
    try:
        # Create a temporary connection
        connections.connect(alias="ping-check", host=host, port=port)
        healthy = connections.has_connection("ping-check")
        connections.disconnect("ping-check")

        return PingResponse(
            status="success" if healthy else "failure",
            connected=healthy,
            host=host,
            port=port
        )
    except MilvusException as e:
        return PingResponse(
            status="error",
            connected=False,
            host=host,
            port=port,
            error=str(e)
        )
    except Exception as e:
        return PingResponse(
            status="error",
            connected=False,
            host=host,
            port=port,
            error=str(e)
        )

@router.get("/collections")
def list_collections():
    # Stubbed until real Milvus logic is added
    return {
        "status": "success",
        "collections": [
            {
                "name": "PUBMED_DISKANN_1M",
                "description": "1 million biomedical vectors",
                "loaded": True,
                "entity_count": 1000000,
                "index_type": "DISKANN"
            },
            {
                "name": "GLOVE_SMALL",
                "description": "Small GloVe test dataset",
                "loaded": False,
                "entity_count": 10000,
                "index_type": "HNSW"
            }
        ]
    }