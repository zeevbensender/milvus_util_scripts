import json
import traceback
from contextlib import contextmanager
from typing import List, Dict, Optional

from fastapi import APIRouter, Query, Body
from google.protobuf.json_format import MessageToDict
from pydantic import BaseModel
from pymilvus import connections, utility, MilvusClient, Collection, DataType, FieldSchema, CollectionSchema
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


class SegmentInfo(BaseModel):
    id: int
    numRows: int
    indexName: str
    state: str



class SegmentResponse(BaseModel):
    load_state: int
    status: str
    segments:List[SegmentInfo]

@router.get("/collections/{collection_name}/segments", response_model=SegmentResponse)
def get_segments(
    collection_name: str,
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    try:
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            load_state = int(client.get_load_state(collection_name=collection_name)["state"])
            if load_state != 3:
                return SegmentResponse(load_state=load_state, status="not loaded", segments=[])
            # collection = get_collection(host_name=host_name, collection_name=collection_name)
            qs_info = utility.get_query_segment_info(collection_name=collection_name)
            segment_info = [SegmentInfo(id=segm["segmentID"], numRows=segm["numRows"], indexName=segm["indexName"], state=segm["state"]) for segm in [MessageToDict(msg) for msg in qs_info]]
            segment_info.sort(key=lambda seg: seg.id, reverse=True)
            return SegmentResponse(load_state=load_state, status="success", segments=segment_info)
    except Exception as e:
        print(f"Error on get segments info: {e}")
        traceback.print_exc()
        return SegmentResponse(load_state=load_state, status=f"Error: {e}", segments=[])
        # raise e


class CollectionInfo(BaseModel):
    name: str
    description: str
    loaded: int
    entity_count: int
    index_type: str
    error: str
    index_type_error: str

class CollectionResponse(BaseModel):
    status: str
    collections: List[CollectionInfo]


def build_milvus_client(host: str, port: int) -> MilvusClient:
    return MilvusClient(uri=f"http://{host}:{port}")


def fetch_collection_info(client: MilvusClient, name: str) -> CollectionInfo:
    collection_info = CollectionInfo(
        name=name,
        description="",
        loaded=-1,
        entity_count=-1,
        index_type="",
        error="",
        index_type_error=""
    )
    try:
        collection_info.entity_count = client.get_collection_stats(collection_name=name).get('row_count', -1)
    except Exception as e:
        collection_info.error = str(e)
    try:
        c_desc = client.describe_collection(collection_name=name)
        collection_info.description = str(c_desc.get("description", "")),
    except Exception as e:
        collection_info.error = f"{collection_info.error}; {str(e)}"
    try:
        collection_info.loaded = int(client.get_load_state(collection_name=name)["state"])
    except Exception as e:
        collection_info.error = f"{collection_info.error}; {str(e)}"
    try:
        i_desc = client.describe_index(collection_name=name, index_name="embedding")
        collection_info.index_type = i_desc.get("index_type", "N/A") if i_desc else "N/A"
    except Exception as e:
        collection_info.index_type_error = f"{collection_info.error}; {str(e)}"
    return collection_info


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


class IndexingResponse(BaseModel):
    status: str = "success"
    indexing: bool = False
    message: str = ""


@router.get("/indexing", response_model=IndexingResponse)
def is_indexing(
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
                coll = Collection(name=name)
                desc = client.describe_collection(name)
                indexes = get_indexes(coll)
                for ixn in indexes.values():
                    progress = utility.index_building_progress(collection_name=name,
                                                               index_name=ixn['index_name'])
                    if progress.get("pending_index_rows"):
                        return IndexingResponse(indexing=True)
    except Exception as e:
        print(f"Failed to check indexing: {e}")
        traceback.print_exc()
        return IndexingResponse(status="error", message=str(e))
    return IndexingResponse(indexing=False)


@router.post("/collections/load")
def load_collection(
    payload: Dict = Body(...),
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    try:
        fields:list = payload.get("fields", None)
        name = payload.get("name")
        print(f"NAME: {name}; FIELDS: {fields}; HOST: {host}")
        print(f"About to load {name} collection")
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            if fields:
                client.load_collection(name, load_fields=fields)
            else:
                client.load_collection(name)
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


@router.post("/collection/rename")
def rename_collection(
    payload: Dict = Body(...),
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    old_name = payload.get("old_name")
    new_name = payload.get("new_name")

    if not old_name or not new_name:
        return {"status": "error", "message": "Missing 'old_name' or 'new_name'"}

    try:
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            client.rename_collection(old_name=old_name, new_name=new_name)
        return {"status": "success", "message": f"Collection '{old_name}' renamed to '{new_name}'."}
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


@router.post("/collections/compact")
def drop_collection(
    name: str = Query(...),
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    print(f"Compact collection called: '{name}")
    try:
        client = build_milvus_client(host, port)
        with milvus_connection(alias, host, port):
            client.compact(name)
        return {"status": "success", "message": f"Collection compaction started for '{name}'."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


class CollectionDetailsResponse(BaseModel):
    collection_id: int = 0
    status: str
    name: str
    description: str
    schema: List[Dict]
    index_type: str = "Not Indexed"
    entity_count: int
    load_state: int
    shard_num: int
    auto_id: bool
    index_info: List[Dict] = []


def map_data_type(datatype: int):
    data_type_map = {
        0: "None",
        1: "Boolean",
        2: "Int8",
        3: "Int16",
        4: "Int32",
        5: "Int64",
        10: "Float",
        11: "Double",
        20: "String",
        21: "Varchar",
        25: "Text",
        22: "Array",
        23: "Json",
        100: "Binary Vector",
        101: "Float Vector"
    }
    return data_type_map.get(datatype, "Unknown")


def get_fields_data(fields):
    return [
        {
            "name": field.name,
            "type": map_data_type(field.dtype),
            "description": str(field.description),
            "primary": field.is_primary,
            "auto_id": field.is_auto_id,
            "dimension": field.dim,
            # "index": indexes.get(field.name, {}).get("index_param", None) if indexes else None
        }
        for field in fields
    ]


def get_indexes(coll: Collection):
    return {idx.field_name: idx.to_dict() for idx in coll.indexes}


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
            coll = Collection(name=name)
            # print(f"==> --> COLLECTION NAME: {coll.name}")
            desc = client.describe_collection(name)
            try:
                indexes = get_indexes(coll)
                for ixn in indexes.values():
                    progress = utility.index_building_progress(collection_name=name, index_name=ixn['index_name'])
                    if not progress.get("pending_index_rows"):
                        continue
                    field = ixn.get('field')
                    if field:
                        indexes[field].update({'progress': progress})
            except MilvusException as e:
                print(f"[INFO] ====> Skipping progress for dropped index {ixn['index_name']}: {e}")

            schema_fields = get_fields_data(coll.schema.fields)



            try:
                load_state = int(client.get_load_state(collection_name=name)["state"])
            except:
                load_state = -1
            # print(f"=====>> DESC {desc}")
            return CollectionDetailsResponse(
                status="success",
                collection_id=desc["collection_id"],
                name=name,
                description=str(coll.description),
                schema=schema_fields,
                index_type=next(iter(indexes.values())).get("index_param", {}).get("index_type", "") if indexes else "",
                entity_count=coll.num_entities,
                load_state=load_state,
                index_info=list(indexes.values()),

                shard_num=coll.num_shards,
                auto_id=coll.schema.auto_id
            )

    except MilvusException as e:
        print(f"___________________________________________________")
        traceback.print_exc()
        print(f"___________________________________________________")
        return CollectionDetailsResponse(
            status="error",
            name=name,
            description="",
            schema=[],
            entity_count=-1,
            load_state=-1,
            shard_num=-1,
            auto_id=False
        )
    except Exception as e:
        print(f"___________________________________________________")
        traceback.print_exc()
        print(f"___________________________________________________")
        return CollectionDetailsResponse(
            status="error",
            name=name,
            description="",
            schema=[],
            entity_count=-1,
            load_state=-1,
            shard_num=-1,
            auto_id=False
        )


@router.post("/index/drop")
def drop_index(
    payload: Dict = Body(...),
    host: str = Query("localhost"),
    port: int = Query(19530),
    alias: str = Query("default")
):
    collection_name = payload.get("collection_name")
    field_name = payload.get("field_name")

    if not collection_name or not field_name:
        return {"status": "error", "message": "Missing 'collection_name' or 'field_name'"}

    try:
        with milvus_connection(alias, host, port):
            if not utility.has_collection(collection_name):
                return {"status": "error", "message": f"Collection '{collection_name}' not found"}
            collection = Collection(collection_name)
            collection.drop_index(index_name=field_name)

        return {"status": "success", "message": f"Index on field '{field_name}' dropped."}
    except Exception as e:
        print(f"Failed to drop index for field '{field_name}' in collection '{collection_name}': {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


class FieldDefinition(BaseModel):
    name: str
    type: str
    dim: Optional[int] = None
    max_length: Optional[int] = None
    is_primary: Optional[bool] = False
    auto_id: Optional[bool] = False
    element_type: Optional[str] = None


class CreateCollectionRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    fields: List[FieldDefinition]


@router.post("/collection/create")
def create_collection(request: CreateCollectionRequest, host: str = "localhost", port: str = "19530"):
    try:
        connections.connect(host=host, port=port)

        fields = []
        for f in request.fields:
            type_map = {
                "int64": DataType.INT64,
                "float": DataType.FLOAT,
                "double": DataType.DOUBLE,
                "bool": DataType.BOOL,
                "varchar": DataType.VARCHAR,
                "float_vector": DataType.FLOAT_VECTOR,
                "binary_vector": DataType.BINARY_VECTOR,
                "array": DataType.ARRAY,
                "json": DataType.JSON,
            }

            if f.type not in type_map:
                return {"status": "error", "message": f"Unsupported field type: {f.type}"}

            kwargs = {}
            if f.dim is not None:
                kwargs["dim"] = f.dim
            if f.max_length is not None:
                kwargs["max_length"] = f.max_length
            if f.element_type is not None:
                kwargs["element_type"] = getattr(DataType, f.element_type.upper(), None)
                if kwargs["element_type"] is None:
                    return {"status": "error", "message": f"Unsupported element_type: {f.element_type}"}

            field = FieldSchema(
                name=f.name,
                dtype=type_map[f.type],
                is_primary=f.is_primary,
                auto_id=f.auto_id,
                **kwargs
            )
            fields.append(field)

        schema = CollectionSchema(fields=fields, description=str(request.description) or "")
        collection = Collection(name=request.name, schema=schema)
        return {"status": "success", "message": f"Collection '{request.name}' created"}

    except Exception as e:
        return {"status": "error", "message": str(e)}
