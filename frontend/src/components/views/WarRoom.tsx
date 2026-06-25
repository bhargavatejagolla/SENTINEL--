import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

const ThreeScene = dynamic(() => import('@/components/ThreeScene'), { ssr: false });

// Glassmorphism classes
const glassPanel = "bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl";
const glassHeader = "text-[10px] uppercase text-blue-300 tracking-widest font-bold mb-2 pb-1 border-b border-white/10";

export default function WarRoom({ data, triggerAction, isConnected }: { data: any, triggerAction: any, isConnected: boolean }) {
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
  const intelligence = data?.intelligence_layer;

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (riskScore > 70 && !audioRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); 
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    }
  }, [riskScore]);

  const getHealth = (vibration: number, pressure: number, baseVib: number, basePres: number) => {
    const vibDev = Math.abs(vibration - baseVib) / baseVib;
    const presDev = Math.abs(pressure - basePres) / basePres;
    const health = 100 - (vibDev * 50 + presDev * 50);
    return Math.max(0, Math.min(100, health)).toFixed(1);
  };
  
  const boilerHealth = sensors.S9 ? getHealth(sensors.S9, sensors.S16, 1.2, 85) : 100;
  const compressorHealth = sensors.S15 ? getHealth(sensors.S15, sensors.S3, 1.0, 80) : 100;
  const valveHealth = sensors.S19 ? getHealth(sensors.S19, sensors.S20, 1.5, 70) : 100;

  const isOISDViolation = permits.includes('P001') && sensors.S1 > 30;

  const workers = [
    { id: 14, zone: 'Z1', status: sensors.S1 > 40 ? 'DANGER' : 'NOMINAL' },
    { id: 22, zone: 'Z3', status: sensors.S3 > 90 ? 'WARNING' : 'NOMINAL' },
    { id: 33, zone: 'Z4', status: 'NOMINAL' }
  ];

  const getCascade = () => {
    if (riskScore > 70) return ['Gas Leak (S1)', 'Temperature Rise (S17)', 'Worker Exposure', 'Evacuation Imminent'];
    if (riskScore > 40) return ['Gas Leak (S1)', 'Temperature Rise (S17)', 'Pending...'];
    if (sensors.S1 > 30) return ['Gas Leak (S1)', 'Pending...'];
    return ['System Nominal'];
  };

  const handleCCTVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      await fetch('http://localhost:8001/api/cctv/upload', { method: 'POST', body: formData });
    }
  };

  const [evacuationStarted, setEvacuationStarted] = useState(false);
  const handleEvacuate = () => {
    setEvacuationStarted(true);
    triggerAction('/execute');
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col font-sans text-white overflow-hidden p-3 gap-3 relative">
      
      {/* Background Gradient responding to risk */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${riskScore > 70 ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950' : 'bg-slate-950'}`} />

      {/* TOP STRIP: KPI (Level 18) */}
      <div className="flex gap-3 h-16 shrink-0 z-10">
        <div className={`flex-1 ${glassPanel} flex items-center px-6 justify-between`}>
           <div className="flex items-center gap-4">
             <div className="text-2xl font-black tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SENTINEL-Φ</div>
             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] tracking-widest font-mono border border-white/20">INDUSTRIAL OS v2.0</div>
           </div>
           <div className="flex gap-10">
             <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Workers Active</span><span className="font-mono text-xl text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">142</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Critical Zones</span><span className={`font-mono text-xl ${riskScore > 70 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-slate-300'}`}>{riskScore > 70 ? '1' : '0'}</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">System Risk</span><span className={`font-mono text-xl ${riskScore > 70 ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : riskScore > 40 ? 'text-yellow-500' : 'text-emerald-500'}`}>{Math.round(riskScore)}%</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Compliance</span><span className={`font-mono text-xl ${isOISDViolation ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-emerald-500'}`}>{isOISDViolation ? 'FAILED' : 'PASSED'}</span></div>
             <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Status</span><span className={`font-mono text-xl ${isConnected ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-red-500'}`}>{isConnected ? 'LIVE STREAM' : 'OFFLINE'}</span></div>
           </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 flex gap-3 min-h-0 z-10">
        
        {/* LEFT COLUMN: Telemetry & Equipment */}
        <div className="w-1/4 flex flex-col gap-3">
          
          {/* Live Sensor Panels (Level 2) */}
          <div className={`${glassPanel} p-4 flex flex-col shrink-0`}>
             <div className={glassHeader}>Live Sensors</div>
             <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${sensors.S1 > 40 ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                  <div className="text-[10px] uppercase font-bold tracking-widest">S1 Gas</div>
                  <div className="text-2xl font-mono mt-1">{sensors.S1?.toFixed(1) || '0.0'} <span className="text-[10px] opacity-50">ppm</span></div>
                </div>
                <div className={`p-3 rounded-lg border ${sensors.S17 > 300 ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]' : 'bg-orange-500/5 border-orange-500/20 text-orange-400'}`}>
                  <div className="text-[10px] uppercase font-bold tracking-widest">S17 Temp</div>
                  <div className="text-2xl font-mono mt-1">{sensors.S17?.toFixed(1) || '0.0'} <span className="text-[10px] opacity-50">°C</span></div>
                </div>
                <div className={`p-3 rounded-lg border ${sensors.S3 > 90 ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]' : 'bg-blue-500/5 border-blue-500/20 text-blue-400'}`}>
                  <div className="text-[10px] uppercase font-bold tracking-widest">S3 Pressure</div>
                  <div className="text-2xl font-mono mt-1">{sensors.S3?.toFixed(1) || '0.0'} <span className="text-[10px] opacity-50">bar</span></div>
                </div>
                <div className="p-3 rounded-lg border bg-purple-500/5 border-purple-500/20 text-purple-400">
                  <div className="text-[10px] uppercase font-bold tracking-widest">Shift Status</div>
                  <div className="text-2xl font-mono mt-1">{shift}</div>
                </div>
             </div>
          </div>

          {/* Maintenance Panel (Level 11) */}
          <div className={`${glassPanel} p-4 flex-1 flex flex-col`}>
            <div className={glassHeader}>Equipment Health</div>
            <div className="flex-1 flex flex-col gap-4 justify-center">
               <div>
                 <div className="flex justify-between font-mono text-xs mb-1"><span>Boiler Unit</span><span className={Number(boilerHealth) < 80 ? 'text-red-400' : 'text-emerald-400'}>{boilerHealth}%</span></div>
                 <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-white/5"><div className={`h-full ${Number(boilerHealth) < 80 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`} style={{width: `${boilerHealth}%`}} /></div>
               </div>
               <div>
                 <div className="flex justify-between font-mono text-xs mb-1"><span>Compressor</span><span className={Number(compressorHealth) < 80 ? 'text-red-400' : 'text-emerald-400'}>{compressorHealth}%</span></div>
                 <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-white/5"><div className={`h-full ${Number(compressorHealth) < 80 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`} style={{width: `${compressorHealth}%`}} /></div>
               </div>
               <div>
                 <div className="flex justify-between font-mono text-xs mb-1"><span>Z1 Valve</span><span className={Number(valveHealth) < 80 ? 'text-red-400' : 'text-emerald-400'}>{valveHealth}%</span></div>
                 <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-white/5"><div className={`h-full ${Number(valveHealth) < 80 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`} style={{width: `${valveHealth}%`}} /></div>
               </div>
            </div>
          </div>

          {/* Live Permit & Worker System (Level 7 & 3) */}
          <div className={`${glassPanel} p-4 flex-1 flex flex-col gap-4`}>
            <div className="flex-1 flex flex-col">
              <div className={glassHeader}>Active Permits</div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                {permits.map((p: string) => (
                  <div key={p} className={`text-xs p-2 rounded border ${isOISDViolation && p === 'P001' ? 'bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-800/50 border-white/10 text-slate-300'}`}>
                    {p === 'P001' ? '🔥 P001 Hot Work (Z1)' : p === 'P002' ? '⚡ P002 Electrical (Z2)' : '🛠️ P003 Maintenance (Z4)'}
                    {isOISDViolation && p === 'P001' && <div className="text-[10px] text-red-400 mt-1 font-mono uppercase font-bold animate-pulse">OISD Violation: Gas Leak Overlap</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className={glassHeader}>Worker Tracking</div>
              <div className="flex flex-col gap-2 text-xs">
                 {workers.map(w => (
                   <div key={w.id} className="flex justify-between items-center bg-slate-800/30 p-2 rounded border border-white/5">
                     <span>👷 Worker {w.id}</span>
                     <span className="font-mono text-slate-400">{w.zone}</span>
                     <span className={w.status === 'DANGER' ? 'text-red-500 animate-pulse font-bold bg-red-500/10 px-2 py-0.5 rounded' : w.status === 'WARNING' ? 'text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded' : 'text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded'}>{w.status}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Digital Twin & Trajectory */}
        <div className="flex-[1.5] flex flex-col gap-3">
           
           {/* Risk Prediction Trajectory (Level 6) */}
           <div className={`h-32 ${glassPanel} p-4 flex flex-col shrink-0 relative overflow-hidden`}>
             {riskScore > 70 && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />}
             <div className={`${glassHeader} z-10`}>Risk Forecast Trajectory</div>
             <div className="flex-1 flex items-end justify-between px-8 z-10">
                <div className="flex flex-col items-center gap-1">
                   <div className="text-3xl font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{Math.round(riskScore)}%</div>
                   <div className="text-[10px] uppercase text-blue-300 tracking-widest font-bold">Current</div>
                </div>
                <div className="flex-1 border-b-2 border-dashed border-white/20 mx-6 mb-5 relative">
                   <div className="absolute right-0 -bottom-1.5 w-3 h-3 rounded-full bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className={`text-3xl font-mono font-bold ${forecast[1] > 70 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-yellow-400'}`}>{forecast[1] ? Math.round(forecast[1]) : '--'}%</div>
                   <div className="text-[10px] uppercase text-slate-400 tracking-widest font-bold">+5 Min</div>
                </div>
                <div className="flex-1 border-b-2 border-dashed border-white/20 mx-6 mb-5" />
                <div className="flex flex-col items-center gap-1">
                   <div className={`text-3xl font-mono font-bold ${forecast[3] > 70 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-orange-400'}`}>{forecast[3] ? Math.round(forecast[3]) : '--'}%</div>
                   <div className="text-[10px] uppercase text-slate-400 tracking-widest font-bold">+15 Min (Critical)</div>
                </div>
             </div>
           </div>

           {/* Plant Map / Digital Twin (Level 16) */}
           <div className={`${glassPanel} flex-1 relative overflow-hidden group border border-white/10`}>
              <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-xs tracking-widest uppercase font-bold text-white shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${riskScore > 70 ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,1)]'}`} />
                 Live Digital Twin
              </div>
              
              {/* Failure Cascade Overlay (Level 13) */}
              <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-none">
                 {getCascade().map((step, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     key={i} 
                     className={`text-[10px] font-mono px-3 py-1.5 rounded-md border shadow-lg ${riskScore > 40 ? 'bg-red-950/90 border-red-500/50 text-red-200' : 'bg-slate-900/90 border-white/10 text-slate-400'}`}
                   >
                     {i > 0 && <span className="mr-2 opacity-50">↓</span>}{step}
                   </motion.div>
                 ))}
              </div>

              <ThreeScene riskScore={riskScore} />
           </div>

        </div>

        {/* RIGHT COLUMN: AI, Timeline, CCTV */}
        <div className="w-1/3 flex flex-col gap-3">
           
           {/* Event Timeline (Level 1 & 4) */}
           <div className={`${glassPanel} p-4 flex-1 flex flex-col max-h-[35%]`}>
              <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                 <div className="text-[10px] uppercase text-blue-300 tracking-widest font-bold">Event Timeline</div>
                 <button className="text-[9px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full uppercase font-mono transition-colors">▶ Replay Incident</button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 font-mono text-[10px] pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                 <AnimatePresence>
                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start bg-slate-800/30 p-2 rounded">
                      <div className="text-blue-400 shrink-0">[{data?.timestamp ? data.timestamp.split('T')[1]?.substring(0, 5) : '00:00'}]</div>
                      <div className="text-slate-500 shrink-0">| SYSTEM |</div>
                      <div className="text-slate-300">Shift changed to {shift}.</div>
                   </motion.div>
                   
                   {permits.map((p: string, i: number) => (
                     <motion.div key={`p-${i}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start bg-slate-800/30 p-2 rounded">
                        <div className="text-blue-400 shrink-0">[{data?.timestamp ? data.timestamp.split('T')[1]?.substring(0, 5) : '00:00'}]</div>
                        <div className="text-purple-400 shrink-0">| PERMIT |</div>
                        <div className="text-slate-300">{p} Active.</div>
                     </motion.div>
                   ))}

                   {timeline.map((alert: any, i: number) => (
                     <motion.div key={`a-${i}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start bg-red-950/30 border border-red-500/20 p-2 rounded">
                        <div className="text-red-400 shrink-0">[{new Date().toLocaleTimeString().substring(0,5)}]</div>
                        <div className="text-red-500 shrink-0">| ALARM  |</div>
                        <div className="text-red-300">{alert.scenario}</div>
                     </motion.div>
                   ))}

                   {cctv?.status === 'violation' && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start bg-orange-950/30 border border-orange-500/20 p-2 rounded">
                        <div className="text-orange-400 shrink-0">[{new Date().toLocaleTimeString().substring(0,5)}]</div>
                        <div className="text-orange-500 shrink-0">| VISION |</div>
                        <div className="text-orange-200">PPE Violation detected in Z1.</div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>

           {/* AI Senate & Explanations (Levels 5 & 6) */}
           <div className={`${glassPanel} p-4 flex-1 flex flex-col`}>
              <div className={glassHeader}>AI Senate & Explanations</div>
              
              <div className="flex gap-3 h-full">
                {/* SHAP Values & RAG */}
                <div className="w-1/2 flex flex-col gap-3">
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-white/5 font-mono flex-1">
                     <div className="text-[10px] text-slate-500 mb-2 border-b border-white/5 pb-1 uppercase">Risk Drivers (SHAP)</div>
                     <div className="text-[10px] flex flex-col gap-1.5">
                       {Object.entries(contributors).slice(0,4).map(([k,v]: any) => (
                         <div key={k} className="flex justify-between items-center">
                           <span className="text-slate-300">{k}</span>
                           <span className="text-orange-400 bg-orange-400/10 px-1 rounded">{(v*100).toFixed(0)}%</span>
                         </div>
                       ))}
                       {Object.keys(contributors).length === 0 && <span className="text-slate-600">Nominal conditions.</span>}
                     </div>
                  </div>

                  {intelligence?.similar_events > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-950/40 rounded-lg p-3 border border-red-500/30 text-[10px] font-mono shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                       <div className="text-red-400 font-bold mb-1 border-b border-red-500/20 pb-1">Historical Match: 87%</div>
                       <div className="text-slate-300 mb-1">Vizag Gas Leak 2020</div>
                       <div className="text-slate-500">Shared: Gas Accumulation, Night Shift, Maintenance.</div>
                    </motion.div>
                  )}
                </div>

                {/* Animated Senate Conversation */}
                <div className="w-1/2 bg-slate-900/60 rounded-lg p-3 border border-white/5 overflow-y-auto flex flex-col gap-3">
                   <div className="text-[10px] text-slate-500 border-b border-white/5 pb-1 uppercase font-mono">Live Deliberation</div>
                   <div className="text-[10px] font-mono flex flex-col gap-3">
                     {senate?.decision ? (
                       <>
                         <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0 }} className="flex flex-col">
                           <span className="text-emerald-400">Safety Agent:</span>
                           <span className="text-slate-300 ml-2">Gas levels exceed safe limits (S1).</span>
                         </motion.div>
                         <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="flex flex-col">
                           <span className="text-blue-400">Operations Agent:</span>
                           <span className="text-slate-300 ml-2">Shutdown cost estimated at ₹15 lakh.</span>
                         </motion.div>
                         {isOISDViolation && (
                           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2 }} className="flex flex-col">
                             <span className="text-orange-400">Compliance Agent:</span>
                             <span className="text-slate-300 ml-2">OISD Violation detected (Hot Work).</span>
                           </motion.div>
                         )}
                         <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 3 }} className="flex flex-col mt-2 pt-2 border-t border-white/5">
                           <span className="text-red-400 font-bold">Emergency Agent:</span>
                           <span className="text-red-300 ml-2 font-bold uppercase tracking-widest">Recommend {senate.decision}.</span>
                         </motion.div>
                       </>
                     ) : (
                       <span className="text-slate-600 italic">Monitoring telemetry...</span>
                     )}
                   </div>
                </div>
              </div>
           </div>

           {/* CCTV Grid (Level 10) */}
           <div className={`${glassPanel} p-4 h-[25%] flex flex-col shrink-0`}>
             <div className="text-[10px] uppercase text-blue-300 tracking-widest font-bold mb-2 pb-1 border-b border-white/10 flex justify-between">
                <span>Surveillance Grid</span>
                <label className="cursor-pointer text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span className="bg-blue-500/20 px-2 py-0.5 rounded">Upload to CAM 3</span>
                  <input type="file" className="hidden" onChange={handleCCTVUpload} />
                </label>
             </div>
             <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="bg-slate-950 rounded relative overflow-hidden flex items-center justify-center border border-white/10"><span className="absolute top-1 left-1 text-[8px] bg-black/80 px-1.5 py-0.5 rounded font-mono text-slate-400">CAM 1</span><span className="text-slate-700 text-xs font-mono">NOMINAL</span></div>
                <div className="bg-slate-950 rounded relative overflow-hidden flex items-center justify-center border border-white/10"><span className="absolute top-1 left-1 text-[8px] bg-black/80 px-1.5 py-0.5 rounded font-mono text-slate-400">CAM 2</span><span className="text-slate-700 text-xs font-mono">NOMINAL</span></div>
                <div className={`rounded relative overflow-hidden flex items-center justify-center border ${cctv?.status === 'violation' ? 'bg-red-950/30 border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]' : 'bg-slate-950 border-white/10'}`}>
                   <span className={`absolute top-1 left-1 text-[8px] px-1.5 py-0.5 rounded font-mono ${cctv?.status === 'violation' ? 'bg-red-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-black/80 text-slate-400'}`}>CAM 3</span>
                   <span className={`text-[10px] font-mono text-center px-2 ${cctv?.status === 'violation' ? 'text-red-400 font-bold' : 'text-slate-700'}`}>{cctv?.status === 'violation' ? 'PPE VIOLATION DETECTED' : 'AWAITING UPLOAD'}</span>
                </div>
                <div className="bg-slate-950 rounded relative overflow-hidden flex items-center justify-center border border-white/10"><span className="absolute top-1 left-1 text-[8px] bg-black/80 px-1.5 py-0.5 rounded font-mono text-slate-400">CAM 4</span><span className="text-slate-700 text-xs font-mono">NOMINAL</span></div>
             </div>
           </div>

        </div>

      </div>

      {/* BOTTOM STRIP: Commander Mode & Black Box (Levels 15 & 17) */}
      <div className="h-[72px] shrink-0 flex gap-3 z-10">
         
         {/* Commander Button & Checklist */}
         <div className={`w-1/4 ${glassPanel} flex items-center justify-center p-2 relative overflow-hidden`}>
            {!evacuationStarted ? (
              <button 
                onClick={handleEvacuate}
                className="w-full h-full bg-red-600/90 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400/50 transition-all text-sm backdrop-blur-md"
              >
                Execute Evacuation
              </button>
            ) : (
              <div className="w-full h-full flex flex-col justify-center px-4 font-mono text-[9px] text-emerald-400 bg-emerald-950/20">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0 }}>✓ Sirens activated</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>✓ Teams alerted</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>✓ Black Box stored</motion.div>
              </div>
            )}
         </div>

         {/* Emergency Response Dashboard (Level 8) */}
         <div className={`flex-1 ${glassPanel} flex items-center px-8 justify-between`}>
            <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Ambulance ETA</span><span className="font-mono text-slate-200 text-lg">5 min</span></div>
            <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Assembly Point</span><span className="font-mono text-slate-200 text-lg">Zone D</span></div>
            <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Workers Evacuated</span><span className={`font-mono text-lg ${riskScore > 70 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-slate-500'}`}>{riskScore > 70 ? '118' : '0'}</span></div>
            <div className="flex flex-col"><span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Fire Team</span><span className={`font-mono text-lg ${riskScore > 70 ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-slate-500'}`}>{riskScore > 70 ? 'DISPATCHED' : 'STANDBY'}</span></div>
         </div>

         {/* Black Box Viewer (Level 17) */}
         <div className={`w-1/3 ${glassPanel} p-3 flex flex-col justify-center font-mono text-[9px] text-slate-400 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay`}>
            <div className="flex justify-between"><span>EVENT ID:</span><span className="text-slate-300">{blackbox ? blackbox.event_id : '---'}</span></div>
            <div className="flex justify-between mt-1"><span>SHA-256:</span><span className="text-emerald-400">{blackbox ? blackbox.hash_sha256?.substring(0,24)+'...' : 'AWAITING EVENT'}</span></div>
            <div className="flex justify-between mt-1"><span>PREV HASH:</span><span className="text-slate-500">{blackbox ? '71ff21c89a00b2...' : '---'}</span></div>
            <div className="flex justify-between mt-1 text-slate-500"><span>STATUS:</span><span>{blackbox ? 'IMMUTABLE' : '---'}</span></div>
         </div>

      </div>

    </div>
  );
}
