import sys
from pymilvus import connections, Collection, exceptions, utility,  MilvusClient
import json

def collect_stats(host_name, collection_name, port="19530", alias="default", load=True):
    try:
        print(f"Connecting to Milvus at {host_name}:{port}...")
            # 1. Set up a milvus client
        client = MilvusClient(
        uri=f"http://{host_name}:19530",
        # token="root:Milvus"
    )

        connections.connect(alias=alias, host=host_name, port=port)

        print(f"Collection {collection_name} exists {utility.has_collection(collection_name)}")
        res = client.get_load_state(collection_name=collection_name)
        print(res)
        
        collection = Collection(collection_name, using=alias)
        print(f"Entities num: {collection.num_entities}")
        c_desc = client.describe_collection(collection_name=collection_name)
        print(f"Collection desc: {json.dumps(c_desc, indent=2)}")

        
        # print(collection.query("id"))
    except exceptions.MilvusException as e:
        print(f"❌ Failed to test collection '{collection_name}':\n {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        connections.disconnect(alias=alias)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python health.py <host_name> <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]

    collect_stats(host_name, collection_name)