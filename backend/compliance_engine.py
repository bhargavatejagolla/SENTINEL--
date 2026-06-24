import json

def check_compliance(risk_score, contributors, active_permits, senate_decision):
    """
    Deterministic Compliance Guardrail based on OISD/Factory Act rules.
    This intercepts the LLM's decision and acts as a strict veto if safety limits are breached.
    """
    
    gas_level = contributors.get("gas_avg", 0) + contributors.get("gas_night", 0) + contributors.get("gas_permits", 0)
    vibration_level = contributors.get("vibration_avg", 0) + contributors.get("vib_maintenance", 0)
    
    # Rule 1: Extreme Gas + Hot Work (OISD 105 Violation)
    # If gas contribution is very high and there's a hot work permit
    if gas_level > 20 and "hot_work" in active_permits:
        if senate_decision != "Evacuate" and senate_decision != "Stop":
            return {
                "passed": False,
                "reason": "OISD VETO: Critical gas levels detected during active hot work. Forced EVACUATE.",
                "forced_decision": "Evacuate"
            }
            
    # Rule 2: Critical Risk Threshold Override
    if risk_score > 85:
        if senate_decision == "Ignore" or senate_decision == "Delay":
            return {
                "passed": False,
                "reason": "FACTORY ACT VETO: Absolute risk score > 85%. Cannot 'Ignore'. Forced STOP WORK.",
                "forced_decision": "Stop"
            }
            
    # Rule 3: High Vibration + Maintenance
    if vibration_level > 5 and "maintenance" in active_permits:
        if senate_decision == "Ignore":
            return {
                "passed": False,
                "reason": "SAFETY VETO: Extreme equipment vibration during maintenance. Forced STOP WORK.",
                "forced_decision": "Stop"
            }

    # If no hard rules are violated, the LLM's decision stands.
    return {
        "passed": True,
        "reason": "Compliance Verified. LLM decision complies with safety limits.",
        "forced_decision": senate_decision
    }
