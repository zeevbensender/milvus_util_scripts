import traceback
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

@router.get("/collections", response_model=CollectionResponse)
def list_collections(
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    print("==> PROCESSING")
    try:
        client = MilvusClient(
            uri=f"http://{host}:{port}",
            # token="root:Milvus"
        )
        connections.connect(alias=alias, host=host, port=port)
        collection_names = client.list_collections()
        collections = []

        print(f"==> COLLECTION COUNT: {len(collection_names)}")
        for name in collection_names:
            try:
                entity_count = client.get_collection_stats(collection_name=name).get('row_count', -1)
                c_desc = client.describe_collection(collection_name=name)
                loaded = utility.has_collection(name)
                i_desc = client.describe_index(collection_name=name, index_name="embedding")
                index_type = i_desc.get("index_type", "N/A")
                description = c_desc.get("description", "")
                collections.append(CollectionInfo(
                    name=name,
                    description=description,  # Optional: retrieve if schema saved it
                    loaded=loaded,
                    entity_count=entity_count,
                    index_type=index_type
                ))
            except Exception as inner_err:
                print(inner_err)
                print(f"Failed to load info for collection {name}: {inner_err}")
                traceback.print_exc()
        connections.disconnect(alias)
        return CollectionResponse(status="success", collections=collections)

    except MilvusException as e:
        traceback.print_exc()
        print(e)
        return CollectionResponse(status="milvus_error", collections=[])
    except Exception as e:
        print(e)
        traceback.print_exc()
        return CollectionResponse(status="error", collections=[])
