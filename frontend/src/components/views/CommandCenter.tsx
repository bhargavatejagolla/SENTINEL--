import { motion } from 'framer-motion';

export default function CommandCenter({
  riskScore,
  intelligence,
  countdown,
}: {
  riskScore: number;
  intelligence: any;
  countdown: number | null | undefined;
}) {
  const getRiskColor = (score: number) => {
    if (score > 70) return 'text-red-500 shadow-red-500/50';
    if (score > 40) return 'text-yellow-500 shadow-yellow-500/50';
    return 'text-emerald-500 shadow-emerald-500/50';
  };

  const getRiskBorder = (score: number) => {
    if (score > 70) return 'border-red-500/50';
    if (score > 40) return 'border-yellow-500/50';
    return 'border-emerald-500/50';
  };

  return (
    <div className="flex flex-col gap-6 h-full p-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Workers Safe */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-colors"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50" />
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Workers Safe</div>
          <div className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            247
          </div>
          <div className="mt-4 text-xs text-cyan-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            All biometric streams active
          </div>
        </motion.div>

        {/* Critical Zones */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`bg-black/40 border ${riskScore > 70 ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-6 relative overflow-hidden transition-colors`}
        >
          <div className={`absolute top-0 left-0 w-full h-1 ${riskScore > 70 ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Critical Zones</div>
          <div className={`text-6xl font-black ${riskScore > 70 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]'}`}>
            {riskScore > 70 ? '1' : '0'}
          </div>
          <div className="mt-4 text-xs text-slate-400 font-mono">
            {riskScore > 70 ? 'Zone Z1: High Gas & Hot Work' : 'All zones nominal'}
          </div>
        </motion.div>

        {/* Compound Risk */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`bg-black/40 border ${getRiskBorder(riskScore)} rounded-2xl p-6 relative overflow-hidden`}
        >
          <div className={`absolute top-0 left-0 w-full h-1 ${getRiskColor(riskScore).split(' ')[0].replace('text', 'bg')}`} />
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">System Risk Level</div>
          <div className={`text-6xl font-black ${getRiskColor(riskScore)} drop-shadow-[0_0_15px_currentColor]`}>
            {Math.round(riskScore)}%
          </div>
          <div className="mt-4 flex gap-1 h-2">
            {intelligence?.trajectory?.map((val: number, i: number) => (
              <div key={i} className="flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${val > 70 ? 'bg-red-500' : val > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${val}%` }} 
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Predicted Incident */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-black/40 border ${countdown != null ? 'border-red-500/50 bg-red-950/20' : 'border-white/10'} rounded-2xl p-6 relative overflow-hidden`}
        >
          {countdown != null && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 relative z-10">Predicted Incident</div>
          <div className={`text-5xl font-black relative z-10 ${countdown != null ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-slate-500'}`}>
            {countdown != null ? `00:${countdown.toString().padStart(2, '0')}` : '--:--'}
          </div>
          <div className="mt-4 text-xs font-mono text-slate-400 relative z-10">
            {countdown != null ? 'CRITICAL: Thermal runaway imminent' : 'No immediate threat detected'}
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-xl font-light text-slate-400 mb-4 tracking-widest uppercase text-center w-full">Telemetry Map (Digital Twin Active)</h3>
          <p className="text-slate-600 text-sm mb-4">View switches dynamically to Digital Twin tab...</p>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-6 font-bold flex justify-between">
            <span>Safety Culture Score</span>
            <span className="text-red-400">▼ 8 pts</span>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center mb-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * 82) / 100} className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" />
              </svg>
              <div className="absolute text-5xl font-black text-white">82</div>
            </div>
            <div className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Out of 100</div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-2">
            <div className="text-xs uppercase text-slate-400 mb-2">Recent Factors:</div>
            <div className="flex items-center gap-2 text-sm text-slate-300"><span className="text-red-400">⨯</span> 3 Near misses this week</div>
            <div className="flex items-center gap-2 text-sm text-slate-300"><span className="text-yellow-400">!</span> Night shift fatigue detected</div>
            <div className="flex items-center gap-2 text-sm text-slate-300"><span className="text-red-400">⨯</span> Minor permit violation (Z4)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
