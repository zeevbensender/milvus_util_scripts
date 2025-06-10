# 📋 Milvus Admin Panel – TODO List

## ✅ Milestone 1: Core MVP Scaffold
- [x] Scaffold project structure (frontend, backend, Docker)
- [x] Create FastAPI backend and React frontend
- [x] Add /health endpoint
- [x] Make frontend call backend dynamically using hostname
- [x] Add and test ConnectionPanel component
- [x] Add real Milvus connectivity check using pymilvus

## 🚧 Milestone 2: Connection UX & Config Foundation
- [x] Add global ConnectionContext to manage connection status
- [x] Add top-right connection status bar (green/red + host:port)
- [x] Store last successful connection (host & port) in localStorage
- [x] Autofill inputs from localStorage on page load
- [x] Attempt auto-connect from saved settings
- [x] Extract hardcoded values (e.g. port 8080, 19530) into `config.js`
- [ ] Display connection errors clearly (invalid port, timeout, etc.)
- [ ] Refactor layout into shell (sidebar, topbar, content area)
- [ ] Apply minimal styling to sidebar, header, and form elements
- [ ] Optional: initialize Tailwind for future styling

## 🔜 Milestone 3: Collection Management
- [ ] Create CollectionBrowser panel in sidebar
- [ ] Call Milvus list_collections (or wrap list.py)
- [ ] Show table of collections with status and basic actions
- [ ] Enable load/unload via buttons
- [ ] Display error/success feedback on operations

## 🧪 Future Ideas
- [ ] Save multiple connection profiles (like pgAdmin)
- [ ] Add /config endpoint from backend for frontend init values
- [ ] Show Milvus version and server status in top bar
- [ ] Option to reconnect/change Milvus instance without page reload
