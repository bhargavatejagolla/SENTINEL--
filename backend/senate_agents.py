import json
import os
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from groq import Groq

# Initialize Groq client (FREE API)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_free_groq_api_key_here")
client = Groq(api_key=GROQ_API_KEY)

# ----------------------------
# STATE DEFINITION
# ----------------------------
class SenateState(TypedDict):
    risk_score: float
    contributors: Dict[str, float]
    features: Dict[str, Any]
    permits: List[str]
    shift: str
    zone: str
    agent_votes: List[Dict[str, str]]
    final_decision: str
    final_reason: str

# ----------------------------
# AGENT PROMPTS
# ----------------------------
AGENTS = {
    "Safety Sentinel": {
        "role": "Chief Safety Officer",
        "prompt": """You are the SAFETY SENTINEL. Your ONLY priority is human life.
You MUST recommend intervention if risk > 60%.
Consider: gas levels, fatigue, permits, and historical incident patterns.
Output format: {"decision": "STOP|EVACUATE|DELAY|CONTINUE", "reason": "brief reason"}"""
    },
    "Financial Officer": {
        "role": "Chief Financial Officer",
        "prompt": """You are the FINANCIAL OFFICER. You balance safety with business cost.
Calculate: downtime cost, equipment damage, regulatory fines, insurance claims.
Recommend the MOST COST-EFFECTIVE action that still maintains reasonable safety.
Output format: {"decision": "STOP|EVACUATE|DELAY|CONTINUE", "reason": "brief reason"}"""
    },
    "Operations Chief": {
        "role": "Operations Manager",
        "prompt": """You are the OPERATIONS CHIEF. You care about production continuity.
Consider: process stability, restart costs, supply chain impact.
You prefer DELAY or CONTINUE unless risk is extreme (>80%).
Output format: {"decision": "STOP|EVACUATE|DELAY|CONTINUE", "reason": "brief reason"}"""
    },
    "Compliance Lawyer": {
        "role": "Legal & Compliance Officer",
        "prompt": """You are the COMPLIANCE LAWYER. You enforce OISD, DGMS, and Factory Act regulations.
If regulations are violated, you MUST recommend STOP or EVACUATE.
Consider: permit validity, gas limits, confined space rules, worker safety laws.
Output format: {"decision": "STOP|EVACUATE|DELAY|CONTINUE", "reason": "brief reason"}"""
    }
}

# ----------------------------
# AGENT EXECUTION FUNCTION
# ----------------------------
def run_agent(agent_name: str, state: SenateState) -> Dict[str, str]:
    """Run a single agent with Groq LLM"""
    
    agent_config = AGENTS[agent_name]
    
    # Build context for the agent
    context = f"""
    Current Situation:
    - Risk Score: {state['risk_score']:.1f}%
    - Key Contributors: {json.dumps(state['contributors'], indent=2)}
    - Active Permits: {state['permits']}
    - Shift: {state['shift']}
    - Zone: {state.get('zone', 'Unknown')}
    
    Your role: {agent_config['role']}
    
    {agent_config['prompt']}
    
    Respond with ONLY valid JSON. No other text.
    """
    
    try:
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[
                {"role": "system", "content": "You are an industrial safety AI agent. Respond only with valid JSON."},
                {"role": "user", "content": context}
            ],
            temperature=0.3,
            max_tokens=200,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            "agent": agent_name,
            "decision": result.get("decision", "DELAY"),
            "reason": result.get("reason", "No reason provided")
        }
    except Exception as e:
        print(f"❌ Agent {agent_name} error: {e}")
        # Fallback decision based on risk
        if state['risk_score'] > 75:
            return {"agent": agent_name, "decision": "STOP", "reason": "High risk detected (fallback)"}
        elif state['risk_score'] > 50:
            return {"agent": agent_name, "decision": "DELAY", "reason": "Moderate risk detected (fallback)"}
        else:
            return {"agent": agent_name, "decision": "CONTINUE", "reason": "Low risk (fallback)"}

# ----------------------------
# THE SENATE DEBATE
# ----------------------------
def convene_senate(state: SenateState) -> SenateState:
    """Run all 4 agents and aggregate votes"""
    
    print("🏛️ CONVENING THE SENATE...")
    
    votes = []
    for agent_name in AGENTS.keys():
        vote = run_agent(agent_name, state)
        votes.append(vote)
        print(f"  {agent_name}: {vote['decision']} - {vote['reason'][:50]}...")
    
    state["agent_votes"] = votes
    
    # Count votes
    vote_counts = {"STOP": 0, "EVACUATE": 0, "DELAY": 0, "CONTINUE": 0}
    for v in votes:
        vote_counts[v["decision"]] += 1
    
    # Determine final decision (majority wins, tie-break: safety first)
    max_votes = max(vote_counts.values())
    top_decisions = [d for d, c in vote_counts.items() if c == max_votes]
    
    # Tie-break: prefer SAFETY (STOP > EVACUATE > DELAY > CONTINUE)
    priority = {"STOP": 4, "EVACUATE": 3, "DELAY": 2, "CONTINUE": 1}
    final_decision = max(top_decisions, key=lambda x: priority.get(x, 0))
    
    state["final_decision"] = final_decision
    
    # Generate final reasoning
    reasons = [f"{v['agent']}: {v['reason']}" for v in votes]
    state["final_reason"] = f"Senate voted {final_decision}. {', '.join(reasons)}"
    
    print(f"✅ FINAL DECISION: {final_decision}")
    return state

# ----------------------------
# MAIN FUNCTION
# ----------------------------
def run_senate(risk_score: float, contributors: Dict, features: Dict, permits: List[str], shift: str, zone: str = "Unknown") -> Dict:
    """Entry point for the Senate"""
    
    initial_state: SenateState = {
        "risk_score": risk_score,
        "contributors": contributors,
        "features": features,
        "permits": permits,
        "shift": shift,
        "zone": zone,
        "agent_votes": [],
        "final_decision": "CONTINUE",
        "final_reason": ""
    }
    
    # Run the debate
    final_state = convene_senate(initial_state)
    
    return {
        "decision": final_state["final_decision"],
        "reason": final_state["final_reason"],
        "votes": final_state["agent_votes"],
        "vote_counts": {
            "STOP": sum(1 for v in final_state["agent_votes"] if v["decision"] == "STOP"),
            "EVACUATE": sum(1 for v in final_state["agent_votes"] if v["decision"] == "EVACUATE"),
            "DELAY": sum(1 for v in final_state["agent_votes"] if v["decision"] == "DELAY"),
            "CONTINUE": sum(1 for v in final_state["agent_votes"] if v["decision"] == "CONTINUE")
        }
    }

# ----------------------------
# TEST
# ----------------------------
if __name__ == "__main__":
    # Mock test
    test_result = run_senate(
        risk_score=87.3,
        contributors={"gas_night": 35.2, "gas_permits": 28.1},
        features={},
        permits=["P001", "P003"],
        shift="NIGHT",
        zone="Z4"
    )
    print("\n📊 SENATE RESULT:")
    print(json.dumps(test_result, indent=2))
