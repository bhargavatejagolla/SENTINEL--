import json
import time
import random
import math
import redis
import threading
from datetime import datetime

# Connect to Redis (port 6380 on host, 6379 inside container)
try:
    r = redis.Redis(host='redis', port=6379, decode_responses=True)
    r.ping()
    print("✅ Connected to Redis")
except:
    print("⚠️ Redis not found. Running in local mode (printing only).")
    r = None

# Load topology to know which sensors exist
with open("topology.json", "r") as f:
    TOPOLOGY = json.load(f)

# Get list of all sensor IDs
SENSOR_IDS = [s["id"] for s in TOPOLOGY["sensors"]]
ZONE_IDS = [z["id"] for z in TOPOLOGY["zones"]]

# --- Compound Scenario Definitions (The "Hidden" Disasters) ---
# These trigger specific dangerous patterns that single sensors would miss.
SCENARIOS = [
    {
        "name": "Alpha: Gas Rise + Night Shift",
        "trigger_time": 15,  # seconds after start
        "duration": 30,
        "effects": {
            "S1": {"base": 35, "drift": 0.8, "noise": 2},
            "S2": {"base": 40, "drift": 0.7, "noise": 2},
            "S4": {"base": 38, "drift": 0.6, "noise": 2},
        },
        "permits": ["P003"]  # Maintenance permit active
    },
    {
        "name": "Beta: Hot Work + Gas Accumulation",
        "trigger_time": 45,
        "duration": 30,
        "effects": {
            "S10": {"base": 30, "drift": 0.9, "noise": 1.5},
            "S11": {"base": 28, "drift": 0.85, "noise": 1.5},
        },
        "permits": ["P001"]  # Hot Work permit active
    },
    {
        "name": "Gamma: Pressure Spike + Maintenance",
        "trigger_time": 75,
        "duration": 30,
        "effects": {
            "S3": {"base": 95, "drift": 1.2, "noise": 3},
            "S16": {"base": 100, "drift": 1.1, "noise": 3},
        },
        "permits": ["P003"]
    },
    {
        "name": "Delta: Vibration + Fatigue (Night Shift)",
        "trigger_time": 105,
        "duration": 30,
        "effects": {
            "S9": {"base": 3.5, "drift": 0.5, "noise": 0.3},
            "S15": {"base": 3.2, "drift": 0.4, "noise": 0.3},
            "S19": {"base": 3.8, "drift": 0.5, "noise": 0.3},
        },
        "permits": []  # No permit, just fatigue + vibration
    },
    {
        "name": "Epsilon: Temperature + Gas Overlap",
        "trigger_time": 135,
        "duration": 30,
        "effects": {
            "S6": {"base": 350, "drift": 1.1, "noise": 5},
            "S17": {"base": 400, "drift": 1.0, "noise": 5},
            "S5": {"base": 38, "drift": 0.7, "noise": 2},
        },
        "permits": ["P002"]
    },
    {
        "name": "Zeta: The \"Perfect Storm\" (Gas + Maintenance + Fatigue)",
        "trigger_time": 165,
        "duration": 45,
        "effects": {
            "S1": {"base": 42, "drift": 1.0, "noise": 2},
            "S2": {"base": 45, "drift": 0.9, "noise": 2},
            "S7": {"base": 35, "drift": 0.8, "noise": 2},
            "S8": {"base": 38, "drift": 0.7, "noise": 2},
            "S10": {"base": 30, "drift": 0.6, "noise": 2},
        },
        "permits": ["P001", "P003"]  # Hot Work + Maintenance overlapping
    }
]

# --- Baseline normal values (no drift) ---
BASELINE = {
    "S1": 10, "S2": 12, "S3": 80, "S4": 15, "S5": 18,
    "S6": 200, "S7": 8, "S8": 10, "S9": 1.2, "S10": 8,
    "S11": 10, "S12": 80, "S13": 5, "S14": 6, "S15": 1.0,
    "S16": 85, "S17": 250, "S18": 7, "S19": 1.5, "S20": 70
}

# --- The Simulator Loop ---


def generate_sensor_data(timestamp, elapsed_seconds):
    elapsed_seconds = float(elapsed_seconds)
    hour = (elapsed_seconds // 60) % 24
    
    active_permits = []
    if elapsed_seconds > 10:
        active_permits.append("P003")
    if elapsed_seconds > 40:
        active_permits.append("P001")
    if elapsed_seconds > 130:
        active_permits.append("P002")

    data = {
        "timestamp": timestamp,
        "elapsed_seconds": elapsed_seconds,
        "sensors": {},
        "active_permits": active_permits,
        "shift": "NIGHT" if hour >= 22 or hour <= 6 else "DAY",
        "compound_alerts": []
    }

    # Start with baseline
    for sid, base_val in BASELINE.items():
        data["sensors"][sid] = base_val + \
            random.uniform(-0.5, 0.5)  # Small noise

    # Apply compound scenarios
    for scenario in SCENARIOS:
        trigger = scenario["trigger_time"]
        duration = scenario["duration"]
        if trigger <= elapsed_seconds <= trigger + duration:
            progress = (elapsed_seconds - trigger) / duration  # 0 to 1

            # Mark compound alert
            data["compound_alerts"].append({
                "scenario": scenario["name"],
                "severity": min(1.0, progress * 1.5),
                "permits": scenario["permits"]
            })

            # Apply drifting effects
            for sid, params in scenario["effects"].items():
                if sid in data["sensors"]:
                    drift_factor = 1 + (params["drift"] * progress)
                    noise = random.uniform(-params["noise"], params["noise"])
                    data["sensors"][sid] = (
                        params["base"] * drift_factor) + noise

    # Cap values to realistic ranges
    for sid in data["sensors"]:
        if "gas" in sid or sid.startswith("S"):
            # Rough gas caps
            if int(sid[1:]) in [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 18]:
                data["sensors"][sid] = max(0, min(80, data["sensors"][sid]))

    return data


def run_simulator():
    print("🚀 SENTINEL-Φ Simulator Starting...")
    print("📡 Streaming data to Redis (or stdout)")
    start_time = time.time()
    counter = 0

    while True:
        elapsed = time.time() - start_time
        timestamp = datetime.now().isoformat()

        data = generate_sensor_data(timestamp, elapsed)

        # Push to Redis stream
        if r:
            try:
                r.xadd("sensor_stream", {
                    "data": json.dumps(data)
                })
                if counter % 50 == 0:
                    print(
                        f"✅ {counter} messages sent. Active scenarios: {len(data['compound_alerts'])}")
            except Exception as e:
                print(f"❌ Redis error: {e}")
        else:
            # Fallback: print to console
            if counter % 50 == 0:
                print(json.dumps(data, indent=2))

        counter += 1
        time.sleep(0.5)  # 2 messages per second


if __name__ == "__main__":
    run_simulator()
