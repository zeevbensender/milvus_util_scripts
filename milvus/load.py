import sys
from pymilvus import connections, Collection, exceptions, utility

def load_collection(host_name, collection_name, port="19530", alias="default", load=True):
    try:
        print(f"Connecting to Milvus at {host_name}:{port}...")
        connections.connect(alias=alias, host=host_name, port=port)

        print(f"Collection {collection_name} exists {utility.has_collection(collection_name)}")

        print(f"Attempting to {'load' if load else 'release'} collection '{collection_name}'...")
        collection = Collection(collection_name, using=alias)

        if load:
            collection.load()
            collection.wait_for_loading()
        else:
            collection.release()
            

        print(f"✅ Collection '{collection_name}' {'successfully loaded and ready' if load else 'released'}.")
    except exceptions.MilvusException as e:
        print(f"❌ Failed to {'load' if load else 'release'} collection '{collection_name}':\n {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        connections.disconnect(alias=alias)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python load_collection.py <host_name> <collection_name> [l / r (load / release; default: load)]")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]
    load = False if len(sys.argv) == 4 and sys.argv[3] == 'r' else True

    load_collection(host_name, collection_name, load=load)