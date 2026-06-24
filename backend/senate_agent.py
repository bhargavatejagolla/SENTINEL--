import os
import json
from typing import TypedDict, List, Annotated
import operator
from groq import Groq
from langgraph.graph import StateGraph, END
import graph_context

# --- Configuration ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_FREE_GROQ_API_KEY_HERE")
if GROQ_API_KEY == "YOUR_FREE_GROQ_API_KEY_HERE":
    print("⚠️ WARNING: Set GROQ_API_KEY environment variable!")

client = Groq(api_key=GROQ_API_KEY)

# --- State Definition ---
class SenateState(TypedDict):
    zone_id: str
    risk_score: float
    contributors: dict  # SHAP values
    context: dict  # From Neo4j
    messages: List[dict]  # Debate history
    votes: List[str]
    final_decision: str
    reasoning: str

# --- Agent Definitions ---
AGENTS = {
    "Safety": {
        "role": "Chief Safety Officer",
        "mandate": "Prioritize human life above all. Evacuate immediately if risk exceeds 70%.",
        "bias": "Evacuate"
    },
    "Emergency": {
        "role": "Emergency Response Coordinator", 
        "mandate": "Coordinate rapid response logistics (ambulances, fire suppression). Err on the side of evacuation if conditions degrade.",
        "bias": "Evacuate or Stop"
    },
    "Operations": {
        "role": "Operations Manager",
        "mandate": "Keep production running. Only stop if absolutely critical.",
        "bias": "Delay"
    },
    "Compliance": {
        "role": "Legal & Compliance Officer",
        "mandate": "Enforce OISD, Factory Act, DGMS regulations. Company must avoid legal liability.",
        "bias": "Stop or Evacuate"
    }
}

# System Prompts
def get_system_prompt(agent_name, context, risk_score, contributors):
    return f"""
You are the {AGENTS[agent_name]['role']} in an industrial plant.
Current Risk Score: {risk_score}% (High: >70%)
SHAP Contributors (Why risk is high): {json.dumps(contributors, indent=2)}
Plant Context: {json.dumps(context, indent=2)}
Your Mandate: {AGENTS[agent_name]['mandate']}

Decide: Should we STOP WORK, EVACUATE, or DELAY maintenance?
Provide your vote and a brief justification (2-3 sentences).
Output MUST be valid JSON: {{"vote": "Stop/Evacuate/Delay", "reasoning": "your reasoning here"}}
"""

def call_agent(state: SenateState, agent_name: str):
    """Run a single agent and return its decision."""
    context = state["context"]
    risk = state["risk_score"]
    contributors = state["contributors"]
    
    # Build conversation history
    messages = [
        {"role": "system", "content": get_system_prompt(agent_name, context, risk, contributors)}
    ]
    # Add previous debate history (so they can argue back)
    for msg in state.get("messages", []):
        messages.append(msg)
    
    # Add current agent's turn
    messages.append({"role": "user", "content": f"Agent {agent_name}, state your decision."})
    
    try:
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        vote = result.get("vote", "Delay")
        reasoning = result.get("reasoning", "No clear reasoning provided.")
        
        # Append to state
        state["messages"].append({"role": "assistant", "content": f"{agent_name}: {reasoning}"})
        state["votes"].append(vote)
        return state
    except Exception as e:
        print(f"❌ Agent {agent_name} error: {e}")
        state["messages"].append({"role": "assistant", "content": f"{agent_name}: Error occurred, defaulting to Delay."})
        state["votes"].append("Delay")
        return state

def debate_round(state: SenateState):
    """Run one full round of debate (all 4 agents)."""
    for agent in AGENTS.keys():
        state = call_agent(state, agent)
    return state

def tally_votes(state: SenateState):
    """Tally votes and decide final action."""
    votes = state["votes"]
    if not votes:
        return "Delay"
    
    # Count
    counts = {}
    for v in votes:
        counts[v] = counts.get(v, 0) + 1
    
    # Majority wins
    decision = max(counts, key=counts.get)
    state["final_decision"] = decision
    state["reasoning"] = f"Vote tally: {counts}. Final decision: {decision}."
    return state

def should_continue(state: SenateState):
    """After 2 rounds, end the debate."""
    # We will control the loop externally, but LangGraph needs a condition.
    # We'll run 2 explicit rounds by chaining.
    return "tally"

# --- Build the LangGraph ---
def run_senate(zone_id, risk_score, contributors):
    """
    Main entry point for the Senate.
    Returns: { "decision": "Stop/Evacuate/Delay", "reasoning": "...", "debate_log": [...] }
    """
    print(f"🏛️ Senate convened for Zone {zone_id} (Risk: {risk_score}%)")
    
    # 1. Get Plant Context
    context = graph_context.get_zone_context(zone_id)
    if "error" in context:
        return {"error": context["error"]}
    
    # 2. Initialize State
    initial_state = SenateState(
        zone_id=zone_id,
        risk_score=risk_score,
        contributors=contributors,
        context=context,
        messages=[],
        votes=[],
        final_decision="",
        reasoning=""
    )
    
    # 3. Run Round 1
    initial_state = debate_round(initial_state)
    
    # 4. Run Round 2 (Second chance to convince each other)
    # Reset votes for round 2 so we don't double count? No, we want cumulative votes.
    # Actually, to make it fair, we'll let them debate again and add their final votes.
    initial_state = debate_round(initial_state)
    
    # 5. Tally all votes
    final_state = tally_votes(initial_state)
    
    return {
        "decision": final_state["final_decision"],
        "reasoning": final_state["reasoning"],
        "debate_log": final_state["messages"],
        "votes": final_state["votes"],
        "context": context
    }

# --- Quick Test ---
if __name__ == "__main__":
    test_result = run_senate(
        zone_id="Z1",
        risk_score=87.5,
        contributors={"gas_night": 35.2, "gas_permits": 28.1, "gas_hotwork": 15.6}
    )
    print("🏛️ Senate Verdict:")
    print(json.dumps(test_result, indent=2))
