import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('@/components/ThreeScene'), { ssr: false });

const panelBase = "bg-[#0b101e] border border-[#1e293b] shadow-lg relative overflow-hidden";
const headerText = "text-[10px] uppercase text-[#64748b] tracking-widest font-bold font-mono border-b border-[#1e293b] pb-2 mb-3";

export default function CommandCenter({ data, triggerAction, isConnected }: { data: any, triggerAction: any, isConnected: boolean }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Surveillance', 'Knowledge Graph', 'Event Replay'];

  const riskScore = data?.risk?.score || 0;
  const isIncidentMode = riskScore > 70;
  
  const weather = data?.weather || { wind_speed: 0, direction: "N/A", humidity: 0, temp: 0 };
  const maintenance = data?.maintenance || {};
  const emergency = data?.emergency_response || { accounted: 0, missing: 0, assembly: "N/A", ambulances: "N/A", fire: "N/A" };
  const countdown = data?.countdown;
  const timeline = data?.timeline || [];
  const action = data?.action || { status: 'Idle', message: '' };
  const cctv = data?.cctv || {};
  
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const modeBg = isIncidentMode ? 'bg-[#1a0505]' : 'bg-[#020617]';

  return (
    <div className={`w-full h-full flex flex-col font-sans text-slate-300 overflow-hidden p-2 gap-2 transition-colors duration-1000 ${modeBg}`}>
      
      {/* FULL SCREEN OVERLAYS FOR OPERATOR ACTION */}
      <AnimatePresence>
        {action.status === 'Executed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-950/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-8 text-center border-[8px] border-red-600">
            <h1 className="text-7xl font-black text-red-500 mb-6 tracking-tighter drop-shadow-2xl font-mono">EVACUATION PROTOCOL ENGAGED</h1>
            <p className="text-red-200 text-2xl max-w-4xl font-light mb-12 font-mono bg-black/50 p-6 border border-red-500/30">
              {action.message}
            </p>
            <div className="flex gap-4">
               <div className="flex flex-col items-center p-4 bg-black/50 border border-red-500/30 rounded">
                 <span className="text-4xl font-bold text-white">{emergency.accounted}</span>
                 <span className="text-xs uppercase text-red-400 font-bold mt-2">Accounted</span>
               </div>
               <div className="flex flex-col items-center p-4 bg-black/50 border border-red-500/30 rounded">
                 <span className="text-4xl font-bold text-red-500">{emergency.missing}</span>
                 <span className="text-xs uppercase text-red-400 font-bold mt-2">Missing</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP COMMAND STRIP - VERY INDUSTRIAL */}
      <div className="flex h-12 shrink-0 z-10 items-center justify-between border-b border-[#1e293b] px-4 bg-[#060b14]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(37,99,235,0.8)]">Φ</div>
             <div className="flex flex-col">
               <div className="text-lg font-black tracking-widest text-white leading-none">SENTINEL-Φ</div>
               <div className="text-[8px] uppercase text-blue-400 tracking-widest font-bold">Industrial Safety OS v2.1</div>
             </div>
          </div>
          
          <div className="flex h-full border-l border-[#1e293b]">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 h-full text-[10px] uppercase font-bold tracking-widest transition-all border-r border-[#1e293b] flex items-center gap-2
                  ${activeTab === tab ? 'bg-[#1e293b] text-white border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0f172a] hover:text-slate-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6 items-center">
          {/* System Health */}
          <div className="flex gap-3 text-[9px] font-mono uppercase font-bold">
             <div className="flex items-center gap-1 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" /> Telemetry</div>
             <div className="flex items-center gap-1 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" /> Vision AI</div>
             <div className="flex items-center gap-1 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" /> Neo4j Knowledge</div>
          </div>
          
          {/* Mode Indicator */}
          <div className={`px-4 py-1 rounded-sm font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 border font-mono
            ${isIncidentMode ? 'bg-red-950/50 text-red-500 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-emerald-950/30 text-emerald-500 border-emerald-900'}`}>
            {isIncidentMode ? 'INCIDENT COMMAND ACTIVE' : 'LIVE OPERATIONS NORMAL'}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex gap-2 min-h-0 z-10">
        
        {/* LEFT COLUMN: Map & Digital Twin (Occupies majority space) */}
        <div className="flex-[2.5] flex flex-col gap-2 relative">
          
          <div className={`${panelBase} flex-1 rounded`}>
            {/* The Digital Twin */}
            <ThreeScene riskScore={riskScore} onSelectAsset={setSelectedAsset} />
            
            {/* Top Left Asset Hierarchy */}
            <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1">
              <span className="bg-[#020617]/80 px-2 py-1 rounded-sm text-[9px] uppercase font-bold tracking-widest border border-[#1e293b] text-blue-400 font-mono">
                Facility Blueprint
              </span>
              <span className="bg-[#020617]/80 px-2 py-1 rounded-sm text-[9px] uppercase tracking-widest border border-[#1e293b] text-slate-300 font-mono flex items-center gap-2">
                Wind: {weather.wind_speed} km/h {weather.direction} <span className="text-slate-600">|</span> Temp: {weather.temp}°C
              </span>
            </div>
            
            {/* Context Panel (Appears when asset is clicked) */}
            <AnimatePresence>
              {selectedAsset && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} 
                  className="absolute bottom-4 left-4 w-96 bg-[#060b14]/95 backdrop-blur-md border border-[#1e293b] rounded p-4 shadow-2xl pointer-events-auto">
                  <div className="flex justify-between items-center border-b border-[#1e293b] pb-2 mb-3">
                    <span className="text-blue-400 font-bold tracking-widest uppercase text-xs font-mono">{selectedAsset} :: SAP TELEMETRY</span>
                    <button onClick={() => setSelectedAsset(null)} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                  {maintenance[selectedAsset] ? (
                     <div className="flex flex-col gap-3 font-mono text-[10px] text-slate-300">
                       <div className="grid grid-cols-2 gap-4">
                         <div className="flex flex-col bg-[#0b101e] p-2 border border-[#1e293b] rounded-sm">
                           <span className="text-slate-500 mb-1">Installed</span>
                           <span className="text-white text-xs">{maintenance[selectedAsset].installed}</span>
                         </div>
                         <div className="flex flex-col bg-[#0b101e] p-2 border border-[#1e293b] rounded-sm">
                           <span className="text-slate-500 mb-1">Last Maintenance</span>
                           <span className="text-white text-xs">{maintenance[selectedAsset].last_maint}</span>
                         </div>
                         <div className="flex flex-col bg-[#0b101e] p-2 border border-[#1e293b] rounded-sm">
                           <span className="text-slate-500 mb-1">Useful Life</span>
                           <span className={`text-xs ${maintenance[selectedAsset].useful_life.includes('days') ? 'text-yellow-400' : 'text-emerald-400'}`}>{maintenance[selectedAsset].useful_life}</span>
                         </div>
                         <div className="flex flex-col bg-[#0b101e] p-2 border border-[#1e293b] rounded-sm">
                           <span className="text-slate-500 mb-1">Bearing Wear</span>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
                               <div className="bg-orange-500 h-full" style={{ width: `${maintenance[selectedAsset].bearing_wear}%` }} />
                             </div>
                             <span className="text-white">{maintenance[selectedAsset].bearing_wear}%</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="flex justify-between items-center bg-[#0f172a] p-3 border border-[#1e293b] rounded-sm mt-1">
                         <span className="text-slate-400">Predictive Failure Probability</span>
                         <span className={`text-lg font-bold ${maintenance[selectedAsset].failure_prob > 20 ? 'text-orange-500' : 'text-emerald-500'}`}>
                           {maintenance[selectedAsset].failure_prob}%
                         </span>
                       </div>
                     </div>
                  ) : (
                     <div className="text-xs text-slate-500 font-mono py-4 text-center border border-dashed border-[#1e293b] bg-[#0b101e]">
                       Asset telemetry nominal. No predictive alerts.
                     </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: Action & Analysis */}
        <div className="flex-1 flex flex-col gap-2 min-w-[400px]">
          
          {/* AI Decision Support / Operator Console */}
          <div className={`${panelBase} p-4 shrink-0 flex flex-col rounded ${isIncidentMode ? 'border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)] bg-red-950/10' : ''}`}>
             <div className="flex justify-between items-center mb-3 border-b border-[#1e293b] pb-2">
               <div className="text-[10px] uppercase text-slate-300 tracking-widest font-bold font-mono">Operations Advisory</div>
               {countdown !== null && (
                 <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-sm text-[10px] uppercase font-bold animate-pulse border border-red-500 font-mono">
                   Auto-Execute in {countdown}s
                 </span>
               )}
             </div>
             
             {isIncidentMode ? (
               <div className="flex flex-col gap-3">
                 <div className="p-3 bg-[#1a0505] border border-red-900 rounded-sm text-sm text-red-200">
                   <strong className="text-red-500 block mb-1 font-mono uppercase text-xs">⚠️ CRITICAL: Immediate Evacuation Required</strong>
                   Multiple risk vectors aligned. Compliance engine vetoes delay. Requesting incident commander approval.
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 mt-2">
                   <button onClick={() => triggerAction('/execute')} className="col-span-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-sm text-xs tracking-widest uppercase border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all">
                     Approve & Execute Evacuation
                   </button>
                   <button onClick={() => triggerAction('/cancel')} className="bg-[#1e293b] hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-sm text-[10px] tracking-widest uppercase border border-slate-600 transition-all">
                     Delay Action
                   </button>
                   <button onClick={() => triggerAction('/cancel')} className="bg-[#1e293b] hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-sm text-[10px] tracking-widest uppercase border border-slate-600 transition-all">
                     Reject Recommendation
                   </button>
                 </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono py-8 bg-[#060b14] border border-[#1e293b] rounded-sm border-dashed">
                 <div className="text-emerald-500 text-2xl mb-2">✓</div>
                 No active advisories. Plant operations nominal.
               </div>
             )}
          </div>

          {/* Dynamic Content Area based on Tab */}
          <div className={`${panelBase} flex-1 p-4 flex flex-col overflow-hidden rounded`}>
             <div className={headerText}>{activeTab}</div>
             
             <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1e293b] pr-2 flex flex-col gap-3">
                
                {activeTab === 'Overview' && (
                  <>
                    {/* Explainable AI Risk */}
                    <div className="bg-[#060b14] rounded-sm p-3 border border-[#1e293b] font-mono text-xs flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-1 border-b border-[#1e293b] pb-2">
                        <span className="text-slate-400 uppercase tracking-widest font-bold">XAI Risk Confidence</span>
                        <span className={`text-lg font-bold ${riskScore > 70 ? 'text-red-500' : 'text-emerald-500'}`}>{riskScore}%</span>
                      </div>
                      
                      {Object.keys(data?.risk?.contributors || {}).length > 0 ? (
                        Object.entries(data.risk.contributors).slice(0,5).map(([k,v]: any) => (
                          <div key={k} className="flex justify-between items-center py-1">
                            <span className="text-slate-300 capitalize">{k.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-2 w-32">
                              <div className="flex-1 bg-[#1e293b] h-1 rounded-full overflow-hidden">
                                <div className={`${riskScore > 70 ? 'bg-red-500' : 'bg-blue-500'} h-full`} style={{ width: `${v*100}%` }} />
                              </div>
                              <span className="text-slate-400 text-[9px] w-6 text-right">{Math.round(v*100)}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-emerald-600 border border-emerald-900/30 bg-emerald-950/10 border-dashed">
                          Risk Model Baseline
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {activeTab === 'Surveillance' && (
                  <div className="flex flex-col gap-3 h-full">
                    <div className="relative flex-1 bg-black rounded-sm border border-[#1e293b] overflow-hidden group shadow-inner">
                       {/* CRT Scanline effect */}
                       <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-50" />
                       
                       <div className="absolute top-2 left-2 text-[9px] bg-black/80 px-2 py-0.5 text-slate-300 font-mono z-30 border border-[#1e293b] uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> CAM 04 : ZONE Z1
                       </div>
                       
                       <div className="absolute top-2 right-2 text-[9px] text-white/50 font-mono z-30">
                         {new Date().toISOString().split('T')[1].substring(0,8)}
                       </div>

                       {cctv.intrusion ? (
                         <div className="absolute inset-0 flex items-center justify-center">
                           <div className="absolute border-[1px] border-red-500 w-32 h-56 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]">
                             <div className="absolute -top-5 left-0 text-red-500 text-[8px] font-mono px-1 font-bold bg-black border border-red-500">SUBJECT DETECTED</div>
                             {/* Corner accents */}
                             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500" />
                             <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500" />
                             <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500" />
                             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500" />
                           </div>
                           
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/80 p-3 text-[9px] font-mono border border-red-900 rounded-sm flex flex-col gap-2 min-w-[120px] z-30">
                             <div className="text-red-500 border-b border-red-900 pb-1 mb-1 text-[8px] uppercase tracking-widest">PPE Analysis</div>
                             <div className="flex justify-between"><span className="text-slate-400">Helmet</span><span className="text-red-500 font-bold text-right">✕ 0%</span></div>
                             <div className="flex justify-between"><span className="text-slate-400">Vest</span><span className="text-emerald-500 text-right">✓ 98%</span></div>
                             <div className="flex justify-between"><span className="text-slate-400">Gloves</span><span className="text-emerald-500 text-right">✓ 91%</span></div>
                             <div className="flex justify-between"><span className="text-slate-400">Boots</span><span className="text-emerald-500 text-right">✓ 88%</span></div>
                           </div>
                         </div>
                       ) : (
                         <div className="absolute inset-0 flex items-center justify-center text-[#1e293b] font-mono text-xs uppercase tracking-widest">
                           NO MOTION DETECTED
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'Knowledge Graph' && (
                  <div className="flex flex-col h-full items-center justify-center bg-[#060b14] rounded-sm border border-[#1e293b] relative overflow-hidden">
                     <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                       <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                         <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="1"/>
                       </pattern>
                       <rect width="100%" height="100%" fill="url(#grid)" />
                     </svg>
                     
                     <span className="absolute top-2 left-2 text-[9px] text-blue-500 uppercase font-mono tracking-widest bg-black px-2 border border-blue-900/50">Palantir Causality Engine</span>
                     
                     <div className="flex flex-col items-center z-10 font-mono text-[10px]">
                       {/* Node 1 */}
                       <div className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-sm shadow-lg text-slate-300">
                         <div className="text-blue-400 text-[8px] mb-1">ENTITY_PERSON</div>
                         Worker ID: 4182
                       </div>
                       <div className="w-[1px] h-6 bg-blue-500/50" />
                       
                       {/* Node 2 */}
                       <div className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-sm shadow-lg text-slate-300">
                         <div className="text-blue-400 text-[8px] mb-1">ENTITY_ASSET</div>
                         Boiler-01 (Zone Z1)
                       </div>
                       <div className="w-[1px] h-6 bg-red-500/50" />
                       
                       {/* Node 3 */}
                       <div className="px-4 py-2 bg-red-950/30 border border-red-900 rounded-sm shadow-lg text-red-200">
                         <div className="text-red-500 text-[8px] mb-1">EVENT_TELEMETRY</div>
                         Gas Conc. {'>'} 35%
                       </div>
                       <div className="w-[1px] h-6 bg-red-500/50" />
                       
                       {/* Node 4 */}
                       <div className="px-4 py-2 bg-orange-950/30 border border-orange-900 rounded-sm shadow-lg text-orange-200 flex items-center gap-2">
                         <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                         HISTORICAL MATCH: Vizag 2020 (89%)
                       </div>
                     </div>
                  </div>
                )}
                
                {/* Event Replay Timeline - Visible on Overview and its own tab */}
                {(activeTab === 'Overview' || activeTab === 'Event Replay') && (
                  <div className="bg-[#060b14] rounded-sm p-3 border border-[#1e293b] flex flex-col flex-1 min-h-[200px]">
                    <div className="flex justify-between items-center border-b border-[#1e293b] pb-2 mb-3">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest font-mono">Mission Black Box</span>
                      <div className="flex gap-1">
                        <button className="text-[8px] bg-[#0f172a] border border-[#1e293b] px-2 py-1 rounded-sm hover:bg-[#1e293b] text-slate-400">REPLAY</button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 text-[10px] font-mono pr-2">
                      {timeline.length === 0 && <span className="text-slate-600 block text-center py-4">No events logged.</span>}
                      {timeline.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3 relative pl-3 border-l-2 border-[#1e293b]">
                          <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px] top-1" />
                          <span className="text-blue-400 shrink-0">{item.time}</span>
                          <span className="text-slate-300 leading-tight">{item.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
