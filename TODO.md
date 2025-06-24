# Milvus Admin Panel – Project TODO

## ✅ Implemented Features

### Backend (FastAPI)

- `/ping` endpoint with error handling
- `/collections` to list collections with:
  - Entity count
  - Index type
  - Load state (0–3 enum)
- Async collection actions:
  - `/collections/load`
  - `/collections/release`
  - `/collections/drop`

### Frontend (React + Bootstrap)

- ConnectionPanel.jsx:
  - Auto-connect to last-used host (localStorage)
  - Connection status shown at top
- CollectionsPanel.jsx:
  - Table displays name, desc, index type, load state, entity count
  - Buttons for Load / Release / Drop
  - Drop confirms with a dialog
  - Load & Release show spinners
  - Toast-based success/error messages
  - Collection list is polled periodically (30s)
  - Sorting by any column, always secondary-sorted by name
  - Sort is persisted across reloads

### Docker / Deploy

- Backend Dockerfile for FastAPI server
- Frontend Dockerfile using Vite build + Nginx
- `docker-compose.yaml` to run backend + frontend in sync

---

## 🔥 Next Priority Feature: Collection Details Panel

A new detailed panel showing complete metadata for a single collection.

### Frontend:

- New route: `/collections/:name`
- New component: `<CollectionDetails />`
  - Fetches schema, index info, row count, segments, load state
  - Shows loading & error state
  - Back button to return to main collection list
- Collection name in table becomes a link

### Backend:

- New endpoint: `/collections/{name}/details`
  - Returns: schema, stats, load state, segment info, index types
  - Enhances and decomposes existing `fetch_collection_info()` logic

---

## 🧊 Future Milestones (After Details Panel)

### 1. UI Polish & Feedback
- Improve empty state / error handling
- Add success/failure icons to table rows

### 2. Collection Creation
- Add button to create new collection (form UI)
- Backend endpoint to create collection

### 3. Advanced Metrics
- Show index size, memory usage, segment count
- Visualize load state or memory graphically

### 4. Search & Filtering
- Add input for client-side filter in table
- Highlight search results / apply dynamic filtering

### 5. Authentication & Profiles
- Support token-based auth for secured Milvus instances
- Save multiple connection configs (like pgAdmin profiles)
