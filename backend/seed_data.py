import json
import os
from neo4j import GraphDatabase

# Connection details (matches docker-compose.yml)
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")


def clear_and_seed():
    try:
        driver = GraphDatabase.driver(
            NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        with driver.session() as session:
            # 1. Wipe the database clean (for fresh start)
            print("🧹 Clearing existing graph...")
            session.run("MATCH (n) DETACH DELETE n")

            # 2. Load topology
            with open("topology.json", "r") as f:
                data = json.load(f)

            print("🌱 Seeding Zones...")
            for zone in data["zones"]:
                # FIX: Extract nested coordinates explicitly
                session.run(
                    """
                    CREATE (z:Zone {
                        id: $id, 
                        name: $name, 
                        hazard_level: $hazard_level,
                        risk_multiplier: $risk_multiplier,
                        x: $x, 
                        y: $y
                    })
                    """,
                    id=zone["id"],
                    name=zone["name"],
                    hazard_level=zone["hazard_level"],
                    risk_multiplier=zone["risk_multiplier"],
                    x=zone["coordinates"]["x"],
                    y=zone["coordinates"]["y"]
                )

            print("🔧 Seeding Equipment...")
            for eq in data["equipment"]:
                session.run(
                    """
                    MATCH (z:Zone {id: $zone_id})
                    CREATE (e:Equipment {
                        id: $id, 
                        name: $name, 
                        failure_rate: $failure_rate
                    })
                    CREATE (e)-[:LOCATED_IN]->(z)
                    """,
                    zone_id=eq["zone_id"],
                    id=eq["id"],
                    name=eq["name"],
                    failure_rate=eq["failure_rate"]
                )

            print("📡 Seeding Sensors...")
            for sensor in data["sensors"]:
                session.run(
                    """
                    MATCH (z:Zone {id: $zone_id})
                    CREATE (s:Sensor {
                        id: $id, 
                        type: $type, 
                        threshold: $threshold
                    })
                    CREATE (s)-[:MONITORS]->(z)
                    """,
                    zone_id=sensor["zone_id"],
                    id=sensor["id"],
                    type=sensor["type"],
                    threshold=sensor["threshold"]
                )

            print("📄 Seeding Permits...")
            for permit in data["permits"]:
                session.run(
                    """
                    MATCH (z:Zone {id: $zone_id})
                    CREATE (p:Permit {
                        id: $id, 
                        type: $type, 
                        status: $status,
                        issued_at: $issued_at
                    })
                    CREATE (p)-[:COVERS]->(z)
                    """,
                    zone_id=permit["zone_id"],
                    id=permit["id"],
                    type=permit["type"],
                    status=permit["status"],
                    issued_at=permit["issued_at"]
                )

            print("✅ Seeding Complete! Graph is ready.")

        driver.close()
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("💡 Make sure Neo4j is running on port 7688 (Bolt).")


if __name__ == "__main__":
    clear_and_seed()
