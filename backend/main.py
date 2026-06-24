from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
import redis
import threading
import time
import asyncio
from datetime import datetime
import risk_engine
import senate_agent
import what_if_engine
import black_box
from knowledge_base import build_rag
import compliance_engine

app = FastAPI(title="SENTINEL-Φ Backend", version="2.0.0")

# Initialize RAG Database on startup
try:
    build_rag.build_database()
except Exception as e:
    print(f"⚠️ Could not initialize RAG DB: {e}")

# Connect to Redis
try:
    r = redis.Redis(host='redis', port=6379, decode_responses=True)
    r.ping()
    print("✅ Backend connected to Redis")
except:
    r = None
    print("⚠️ Redis not available")

# Store latest ENHANCED data for WebSocket
latest_enhanced_data = {
    "sensors": {},
    "compound_alerts": [],
    "timestamp": "",
    "shift": "DAY",
    "permits": [],
    "risk": {"score": 10, "forecast_20m": 10, "contributors": {}, "features": {}},
    "senate": {"decision": "Idle", "reasoning": "Monitoring...", "debate_log": []},
    "compliance": {"passed": True, "reason": ""},
    "whatif": {"plans": [], "best_plan": None, "ghost_path": []},
    "blackbox": {"last_event": None},
    "action": {"status": "Idle", "message": ""},
    "cctv": {"intrusion": False, "message": "Clear"},
    "safety_culture": {"score": 95, "trend": "Stable"},
    "intelligence_layer": {
        "human_reliability": 100,
        "similar_events": 0,
        "trajectory": [10, 10, 10, 10]
    }
}

global_safety_culture = 95
consecutive_high_risk = 0

last_senate_trigger = 0
last_blackbox_record = ""

def redis_listener():
    global latest_enhanced_data, last_senate_trigger, last_blackbox_record
    if not r:
        return
    
    last_id = "$"
    while True:
        try:
            messages = r.xread({"sensor_stream": last_id}, count=1, block=1000)
            if messages:
                for stream, msgs in messages:
                    for msg_id, fields in msgs:
                        if "data" in fields:
                            raw_data = json.loads(fields["data"])
                            
                            # --- STEP 1: RISK ENGINE ---
                            risk_result = risk_engine.predict_risk(raw_data)
                            risk_score = risk_result.get("risk_score", 10)
                            forecast_20m = risk_result.get("forecast_20m", risk_score)
                            contributors = risk_result.get("contributors", {})
                            features = risk_result.get("features", {})
                            
                            # Update Safety Culture Score
                            global global_safety_culture, consecutive_high_risk
                            if risk_score > 70:
                                consecutive_high_risk += 1
                                if consecutive_high_risk > 3:
                                    global_safety_culture = max(40, global_safety_culture - 1)
                            else:
                                consecutive_high_risk = 0
                                if global_safety_culture < 95:
                                    global_safety_culture += 0.1
                                    
                            cctv_intrusion = raw_data.get("cctv_intrusion", False)
                            if cctv_intrusion:
                                global_safety_culture = max(40, global_safety_culture - 2)
                                
                            cctv_status = {
                                "intrusion": cctv_intrusion,
                                "message": "🚨 UNAUTHORIZED PERSONNEL" if cctv_intrusion else "Clear"
                            }
                            
                            safety_culture_status = {
                                "score": round(global_safety_culture, 1),
                                "trend": "Decreasing" if consecutive_high_risk > 2 else "Stable"
                            }
                            
                            # --- STEP 2: ZONE DETECTION ---
                            zone_id = "Z1"
                            sensors = raw_data.get("sensors", {})
                            zone_scores = {"Z1": 0, "Z2": 0, "Z3": 0, "Z4": 0, "Z5": 0}
                            sensor_zone_map = {"S1": "Z1", "S2": "Z1", "S3": "Z1", "S4": "Z2", "S5": "Z2", "S6": "Z2", 
                                               "S7": "Z3", "S8": "Z3", "S9": "Z3", "S10": "Z4", "S11": "Z4", "S12": "Z4",
                                               "S13": "Z5", "S14": "Z5", "S15": "Z5", "S16": "Z2", "S17": "Z1", "S18": "Z3",
                                               "S19": "Z2", "S20": "Z5"}
                            for sid, val in sensors.items():
                                if sid in sensor_zone_map:
                                    zone_scores[sensor_zone_map[sid]] += val
                            if any(zone_scores.values()):
                                zone_id = max(zone_scores, key=zone_scores.get)
                                
                            # Intelligence Layer calculations
                            fatigue_index = raw_data.get("fatigue_index", 0.0)
                            human_reliability = max(0, 100 - (fatigue_index * 100) - (20 if cctv_intrusion else 0))
                            
                            similar_events_count = 0
                            rag_context = ""
                            if risk_score > 60:
                                try:
                                    query_str = f"{raw_data.get('active_permits', [])} permit with high gas level accumulation"
                                    rag_docs = build_rag.query_rag(query_str)
                                    if rag_docs:
                                        similar_events_count = len(rag_docs)
                                        rag_context = rag_docs[0]
                                except Exception as e:
                                    pass
                                    
                            intelligence_layer = {
                                "human_reliability": round(human_reliability, 1),
                                "similar_events": similar_events_count,
                                "trajectory": risk_result.get("trajectory", [risk_score]*4)
                            }
                            
                            # --- STEP 3: SENATE & RAG & COMPLIANCE ---
                            current_time = datetime.now().timestamp()
                            senate_result = latest_enhanced_data.get("senate", {})
                            compliance_result = latest_enhanced_data.get("compliance", {"passed": True, "reason": ""})
                            whatif_result = latest_enhanced_data.get("whatif", {"plans": [], "best_plan": None, "ghost_path": []})
                            
                            if risk_score > 70 and (current_time - last_senate_trigger > 30):
                                print(f"⚡ RISK {risk_score}%! Convening Senate for {zone_id}")
                                
                                # Query RAG for historical context
                                try:
                                    query_str = "hot work permit with high gas level accumulation"
                                    rag_docs = build_rag.query_rag(query_str)
                                    rag_context = rag_docs[0] if rag_docs else ""
                                except Exception as e:
                                    rag_context = ""
                                
                                senate_result = senate_agent.run_senate(
                                    zone_id=zone_id,
                                    risk_score=risk_score,
                                    contributors=contributors
                                )
                                
                                # Deterministic Compliance Guardrail Check
                                compliance_result = compliance_engine.check_compliance(
                                    risk_score=risk_score,
                                    contributors=contributors,
                                    active_permits=raw_data.get("active_permits", []),
                                    senate_decision=senate_result.get("decision", "Unknown")
                                )
                                
                                # Override Senate if Vetoed
                                if not compliance_result["passed"]:
                                    print(f"🛑 GUARDRAIL VETO: {compliance_result['reason']}")
                                    senate_result["decision"] = compliance_result["forced_decision"]
                                    senate_result["reasoning"] = f"🛑 {compliance_result['reason']} (Original Senate vote vetoed)"
                                
                                last_senate_trigger = current_time
                                
                                # --- STEP 4: WHAT-IF & GHOST ---
                                whatif_result = what_if_engine.run_monte_carlo(
                                    zone_id=zone_id,
                                    risk_score=risk_score,
                                    contributors=contributors
                                )
                                
                                # --- STEP 5: BLACK BOX ---
                                sensor_snapshot = {k: v for k, v in list(sensors.items())[:10]}
                                blackbox_result = black_box.record_event(
                                    zone_id=zone_id,
                                    risk_score=risk_score,
                                    contributors=contributors,
                                    senate_votes=senate_result.get("votes", []),
                                    final_decision=senate_result.get("decision", "Unknown"),
                                    ghost_path=whatif_result.get("ghost_path", []),
                                    whatif_plans=whatif_result.get("plans", []),
                                    sensor_snapshot=sensor_snapshot
                                )
                                last_blackbox_record = blackbox_result.get("event_id", "")
                                
                            elif risk_score <= 70 and senate_result.get("decision") != "Idle":
                                senate_result = {"decision": "Idle", "reasoning": "Risk dropped below 70%.", "debate_log": []}
                                compliance_result = {"passed": True, "reason": ""}
                                whatif_result = {"plans": [], "best_plan": None, "ghost_path": []}
                            
                            # Reset action status if risk drops
                            if risk_score <= 70:
                                latest_enhanced_data["action"] = {"status": "Idle", "message": ""}
                                
                            # --- STEP 6: BUILD PAYLOAD ---
                            latest_enhanced_data.update({
                                "sensors": raw_data.get("sensors", {}),
                                "compound_alerts": raw_data.get("compound_alerts", []),
                                "timestamp": raw_data.get("timestamp", ""),
                                "shift": raw_data.get("shift", "DAY"),
                                "permits": raw_data.get("active_permits", []),
                                "risk": {
                                    "score": risk_score,
                                    "forecast_20m": forecast_20m,
                                    "contributors": contributors,
                                    "features": features
                                },
                                "senate": senate_result,
                                "compliance": compliance_result,
                                "whatif": whatif_result,
                                "blackbox": {"last_event": last_blackbox_record},
                                "cctv": cctv_status,
                                "safety_culture": safety_culture_status,
                                "intelligence_layer": intelligence_layer
                            })
                        last_id = msg_id
        except Exception as e:
            print(f"Redis listener error: {e}")
        time.sleep(0.1)

if r:
    thread = threading.Thread(target=redis_listener, daemon=True)
    thread.start()
    print("🔄 Redis listener thread started")

@app.get("/")
def root():
    return {"message": "SENTINEL-Φ Core v2.0", "status": "online"}

@app.get("/latest")
def get_latest():
    return latest_enhanced_data

@app.post("/execute")
def execute_plan():
    """
    Triggers the emergency response orchestrator.
    Generates multilingual audio payload, logs execution, and broadcasts status.
    """
    global latest_enhanced_data
    
    plan_name = "Evacuation"
    if latest_enhanced_data["whatif"]["best_plan"]:
        plan_name = latest_enhanced_data["whatif"]["best_plan"]["name"]
        
    # Simulate Audio Generation payload
    audio_alerts = {
        "english": f"Attention. {plan_name} protocol initiated. Please proceed to the nearest safe exit.",
        "hindi": f"Kripya dhyaan de. {plan_name} protocol shuru ho gaya hai. Surakshit raste se bahar niklein.",
        "telugu": f"Dayachesi vinandi. {plan_name} protocol prarambhamaindi. Surakshitamaina darilo bayataku vellandi."
    }
    
    action_msg = f"Executing {plan_name}. Sirens activated. SMS dispatched to 142 workers. Audio alerts broadcasting in EN, HI, TE."
    print(f"🚀 ACTION TRIGGERED: {action_msg}")
    
    latest_enhanced_data["action"] = {
        "status": "Executed",
        "message": action_msg,
        "audio_payloads": audio_alerts
    }
    
    # Log to black box as manual intervention
    black_box.record_event(
        zone_id="ALL",
        risk_score=latest_enhanced_data["risk"]["score"],
        contributors={},
        senate_votes=[],
        final_decision=f"MANUAL EXECUTION: {plan_name}",
        ghost_path=[],
        whatif_plans=[],
        sensor_snapshot={}
    )
    
    return {"status": "success", "action": latest_enhanced_data["action"]}

@app.get("/blackbox/recent")
def get_recent_events(limit: int = 10):
    return black_box.get_recent_events(limit)

@app.get("/blackbox/replay/{event_id}")
def replay_event(event_id: str):
    return black_box.replay_event(event_id)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 WebSocket client connected")
    try:
        while True:
            await asyncio.sleep(0.5)
            await websocket.send_json({
                "type": "update",
                "data": latest_enhanced_data
            })
    except WebSocketDisconnect:
        print("🔌 WebSocket client disconnected")
