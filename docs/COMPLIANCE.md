# 🛑 Deterministic Compliance Engine

The biggest risk in deploying GenAI in industrial settings is **LLM Hallucination**. If the AI Senate decides to "Delay" maintenance during a critical gas leak to save money, the results are fatal.

SENTINEL-Φ solves this through a **Deterministic Compliance Guardrail**.

## How it works

Before any AI Senate decision is passed to the execution layer, it is intercepted by the `compliance_engine.py`. This engine reads from strict JSON files:
- `oisd_rules.json` (Oil Industry Safety Directorate)
- `factory_act_rules.json` (The Factories Act, 1948)

If the conditions match a mandatory evacuation rule, and the LLM Senate voted for "Delay" or "Continue", the Compliance Engine **VETOES** the AI and forces the Evacuation.

## The Guarantee
> **We do not trust the LLM with human lives. The AI advises; the Deterministic Compliance Engine governs.**
