import { motion } from 'framer-motion';

export default function AISenate({ senate, compliance }: { senate: any, compliance: any }) {
  const agents = [
    { name: 'Safety Agent', status: compliance?.passed ? 'OK' : 'EVACUATE', color: compliance?.passed ? 'emerald' : 'red', icon: '🛡️' },
    { name: 'Operations Agent', status: senate?.decision === 'Stop' ? 'ISOLATE AREA' : 'NOMINAL', color: senate?.decision === 'Stop' ? 'yellow' : 'emerald', icon: '⚙️' },
    { name: 'Compliance Agent', status: !compliance?.passed ? 'OISD VIOLATION' : 'CLEAR', color: !compliance?.passed ? 'red' : 'emerald', icon: '📋' },
    { name: 'Emergency Agent', status: senate?.decision === 'Evacuate' || !compliance?.passed ? 'LEVEL 3 RESPONSE' : 'STANDBY', color: senate?.decision === 'Evacuate' || !compliance?.passed ? 'red' : 'blue', icon: '🚨' },
  ];

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      case 'red': return 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse';
      case 'yellow': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
      case 'blue': return 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
      default: return 'bg-slate-800 border-slate-600 text-slate-300';
    }
  };

  const isEvacuation = senate?.decision === 'Evacuate' || !compliance?.passed;

  return (
    <div className="flex flex-col h-full gap-6 p-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-light text-slate-200 tracking-widest uppercase mb-2">Autonomous Senate</h2>
          <p className="text-slate-500 text-sm">Multi-agent consensus protocol active.</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Current Consensus</div>
          <div className={`text-2xl font-black uppercase tracking-widest px-4 py-2 rounded-lg border ${isEvacuation ? 'bg-red-950/50 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400'}`}>
            {isEvacuation ? 'EVACUATION ORDERED' : 'MONITORING'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map((agent, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 1.5, type: 'spring', stiffness: 100 }}
            className={`rounded-2xl p-6 border flex flex-col items-center text-center justify-center min-h-[200px] transition-all ${getColorClasses(agent.color)}`}
          >
            <div className="text-4xl mb-4">{agent.icon}</div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">{agent.name}</div>
            <div className="text-xl font-black uppercase">{agent.status}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex-1 mt-4 overflow-hidden flex flex-col">
        <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 border-b border-white/5 pb-2">Live Agent Debate Log</h3>
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-4">
          {senate?.debate_log?.map((log: string, idx: number) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={idx} 
              className="p-3 rounded-lg bg-slate-900/50 border border-white/5 flex gap-4"
            >
              <div className="text-xs font-mono text-slate-500 mt-0.5">{new Date().toISOString().split('T')[1].substring(0, 8)}</div>
              <div className="text-sm text-slate-300 font-light">{log}</div>
            </motion.div>
          ))}
          {(!senate?.debate_log || senate.debate_log.length === 0) && (
            <div className="text-slate-600 text-sm italic text-center py-8">Waiting for agent consensus...</div>
          )}
        </div>
      </div>
    </div>
  );
}
