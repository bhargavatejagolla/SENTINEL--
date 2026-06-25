import { motion } from 'framer-motion';

export default function WhatIfSimulator({ whatif, executeAction }: { whatif: any, executeAction: (action: string) => void }) {
  
  // Provide mock data if no plans exist yet (e.g., during normal monitoring)
  const plans = whatif?.plans?.length > 0 ? whatif.plans : [
    { name: 'Evacuate', risk_reduction: 95, cost_impact: 500000, new_risk_score: 5, time_to_execute: 15 },
    { name: 'Shutdown Unit', risk_reduction: 70, cost_impact: 2000000, new_risk_score: 25, time_to_execute: 45 },
    { name: 'Ignore', risk_reduction: 0, cost_impact: 120000000, new_risk_score: 98, time_to_execute: 0 },
  ];

  const getRowClasses = (name: string) => {
    if (name.toLowerCase().includes('evacuate')) return 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500';
    if (name.toLowerCase().includes('shutdown')) return 'bg-yellow-950/20 border-yellow-500/30 hover:border-yellow-500';
    return 'bg-red-950/20 border-red-500/30 hover:border-red-500';
  };

  const getFatalities = (name: string) => {
    if (name.toLowerCase().includes('evacuate')) return '0';
    if (name.toLowerCase().includes('shutdown')) return '2 (Estimated)';
    return '8+ (Critical)';
  };

  const formatCost = (cost: number) => {
    if (cost >= 10000000) return `₹${(cost / 10000000).toFixed(1)} Cr`;
    if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)}L`;
    return `₹${cost}`;
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6 animate-in fade-in duration-700">
      <div className="mb-4">
        <h2 className="text-3xl font-light text-slate-200 tracking-widest uppercase mb-2">What-If Simulator</h2>
        <p className="text-slate-500 text-sm">Monte Carlo projections for intervention strategies.</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-4">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-black/40 border border-white/5 rounded-xl text-xs uppercase tracking-widest text-slate-500 font-bold">
          <div className="col-span-1">Action</div>
          <div className="col-span-1 text-center">Predicted Fatalities</div>
          <div className="col-span-1 text-center">Financial Impact</div>
          <div className="col-span-1 text-center">Residual Risk</div>
          <div className="col-span-1 text-center">Execution</div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col gap-4 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {plans.map((plan: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`grid grid-cols-5 gap-4 px-6 py-5 rounded-2xl border items-center transition-all cursor-pointer group ${getRowClasses(plan.name)}`}
            >
              <div className="col-span-1 font-bold text-white text-lg group-hover:pl-2 transition-all">
                {plan.name}
              </div>
              <div className={`col-span-1 text-center font-black text-xl ${plan.name.toLowerCase().includes('ignore') ? 'text-red-500' : 'text-slate-300'}`}>
                {getFatalities(plan.name)}
              </div>
              <div className="col-span-1 text-center font-mono text-slate-400">
                {formatCost(plan.cost_impact)}
              </div>
              <div className="col-span-1 flex justify-center items-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * plan.new_risk_score) / 100} className={plan.new_risk_score > 50 ? 'text-red-500' : 'text-emerald-500'} />
                  </svg>
                  <span className="absolute text-sm font-bold text-slate-300">{plan.new_risk_score}%</span>
                </div>
              </div>
              <div className="col-span-1 flex justify-center">
                {plan.name.toLowerCase().includes('ignore') ? (
                  <span className="text-red-500/50 uppercase tracking-widest text-xs font-bold">NOT RECOMMENDED</span>
                ) : (
                  <button 
                    onClick={() => executeAction(plan.name)}
                    className="px-6 py-2 bg-slate-900 border border-slate-600 rounded-full text-xs uppercase tracking-widest font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all hover:scale-105"
                  >
                    Simulate
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
