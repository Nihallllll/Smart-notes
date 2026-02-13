import chromadb
chroma_client = chromadb.Client()

collection = chroma_client.create_collection(
    name="grimoire_documents",
    configuration={"hnsw":{"space" :"cosine"}}
    )
