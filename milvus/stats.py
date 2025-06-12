import sys
from pymilvus import MilvusClient, utility, Collection
import json


def stats(host_name, collection_name, port="19530", alias="default"):
    # 1. Set up a milvus client
    client = MilvusClient(
        uri=f"http://{host_name}:19530",
        # token="root:Milvus"
    )

    # 2. Create a collection
    # client.create_collection(collection_name="test_collection", dimension=5)
    # 3. Describe the collection
    rows = client.get_collection_stats(collection_name=collection_name)
    loaded = int(client.get_load_state(collection_name=collection_name)["state"])

    c_desc = client.describe_collection(collection_name=collection_name)

    print(f"==> Collection Description: {json.dumps(c_desc, indent=2, sort_keys=True)}; {rows}; LOADED: {loaded}")
    

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python load_collection.py <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]
    stats(host_name, collection_name)