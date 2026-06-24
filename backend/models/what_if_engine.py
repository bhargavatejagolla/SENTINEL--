import json
import random
from agents import senate_agents
import numpy as np
from datetime import datetime

# Load topology for zone risk multipliers
with open("topology.json", "r") as f:
    TOPOLOGY = json.load(f)

def get_zone_coords(zone_id):
    """Get the X, Y coordinates of a zone for ghost pathfinding."""
    for z in TOPOLOGY["zones"]:
        if z["id"] == zone_id:
            return z["coordinates"]["x"], z["coordinates"]["y"]
    return 0, 0

def run_monte_carlo(zone_id, risk_score, contributors, num_iterations=500):
    """
    Runs 500 simulations for 3 scenarios.
    Returns probabilities, costs, and a ghost evacuation path.
    """
    # Base variables
    zone_multiplier = 1.0
    for z in TOPOLOGY["zones"]:
        if z["id"] == zone_id:
            zone_multiplier = z["risk_multiplier"]
            break
    
    # Extract key contributors
    gas_contrib = contributors.get("gas_avg", 0) + contributors.get("gas_night", 0) + contributors.get("gas_permits", 0)
    vib_contrib = contributors.get("vibration_avg", 0) + contributors.get("vib_maintenance", 0)
    
    # Normalize risk to 0-1 for simulation
    base_risk = risk_score / 100.0
    
    # Scenario A: IGNORE (Do nothing)
    success_rate_a = max(0, 1 - (base_risk * 1.2 * zone_multiplier))
    cost_a = 4.2 + (base_risk * 3.5)  # Crores (₹4.2Cr base + escalation)
    
    # Scenario B: STOP WORK (Immediate intervention)
    success_rate_b = max(0, 1 - (base_risk * 0.15 * zone_multiplier))
    cost_b = 0.5 + (base_risk * 0.3)  # Crores (downtime cost)
    
    # Scenario C: EVACUATE (Full evacuation)
    success_rate_c = max(0, 1 - (base_risk * 0.05 * zone_multiplier))
    cost_c = 1.8 + (base_risk * 0.5)  # Crores (evacuation + restart)
    
    # Run Monte Carlo
    outcomes = {"Ignore": [], "Stop": [], "Evacuate": []}
    for _ in range(num_iterations):
        # Add random noise
        noise = random.gauss(0, 0.05)
        outcomes["Ignore"].append(1 if random.random() < (success_rate_a + noise) else 0)
        outcomes["Stop"].append(1 if random.random() < (success_rate_b + noise) else 0)
        outcomes["Evacuate"].append(1 if random.random() < (success_rate_c + noise) else 0)
    
    # Calculate probabilities (chance of survival / success)
    prob_ignore = np.mean(outcomes["Ignore"])
    prob_stop = np.mean(outcomes["Stop"])
    prob_evacuate = np.mean(outcomes["Evacuate"])
    
    # Determine best plan
    plans = [
        {"id": "A", "name": "Ignore", "success_rate": round(prob_ignore * 100, 1), "cost": round(cost_a, 2), "risk_reduction": 0},
        {"id": "B", "name": "Stop Work", "success_rate": round(prob_stop * 100, 1), "cost": round(cost_b, 2), "risk_reduction": round((base_risk - (base_risk * 0.15)) * 100, 1)},
        {"id": "C", "name": "Evacuate", "success_rate": round(prob_evacuate * 100, 1), "cost": round(cost_c, 2), "risk_reduction": round((base_risk - (base_risk * 0.05)) * 100, 1)}
    ]
    best_plan = max(plans, key=lambda x: (x["success_rate"], -x["cost"]))
    
    # --- GHOST EVACUATION PATH (For 3D visualization) ---
    # If risk is high, the ghost moves from its current position to a safe exit.
    zone_x, zone_y = get_zone_coords(zone_id)
    # Path: from danger zone to exit (roughly 10 units away)
    path = [
        {"x": zone_x, "y": zone_y, "z": 0, "t": 0},  # Start at zone
        {"x": zone_x + 2, "y": zone_y + 2, "z": 0, "t": 1},
        {"x": zone_x + 5, "y": zone_y + 4, "z": 0, "t": 2},
        {"x": zone_x + 8, "y": zone_y + 6, "z": 0, "t": 3},
        {"x": zone_x + 10, "y": zone_y + 8, "z": 0, "t": 4},  # Safe exit
    ]
    
    return {
        "zone_id": zone_id,
        "plans": plans,
        "best_plan": best_plan,
        "ghost_path": path,
        "summary": f"Best action: {best_plan['name']} ({best_plan['success_rate']}% success, ₹{best_plan['cost']}Cr cost)"
    }

if __name__ == "__main__":
    # Test
    test_result = run_monte_carlo("Z1", 87.5, {"gas_avg": 35, "vibration_avg": 3.5})
    print(json.dumps(test_result, indent=2))
