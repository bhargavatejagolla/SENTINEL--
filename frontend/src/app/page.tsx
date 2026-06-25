'use client';

import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

import HeroLanding from '@/components/views/HeroLanding';
import WarRoom from '@/components/views/WarRoom';
import AICopilot from '@/components/AICopilot';

export default function Home() {
  const { data, isConnected } = useWebSocket();
  const [inWarRoom, setInWarRoom] = useState(false);

  const triggerAction = async (endpoint: string) => {
    try {
      await fetch(`http://localhost:8001${endpoint}`, { method: 'POST' });
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  if (!inWarRoom) {
    return <HeroLanding onEnter={() => setInWarRoom(true)} />;
  }

  return (
    <main className="h-screen w-screen bg-slate-950 overflow-hidden flex flex-col font-sans text-white selection:bg-cyan-500/30">
      
      {/* Demo Scenario Controller (Top Right Corner floating) */}
      <div className="absolute top-2 right-2 z-50 flex gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
         <span className="text-[8px] uppercase text-slate-500 tracking-widest font-bold my-auto ml-2 mr-1">Demo Scenarios</span>
         <button onClick={() => triggerAction('/api/scenario/monitor')} className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-[10px] hover:bg-slate-700" title="Normal">▶</button>
         <button onClick={() => triggerAction('/api/scenario/critical_incident')} className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-950 text-orange-500 text-[10px] hover:bg-orange-900" title="Incident">⚠</button>
         <button onClick={() => triggerAction('/api/scenario/explosion')} className="w-6 h-6 flex items-center justify-center rounded-full bg-red-950 text-red-500 text-[10px] hover:bg-red-900" title="Critical Incident">🔥</button>
      </div>

      <WarRoom data={data} triggerAction={triggerAction} isConnected={isConnected} />
      
      <AICopilot />
    </main>
  );
}
