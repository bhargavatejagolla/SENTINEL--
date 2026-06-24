import json
import hashlib
import psycopg2
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sentinel:sentinel123@postgres:5432/sentinel_db")

def init_db():
    """Create the black box table if it doesn't exist."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS forensic_events (
                id SERIAL PRIMARY KEY,
                event_id VARCHAR(255) UNIQUE NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                zone_id VARCHAR(10),
                risk_score FLOAT,
                contributors JSONB,
                senate_votes JSONB,
                final_decision VARCHAR(50),
                ghost_path JSONB,
                whatif_plans JSONB,
                sensor_snapshot JSONB,
                hash_sha256 VARCHAR(64) NOT NULL,
                parent_hash VARCHAR(64)
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Black Box database initialized.")
    except Exception as e:
        print(f"❌ Black Box init error: {e}")

def calculate_hash(data_string, parent_hash=""):
    """Calculate SHA-256 hash of the event."""
    combined = data_string + parent_hash
    return hashlib.sha256(combined.encode()).hexdigest()

def record_event(zone_id, risk_score, contributors, senate_votes, final_decision, ghost_path, whatif_plans, sensor_snapshot):
    """Record a single event in the black box."""
    try:
        # Get the latest parent hash (chain integrity)
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT hash_sha256 FROM forensic_events ORDER BY id DESC LIMIT 1")
        result = cur.fetchone()
        parent_hash = result[0] if result else "0" * 64
        
        # Create a unique event ID
        event_id = f"BLK-{datetime.now().strftime('%Y%m%d%H%M%S')}-{hashlib.md5(str(risk_score).encode()).hexdigest()[:6]}"
        
        # Prepare data for hashing
        data_string = json.dumps({
            "event_id": event_id,
            "zone_id": zone_id,
            "risk_score": risk_score,
            "contributors": contributors,
            "senate_votes": senate_votes,
            "final_decision": final_decision,
            "timestamp": datetime.now().isoformat()
        }, sort_keys=True)
        
        event_hash = calculate_hash(data_string, parent_hash)
        
        # Insert into DB
        cur.execute("""
            INSERT INTO forensic_events 
            (event_id, zone_id, risk_score, contributors, senate_votes, final_decision, ghost_path, whatif_plans, sensor_snapshot, hash_sha256, parent_hash)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            event_id, zone_id, risk_score, json.dumps(contributors), json.dumps(senate_votes),
            final_decision, json.dumps(ghost_path), json.dumps(whatif_plans), 
            json.dumps(sensor_snapshot), event_hash, parent_hash
        ))
        conn.commit()
        cur.close()
        conn.close()
        print(f"📦 Black Box: Recorded event {event_id} with hash {event_hash[:8]}...")
        return {"event_id": event_id, "hash": event_hash, "parent_hash": parent_hash}
    except Exception as e:
        print(f"❌ Black Box record error: {e}")
        return {"error": str(e)}

def get_recent_events(limit=10):
    """Retrieve recent events for the replay timeline."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT event_id, timestamp, zone_id, risk_score, final_decision, hash_sha256 
            FROM forensic_events 
            ORDER BY id DESC LIMIT %s
        """, (limit,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [
            {
                "event_id": r[0],
                "timestamp": r[1].isoformat(),
                "zone_id": r[2],
                "risk_score": r[3],
                "decision": r[4],
                "hash": r[5][:8] + "..."
            }
            for r in rows
        ]
    except Exception as e:
        return {"error": str(e)}

def replay_event(event_id):
    """Replay a specific event (get full details)."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM forensic_events WHERE event_id = %s
        """, (event_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {"error": "Event not found"}
        # Map to dict (columns: id, event_id, timestamp, zone_id, risk_score, contributors, senate_votes, final_decision, ghost_path, whatif_plans, sensor_snapshot, hash_sha256, parent_hash)
        return {
            "event_id": row[1],
            "timestamp": row[2].isoformat(),
            "zone_id": row[3],
            "risk_score": row[4],
            "contributors": row[5],
            "senate_votes": row[6],
            "decision": row[7],
            "ghost_path": row[8],
            "plans": row[9],
            "sensors": row[10],
            "hash": row[11],
            "parent_hash": row[12]
        }
    except Exception as e:
        return {"error": str(e)}

# Initialize on import
init_db()
