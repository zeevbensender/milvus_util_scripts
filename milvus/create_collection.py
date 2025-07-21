import argparse
from pymilvus import connections, FieldSchema, CollectionSchema, Collection, DataType


def create_collection(host, collection_name, description):
    # Connect to Milvus
    connections.connect("default", host=host, port="19530")

    # Define the fields
    fields = [
        FieldSchema(
            name="id",
            dtype=DataType.INT64,
            is_primary=True,
            auto_id=False
        ),
        FieldSchema(
            name="embedding",
            dtype=DataType.FLOAT_VECTOR,
            dim=768
        ),
        FieldSchema(
            name="source_content",
            dtype=DataType.VARCHAR,
            max_length=65535  # Assuming VARCHAR since dtype=21 (string)
        )
    ]

    # Create the collection schema
    schema = CollectionSchema(fields=fields, description=description)

    # Create the collection
    Collection(name=collection_name, schema=schema)

    print(f"Collection '{collection_name}' created successfully on {host}.")


def main():
    parser = argparse.ArgumentParser(description="Create a Milvus collection with predefined fields.")
    parser.add_argument("-a", "--host", required=True, help="Milvus host (e.g., 127.0.0.1)")
    parser.add_argument("-c", "--collection", required=True, help="Collection name")
    parser.add_argument("-d", "--description", default="", help="Collection description")

    args = parser.parse_args()
    create_collection(args.host, args.collection, args.description)


if __name__ == "__main__":
    main()
