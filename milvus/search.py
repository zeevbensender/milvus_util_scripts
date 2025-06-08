import sys
from pymilvus import MilvusClient, utility
import json
import random

from jsonpath_rw_ext import parse




def extract_field_info(data):
    # Print the entire data structure to inspect
    # print(json.dumps(data, indent=2))

    # Define the JSONPath expression to filter the field where 'type' == 101
    jsonpath_expr = parse('$.fields[?(@.type==101)]')

    # Use the expression to find the matching field
    matches = [match.value for match in jsonpath_expr.find(data)]

    # Check if we found a matching field
    if not matches:
        print(f"Error: no fields with type equals 101 in {json.dumps(data, indent=2)}")
        return None, None

    # Assuming the result contains exactly one match, we can extract the 'name' and 'dim'
    field = matches[0]
    return field['name'], field['params']['dim']


def generate_random_floats(n):
    random_floats = []
    for _ in range(n):
        # Generate a random float in the range [-1, 1], excluding 0
        rand_float = random.uniform(-1, 1)
        while rand_float == 0:
            rand_float = random.uniform(-1, 1)
        random_floats.append(rand_float)
    return random_floats

def search(host_name, collection_name, port="19530", alias="default"):
    # 1. Set up a milvus client
    client = MilvusClient(
        uri=f"http://{host_name}:19530",
        # token="root:Milvus"
    )

    c_desc = client.describe_collection(collection_name=collection_name)
    field_name, dim = extract_field_info(c_desc)
    if not field_name or not dim:
        exit(1)
    request = generate_random_floats(dim)
    res =  client.search(collection_name=collection_name, anns_field=field_name, limit=5, data=[request], search_params={"metric_type": "L2"})
    for hits in res:
        for hit in hits:
            print(hit)
    

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python search.py <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    collection_name = sys.argv[2]
    search(host_name, collection_name)