# Collection Details Panel Plan

---

## ✅ Step 1: Plan the Architecture

We’ll split it into:

### 🔹 Frontend

* Route: `/collections/:name`
* Component: `CollectionDetails.jsx`
* Reads `host` & `port` from `ConnectionContext`
* Fetches data from:
  `GET /api/milvus/collections/{name}/details?host=...&port=...`

### 🔹 Backend

* New route in `milvus.py`:
  `@router.get("/collections/{name}/details")`
* Returns:

  * Schema (fields)
  * Index info
  * Collection metadata (auto\_id, shard count, etc.)
  * Load state, row count
  * Segment count (if possible)

---

## ✅ Step 2: Backend – Generate Endpoint

Let’s begin by adding the **`/collections/{name}/details`** endpoint to `milvus.py`.

