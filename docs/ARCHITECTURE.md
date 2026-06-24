# 🏛️ Architecture Pipeline

SENTINEL-Φ is a highly concurrent, multi-layered data pipeline designed for sub-second latency and absolute deterministic safety.

## 1. The Ingestion Layer
- **IoT Simulator:** Injects 20 distinct sensors across 5 zones.
- **YOLOv8 Vision:** Processes CCTV feeds to detect unauthorized human intrusion.
- **Redis Streams:** Acts as the high-throughput, low-latency message bus orchestrating all events.

## 2. The Intelligence Layer
- **XGBoost Risk Engine:** Processes the Redis stream to calculate Compound Risk momentum and predictive trajectories (+5m, +10m, +15m).
- **SHAP Explainer:** Provides Explainable AI (XAI) feature importance for every prediction.
- **Operator Reliability Math:** Aggregates shift fatigue + zone intrusions to score human error probability.

## 3. The Orchestration Layer
- **LangGraph Multi-Agent Senate:** Safety, Operations, Compliance, and Emergency agents debate the intervention strategy.
- **ChromaDB RAG Memory:** Vector search against historical plant fatalities to find identical compound parameters.
- **Deterministic Compliance Guardrail:** A hardcoded Python layer checking against `oisd_rules.json` that physically prevents the LLM from taking unsafe actions.
- **Monte Carlo Simulator:** Runs 500 what-if scenarios to predict financial vs. risk reduction impacts for different interventions.

## 4. The Execution Layer
- **Next.js Real-time Dashboard:** Consumes WebSocket streams to render the Intelligence UI.
- **Multilingual Audio Dispatch:** Triggers specific physical zone alerts.
- **PostgreSQL Industrial Black Box:** Writes an immutable, SHA-256 hashed JSON record of every sensor state, AI vote, and final action for forensic auditing.
