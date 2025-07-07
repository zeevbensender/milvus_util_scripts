import sys
import time

from pymilvus import MilvusClient, utility, Collection
import json


def stats(host_name, collection_name, port="19530", alias="default"):
    # 1. Set up a milvus client
    client = MilvusClient(
        uri=f"http://{host_name}:19530",
        # token="root:Milvus"
    )

    comp_res = client.compact(collection_name=collection_name)
    print(f"==> Collection Job ID: {comp_res}")

    while True:
        time.sleep(5)
        state_res = client.get_compaction_state(comp_res)
        print(f"==> Collection Compaction State: {state_res}")
        if state_res == -1 or state_res == 'Completed':
            break
    # print(f"==> Collection Description: {json.dumps(c_desc, indent=2, sort_keys=True)}; {rows}; LOADED: {loaded}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python compact.py <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]
    stats(host_name, collection_name)