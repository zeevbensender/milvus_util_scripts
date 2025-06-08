import sys
from pymilvus import connections, Collection, exceptions, utility

def list_collections(host_name, port="19530", alias="default"):
    try:
        print(f"Connecting to Milvus at {host_name}:{port}...")
        connections.connect(alias=alias, host=host_name, port=port)

        print(f"==> COLLECTIONS: {utility.list_collections()}")

    except exceptions.MilvusException as e:
        print(f"❌ Failed to get data from Milvus: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        connections.disconnect(alias=alias)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python load_collection.py <host name>")
        sys.exit(1)

    host_name = sys.argv[1]
    list_collections(host_name)