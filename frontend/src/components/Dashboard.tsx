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
  const alerts = data?.compound_alerts || [];
  const shift = data?.shift || 'DAY';
  const cctv = data?.cctv || { intrusion: false, message: 'Clear' };
  const safetyCulture = data?.safety_culture || { score: 95, trend: 'Stable' };
  const intelligence = data?.intelligence_layer || { human_reliability: 100, similar_events: 0, trajectory: [0, 0, 0, 0] };
  const whatif = data?.whatif || { plans: [], best_plan: null, ghost_path: [] };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await fetch('http://localhost:8001/execute', { method: 'POST' });
    } catch (e) {
      console.error("Execution failed", e);
    }
    setTimeout(() => setIsExecuting(false), 2000);
  };

  const getDecisionColor = (decision: string) => {
    if (decision === 'Stop' || decision === 'Evacuate') return 'text-red-400 border-red-400';
    if (decision === 'Delay') return 'text-yellow-400 border-yellow-400';
    return 'text-green-400 border-green-400';
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 min-h-screen text-white font-sans selection:bg-blue-500/30">
      
      {/* Execution Overlay */}
      {action.status === 'Executed' && (
        <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center border-4 border-red-600 animate-in fade-in duration-500">
          <div className="text-7xl animate-pulse mb-6 shadow-red-500/50 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)]">🚨</div>
          <h1 className="text-5xl font-black text-red-500 mb-4 tracking-tighter">INTERVENTION EXECUTED</h1>
          <p className="text-white text-2xl max-w-3xl font-light">{action.message}</p>
          <div className="mt-8 flex gap-4">
            {action.audio_payloads && Object.keys(action.audio_payloads).map(lang => (
              <div key={lang} className="bg-red-900/40 px-6 py-2 rounded-full border border-red-700 text-red-200 uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                <span>🔊</span> {lang} AUDIO DISPATCHED
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex justify-between items-center bg-slate-900/50 border border-white/5 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
            <span className="text-sm font-bold tracking-widest text-slate-300">{isConnected ? 'SYSTEM ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="flex gap-2">
            <span className="bg-blue-900/30 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-mono">SHIFT: {shift}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-mono border ${cctv.intrusion ? 'bg-red-900/30 border-red-500/50 text-red-400 animate-pulse' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
              CCTV: {cctv.message}
            </span>
          </div>
        </div>
        <div className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          SENTINEL-Φ
        </div>
      </header>

      {/* THE WOW MOMENT: Intelligence Layer */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
        
        <h2 className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
          <span>🧠</span> SENTINEL-Φ Intelligence Layer
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* 1. Current Risk */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Compound Risk</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className={`text-4xl font-black ${riskScore > 70 ? 'text-red-500' : riskScore > 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                {Math.round(riskScore)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className={`h-full ${riskScore > 70 ? 'bg-red-500' : riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${riskScore}%` }} />
            </div>
          </div>

          {/* 2. Safety Culture */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Safety Culture</span>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-3xl font-black ${safetyCulture.score < 80 ? 'text-orange-500' : 'text-emerald-500'}`}>
                {safetyCulture.score.toFixed(1)}
              </span>
              <span className={`text-lg ${safetyCulture.trend === 'Decreasing' ? 'text-red-500' : 'text-slate-500'}`}>
                {safetyCulture.trend === 'Decreasing' ? '↘' : '→'}
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-2">Organizational Health</span>
          </div>

          {/* 3. Predictive Trajectory */}
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

          {/* 4. Near-Miss Memory */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Historical Precedent</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-4xl font-black ${intelligence.similar_events > 0 ? 'text-red-500' : 'text-slate-600'}`}>
                {intelligence.similar_events}
              </span>
            </div>
            <span className={`text-xs mt-2 ${intelligence.similar_events > 0 ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
              Similar Fatalities Found
            </span>
          </div>

          {/* 5. Human Reliability */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Operator Reliability</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-4xl font-black ${intelligence.human_reliability < 60 ? 'text-red-500' : 'text-blue-400'}`}>
                {intelligence.human_reliability.toFixed(0)}
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-2">Zone Z1 Index</span>
          </div>

        </div>
      </div>

      {/* Middle Section: Senate & SHAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* SHAP Explainability */}
        <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Risk Vectors (SHAP)</span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-500">XAI</span>
          </div>
          <div className="space-y-3 flex-1">
            {Object.entries(contributors).slice(0, 5).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-slate-300 w-28 truncate">{key.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500"
                    style={{ width: `${Math.min(Math.abs(value as number) * 2, 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-mono font-medium ${(value as number) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {(value as number) > 0 ? '+' : ''}{(value as number).toFixed(1)}
                </span>
              </div>
            ))}
            {Object.keys(contributors).length === 0 && (
              <div className="text-sm text-slate-600 flex items-center justify-center h-full italic">Baseline conditions</div>
            )}
          </div>
        </div>

        {/* Multi-Agent Senate */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              <span>🏛️</span> Autonomous Senate
            </span>
            <div className="flex items-center gap-4">
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${!compliance.passed ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-emerald-500'}`}>
                {!compliance.passed ? 'GUARDRAIL VETO' : 'GUARDRAIL PASS'}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full bg-black border ${getDecisionColor(senate.decision)}`}>
                VERDICT: {senate.decision.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className={`text-base font-medium mb-4 ${!compliance.passed ? 'text-red-400' : 'text-slate-200'}`}>
            {senate.reasoning || 'Monitoring baseline conditions...'}
          </div>
          
          {senate.debate_log && senate.debate_log.length > 0 && (
            <div className="flex-1 bg-black/40 rounded-xl p-3 overflow-y-auto max-h-32 border border-white/5 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
              {senate.debate_log.map((log: string, idx: number) => {
                const isSystem = log.includes('Error') || log.includes('monitoring');
                return (
                  <div key={idx} className={`text-xs p-2 rounded border-l-2 ${isSystem ? 'border-slate-600 text-slate-500 bg-slate-900/50' : 'border-blue-500/50 text-slate-300 bg-blue-950/20'}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: What-If Simulator & Action */}
      {whatif.plans && whatif.plans.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-2">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {whatif.plans.map((plan: any) => {
              const isBest = plan.id === whatif.best_plan?.id;
              return (
                <div key={plan.id} className={`p-4 rounded-2xl border transition-all ${isBest ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900/50 border-white/5 hover:bg-slate-800/50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-sm text-slate-200">{plan.name}</span>
                    {isBest && <span className="text-[9px] font-black tracking-widest px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">RECOMMENDED</span>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-light text-white">{plan.success_rate}%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Survival Probability</span>
                  
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono">Cost: ₹{plan.cost}Cr</span>
                    <span className={plan.risk_reduction > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                      -{plan.risk_reduction}% Risk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <button 
              onClick={handleExecute}
              disabled={isExecuting || action.status === 'Executed'}
              className="w-full h-full min-h-[140px] bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white rounded-2xl border-b-4 border-red-900 hover:border-red-700 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.3)] disabled:shadow-none group"
            >
              <span className="text-3xl font-black tracking-widest group-disabled:text-slate-600">EXECUTE</span>
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full group-disabled:text-slate-600">
                {whatif.best_plan?.name || 'INTERVENTION'} PROTOCOL
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
