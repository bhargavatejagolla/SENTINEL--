import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ExecuteIntervention({ onExecute, hasExecuted }: { onExecute: () => void, hasExecuted: boolean }) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (hasExecuted) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 animate-in fade-in duration-700 bg-red-950/20">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6 animate-pulse">🚨</div>
          <h2 className="text-6xl font-black text-red-500 tracking-tighter mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">EVACUATION INITIATED</h2>
          <p className="text-xl text-slate-300 font-light tracking-widest uppercase">Emergency protocols activated.</p>
          
          <div className="mt-12 bg-black/40 border border-red-500/30 rounded-2xl p-6 text-left max-w-2xl mx-auto inline-block w-full">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-bold border-b border-white/5 pb-2">Execution Log</h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex gap-4 text-emerald-400"><span className="opacity-50">T+00s</span> <span>Siren arrays activated.</span></div>
              <div className="flex gap-4 text-emerald-400"><span className="opacity-50">T+02s</span> <span>Automated regional SMS dispatched.</span></div>
              <div className="flex gap-4 text-emerald-400"><span className="opacity-50">T+05s</span> <span>Blast doors isolated in Z1.</span></div>
              <div className="flex gap-4 text-emerald-400"><span className="opacity-50">T+12s</span> <span>Emergency Response Team deployed.</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-6 p-6 animate-in fade-in duration-700">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-light text-slate-200 tracking-widest uppercase mb-2">Execute Intervention</h2>
        <p className="text-slate-500">Requires manual authorization from Command level.</p>
      </div>

      <div className="relative">
        {/* Glow behind button */}
        <div className="absolute inset-0 bg-red-500/20 blur-[50px] rounded-full animate-pulse" />
        
        {/* The Big Red Button */}
        <button 
          onClick={() => {
            if (!isConfirming) {
              setIsConfirming(true);
            } else {
              onExecute();
            }
          }}
          className={`relative z-10 w-64 h-64 rounded-full border-4 shadow-2xl transition-all duration-300 flex flex-col items-center justify-center ${
            isConfirming 
              ? 'bg-red-600 border-white text-white shadow-[0_0_80px_rgba(239,68,68,0.8)] scale-110' 
              : 'bg-red-950/80 border-red-500 text-red-500 hover:bg-red-900/80 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
          }`}
        >
          <span className="text-sm tracking-[0.3em] font-bold uppercase mb-2 opacity-80">
            {isConfirming ? 'Confirm' : 'System Override'}
          </span>
          <span className="text-4xl font-black uppercase tracking-tighter">
            {isConfirming ? 'EXECUTE' : 'EVACUATE'}
          </span>
        </button>
      </div>

      {isConfirming && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center text-red-400 font-bold uppercase tracking-widest text-sm animate-pulse"
        >
          Warning: This action will halt operations. Click again to confirm.
        </motion.div>
      )}
      
      {!isConfirming && (
        <div className="mt-8 text-center text-slate-500 text-xs font-mono max-w-md">
          Executing this command will trigger physical siren arrays, dispatch emergency SMS to all on-site personnel, and record an immutable entry in the forensic Black Box.
        </div>
      )}
    </div>
  );
}
