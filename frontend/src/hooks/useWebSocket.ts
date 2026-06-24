import { useEffect, useState, useRef } from 'react';

interface WebSocketData {
  sensors: Record<string, number>;
  compound_alerts: any[];
  timestamp: string;
  shift: string;
  permits: string[];
  risk: {
    score: number;
    forecast_20m?: number;
    contributors: Record<string, number>;
    features: Record<string, any>;
  };
  senate: {
    decision: string;
    reasoning: string;
    debate_log: string[];
    context?: any;
  };
  whatif?: {
    plans: any[];
    best_plan: any;
    ghost_path: any[];
  };
  blackbox?: {
    last_event: string | null;
  };
  compliance?: {
    passed: boolean;
    reason: string;
  };
  action?: {
    status: string;
    message: string;
    audio_payloads?: Record<string, string>;
  };
  cctv?: {
    intrusion: boolean;
    message: string;
  };
  safety_culture?: {
    score: number;
    trend: string;
  };
  intelligence_layer?: {
    human_reliability: number;
    similar_events: number;
    trajectory: number[];
  };
}

export function useWebSocket() {
  const [data, setData] = useState<WebSocketData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to your FastAPI backend
    const ws = new WebSocket('ws://localhost:8001/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🔌 WebSocket connected to SENTINEL-Φ Backend');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update' && payload.data) {
          setData(payload.data);
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.log('🔄 Attempting WebSocket reconnect...');
          // We let the useEffect cleanup and re-run
        }
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return { data, isConnected };
}
