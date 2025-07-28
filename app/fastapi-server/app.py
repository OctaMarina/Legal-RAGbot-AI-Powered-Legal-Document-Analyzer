"""app.py
Conversation RAG backend (Gemini Flash + Chroma)
================================================
A minimal FastAPI server that powers a ChatGPT‑like UI:

* **POST /chat** → chat with `session_id`; history is persisted in SQLite.
* **GET /history/{session_id}** → full thread for one session.
* **GET /conversations** → list all sessions with message counts & last activity.
* **POST /reset/{session_id}** → delete one conversation.

Run:
```bash
pip install fastapi uvicorn "langchain>=0.2.0" langchain-google-genai chromadb \
            sentence-transformers python-dotenv
export GOOGLE_API_KEY=YOUR_KEY
uvicorn app:app --reload
```
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain.chat_models import init_chat_model
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from langchain_chroma import Chroma
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever
from langchain.chains.combine_documents import create_stuff_documents_chain

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

load_dotenv()

DB_PATH = Path("chat_history.db")
PERSIST_DIR = Path("../../notebooks/chroma_db")
COLLECTION_NAME = "articles_collection"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
LLM_MODEL = "gemini-2.0-flash"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY env var.")

# -----------------------------------------------------------------------------
# SQLite helpers (no additional abstraction – keep it simple)
# -----------------------------------------------------------------------------

def init_db() -> None:
    """Create the messages table if absent."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT CHECK(role IN ('human','ai')) NOT NULL,
                content TEXT NOT NULL,
                ts DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def fetch_history(session_id: str) -> List[BaseMessage]:
    """Return chat history as LangChain Message objects."""
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        ).fetchall()
    history: List[BaseMessage] = []
    for role, content in rows:
        history.append(HumanMessage(content=content) if role == "human" else AIMessage(content=content))
    return history


def save_message(session_id: str, role: Literal["human", "ai"], content: str) -> None:
    """Insert one message."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, role, content),
        )
        conn.commit()


def delete_history(session_id: str) -> None:
    """Remove all messages of a conversation."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.commit()


def list_conversations():
    """Return session id, message count and last timestamp for every conversation."""
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT session_id, COUNT(*) AS total, MAX(ts) AS last_ts
            FROM messages
            GROUP BY session_id
            ORDER BY last_ts DESC
            """
        ).fetchall()
    return [{"session_id": sid, "messages": total, "last_activity": last_ts} for sid, total, last_ts in rows]


init_db()

# -----------------------------------------------------------------------------
# Vector store & chains (loaded once)
# -----------------------------------------------------------------------------

if not PERSIST_DIR.exists():
    raise RuntimeError(f"Vector store directory not found: {PERSIST_DIR}")

embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)
vectorstore = Chroma(
    collection_name=COLLECTION_NAME,
    persist_directory=str(PERSIST_DIR),
    embedding_function=embeddings,
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

llm = init_chat_model(LLM_MODEL, model_provider="google_genai", api_key=GOOGLE_API_KEY)

contextualize_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Rewrite the user's last question as a standalone query, using the chat history for context. Don't answer the question.",
        ),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

history_aware_retriever = create_history_aware_retriever(llm, retriever, contextualize_prompt)

qa_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a helpful assistant. Use the provided context to answer."),
        ("system", "Context: {context}"),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ]
)

rag_chain = create_stuff_documents_chain(llm, qa_prompt)

# -----------------------------------------------------------------------------
# FastAPI
# -----------------------------------------------------------------------------

app = FastAPI(title="Gemini‑Chroma Chat")

# Allow browser-based front‑ends to hit the API directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Chat with the assistant. Provide *session_id* to continue a thread."""
    history = fetch_history(req.session_id)

    try:
        docs: List[Document] = history_aware_retriever.invoke({"input": req.message, "chat_history": history})
        answer: str = rag_chain.invoke({"input": req.message, "chat_history": history, "context": docs})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # Deduplicate source titles
    seen, sources = set(), []
    for d in docs:
        title = d.metadata.get("title") or d.metadata.get("source") or "Unknown"
        if title not in seen:
            sources.append(title)
            seen.add(title)

    save_message(req.session_id, "human", req.message)
    save_message(req.session_id, "ai", answer)

    return ChatResponse(answer=answer, sources=sources)


@app.get("/history/{session_id}")
async def history(session_id: str):
    """Return full message list for *session_id*."""
    msgs = fetch_history(session_id)
    return [{"role": "human" if isinstance(m, HumanMessage) else "ai", "content": m.content} for m in msgs]


@app.get("/conversations")
async def conversations():
    """List all conversations with basic stats."""
    return list_conversations()


@app.post("/reset/{session_id}")
async def reset(session_id: str):
    """Delete all stored messages for *session_id*."""
    delete_history(session_id)
    return {"status": "reset", "session_id": session_id}


@app.get("/health")
async def health():
    """Simple health-check endpoint."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
