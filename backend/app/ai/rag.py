"""
RAG (Retrieval-Augmented Generation) da AURA.
Usa ChromaDB para busca semântica na base de conhecimento institucional.
"""
from typing import List, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from app.core.config import settings
from loguru import logger


class AuraRAG:
    def __init__(self):
        self._chroma_client: Optional[chromadb.AsyncHttpClient] = None
        self._vectorstore: Optional[Chroma] = None
        self._embeddings = OpenAIEmbeddings(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_EMBEDDING_MODEL,
        )

    async def initialize(self):
        try:
            self._chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
            )
            self._vectorstore = Chroma(
                client=self._chroma_client,
                collection_name=settings.CHROMA_COLLECTION,
                embedding_function=self._embeddings,
            )
            logger.info("RAG/ChromaDB initialized successfully")
        except Exception as e:
            logger.warning(f"ChromaDB not available, RAG disabled: {e}")
            self._vectorstore = None

    async def add_documents(self, documents: List[Document]) -> None:
        if not self._vectorstore:
            return
        try:
            self._vectorstore.add_documents(documents)
            logger.info(f"Added {len(documents)} documents to RAG")
        except Exception as e:
            logger.error(f"Failed to add documents to RAG: {e}")

    async def search(self, query: str, k: int = 4, score_threshold: float = 0.6) -> List[Document]:
        if not self._vectorstore:
            return []
        try:
            results = self._vectorstore.similarity_search_with_score(query, k=k)
            filtered = [doc for doc, score in results if score >= score_threshold]
            logger.debug(f"RAG search '{query[:50]}': {len(filtered)}/{k} results above threshold")
            return filtered
        except Exception as e:
            logger.error(f"RAG search failed: {e}")
            return []

    async def format_context(self, query: str) -> str:
        docs = await self.search(query)
        if not docs:
            return "Nenhum contexto específico encontrado na base de conhecimento."

        parts = []
        for i, doc in enumerate(docs, 1):
            source = doc.metadata.get("source", "Desconhecido")
            parts.append(f"[Fonte {i} - {source}]\n{doc.page_content}")
        return "\n\n".join(parts)

    async def upsert_knowledge(self, title: str, content: str, category: str,
                                source_url: str = "", doc_id: str = "") -> str:
        doc = Document(
            page_content=f"{title}\n\n{content}",
            metadata={"title": title, "category": category, "source": source_url},
        )
        if not self._vectorstore:
            return ""
        try:
            ids = self._vectorstore.add_documents([doc])
            return ids[0] if ids else ""
        except Exception as e:
            logger.error(f"Failed to upsert knowledge: {e}")
            return ""


rag = AuraRAG()
