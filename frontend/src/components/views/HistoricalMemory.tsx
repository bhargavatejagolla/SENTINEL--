import { motion } from 'framer-motion';

export default function HistoricalMemory({ intelligence }: { intelligence: any }) {
  const hasSimilar = intelligence?.similar_events > 0;

  return (
    <div className="flex flex-col h-full gap-6 p-6 animate-in fade-in duration-700">
      <div className="mb-4">
        <h2 className="text-3xl font-light text-slate-200 tracking-widest uppercase mb-2">Historical Memory</h2>
        <p className="text-slate-500 text-sm">Searching global incident databases for pattern matches...</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 items-center justify-center">
        {hasSimilar ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-black/60 border border-red-500/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <div className="absolute top-4 right-4 bg-red-950/50 text-red-400 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              92% Pattern Match
            </div>
            
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-6">Similar Incident Found</div>
            
            <h3 className="text-4xl font-black text-white mb-2">Visakhapatnam Steel Plant</h3>
            <div className="text-xl text-slate-400 font-light mb-8">May 2020</div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-red-950/20 rounded-xl p-4 border border-red-500/10">
                <div className="text-xs uppercase text-slate-500 mb-1">Impact</div>
                <div className="text-2xl font-bold text-red-500">12 Fatalities</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                <div className="text-xs uppercase text-slate-500 mb-1">Current Similarity</div>
                <div className="text-2xl font-bold text-slate-200">High</div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 border-l-4 border-l-red-500">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-bold">Root Cause Analysis</div>
              <p className="text-slate-300 font-light leading-relaxed">
                Gas accumulation (Styrene monomer) during maintenance. The temperature inside the tank rose above 20°C due to a faulty refrigeration unit, leading to auto-polymerization and vapor release. 
                <br/><br/>
                <span className="text-red-400 font-medium">WARNING: Current telemetry shows identical pre-conditions in Zone Z1.</span>
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-black/20 border border-white/5 rounded-2xl w-full max-w-2xl">
            <div className="text-6xl mb-6 opacity-50">🌍</div>
            <h3 className="text-xl font-light text-slate-300 mb-2 uppercase tracking-widest">No Critical Matches</h3>
            <p className="text-slate-500">Current telemetry does not match any historical fatal incident patterns in the global database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
