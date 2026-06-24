import time
import json
import redis
import sys

try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
except:
    try:
        r = redis.Redis(host='redis', port=6379, decode_responses=True)
        r.ping()
    except:
        print("⚠️ Cannot connect to Redis. Ensure containers are running.")
        sys.exit(1)

def push_event(data):
    r.xadd("sensor_stream", {"data": json.dumps(data)})
    print(f"▶️ Injected: {data.get('message', 'Sensor update')}")

def run_flawless_demo():
    print("🎬 STARTING SENTINEL-Φ CRITICAL INCIDENT SIMULATION 🎬")
    print("=========================================================")
    
    # 1. T+0s: Normal Operations
    print("\n[T+0s] 🟢 Normal Operations (Gas increasing slowly)")
    payload = {
        "timestamp": time.time(),
        "shift": "DAY",
        "fatigue_index": 0.2, # 20%
        "active_permits": [],
        "sensors": {"S1": 5.0, "S2": 4.0}, # Low gas
        "message": "Normal operations"
    }
    push_event(payload)
    time.sleep(5)
    
    # 2. T+5s: Shift Change & Maintenance Permit Active
    print("\n[T+5s] 🟡 Shift Change + Active Hot Work Permit")
    payload = {
        "timestamp": time.time(),
        "shift": "NIGHT",
        "fatigue_index": 0.85, # 85% fatigue
        "active_permits": ["maintenance", "hot_work"],
        "sensors": {"S1": 15.0, "S2": 18.0}, # Gas rising
        "message": "Night shift started. Hot work permit active."
    }
    push_event(payload)
    time.sleep(5)
    
    # 3. T+10s: CCTV Detects Intrusion (YOLO)
    print("\n[T+10s] 🟠 CCTV Vision Detects Worker in Zone 1")
    payload = {
        "timestamp": time.time(),
        "shift": "NIGHT",
        "fatigue_index": 0.90,
        "active_permits": ["maintenance", "hot_work"],
        "sensors": {"S1": 18.0, "S2": 22.0},
        "cctv_intrusion": True,
        "message": "CCTV Intrusion: Unauthorized personnel in Zone 1"
    }
    push_event(payload)
    time.sleep(5)
    
    # 4. T+15s: Critical Gas Spike (Triggers Senate)
    print("\n[T+15s] 🔴 Critical Gas Spike -> Triggering Multi-Agent Senate")
    payload = {
        "timestamp": time.time(),
        "shift": "NIGHT",
        "fatigue_index": 0.95,
        "active_permits": ["maintenance", "hot_work"],
        "sensors": {"S1": 45.0, "S2": 52.0}, # High gas
        "cctv_intrusion": True,
        "message": "CRITICAL RISK SPIKE"
    }
    push_event(payload)
    print("⏳ Wait for Senate Debate, Compliance Veto, and Execute Intervention on UI...")
    
    print("\n✅ DEMO SEQUENCE INJECTED. Check Dashboard.")

if __name__ == "__main__":
    run_flawless_demo()
