import traceback
from contextlib import contextmanager
from typing import List

from fastapi import APIRouter, Query
from pydantic import BaseModel
from pymilvus import connections, utility, MilvusClient
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


class CollectionInfo(BaseModel):
    name: str
    description: str
    loaded: bool
    entity_count: int
    index_type: str

class CollectionResponse(BaseModel):
    status: str
    collections: List[CollectionInfo]


def build_milvus_client(host: str, port: int) -> MilvusClient:
    return MilvusClient(uri=f"http://{host}:{port}")

def fetch_collection_info(client: MilvusClient, name: str) -> CollectionInfo:
    entity_count = client.get_collection_stats(collection_name=name).get('row_count', -1)
    c_desc = client.describe_collection(collection_name=name)
    loaded = utility.has_collection(name)
    i_desc = client.describe_index(collection_name=name, index_name="embedding")
    return CollectionInfo(
        name=name,
        description=c_desc.get("description", ""),
        loaded=loaded,
        entity_count=entity_count,
        index_type=i_desc.get("index_type", "N/A")
    )

@contextmanager
def milvus_connection(alias: str, host: str, port: int):
    try:
        connections.connect(alias=alias, host=host, port=port)
        yield
    finally:
        connections.disconnect(alias)

@router.get("/collections", response_model=CollectionResponse)
def list_collections(
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    try:
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            names = client.list_collections()
            collections = []

            for name in names:
                try:
                    info = fetch_collection_info(client, name)
                    collections.append(info)
                except Exception as e:
                    print(f"Failed to fetch collection info for {name}: {e}")
                    traceback.print_exc()

        return CollectionResponse(status="success", collections=collections)

    except Exception as e:
        traceback.print_exc()
        return CollectionResponse(status="error", collections=[])
