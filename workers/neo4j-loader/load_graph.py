from neo4j import GraphDatabase
import os, json

def main():
    uri = os.getenv("NEO4J_URI"); user = os.getenv("NEO4J_USER"); pwd = os.getenv("NEO4J_PASSWORD")
    idx_meta = os.path.join(os.getenv("INDEX_DIR","../../data/index"), "meta.jsonl")
    drv = GraphDatabase.driver(uri, auth=(user, pwd))
    with drv.session() as s, open(idx_meta, "r", encoding="utf-8") as f:
        for line in f:
            m = json.loads(line)
            s.run(
                "MERGE (d:Document {path:$p}) "
                "SET d.title=$t "
                "FOREACH (r IN $roles | MERGE (g:Group {name:r}) MERGE (d)-[:VISIBLE_TO]->(g))",
                p=m.get("path"), t=m.get("title"), roles=m.get("roles",["all"])
            )
    print("graph loaded")

if __name__ == "__main__":
    main()
