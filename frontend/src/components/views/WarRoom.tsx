import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

// Dynamically import the 3D scene so it only loads on the client
const ThreeScene = dynamic(() => import('@/components/ThreeScene'), { ssr: false });

export default function WarRoom({ data, triggerAction, isConnected }: { data: any, triggerAction: any, isConnected: boolean }) {
  // Extract top-level state
  const riskScore = data?.risk?.score || 0;
  const sensors = data?.sensors || {};
  const forecast = data?.risk?.forecast_20m || [];
  const contributors = data?.risk?.contributors || {};
  const cctv = data?.cctv || {};
  const senate = data?.senate || {};
  const compliance = data?.compliance || {};
  const timeline = data?.compound_alerts || [];
  const shift = data?.shift || 'DAY';
  const permits = data?.permits || [];
  const blackbox = data?.blackbox?.last_event || null;

  // History state for charts
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    if (sensors && Object.keys(sensors).length > 0) {
      setHistory(prev => {
        const updated = [...prev, { time: new Date().toISOString(), gas: sensors.S1||0, temp: sensors.S17||0, pressure: sensors.S3||0 }];
        if (updated.length > 20) updated.shift();
        return updated;
      });
    }
  }, [sensors]);

  // Audio Siren
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (riskScore > 70 && !audioRef.current) {
      // Simulate siren sound using Web Audio API
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.1, ctx.currentTime); // Keep it quiet
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    }
  }, [riskScore]);

  // Derived Equipment Health (NO MOCK DATA - driven directly by CSV Vibration S9/S15/S19 and Pressure S3/S16/S20)
  const getHealth = (vibration: number, pressure: number, baseVib: number, basePres: number) => {
    const vibDev = Math.abs(vibration - baseVib) / baseVib;
    const presDev = Math.abs(pressure - basePres) / basePres;
    const health = 100 - (vibDev * 50 + presDev * 50);
    return Math.max(0, Math.min(100, health)).toFixed(1);
  };
  
  const boilerHealth = sensors.S9 ? getHealth(sensors.S9, sensors.S16, 1.2, 85) : 100;
  const compressorHealth = sensors.S15 ? getHealth(sensors.S15, sensors.S3, 1.0, 80) : 100;
  const valveHealth = sensors.S19 ? getHealth(sensors.S19, sensors.S20, 1.5, 70) : 100;

  // Live Permit System checks
  const isOISDViolation = permits.includes('P001') && sensors.S1 > 30; // Hot Work + Gas Rise

  // Worker Tracking (Derived deterministically)
  const workers = [
    { id: 14, zone: 'Z1', status: sensors.S1 > 40 ? 'DANGER' : 'NOMINAL' },
    { id: 22, zone: 'Z3', status: sensors.S3 > 90 ? 'WARNING' : 'NOMINAL' },
    { id: 33, zone: 'Z4', status: 'NOMINAL' }
  ];

  // Failure Cascade Logic
  const getCascade = () => {
    if (riskScore > 70) return ['Gas Leak (S1)', 'Temperature Rise (S17)', 'PPE Violation', 'Imminent Explosion'];
    if (riskScore > 40) return ['Gas Leak (S1)', 'Temperature Rise (S17)', 'Worker Exposure'];
    if (sensors.S1 > 30) return ['Gas Leak (S1)', 'Pending...'];
    return ['System Nominal'];
  };

  // CCTV Grid logic
  const [cctvTarget, setCctvTarget] = useState<File | null>(null);
  const handleCCTVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      await fetch('http://localhost:8001/api/cctv/upload', { method: 'POST', body: formData });
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col font-sans text-white overflow-hidden p-2 gap-2">
      
      {/* TOP STRIP: KPI (Level 18) */}
      <div className="flex gap-2 h-14 shrink-0">
        <div className="flex-1 bg-black/60 border border-white/5 rounded-lg flex items-center px-4 justify-between">
           <div className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">SENTINEL-Φ WAR ROOM</div>
           <div className="flex gap-8">
             <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase">Workers Active</span><span className="font-mono text-lg text-emerald-400">142</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase">Critical Zones</span><span className={`font-mono text-lg ${riskScore > 70 ? 'text-red-500' : 'text-slate-300'}`}>{riskScore > 70 ? '1' : '0'}</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase">System Risk</span><span className={`font-mono text-lg ${riskScore > 70 ? 'text-red-500 animate-pulse' : riskScore > 40 ? 'text-yellow-500' : 'text-emerald-500'}`}>{Math.round(riskScore)}%</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase">Compliance</span><span className={`font-mono text-lg ${isOISDViolation ? 'text-red-500' : 'text-emerald-500'}`}>{isOISDViolation ? 'FAILED' : 'PASSED'}</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase">Status</span><span className={`font-mono text-lg ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>{isConnected ? 'LIVE STREAM' : 'OFFLINE'}</span></div>
           </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 flex gap-2 min-h-0">
        
        {/* LEFT COLUMN: Telemetry & Equipment */}
        <div className="w-1/4 flex flex-col gap-2">
          
          {/* Live Sensor Panels (Level 2) */}
          <div className="bg-black/60 border border-white/5 rounded-lg p-3 flex flex-col gap-2 shrink-0">
             <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Live Sensors</div>
             <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded border ${sensors.S1 > 40 ? 'bg-red-950/30 border-red-500/50 text-red-400' : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'}`}>
                  <div className="text-[9px] uppercase">S1 Gas</div>
                  <div className="text-xl font-mono">{sensors.S1?.toFixed(1) || '0.0'}</div>
                </div>
                <div className={`p-2 rounded border ${sensors.S17 > 300 ? 'bg-red-950/30 border-red-500/50 text-red-400' : 'bg-orange-950/10 border-orange-500/20 text-orange-400'}`}>
                  <div className="text-[9px] uppercase">S17 Temp</div>
                  <div className="text-xl font-mono">{sensors.S17?.toFixed(1) || '0.0'}</div>
                </div>
                <div className={`p-2 rounded border ${sensors.S3 > 90 ? 'bg-red-950/30 border-red-500/50 text-red-400' : 'bg-blue-950/10 border-blue-500/20 text-blue-400'}`}>
                  <div className="text-[9px] uppercase">S3 Pressure</div>
                  <div className="text-xl font-mono">{sensors.S3?.toFixed(1) || '0.0'}</div>
                </div>
                <div className="p-2 rounded border bg-purple-950/10 border-purple-500/20 text-purple-400">
                  <div className="text-[9px] uppercase">Shift Status</div>
                  <div className="text-xl font-mono">{shift}</div>
                </div>
             </div>
          </div>

          {/* Maintenance Panel (Level 11) */}
          <div className="bg-black/60 border border-white/5 rounded-lg p-3 flex-1 flex flex-col">
            <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-2">Equipment Health</div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
               <div className="flex items-center justify-between font-mono text-xs"><span>Boiler Unit</span><span className={Number(boilerHealth) < 80 ? 'text-red-400' : 'text-emerald-400'}>{boilerHealth}%</span></div>
               <div className="w-full bg-slate-900 h-1 rounded"><div className={`h-full rounded ${Number(boilerHealth) < 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${boilerHealth}%`}} /></div>
               
               <div className="flex items-center justify-between font-mono text-xs mt-2"><span>Compressor</span><span className={Number(compressorHealth) < 80 ? 'text-red-400' : 'text-emerald-400'}>{compressorHealth}%</span></div>
               <div className="w-full bg-slate-900 h-1 rounded"><div className={`h-full rounded ${Number(compressorHealth) < 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${compressorHealth}%`}} /></div>

               <div className="flex items-center justify-between font-mono text-xs mt-2"><span>Z1 Valve</span><span className={Number(valveHealth) < 80 ? 'text-red-400' : 'text-emerald-400'}>{valveHealth}%</span></div>
               <div className="w-full bg-slate-900 h-1 rounded"><div className={`h-full rounded ${Number(valveHealth) < 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${valveHealth}%`}} /></div>
            </div>
          </div>

          {/* Live Permit System (Level 7) */}
          <div className="bg-black/60 border border-white/5 rounded-lg p-3 flex-1 flex flex-col">
            <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-2">Active Permits</div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {permits.map((p: string) => (
                <div key={p} className={`text-xs p-2 rounded border ${isOISDViolation && p === 'P001' ? 'bg-red-950/50 border-red-500 text-red-200' : 'bg-slate-900/50 border-white/10 text-slate-300'}`}>
                  {p === 'P001' ? '🔥 Hot Work (Z1)' : p === 'P002' ? '⚡ Electrical (Z2)' : '🛠️ Maintenance (Z4)'}
                  {isOISDViolation && p === 'P001' && <div className="text-[9px] text-red-500 mt-1 font-mono uppercase">OISD Violation: Gas Leak Overlap</div>}
                </div>
              ))}
              {permits.length === 0 && <div className="text-xs text-slate-600 italic">No active permits.</div>}
            </div>
          </div>

          {/* Worker Tracking (Level 3) */}
          <div className="bg-black/60 border border-white/5 rounded-lg p-3 flex-1 flex flex-col">
            <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-2">Worker Tracking</div>
            <div className="flex flex-col gap-1 text-xs">
               {workers.map(w => (
                 <div key={w.id} className="flex justify-between border-b border-white/5 py-1">
                   <span>👷 Worker {w.id}</span>
                   <span className="font-mono text-slate-400">{w.zone}</span>
                   <span className={w.status === 'DANGER' ? 'text-red-500 animate-pulse font-bold' : w.status === 'WARNING' ? 'text-yellow-500' : 'text-emerald-500'}>{w.status}</span>
                 </div>
               ))}
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Digital Twin & Trajectory */}
        <div className="flex-1 flex flex-col gap-2">
           {/* Plant Map / Digital Twin (Level 16 & 5) */}
           <div className="bg-black/60 border border-white/5 rounded-lg flex-1 relative overflow-hidden group">
              <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur border border-white/10 px-3 py-1 rounded text-[10px] tracking-widest uppercase font-bold">Live Digital Twin</div>
              
              {/* Failure Cascade Overlay (Level 13) */}
              <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1 pointer-events-none">
                 {getCascade().map((step, i) => (
                   <div key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${riskScore > 40 ? 'bg-red-950/80 border-red-500/50 text-red-200' : 'bg-slate-900/80 border-white/10 text-slate-400'}`}>
                     {i > 0 && <span className="mr-1">↓</span>}{step}
                   </div>
                 ))}
              </div>

              <ThreeScene riskScore={riskScore} />
           </div>

           {/* Prediction Mode (Level 6) */}
           <div className="h-32 bg-black/60 border border-white/5 rounded-lg p-3 flex flex-col shrink-0 relative overflow-hidden">
             {riskScore > 70 && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />}
             <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-2 z-10">Risk Prediction Trajectory</div>
             <div className="flex-1 flex items-end justify-between px-4 z-10">
                <div className="flex flex-col items-center gap-1">
                   <div className="text-2xl font-mono text-white">{Math.round(riskScore)}%</div>
                   <div className="text-[9px] uppercase text-slate-500">Current</div>
                </div>
                <div className="flex-1 border-b-2 border-dashed border-white/10 mx-4 mb-4 relative">
                   <div className="absolute right-0 -bottom-1 w-2 h-2 rounded-full bg-white/20" />
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className={`text-2xl font-mono ${forecast[1] > 70 ? 'text-red-400' : 'text-yellow-400'}`}>{forecast[1] ? Math.round(forecast[1]) : '--'}%</div>
                   <div className="text-[9px] uppercase text-slate-500">+5 Min</div>
                </div>
                <div className="flex-1 border-b-2 border-dashed border-white/10 mx-4 mb-4" />
                <div className="flex flex-col items-center gap-1">
                   <div className={`text-2xl font-mono ${forecast[3] > 70 ? 'text-red-400' : 'text-orange-400'}`}>{forecast[3] ? Math.round(forecast[3]) : '--'}%</div>
                   <div className="text-[9px] uppercase text-slate-500">+15 Min</div>
                </div>
             </div>
           </div>
        </div>

        {/* RIGHT COLUMN: AI, Timeline, CCTV */}
        <div className="w-1/3 flex flex-col gap-2">
           
           {/* CCTV Grid (Level 10) */}
           <div className="h-48 bg-black/60 border border-white/5 rounded-lg p-2 flex flex-col shrink-0">
             <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-1 px-1 flex justify-between">
                <span>Multi-Camera Grid</span>
                <label className="cursor-pointer text-blue-400 hover:text-blue-300">Upload to CAM 3
                  <input type="file" className="hidden" onChange={handleCCTVUpload} />
                </label>
             </div>
             <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="bg-slate-900 rounded relative overflow-hidden flex items-center justify-center border border-white/5"><span className="absolute top-1 left-1 text-[8px] bg-black/80 px-1 font-mono text-slate-500">CAM 1</span><span className="text-slate-700 text-xs font-mono">NOMINAL</span></div>
                <div className="bg-slate-900 rounded relative overflow-hidden flex items-center justify-center border border-white/5"><span className="absolute top-1 left-1 text-[8px] bg-black/80 px-1 font-mono text-slate-500">CAM 2</span><span className="text-slate-700 text-xs font-mono">NOMINAL</span></div>
                <div className={`rounded relative overflow-hidden flex items-center justify-center border ${cctv?.status === 'violation' ? 'bg-red-950/30 border-red-500/50' : 'bg-slate-900 border-white/5'}`}>
                   <span className={`absolute top-1 left-1 text-[8px] px-1 font-mono ${cctv?.status === 'violation' ? 'bg-red-500 text-white animate-pulse' : 'bg-black/80 text-slate-500'}`}>CAM 3</span>
                   <span className={`text-[10px] font-mono text-center px-2 ${cctv?.status === 'violation' ? 'text-red-400' : 'text-slate-700'}`}>{cctv?.status === 'violation' ? 'PPE VIOLATION DETECTED' : 'AWAITING UPLOAD'}</span>
                </div>
                <div className="bg-slate-900 rounded relative overflow-hidden flex items-center justify-center border border-white/5"><span className="absolute top-1 left-1 text-[8px] bg-black/80 px-1 font-mono text-slate-500">CAM 4</span><span className="text-slate-700 text-xs font-mono">NOMINAL</span></div>
             </div>
           </div>

           {/* AI Explanations & Senate (Levels 5 & 6) */}
           <div className="bg-black/60 border border-white/5 rounded-lg p-3 flex-1 flex flex-col">
              <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-2">AI Senate & Risk Drivers</div>
              <div className="flex-1 flex flex-col gap-2">
                 
                 {/* SHAP Values */}
                 <div className="bg-slate-900/50 rounded p-2 border border-white/5 text-xs font-mono">
                    <div className="text-[9px] text-slate-400 mb-1 border-b border-white/10 pb-1">Primary Risk Drivers (SHAP)</div>
                    {Object.entries(contributors).slice(0,4).map(([k,v]: any) => (
                      <div key={k} className="flex justify-between"><span>{k}</span><span className="text-orange-400">{(v*100).toFixed(0)}%</span></div>
                    ))}
                    {Object.keys(contributors).length === 0 && <span className="text-slate-600">No anomalous drivers.</span>}
                 </div>

                 {/* Senate Output */}
                 <div className={`flex-1 rounded p-2 border overflow-y-auto ${riskScore > 70 ? 'bg-red-950/20 border-red-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                    <div className="text-[9px] text-slate-400 mb-1 border-b border-white/10 pb-1">Senate Consensus Log</div>
                    <div className="text-[10px] font-mono text-slate-300 flex flex-col gap-1">
                      {senate?.debate_log?.map((log: string, i: number) => (
                         <div key={i} className={log.includes('EVACUATE') ? 'text-red-400' : ''}>{log}</div>
                      ))}
                      {(!senate?.debate_log || senate.debate_log.length === 0) && <span className="text-slate-600 italic">Senate standing by.</span>}
                    </div>
                 </div>

              </div>
           </div>

           {/* Timeline / Playback (Level 4 & 8) */}
           <div className="bg-black/60 border border-white/5 rounded-lg p-3 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                 <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Event Timeline</div>
                 <button className="text-[9px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded uppercase font-mono">▶ Replay</button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 font-mono text-[9px]">
                 {timeline.map((alert: any, i: number) => (
                   <div key={i} className="flex gap-2">
                      <div className="text-slate-500 mt-0.5">[{new Date().toLocaleTimeString().substring(0,8)}]</div>
                      <div className="text-red-400">{alert.scenario}</div>
                   </div>
                 ))}
                 {cctv?.status === 'violation' && (
                   <div className="flex gap-2">
                      <div className="text-slate-500 mt-0.5">[{new Date().toLocaleTimeString().substring(0,8)}]</div>
                      <div className="text-orange-400">CCTV PPE Violation detected in Z1.</div>
                   </div>
                 )}
                 {timeline.length === 0 && !cctv?.status && <div className="text-slate-600 italic">No critical events logged.</div>}
              </div>
           </div>

        </div>

      </div>

      {/* BOTTOM STRIP: Commander Mode & Black Box (Levels 15 & 17) */}
      <div className="h-16 shrink-0 flex gap-2">
         
         {/* Commander Button */}
         <div className="w-1/4 bg-black/60 border border-white/5 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
            <button 
              onClick={() => triggerAction('/execute')}
              className="w-full h-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-colors text-sm"
            >
              Execute Evacuation
            </button>
         </div>

         {/* Emergency Response Dashboard (Level 8) */}
         <div className="flex-1 bg-black/60 border border-white/5 rounded-lg flex items-center px-6 justify-between">
            <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase">Ambulance ETA</span><span className="font-mono text-slate-300">5 min</span></div>
            <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase">Assembly Point</span><span className="font-mono text-slate-300">Zone D</span></div>
            <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase">Workers Evacuated</span><span className="font-mono text-emerald-400">{riskScore > 70 ? '118' : '0'}</span></div>
            <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase">Fire Team</span><span className={`font-mono ${riskScore > 70 ? 'text-red-400' : 'text-slate-300'}`}>{riskScore > 70 ? 'DISPATCHED' : 'STANDBY'}</span></div>
         </div>

         {/* Black Box Viewer (Level 17) */}
         <div className="w-1/3 bg-black/60 border border-white/5 rounded-lg p-2 flex flex-col justify-center px-4 font-mono text-[9px] text-slate-500">
            <div className="flex justify-between"><span>LATEST BLACK BOX HASH:</span><span className="text-emerald-500">{blackbox ? blackbox.hash_sha256?.substring(0,16)+'...' : 'AWAITING EVENT'}</span></div>
            <div className="flex justify-between"><span>EVENT ID:</span><span className="text-slate-400">{blackbox ? blackbox.event_id : '---'}</span></div>
         </div>

      </div>

    </div>
  );
}
