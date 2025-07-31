from typing import List

from pydantic import BaseModel
from pymilvus import connections, Collection, exceptions, utility
from google.protobuf.json_format import MessageToDict

import sys

ASSUME_MAX_VECTOR_ID = 10000000000

def get_collection(host_name, collection_name, port="19530", alias="default"):
    print(f"Connecting to Milvus at {host_name}:{port}...")
    connections.connect(alias=alias, host=host_name, port=port)

    print(f"Collection {collection_name} exists {utility.has_collection(collection_name)}")

    print(f"Attempting to get segments in collection {collection_name}")
    collection = Collection(collection_name, using=alias)
    return collection


class SegmentInfo(BaseModel):
    id: int
    numRows: int
    indexName: str
    state: str



class SegmentResponse(BaseModel):
    load_state: int
    status: str
    segments:List[SegmentInfo]



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python maxid.py <host_name> <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]
    alias = "default"
    try:
            collection = get_collection(host_name=host_name, collection_name=collection_name)
            res = utility.get_query_segment_info(collection_name=collection_name)
            ret = [SegmentInfo(id=seg["segmentID"], numRows=seg["numRows"], indexName=seg["indexName"], state=seg["state"]) for seg in [MessageToDict(cont) for cont in res]]
            sr = SegmentResponse(load_state=222, status="success", segments=ret)

            # rs = [MessageToDict(cont) for cont in res]
            print(sr)
            
    finally:
        connections.disconnect(alias=alias)
