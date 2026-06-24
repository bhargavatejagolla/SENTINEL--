import json
import os

def load_rules():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    rules = []
    
    # Load OISD Rules
    try:
        with open(os.path.join(base_dir, "oisd_rules.json"), "r") as f:
            data = json.load(f)
            rules.extend(data.get("rules", []))
    except Exception as e:
        print(f"Error loading OISD rules: {e}")
        
    return rules

def check_compliance(risk_score, contributors, active_permits, senate_decision):
    """
    Deterministic Compliance Guardrail based on OISD/Factory Act rules.
    Intercepts the LLM's decision and acts as a strict veto if safety limits are breached.
    """
    rules = load_rules()
    
    # Check each rule
    for rule in rules:
        conditions = rule.get("conditions", {})
        min_risk = conditions.get("min_risk_score", 0)
        
        # Simple dynamic evaluation
        if risk_score >= min_risk:
            # If the LLM tries to delay or continue during a forced stop/evacuate
            if senate_decision not in ["Evacuate", "Stop"]:
                return {
                    "passed": False,
                    "reason": rule.get("reason", "VETOED by Compliance Engine"),
                    "forced_decision": rule.get("forced_decision", "Evacuate")
                }
                
    # Fallback to older hardcoded rules just in case
    gas_level = contributors.get("gas_avg", 0) + contributors.get("gas_night", 0) + contributors.get("gas_permits", 0)
    
    if gas_level > 20 and "HOT_WORK_Z1" in active_permits:
        if senate_decision not in ["Evacuate", "Stop"]:
            return {
                "passed": False,
                "reason": "OISD VETO: Critical gas levels detected during active hot work. Forced EVACUATE.",
                "forced_decision": "Evacuate"
            }
            
    if risk_score > 85:
        if senate_decision in ["Ignore", "Delay"]:
            return {
                "passed": False,
                "reason": "FACTORY ACT VETO: Absolute risk score > 85%. Cannot 'Ignore'. Forced STOP WORK.",
                "forced_decision": "Stop"
            }

    # If no hard rules are violated, the LLM's decision stands.
    return {
        "passed": True,
        "reason": "Compliance Verified. LLM decision complies with safety limits.",
        "forced_decision": senate_decision
    }
