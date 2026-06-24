'use client';

import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function Dashboard() {
  const { data, isConnected } = useWebSocket();
  const [isExecuting, setIsExecuting] = useState(false);

  const riskScore = data?.risk?.score || 0;
  const contributors = data?.risk?.contributors || {};
  const senate = data?.senate || { decision: 'Idle', reasoning: '', debate_log: [] };
  const compliance = data?.compliance || { passed: true, reason: '' };
  const action = data?.action || { status: 'Idle', message: '' };
  const shift = data?.shift || 'DAY';
  const cctv = data?.cctv || { intrusion: false, message: 'Clear' };
  const safetyCulture = data?.safety_culture || { score: 95, trend: 'Stable' };
  const intelligence = data?.intelligence_layer || { human_reliability: 100, similar_events: 0, trajectory: [0, 0, 0, 0] };
  const timeline = data?.timeline || [];
  const countdown = data?.countdown;

  const triggerScenario = async (scenario: string) => {
    try {
      await fetch(`http://localhost:8001/api/scenario/${scenario}`, { method: 'POST' });
    } catch (e) {
      console.error("Failed to trigger scenario", e);
    }
  };

  const getDecisionColor = (decision: string) => {
    if (decision === 'Stop' || decision === 'Evacuate') return 'text-red-400 border-red-400';
    if (decision === 'Delay') return 'text-yellow-400 border-yellow-400';
    return 'text-green-400 border-green-400';
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 min-h-screen text-white font-sans selection:bg-blue-500/30">
      
      {/* EXECUTED OVERLAY */}
      {action.status === 'Executed' && (
        <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center border-4 border-red-600 animate-in fade-in duration-500">
          <div className="text-8xl animate-pulse mb-6 shadow-red-500/50 drop-shadow-[0_0_35px_rgba(220,38,38,0.9)]">🚨</div>
          <h1 className="text-6xl font-black text-red-500 mb-4 tracking-tighter">EVACUATION EXECUTED</h1>
          <p className="text-white text-3xl max-w-3xl font-light">{action.message}</p>
        </div>
      )}

      {/* HEADER & SCENARIO CONTROL CENTER */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 border border-white/5 rounded-2xl p-4 shadow-lg gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            SENTINEL-Φ
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Industrial Safety OS</div>
        </div>

        {/* The Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-2">Scenario Controls:</span>
          
          <button onClick={() => triggerScenario('monitor')} className="px-4 py-2 rounded-lg bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
            <span>▶</span> Start Monitoring
          </button>
          
          <button onClick={() => triggerScenario('critical_incident')} className="px-4 py-2 rounded-lg bg-orange-900/30 hover:bg-orange-800/50 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
            <span>⚠</span> Critical Incident
          </button>
          
          <button onClick={() => triggerScenario('explosion')} className="px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
            <span>🔥</span> Emergency Scenario
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* LEFT COLUMN: Intelligence & System Status */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* THE WOW MOMENT: Intelligence Layer */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
            
            <h2 className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-6 flex justify-between items-center">
              <span className="flex items-center gap-2"><span>🧠</span> Intelligence Layer</span>
              <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold tracking-widest text-slate-300">{isConnected ? 'SYSTEM ONLINE' : 'OFFLINE'}</span>
              </div>
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Current Risk */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Compound Risk</span>
                <div className="text-4xl font-black mt-2" style={{ color: riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981' }}>
                  {Math.round(riskScore)}%
                </div>
              </div>

              {/* Trajectory */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between col-span-2 group hover:border-blue-500/50 transition-all">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Risk Trajectory (+5m / +10m / +15m)</span>
                <div className="flex items-end gap-2 mt-2 h-10">
                  {intelligence.trajectory.map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-1">
                      <span className={`text-xs font-mono ${val > 80 ? 'text-red-400' : 'text-slate-400'}`}>{val}%</span>
                      <div className="w-full bg-slate-800 rounded-t-sm relative group-hover:bg-slate-700 transition-colors" style={{ height: `${val}%` }}>
                        <div className={`absolute bottom-0 w-full rounded-t-sm ${val > 80 ? 'bg-red-500' : val > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ height: '100%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAG Memory */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Historical Memory</span>
                <div className={`text-4xl font-black mt-2 ${intelligence.similar_events > 0 ? 'text-red-500' : 'text-slate-600'}`}>
                  {intelligence.similar_events}
                </div>
                <span className="text-[9px] text-slate-500 uppercase">Similar Fatalities</span>
              </div>

              {/* Reliability */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Operator Reliability</span>
                <div className={`text-4xl font-black mt-2 ${intelligence.human_reliability < 60 ? 'text-red-500' : 'text-blue-400'}`}>
                  {intelligence.human_reliability.toFixed(0)}
                </div>
              </div>

            </div>
          </div>

          {/* Core System Analytics (SHAP & Senate) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            
            {/* SHAP Factors */}
            <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Live Risk Vectors (SHAP XAI)</span>
              <div className="space-y-3">
                {Object.entries(contributors).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-32 truncate">{key.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500" style={{ width: `${Math.min(Math.abs(value as number) * 2, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-mono font-medium ${(value as number) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      +{(value as number).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Senate & Compliance */}
            <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${!compliance.passed ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">🏛️ Autonomous Senate</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${!compliance.passed ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-900/30 text-emerald-500 border border-emerald-500/30'}`}>
                  {!compliance.passed ? 'GUARDRAIL VETO' : 'GUARDRAIL PASS'}
                </span>
              </div>
              
              <div className={`text-sm font-medium mb-3 ${!compliance.passed ? 'text-red-400' : 'text-slate-200'}`}>
                Verdict: {senate.decision.toUpperCase()} <br/>
                <span className="text-xs opacity-80 font-normal">{senate.reasoning}</span>
              </div>

              {senate.debate_log && senate.debate_log.length > 0 && (
                <div className="flex-1 bg-black/40 rounded-xl p-2 overflow-y-auto max-h-24 border border-white/5 space-y-1 scrollbar-none">
                  {senate.debate_log.map((log: string, idx: number) => (
                    <div key={idx} className="text-[10px] p-1.5 rounded border-l-2 border-blue-500/50 text-slate-300 bg-blue-950/20">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: The Drama Panel (Timeline & Action) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          {/* Action Card & Countdown */}
          <div className={`rounded-2xl p-5 border shadow-2xl transition-all relative overflow-hidden ${
              countdown !== null && countdown !== undefined 
                ? 'bg-red-950/40 border-red-500/50 shadow-red-500/20' 
                : 'bg-slate-900/50 border-white/10'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Emergency Action</span>
              {countdown !== null && countdown !== undefined && (
                <span className="animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-red-500 text-xs font-bold uppercase tracking-widest">CRITICAL</span>
                </span>
              )}
            </div>

            {countdown !== null && countdown !== undefined ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-xs text-red-400 uppercase tracking-widest font-bold mb-2">Predicted Catastrophe In</span>
                <span className="text-7xl font-mono font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                  00:{countdown.toString().padStart(2, '0')}
                </span>
                <div className="mt-6 p-3 bg-red-900/30 border border-red-500/30 rounded-xl w-full">
                  <div className="text-[10px] text-red-300 uppercase tracking-widest mb-1">Recommended Action</div>
                  <div className="text-lg font-bold text-red-500">EVACUATE ZONE Z1</div>
                  <div className="text-xs text-red-400 mt-1 opacity-80">Compliance: OISD RULE 4.3</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                <span className="text-4xl mb-2 opacity-50">🛡️</span>
                <span className="text-xs uppercase tracking-widest font-bold">Plant Secure</span>
                <span className="text-[10px] mt-1">Monitoring baseline conditions</span>
              </div>
            )}
            
            {/* Live Audio Buttons */}
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] uppercase tracking-widest font-bold py-2 rounded border border-white/5 flex items-center justify-center gap-1">
                <span>🔊</span> Hindi
              </button>
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] uppercase tracking-widest font-bold py-2 rounded border border-white/5 flex items-center justify-center gap-1">
                <span>🔊</span> Telugu
              </button>
            </div>
          </div>

          {/* Scenario Progress Timeline */}
          <div className="flex-1 bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Event Timeline</span>
            
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-2">
              {timeline.length === 0 ? (
                <div className="text-xs text-slate-600 italic">No events recorded.</div>
              ) : (
                timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-3 relative animate-in slide-in-from-right-4 fade-in">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${idx === timeline.length - 1 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-600'}`} />
                      {idx !== timeline.length - 1 && <div className="w-px h-full bg-slate-800 my-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="text-[10px] font-mono text-slate-500">{item.time}</div>
                      <div className={`text-xs mt-0.5 ${item.event.includes('Critical') || item.event.includes('VETOED') || item.event.includes('EVACUATION') ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                        {item.event}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
