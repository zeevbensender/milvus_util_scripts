import sys

from pymilvus import MilvusClient


def stats(host_name, job_id, port="19530", alias="default"):
    # 1. Set up a milvus client
    client = MilvusClient(
        uri=f"http://{host_name}:19530",
        # token="root:Milvus"
    )

    comp_res = client.get_compaction_state(job_id=job_id)

    print(f"==> Collection Compaction: {comp_res}")
    # print(f"==> Collection Description: {json.dumps(c_desc, indent=2, sort_keys=True)}; {rows}; LOADED: {loaded}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python compact.py <collection_name>")
        sys.exit(1)

    host_name = sys.argv[1]
    job_id = sys.argv[2]
    stats(host_name, job_id)
