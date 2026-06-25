'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWebSocket } from '@/hooks/useWebSocket';

// Views
import HeroLanding from '@/components/views/HeroLanding';
import CommandCenter from '@/components/views/CommandCenter';
import AISenate from '@/components/views/AISenate';
import HistoricalMemory from '@/components/views/HistoricalMemory';
import WhatIfSimulator from '@/components/views/WhatIfSimulator';
import ExecuteIntervention from '@/components/views/ExecuteIntervention';
import CCTVAnalytics from '@/components/views/CCTVAnalytics';
import AICopilot from '@/components/AICopilot';

const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Digital Twin...</div>,
});

export default function Home() {
  const { data, isConnected } = useWebSocket();
  const [currentView, setCurrentView] = useState<'landing' | 'command' | 'twin' | 'senate' | 'history' | 'whatif' | 'execute' | 'cctv'>('landing');

  // Safely extract data
  const riskScore = data?.risk?.score || 0;
  const intelligence = data?.intelligence_layer;
  const countdown = data?.countdown;
  const senate = data?.senate;
  const compliance = data?.compliance;
  const whatif = data?.whatif;
  const action = data?.action;

  const zones = [
    { id: 'Z1', name: 'Coke Oven', x: -4, y: 2, risk_multiplier: 1.8 },
    { id: 'Z2', name: 'Gas Unit', x: 0, y: 3, risk_multiplier: 1.5 },
    { id: 'Z3', name: 'Storage', x: 4, y: 2, risk_multiplier: 1.4 },
    { id: 'Z4', name: 'Maintenance', x: -2, y: -2, risk_multiplier: 1.2 },
    { id: 'Z5', name: 'Dispatch', x: 3, y: -2, risk_multiplier: 1.1 },
  ];

  const triggerAction = async (endpoint: string) => {
    try {
      await fetch(`http://localhost:8001${endpoint}`, { method: 'POST' });
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  const navItems = [
    { id: 'command', label: 'Command Center' },
    { id: 'twin', label: 'Digital Twin' },
    { id: 'cctv', label: 'CCTV Analytics' },
    { id: 'senate', label: 'AI Senate' },
    { id: 'whatif', label: 'What-If Simulation' },
    { id: 'history', label: 'Historical Memory' },
    { id: 'execute', label: 'Execute Intervention', isCritical: true },
  ];

  if (currentView === 'landing') {
    return <HeroLanding onEnter={() => setCurrentView('command')} />;
  }

  return (
    <main className="h-screen w-screen bg-slate-950 overflow-hidden flex flex-col font-sans text-white selection:bg-cyan-500/30">
      
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 z-40 relative">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 cursor-pointer" onClick={() => setCurrentView('landing')}>
            SENTINEL-Φ
          </div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="flex gap-2">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  currentView === item.id 
                    ? item.isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : item.isCritical ? 'text-red-500/50 hover:bg-red-500/10 border border-transparent hover:border-red-500/30' : 'text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Demo Controls */}
          <div className="flex gap-2 mr-4 bg-slate-900/50 p-1 rounded-full border border-white/5">
            <button onClick={() => triggerAction('/api/scenario/monitor')} className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-[10px] hover:bg-slate-700" title="Normal">▶</button>
            <button onClick={() => triggerAction('/api/scenario/critical_incident')} className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-950 text-orange-500 text-[10px] hover:bg-orange-900" title="Incident">⚠</button>
            <button onClick={() => triggerAction('/api/scenario/explosion')} className="w-6 h-6 flex items-center justify-center rounded-full bg-red-950 text-red-500 text-[10px] hover:bg-red-900" title="Explosion">🔥</button>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isConnected ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
            <span className="text-[10px] uppercase tracking-widest font-bold">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-90">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-black z-0" />
        
        <div className="absolute inset-0 z-10">
          {currentView === 'command' && <CommandCenter riskScore={riskScore} intelligence={intelligence} countdown={countdown} sensors={data?.sensors} />}
          
          {currentView === 'twin' && (
            <div className="w-full h-full p-6 animate-in fade-in duration-700">
               <div className="w-full h-full bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                 <div className="absolute top-4 left-4 z-20 text-xs uppercase tracking-widest font-bold text-slate-400 bg-black/50 px-3 py-1 rounded-md border border-white/5 backdrop-blur-sm">Live Digital Twin (Plant A)</div>
                 <ThreeScene riskScore={riskScore} zoneData={zones} />
               </div>
            </div>
          )}

          {currentView === 'senate' && <AISenate senate={senate} compliance={compliance} />}
          {currentView === 'cctv' && <CCTVAnalytics />}
          {currentView === 'history' && <HistoricalMemory intelligence={intelligence} />}
          {currentView === 'whatif' && <WhatIfSimulator whatif={whatif} executeAction={() => triggerAction('/execute')} />}
          {currentView === 'execute' && <ExecuteIntervention onExecute={() => triggerAction('/execute')} hasExecuted={action?.status === 'Executed'} />}
        </div>

        {/* Live Timeline Overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/60 backdrop-blur-md border-l border-white/5 p-4 flex flex-col z-20">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 border-b border-white/5 pb-2">Event Timeline</div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 font-mono text-[10px]">
            {data?.timestamp && (
              <div className="flex flex-col gap-1 text-slate-300">
                <span className="text-blue-400">[{data.timestamp.split('T')[1]?.substring(0, 8)}] System Live</span>
                <span>Active Shift: {data.shift || 'DAY'}</span>
              </div>
            )}
            {data?.compound_alerts?.map((alert: any, i: number) => (
              <div key={i} className="flex flex-col gap-1 p-2 bg-red-950/30 border border-red-500/20 rounded">
                <span className="text-red-400">[{new Date().toLocaleTimeString()}] ALERT</span>
                <span className="text-white">{alert.scenario}</span>
                <span className="text-slate-400">Severity: {(alert.severity * 100).toFixed(0)}%</span>
              </div>
            ))}
            {data?.cctv?.status === 'violation' && (
              <div className="flex flex-col gap-1 p-2 bg-orange-950/30 border border-orange-500/20 rounded">
                <span className="text-orange-400">[{new Date().toLocaleTimeString()}] VISION ENGINE</span>
                <span className="text-white">PPE Violation Detected (Missing Helmet)</span>
                <span className="text-slate-400">Risk increased by +35</span>
              </div>
            )}
            {senate?.decision && (
              <div className="flex flex-col gap-1 p-2 bg-purple-950/30 border border-purple-500/20 rounded">
                <span className="text-purple-400">[{new Date().toLocaleTimeString()}] AI SENATE</span>
                <span className="text-white">Consensus Reached</span>
                <span className="text-slate-400">Action: {senate.decision}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <AICopilot />
    </main>
  );
}
