import sys
from pymilvus import MilvusClient, utility, Collection
import json


def stats(host_name, collection_name, new_name, port="19530", alias="default"):
    # 1. Set up a milvus client
    client = MilvusClient(
        uri=f"http://{host_name}:19530",
        # token="root:Milvus"
    )

    client.rename_collection(old_name=collection_name, new_name=new_name)

    

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python rename_collection.py <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]
    new_name = sys.argv[3]
    stats(host_name, collection_name, new_name)
