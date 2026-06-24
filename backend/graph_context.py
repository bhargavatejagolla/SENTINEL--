import os
from neo4j import GraphDatabase
import json

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")

def get_zone_context(zone_id):
    """
    Fetch all active permits, equipment, and sensors for a given zone.
    Returns a dict that the LLM can easily understand.
    """
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    with driver.session() as session:
        # Query to get everything connected to this zone
        result = session.run(
            """
            MATCH (z:Zone {id: $zone_id})
            OPTIONAL MATCH (e:Equipment)-[:LOCATED_IN]->(z)
            OPTIONAL MATCH (s:Sensor)-[:MONITORS]->(z)
            OPTIONAL MATCH (p:Permit)-[:COVERS]->(z)
            RETURN z, 
                   collect(DISTINCT e) as equipment,
                   collect(DISTINCT s) as sensors,
                   collect(DISTINCT p) as permits
            """,
            zone_id=zone_id
        )
        
        record = result.single()
        if not record:
            driver.close()
            return {"error": f"Zone {zone_id} not found"}
        
        zone = record["z"]
        equipments = record["equipment"]
        sensors = record["sensors"]
        permits = record["permits"]
        
        context = {
            "zone": {
                "id": zone["id"],
                "name": zone["name"],
                "hazard_level": zone["hazard_level"],
                "risk_multiplier": zone["risk_multiplier"]
            },
            "equipment": [{"id": e["id"], "name": e["name"], "failure_rate": e["failure_rate"]} for e in equipments],
            "sensors": [{"id": s["id"], "type": s["type"], "threshold": s["threshold"]} for s in sensors],
            "permits": [{"id": p["id"], "type": p["type"], "status": p["status"]} for p in permits if p.get("status") == "ACTIVE"]
        }
        
    driver.close()
    return context

if __name__ == "__main__":
    # Test
    ctx = get_zone_context("Z1")
    print(json.dumps(ctx, indent=2))
