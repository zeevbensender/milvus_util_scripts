from pymilvus import connections, Collection, exceptions, utility
import sys

ASSUME_MAX_VECTOR_ID = 10000000000

def get_collection(host_name, collection_name, port="19530", alias="default"):
    print(f"Connecting to Milvus at {host_name}:{port}...")
    connections.connect(alias=alias, host=host_name, port=port)

    print(f"Collection {collection_name} exists {utility.has_collection(collection_name)}")

    print(f"Attempting to get max id in collection {collection_name}")
    collection = Collection(collection_name, using=alias)
    return collection


def is_valid_vector_id(collection: Collection, vector_id: int) -> bool:
    expr = f"id == {vector_id}"
    return collection.query(expr=expr, output_fields=["id"])

def get_max_id(collection):
    low = 0
    high = ASSUME_MAX_VECTOR_ID
    while is_valid_vector_id(collection, high):
        high *= 2
    while low < high:
        mid = (low + high + 1) // 2  # Use upper midpoint to avoid infinite loop
        if is_valid_vector_id(collection, mid):
            low = mid  # The max ID is at least mid
        else:
            high = mid - 1  # The max ID must be less than mid
    print(f"Max ID found: {low}")
    return low


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python maxid.py <host_name> <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]
    alias = "default"
    try:
            collection = get_collection(host_name=host_name, collection_name=collection_name)
            get_max_id(collection)
            
    finally:
        connections.disconnect(alias=alias)
