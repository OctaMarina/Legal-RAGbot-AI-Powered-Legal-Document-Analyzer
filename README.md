# 🧠 CryptoRAG Assistant — AI-Powered Knowledge Chat on Crypto

**CryptoRAG Assistant** is a full-stack AI chat platform powered by Retrieval-Augmented Generation (RAG). It allows users to ask natural language questions about crypto-related topics, with answers grounded in Wikipedia articles using semantic search. Powered by FastAPI, React, and Gemini Flash, the assistant remembers previous chat turns and provides source-aware responses.

> 💬 Ask crypto questions.  
> 🧠 Get accurate, source-cited answers from real Wikipedia articles.  
> 💾 Persist chat history.  
> 🚀 All in a clean, production-ready web app.

---

## ⚙️ Architecture Overview

- **Frontend:** React 18 + TailwindCSS 3 SPA with dynamic sidebar navigation
- **Backend:** FastAPI server with Gemini Flash (via LangChain) + ChromaDB
- **Persistence:** SQLite for chat sessions and messages
- **Vector Store:** Chroma with SentenceTransformer embeddings
- **Data:** Wikipedia Crypto Articles (`/data/Wikipedia Crypto Articles.csv`)

---

## ✨ Features

- 🧠 **RAG QA**: Uses LangChain + Gemini Flash to answer with context from vector search
- 💬 **Chat Memory**: Context-aware answers with history
- 🧾 **Source Citations**: See which Wikipedia articles were used
- 🧵 **Multi-Session Chat**: Create and manage conversation threads
- 💾 **SQLite Persistence**: Every message is stored locally
- ⚡ **Fast UI**: Clean React + Tailwind chat interface
- 🌍 **CORS Enabled**: Easily usable by any web frontend

---

## 🧠 Stack Details

| Layer           | Technology                                          |
|----------------|------------------------------------------------------|
| LLM             | [Gemini 2.0 Flash](https://ai.google.dev/) via LangChain |
| Embeddings      | `all-MiniLM-L6-v2` (SentenceTransformers)           |
| Vector Store    | [Chroma](https://www.trychroma.com/)                |
| Backend         | [FastAPI](https://fastapi.tiangolo.com/)            |
| Frontend        | React 18 + TailwindCSS + Lucide icons               |
| Persistence     | SQLite (via Python `sqlite3`)                       |
| Dataset         | Wikipedia Crypto Articles (`data/`)                 |

---

## 📁 Project Structure
```text
Crypto-RAG-Assistant/
├── app/                         # Main application folder
│   ├── client/                  # React 18 + Vite + Tailwind frontend
│   │   ├── pages/               # Route-based page components
│   │   ├── components/          # UI building blocks (chat, sidebar, etc.)
│   │   ├── public/              # Static assets
│   │   ├── App.tsx              # Routing setup using React Router 6
│   │   ├── global.css           # Tailwind theme and styles
│   │   └── tailwind.config.ts   # TailwindCSS configuration
│   ├── shared/                  # Shared TypeScript types (client/server)
│   └── fastapi-server/          # FastAPI backend
│       ├── app.py               # RAG API logic and endpoints
│       └── chat_history.db      # SQLite file for persistent chat history
├── data/                        # Dataset used for vector index
│   └── Wikipedia Crypto Articles.csv
├── notebooks/                   # Jupyter notebooks and Chroma DB
│   ├── Pipeline.ipynb           # Preprocessing / vectorization pipeline
│   └── chroma_db/               # Persisted Chroma vector store
├── README.md                    # Project documentation
├── netlify.toml                 # Netlify deployment config for frontend
└── package.json                 # Vite + Express dev config (frontend)
```
# ⚙️ Environment Setup

To get started with CryptoRAG Assistant, you'll need to configure your environment correctly before running the backend and frontend components.

### 🔐 Environment Variables

Create a `.env` file inside `app/fastapi-server/` with the following content:

GOOGLE_API_KEY=your_google_api_key_here

Make sure you replace `your_google_api_key_here` with your actual key from Google AI Studio.

---

# 🚀 FastAPI Backend Setup

Step into the FastAPI backend directory:

cd app/fastapi-server

Install the dependencies:

pip install fastapi uvicorn "langchain>=0.2.0" langchain-google-genai chromadb sentence-transformers python-dotenv

Then, start the server:

uvicorn app:app --reload

This will launch the backend API at `http://localhost:8000`.

API Endpoints:
- POST /chat — Handle chat messages with memory
- GET /history/{session_id} — Retrieve message history for a session
- GET /conversations — List all sessions
- POST /reset/{session_id} — Delete a session
- GET /health — Basic health check

---

# 💻 Frontend Setup (React + Vite)

Navigate to the app directory:

cd app

Install frontend dependencies:

npm install

Start the frontend development server:

npm run dev

The frontend will run at `http://localhost:5173` and communicate with the FastAPI backend.

Make sure both the frontend and backend servers are running in parallel for full functionality.
