import chromadb
import os

# Ensure the directory exists
os.makedirs("knowledge_base", exist_ok=True)

# Historical disaster reports to embed
INCIDENTS = [
    {
        "id": "INC-2025-VIZAG",
        "title": "Visakhapatnam Steel Plant Explosion",
        "content": "In January 2025, an explosion at the Visakhapatnam Steel Plant coke oven battery resulted in 8 fatalities. The root cause was identified as entrapped hazardous gases accumulating during a shift change, combined with an active hot work permit. Gas pressure sensors had flagged warnings 45 minutes prior, but the combination of high gas levels and active maintenance was ignored.",
        "metadata": {"type": "fatal_explosion", "key_factors": "gas, hot_work, shift_change"}
    },
    {
        "id": "INC-2022-CHEM",
        "title": "Chemical Plant Vibration Failure",
        "content": "A high-pressure pump failure led to a toxic chemical spill. The incident occurred after 3 consecutive days of elevated vibration alerts (vibration_avg > 4.0) while maintenance was repeatedly delayed. The compound risk of sustained mechanical stress and delayed permit execution caused catastrophic seal failure.",
        "metadata": {"type": "mechanical_failure", "key_factors": "vibration, delayed_maintenance"}
    },
    {
        "id": "OISD-GUIDELINE-105",
        "title": "OISD Hot Work Regulations",
        "content": "According to OISD regulations, hot work permits must be immediately revoked, and the area evacuated if LEL (Lower Explosive Limit) gases exceed 10% or if ambient gas sensors detect abnormal toxic accumulation. Simultaneous operations involving hot work and high gas pressure are strictly prohibited.",
        "metadata": {"type": "regulation", "key_factors": "gas, hot_work, compliance"}
    }
]

def build_database():
    print("🏗️ Building ChromaDB RAG Knowledge Base...")
    # Initialize ChromaDB
    client = chromadb.PersistentClient(path="./knowledge_base/chroma_db")
    
    # Create or get collection
    collection = client.get_or_create_collection(name="incident_history")
    
    # Add documents
    docs = [inc["content"] for inc in INCIDENTS]
    metadatas = [inc["metadata"] for inc in INCIDENTS]
    ids = [inc["id"] for inc in INCIDENTS]
    
    # Upsert to prevent duplication errors on re-run
    collection.upsert(
        documents=docs,
        metadatas=metadatas,
        ids=ids
    )
    
    print("✅ RAG Knowledge Base built successfully with historical incident reports.")

def query_rag(query_text, n_results=1):
    client = chromadb.PersistentClient(path="./knowledge_base/chroma_db")
    collection = client.get_or_create_collection(name="incident_history")
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    if results['documents'] and results['documents'][0]:
        return results['documents'][0]
    return []

if __name__ == "__main__":
    build_database()
    print("Test Query:", query_rag("hot work and high gas levels"))
