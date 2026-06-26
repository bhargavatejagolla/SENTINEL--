import pickle
import numpy as np
import json

# Load model, scaler, explainer on startup
try:
    with open("risk_model.pkl", "rb") as f:
        model = pickle.load(f)
    print("✅ Risk model loaded.")
except FileNotFoundError:
    print("❌ risk_model.pkl not found. Run train_model.py first.")
    model = None

try:
    with open("scaler.pkl", "rb") as f:
        scaler = pickle.load(f)
    print("✅ Scaler loaded.")
except FileNotFoundError:
    print("❌ scaler.pkl not found. Run train_model.py first.")
    scaler = None

try:
    with open("shap_explainer.pkl", "rb") as f:
        explainer = pickle.load(f)
    print("✅ SHAP explainer loaded.")
except FileNotFoundError:
    print("❌ shap_explainer.pkl not found. Run train_model.py first.")
    explainer = None

# Feature names (MUST match training order)
FEATURE_NAMES = [
    "gas_avg", "gas_max", "vibration_avg", "vibration_max", 
    "pressure_avg", "temp_avg", "num_permits", "is_night", 
    "elapsed_seconds", "hot_work_present", "confined_present", 
    "maintenance_present", "gas_permits", "gas_night", 
    "vib_maintenance", "gas_hotwork"
]

def extract_features_from_live_data(live_data):
    """
    Convert live sensor data + permits + shift into the feature vector.
    """
    sensors = live_data.get("sensors", {})
    permits = live_data.get("active_permits", [])
    shift = live_data.get("shift", "DAY")
    elapsed = live_data.get("elapsed_seconds", 0)
    
    # Load topology for zone mapping
    with open("topology.json", "r") as f:
        topo = json.load(f)
    sensor_zone_map = {s["id"]: s["zone_id"] for s in topo["sensors"]}
    
    # Aggregations
    zone_gas = {}
    zone_vibration = {}
    zone_pressure = {}
    zone_temp = {}
    
    for sid, val in sensors.items():
        zone = sensor_zone_map.get(sid, "UNKNOWN")
        if "gas" in sid.lower() or sid.startswith("S") and int(sid[1:]) in [1,2,4,5,7,8,10,11,13,14,18]:
            zone_gas.setdefault(zone, []).append(val)
        elif "vibration" in sid.lower() or sid in ["S9", "S15", "S19"]:
            zone_vibration.setdefault(zone, []).append(val)
        elif "pressure" in sid.lower() or sid in ["S3", "S16", "S20"]:
            zone_pressure.setdefault(zone, []).append(val)
        elif "temperature" in sid.lower() or sid in ["S6", "S12", "S17"]:
            zone_temp.setdefault(zone, []).append(val)
    
    # Build features (cast to native Python types to avoid JSON serialization errors)
    gas_avg = float(np.mean([v for vals in zone_gas.values() for v in vals])) if zone_gas else 10.0
    gas_max = float(np.max([v for vals in zone_gas.values() for v in vals])) if zone_gas else 10.0
    vib_avg = float(np.mean([v for vals in zone_vibration.values() for v in vals])) if zone_vibration else 1.0
    vib_max = float(np.max([v for vals in zone_vibration.values() for v in vals])) if zone_vibration else 1.0
    press_avg = float(np.mean([v for vals in zone_pressure.values() for v in vals])) if zone_pressure else 80.0
    temp_avg = float(np.mean([v for vals in zone_temp.values() for v in vals])) if zone_temp else 200.0
    
    num_permits = int(len(permits))
    is_night = 1 if shift == "NIGHT" else 0
    hot_work = 1 if "P001" in permits else 0
    confined = 1 if "P002" in permits else 0
    maintenance = 1 if "P003" in permits else 0
    
    # Interaction features
    gas_permits = float(gas_avg * num_permits)
    gas_night = float(gas_avg * is_night)
    vib_maintenance = float(vib_avg * maintenance)
    gas_hotwork = float(gas_avg * hot_work)
    
    features = {
        "gas_avg": gas_avg,
        "gas_max": gas_max,
        "vibration_avg": vib_avg,
        "vibration_max": vib_max,
        "pressure_avg": press_avg,
        "temp_avg": temp_avg,
        "num_permits": num_permits,
        "is_night": is_night,
        "elapsed_seconds": float(elapsed),
        "hot_work_present": hot_work,
        "confined_present": confined,
        "maintenance_present": maintenance,
        "gas_permits": gas_permits,
        "gas_night": gas_night,
        "vib_maintenance": vib_maintenance,
        "gas_hotwork": gas_hotwork
    }
    
    # Convert to array in correct order
    feature_vector = [features[name] for name in FEATURE_NAMES]
    return np.array(feature_vector).reshape(1, -1), features

def predict_risk(live_data):
    """
    Main function called by WebSocket backend.
    Returns: { risk_score, contributors (SHAP), feature_dict }
    """
    if model is None or scaler is None or explainer is None:
        return {
            "risk_score": 50,
            "contributors": {},
            "error": "Model not loaded. Run train_model.py first."
        }
    
    try:
        # Extract features
        feature_vector, feature_dict = extract_features_from_live_data(live_data)
        
        import pandas as pd
        scaled = scaler.transform(pd.DataFrame(feature_vector, columns=FEATURE_NAMES))
        
        # Predict
        risk = float(model.predict(scaled)[0])
        risk = max(0, min(100, risk))  # Clip to 0-100
        
        # SHAP values
        shap_values = explainer.shap_values(scaled)
        shap_values = shap_values[0]  # First sample
        
        # Create contributors dict (feature_name: contribution)
        contributors = {}
        for i, name in enumerate(FEATURE_NAMES):
            val = float(shap_values[i])
            # Only show features with significant impact (>0.5 absolute)
            if abs(val) > 0.5:
                contributors[name] = round(val, 2)
        
        # Sort by absolute contribution
        contributors = dict(sorted(contributors.items(), key=lambda x: abs(x[1]), reverse=True))
        
        # Keep top 5 for UI cleanliness
        top_contributors = dict(list(contributors.items())[:5])
        
        # Risk Forecast Trajectory (+5m, +10m, +15m)
        momentum = 0
        if "gas_hotwork" in contributors and contributors["gas_hotwork"] > 0:
            momentum += 15
        if "gas_night" in contributors and contributors["gas_night"] > 0:
            momentum += 10
        if "vib_maintenance" in contributors and contributors["vib_maintenance"] > 0:
            momentum += 8
            
        fatigue = live_data.get("fatigue_index", 0.0)
        momentum += (fatigue * 20)
            
        # Calculate trajectory points
        m5 = min(100, risk + (momentum * 0.25))
        m10 = min(100, risk + (momentum * 0.5))
        m15 = min(100, risk + (momentum * 0.75))
        forecast_risk = min(100, risk + momentum) # 20m
        
        trajectory = [round(m5, 1), round(m10, 1), round(m15, 1), round(forecast_risk, 1)]
        
        return {
            "risk_score": round(risk, 1),
            "forecast_20m": round(forecast_risk, 1),
            "trajectory": trajectory,
            "contributors": top_contributors,
            "features": feature_dict
        }
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return {
            "risk_score": 50,
            "forecast_20m": 50,
            "trajectory": [50, 50, 50, 50],
            "contributors": {},
            "error": str(e)
        }

# Quick test if run directly
if __name__ == "__main__":
    # Test with sample data
    test_data = {
        "sensors": {
            "S1": 35, "S2": 38, "S4": 40, "S10": 30,
            "S9": 3.5, "S15": 3.2, "S3": 95, "S16": 100
        },
        "active_permits": ["P001", "P003"],
        "shift": "NIGHT",
        "elapsed_seconds": 65,
        "compound_alerts": [{"severity": 0.8}]
    }
    result = predict_risk(test_data)
    print("🔮 Test Prediction:")
    print(json.dumps(result, indent=2))
