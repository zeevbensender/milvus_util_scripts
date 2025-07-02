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

Rename Collection
```bash
curl -X POST http://localhost:8080/api/milvus/collection/rename?host=<milvus ip> \
  -H "Content-Type: application/json"   \
  -d '{"old_name": "<old collection name>", "new_name": "<new collection name>"}'
```
