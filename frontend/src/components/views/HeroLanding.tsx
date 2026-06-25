import { motion } from 'framer-motion';

export default function HeroLanding({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
      {/* Background Video / Image Mock (Animated Gradient for now) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-gray-900 to-black opacity-90 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 animate-pulse" />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 tracking-tighter drop-shadow-2xl mb-4">
            SENTINEL-Φ
          </h1>
          <p className="text-xl md:text-3xl text-slate-300 font-light tracking-widest uppercase mb-12">
            The Industrial Safety Operating System
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="flex flex-col items-center mb-16"
        >
          <div className="text-7xl md:text-9xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.6)] mb-2">
            0
          </div>
          <div className="text-emerald-500/80 uppercase tracking-widest text-sm font-bold">
            Fatalities
          </div>
          <div className="mt-6 px-6 py-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-sm tracking-widest font-mono">
            95% Incident Prevention Confidence
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          onClick={onEnter}
          className="group relative px-8 py-4 bg-transparent border border-blue-500/50 rounded-lg overflow-hidden transition-all hover:scale-105 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]"
        >
          <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-cyan-400/20 transition-all" />
          <span className="relative z-10 text-blue-400 group-hover:text-cyan-300 uppercase tracking-[0.3em] font-bold text-sm">
            Enter Command Center
          </span>
        </motion.button>
      </div>
    </div>
  );
}
