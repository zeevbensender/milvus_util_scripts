import os

# Folder and file structure
structure = {
    "milvus-admin-panel": {
        "backend": {
            "api": {},
            "services": {},
            "scripts": {},
            "models": {},
            "utils": {},
            "main.py": "# Entry point for FastAPI\n\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {\"msg\": \"Milvus Admin Panel backend running\"}\n",
            "Dockerfile": "FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install --no-cache-dir -r requirements.txt\nCMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n",
            "requirements.txt": "fastapi\nuvicorn\npython-multipart\n",
        },
        "frontend": {
            "public": {},
            "src": {
                "components": {},
                "pages": {},
                "api": {},
                "App.jsx": "// Entry for React app\nexport default function App() {\n  return <div>Hello from Milvus Admin Panel</div>;\n}\n",
            },
            ".env.example": "VITE_API_URL=http://localhost:8000\n",
            "Dockerfile": "FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install && npm run build\nCMD [\"npm\", \"run\", \"dev\"]\n",
            "package.json": "{\n  \"name\": \"milvus-admin-panel\",\n  \"version\": \"1.0.0\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\"\n  }\n}\n",
            "vite.config.js": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    proxy: {\n      '/api': 'http://localhost:8000',\n    }\n  }\n});\n"
        },
        ".env.example": "FASTAPI_ENV=development\n",
        "docker-compose.yml":
            "version: '3.8'\n"
            "services:\n"
            "  backend:\n"
            "    build: ./backend\n"
            "    ports:\n"
            "      - \"8000:8000\"\n"
            "    volumes:\n"
            "      - ./backend:/app\n\n"
            "  frontend:\n"
            "    build: ./frontend\n"
            "    ports:\n"
            "      - \"3000:3000\"\n"
            "    environment:\n"
            "      - VITE_API_URL=http://localhost:8000\n"
            "    depends_on:\n"
            "      - backend\n\n"
            "  milvus:\n"
            "    image: milvusdb/milvus:v2.4.0\n"
            "    ports:\n"
            "      - \"19530:19530\"\n",
        "README.md": "# 🧭 Milvus Admin Panel\n\nA web-based control panel for managing Milvus via utility scripts.\n",
        "TODO.md": "# 📋 Milvus Admin Panel – TODO List\n\n- [ ] Backend endpoints\n- [ ] Frontend connection\n- [ ] Docker setup\n"
    }
}

def create_structure(base, tree):
    for name, content in tree.items():
        path = os.path.join(base, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

if __name__ == "__main__":
    create_structure(".", structure)
    print("✅ Milvus Admin Panel scaffold created.")

