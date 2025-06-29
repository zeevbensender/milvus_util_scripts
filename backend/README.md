# Milvus Admin Panel Backend

## Testing the backend
Get Collections
```bash
 curl "http://localhost:8080/api/milvus/collections?host=<milvus ip>&port=19530"
```

Get Collection Details
```bash
curl "http://localhost:8080/api/milvus/collections/<collection name>/details?host=<milvus ip>&port=19530"
```

Drop Index
```bash
curl -X POST http://localhost:8080/api/milvus/index/drop?host=<milvus ip> \
  -H "Content-Type: application/json" \
  -d '{"collection_name": "<collection name>", "field_name": "embedding"}'
  ```