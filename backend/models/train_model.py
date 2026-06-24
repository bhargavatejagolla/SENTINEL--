import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb
import shap
import pickle
import os
from datetime import datetime
import random

# Import the simulator's generator function
from simulator import generate_sensor_data

# ----------------------------
# 1. GENERATE TRAINING DATA
# ----------------------------
print("🚀 Generating 10,000 training samples...")
samples = []
for i in range(10000):
    # Random elapsed time between 0 and 1000 seconds
    elapsed = random.uniform(0, 1000)
    # Random timestamp
    timestamp = datetime.now().isoformat()
    data = generate_sensor_data(timestamp, elapsed)
    
    # Extract features
    sensors = data["sensors"]
    
    # Zone-level aggregations (we have 5 zones)
    zone_gas = {}
    zone_vibration = {}
    zone_pressure = {}
    zone_temp = {}
    
    # Map sensor to zone (from topology)
    with open("topology.json", "r") as f:
        topo = json.load(f)
    sensor_zone_map = {s["id"]: s["zone_id"] for s in topo["sensors"]}
    
    for sid, val in sensors.items():
        zone = sensor_zone_map.get(sid, "UNKNOWN")
        if "gas" in sid.lower() or sid.startswith("S") and int(sid[1:]) in [1,2,4,5,7,8,10,11,13,14,18]:
            zone_gas[zone] = zone_gas.get(zone, []) + [val]
        elif "vibration" in sid.lower() or sid in ["S9", "S15", "S19"]:
            zone_vibration[zone] = zone_vibration.get(zone, []) + [val]
        elif "pressure" in sid.lower() or sid in ["S3", "S16", "S20"]:
            zone_pressure[zone] = zone_pressure.get(zone, []) + [val]
        elif "temperature" in sid.lower() or sid in ["S6", "S12", "S17"]:
            zone_temp[zone] = zone_temp.get(zone, []) + [val]
    
    # Aggregate features
    features = {
        "gas_avg": np.mean([v for vals in zone_gas.values() for v in vals]) if zone_gas else 10,
        "gas_max": np.max([v for vals in zone_gas.values() for v in vals]) if zone_gas else 10,
        "vibration_avg": np.mean([v for vals in zone_vibration.values() for v in vals]) if zone_vibration else 1,
        "vibration_max": np.max([v for vals in zone_vibration.values() for v in vals]) if zone_vibration else 1,
        "pressure_avg": np.mean([v for vals in zone_pressure.values() for v in vals]) if zone_pressure else 80,
        "temp_avg": np.mean([v for vals in zone_temp.values() for v in vals]) if zone_temp else 200,
        "num_permits": len(data.get("active_permits", [])),
        "is_night": 1 if data.get("shift") == "NIGHT" else 0,
        "elapsed_seconds": elapsed,
        "hot_work_present": 1 if "P001" in data.get("active_permits", []) else 0,
        "confined_present": 1 if "P002" in data.get("active_permits", []) else 0,
        "maintenance_present": 1 if "P003" in data.get("active_permits", []) else 0,
    }
    
    # Interaction features (THE COMPOUND INTELLIGENCE)
    features["gas_permits"] = features["gas_avg"] * features["num_permits"]
    features["gas_night"] = features["gas_avg"] * features["is_night"]
    features["vib_maintenance"] = features["vibration_avg"] * features["maintenance_present"]
    features["gas_hotwork"] = features["gas_avg"] * features["hot_work_present"]
    
    # Target: Risk Score (0-100)
    # If compound alerts exist, set risk based on severity, else baseline
    risk = 10  # Baseline safe
    if data.get("compound_alerts"):
        # Compound alert present: risk increases based on severity
        max_severity = max([a["severity"] for a in data["compound_alerts"]])
        # Add a random noise to make it realistic
        risk = 20 + (max_severity * 70) + random.uniform(-5, 5)
        risk = min(100, max(0, risk))
    else:
        # Normal fluctuation
        risk = random.uniform(2, 15)
    
    # Add some noise to make it non-trivial
    risk = min(100, max(0, risk + random.uniform(-3, 3)))
    
    features["risk"] = risk
    samples.append(features)

# Convert to DataFrame
df = pd.DataFrame(samples)
print(f"📊 Generated {len(df)} samples. Shape: {df.shape}")

# ----------------------------
# 2. TRAIN/TEST SPLIT
# ----------------------------
X = df.drop("risk", axis=1)
y = df["risk"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"📚 Training samples: {len(X_train)}, Test samples: {len(X_test)}")

# ----------------------------
# 3. SCALE FEATURES
# ----------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save scaler
with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)
print("✅ Scaler saved to scaler.pkl")

# ----------------------------
# 4. TRAIN XGBOOST MODEL
# ----------------------------
model = xgb.XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    early_stopping_rounds=20,
    eval_metric="mae"
)

print("🧠 Training XGBoost model...")
model.fit(
    X_train_scaled, y_train,
    eval_set=[(X_train_scaled, y_train), (X_test_scaled, y_test)],
    verbose=False
)

# Save model
with open("risk_model.pkl", "wb") as f:
    pickle.dump(model, f)
print("✅ Model saved to risk_model.pkl")

# ----------------------------
# 5. EVALUATE
# ----------------------------
y_pred = model.predict(X_test_scaled)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"📈 Test MAE: {mae:.2f} points")
print(f"📈 Test R2 Score: {r2:.3f}")

# ----------------------------
# 6. SHAP EXPLAINER (Pre-computed for speed)
# ----------------------------
print("🔮 Creating SHAP explainer...")
explainer = shap.TreeExplainer(model)
# Save explainer for later use
with open("shap_explainer.pkl", "wb") as f:
    pickle.dump(explainer, f)
print("✅ SHAP explainer saved to shap_explainer.pkl")

# Test SHAP on a single sample
sample = X_test.iloc[0:1]
sample_scaled = scaler.transform(sample)
shap_values = explainer.shap_values(sample_scaled)
print(f"✅ SHAP test successful. Shape: {shap_values.shape}")

print("\n🎉 Training complete! Model ready for production.")
