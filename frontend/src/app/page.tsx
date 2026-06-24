'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Dashboard from '@/components/Dashboard';
import { useWebSocket } from '@/hooks/useWebSocket';

// Dynamically import ThreeScene to avoid SSR issues with Three.js
const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-800/50 rounded-xl border border-white/5 flex items-center justify-center">
      <div className="text-gray-500">Loading 3D Scene...</div>
    </div>
  ),
});

export default function Home() {
  const { data, isConnected } = useWebSocket();
  const riskScore = data?.risk?.score || 10;

  // Parse zones from topology if available, or use defaults
  const zones = [
    { id: 'Z1', name: 'Coke Oven', x: -4, y: 2, risk_multiplier: 1.8 },
    { id: 'Z2', name: 'Gas Unit', x: 0, y: 3, risk_multiplier: 1.5 },
    { id: 'Z3', name: 'Storage', x: 4, y: 2, risk_multiplier: 1.4 },
    { id: 'Z4', name: 'Maintenance', x: -2, y: -2, risk_multiplier: 1.2 },
    { id: 'Z5', name: 'Dispatch', x: 3, y: -2, risk_multiplier: 1.1 },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              SENTINEL-Φ
            </h1>
            <p className="text-xs text-gray-400 tracking-widest uppercase">
              Cognitive Industrial Safety OS
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-mono ${isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
              {isConnected ? '● LIVE' : '● OFFLINE'}
            </div>
          </div>
        </div>

        {/* 3D Scene */}
        <div className="mb-4">
          <ThreeScene riskScore={riskScore} zoneData={zones} />
        </div>

        {/* Dashboard Overlay (sits below or on top of 3D) */}
        <Dashboard />
      </div>

      {/* Logo is already fixed in layout.tsx - bottom-left */}
    </main>
  );
}
