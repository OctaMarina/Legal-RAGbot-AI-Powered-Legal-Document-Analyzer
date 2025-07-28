# Legal-RAGbot-AI-Powered-Legal-Document-Analyzer
**Legal RAGbot** is an AI-powered legal document analyzer that uses Retrieval-Augmented Generation (RAG) to answer questions from contracts, agreements, and policy documents. Built with LangChain, Pinecone, and LLMs, it enables users to upload legal files and get clause-specific answers with source citations.

---

## 🚀 Features

- 📄 Upload PDF, DOCX, or TXT legal documents
- 🔍 Semantic search over contract clauses
- 🤖 GPT-4 answers based on retrieved context
- 📌 Clause-level source citations
- 🧠 Optional: Plain-English summarization of legalese

---

## 🧠 Tech Stack

| Layer           | Technology                             |
|-----------------|-----------------------------------------|
| LLM             | [OpenAI GPT-4](https://platform.openai.com) via `ChatOpenAI` |
| Framework       | [LangChain](https://github.com/langchain-ai/langchain) |
| Embeddings      | OpenAI `text-embedding-ada-002` / HuggingFace |
| Vector Store    | [Pinecone](https://www.pinecone.io/) for fast semantic search |
| Document Loaders| LangChain loaders (`PDFLoader`, `DocxLoader`, `TextLoader`) |
| Chunking        | `RecursiveCharacterTextSplitter` / custom clause splitter |