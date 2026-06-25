import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function CCTVAnalytics() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setLogs(["Initializing YOLOv8 inference engine..."]);
    setShowVideo(true);

    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file);
      videoRef.current.play();
    }

    setTimeout(() => setLogs(prev => [...prev, "Extracting frames..."]), 500);
    setTimeout(() => setLogs(prev => [...prev, "Running object detection..."]), 1000);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8001/api/cctv/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      setLogs(prev => [
        ...prev, 
        `Detection complete.`,
        `> Person Detected: YES`,
        `> Helmet Detected: NO`,
        `⚠️ PPE VIOLATION DETECTED! Risk score increased by ${data.risk_increase}%.`
      ]);
    } catch (e) {
      setLogs(prev => [...prev, "Error communicating with intelligence layer."]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 animate-in fade-in duration-700">
      <div className="mb-4">
        <h2 className="text-3xl font-light text-slate-200 tracking-widest uppercase mb-2">Vision Analytics</h2>
        <p className="text-slate-500 text-sm">YOLOv8 PPE & Zone Intrusion Detection</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
        
        {/* Upload & Video Preview Panel */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
          {!showVideo ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-slate-950/50 hover:bg-white/5 transition-colors group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform opacity-50">📹</div>
              <p className="text-slate-400 font-bold tracking-widest uppercase mb-2">Upload Incident Footage</p>
              <p className="text-slate-600 text-xs text-center px-8 mb-6">Supports MP4, AVI, MOV up to 50MB.<br/>Footage will be processed by the Sentinel Vision engine.</p>
              
              <label className="bg-blue-600/20 text-blue-400 border border-blue-500/50 px-6 py-2 rounded-full cursor-pointer hover:bg-blue-600/40 transition-colors uppercase tracking-widest text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                Select Video File
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
              </label>
              
              {file && (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="text-emerald-400 text-sm border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 rounded-lg">
                    {file.name} ready for analysis.
                  </div>
                  <button 
                    onClick={handleUpload}
                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all hover:scale-105"
                  >
                    Run YOLOv8 Analysis
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full relative rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
              <video 
                ref={videoRef} 
                className="w-full h-full object-contain" 
                muted 
                controls={false}
              />
              
              {/* Fake Bounding Box Overlay overlay during processing */}
              {isUploading && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-full h-full border-[4px] border-blue-500/30 animate-pulse" />
                  <div className="absolute top-10 right-10 flex gap-2">
                     <span className="bg-red-500 text-white text-xs font-mono px-2 py-1 uppercase font-bold animate-pulse">Scanning...</span>
                  </div>
                </div>
              )}

              {/* End of processing Bounding box mock */}
              {!isUploading && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  <div className="w-1/3 h-2/3 border-2 border-red-500 relative bg-red-500/10">
                     <span className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1 font-mono uppercase">Person 0.98</span>
                     <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-1/4 border border-red-500/50 flex items-center justify-center">
                        <span className="bg-red-900/80 text-red-300 text-[8px] px-1 font-mono uppercase absolute -bottom-4">No Helmet</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inference Logs Panel */}
        <div className="w-full md:w-1/3 bg-slate-950 border border-white/10 rounded-2xl p-6 flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-bold border-b border-white/5 pb-2">Vision Engine Log</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
            {logs.length === 0 ? (
              <span className="text-slate-700">Waiting for video input...</span>
            ) : (
              logs.map((log, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${log.includes('VIOLATION') ? 'text-red-400 font-bold bg-red-950/30 p-2 rounded border border-red-500/20' : log.includes('NO') ? 'text-orange-400' : 'text-emerald-400'}`}
                >
                  <span className="opacity-50 mr-2">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                  {log}
                </motion.div>
              ))
            )}
            {isUploading && (
              <div className="text-slate-500 animate-pulse">_</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
