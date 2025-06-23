import traceback
from contextlib import contextmanager
from typing import List, Dict

from fastapi import APIRouter, Query
from pydantic import BaseModel
from pymilvus import connections, utility, MilvusClient, Collection
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
    loaded: int
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
    loaded = int(client.get_load_state(collection_name=name)["state"])
    print(f"===> Collection Loading State: {loaded}")
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

@router.post("/collections/load")
def load_collection(
    name: str = Query(...),
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    try:
        print(f"About to load {name} collection")
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            client.load_collection(name)
            # collection = Collection(name, using=alias)
            # collection.load()
        print(f"Collection {name} loaded")
        return {"status": "success", "message": f"Collection '{name}' is loaded."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/collections/release")
def release_collection(
    name: str = Query(...),
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    try:
        print(f"About to release {name} collection")
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            client.release_collection(name)
            # collection = Collection(name, using=alias)
            # collection.release()
        print(f"Collection {name} released")
        return {"status": "success", "message": f"Collection '{name}' released."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.delete("/collections/drop")
def drop_collection(
    name: str = Query(...),
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    try:
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            client.drop_collection(name)
        return {"status": "success", "message": f"Collection '{name}' dropped."}
    except Exception as e:
        return {"status": "error", "message": str(e)}




class CollectionDetailsResponse(BaseModel):
    status: str
    name: str
    description: str
    schema: List[Dict]
    index_info: Dict
    entity_count: int
    load_state: int
    shard_num: int
    auto_id: bool


@router.get("/collections/{name}/details", response_model=CollectionDetailsResponse)
def get_collection_details(
    name: str,
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    try:
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            desc = client.describe_collection(name)
            schema_fields = desc.get("fields", [])

            try:
                index_info = client.describe_index(collection_name=name, index_name="embedding")
            except Exception:
                index_info = {}

            stats = client.get_collection_stats(collection_name=name)
            row_count = stats.get("row_count", -1)

            try:
                load_state = int(client.get_load_state(collection_name=name)["state"])
            except:
                load_state = -1

            return CollectionDetailsResponse(
                status="success",
                name=name,
                description=desc.get("description", ""),
                schema=schema_fields,
                index_info=index_info,
                entity_count=row_count,
                load_state=load_state,
                shard_num=desc.get("shard_number", -1),
                auto_id=desc.get("auto_id", False)
            )

    except MilvusException as e:
        return CollectionDetailsResponse(
            status="error",
            name=name,
            description="",
            schema=[],
            index_info={},
            entity_count=-1,
            load_state=-1,
            shard_num=-1,
            auto_id=False
        )
    except Exception as e:
        return CollectionDetailsResponse(
            status="error",
            name=name,
            description="",
            schema=[],
            index_info={},
            entity_count=-1,
            load_state=-1,
            shard_num=-1,
            auto_id=False
        )
