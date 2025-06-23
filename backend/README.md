# Milvus Admin Panel Backend

## Testing the backend
Get Collections
```bash
 curl "http://localhost:8080/api/milvus/collections?host=<milvus ip>&port=19530"
```

Get Collection Details
```bash
curl "http://localhost:8080/api/milvus/collections/falcon1M/details?host=172.28.50.116&port=19530"
```