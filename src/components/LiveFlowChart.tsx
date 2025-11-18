'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FlowDataPoint {
  time: string;
  inlet: number;
  outlet: number;
  timestamp: number;
}

export default function LiveFlowChart() {
  const [flowData, setFlowData] = useState<FlowDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const incomingRef = ref(realtimeDb, 'waterSystem/incoming');
    const outgoingRef = ref(realtimeDb, 'waterSystem/outgoing');
    const valveRef = ref(realtimeDb, 'waterSystem/valveStatus');

    let currentInlet = 0;
    let currentOutlet = 0;
    let currentValveStatus = true;

    // Listen to incoming flow
    const unsubIncoming = onValue(incomingRef, (snapshot) => {
      if (snapshot.exists()) {
        currentInlet = snapshot.val();
        setIsConnected(true);
        updateFlowData();
      }
    });

    // Listen to outgoing flow
    const unsubOutgoing = onValue(outgoingRef, (snapshot) => {
      if (snapshot.exists()) {
        currentOutlet = snapshot.val();
        updateFlowData();
      }
    });

    // Listen to valve status
    const unsubValve = onValue(valveRef, (snapshot) => {
      if (snapshot.exists()) {
        currentValveStatus = snapshot.val();
        updateFlowData();
      }
    });

    function updateFlowData() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      });

      const newDataPoint: FlowDataPoint = {
        time: timeStr,
        inlet: currentValveStatus ? currentInlet : 0,
        outlet: currentValveStatus ? currentOutlet : 0,
        timestamp: now.getTime(),
      };

      setFlowData((prevData) => {
        // Keep last 60 data points (5 minutes at 5-second intervals)
        const updatedData = [...prevData, newDataPoint];
        if (updatedData.length > 60) {
          return updatedData.slice(-60);
        }
        return updatedData;
      });
    }

    return () => {
      unsubIncoming();
      unsubOutgoing();
      unsubValve();
    };
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-semibold mb-2">{payload[0].payload.time}</p>
          <p className="text-cyan-400 text-sm">
            Inlet: <span className="font-bold">{payload[0].value.toFixed(2)} L/min</span>
          </p>
          <p className="text-purple-400 text-sm">
            Outlet: <span className="font-bold">{payload[1].value.toFixed(2)} L/min</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      {!isConnected && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-yellow-900/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-yellow-700">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-300 text-sm">Waiting for data...</span>
          </div>
        </div>
      )}
      
      {isConnected && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-green-900/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm">Live</span>
          </div>
        </div>
      )}

      {flowData.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-blue-400 text-lg mb-2">📊 Initializing Chart...</div>
            <p className="text-blue-300 text-sm">Waiting for sensor data</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={flowData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorInlet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorOutlet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#60a5fa"
              tick={{ fill: '#93c5fd', fontSize: 12 }}
              tickLine={{ stroke: '#3b82f6' }}
            />
            <YAxis 
              stroke="#60a5fa"
              tick={{ fill: '#93c5fd', fontSize: 12 }}
              tickLine={{ stroke: '#3b82f6' }}
              label={{ value: 'Flow Rate (L/min)', angle: -90, position: 'insideLeft', fill: '#93c5fd' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
              formatter={(value) => <span style={{ color: '#93c5fd' }}>{value}</span>}
            />
            <Line 
              type="monotone" 
              dataKey="inlet" 
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={false}
              name="Inlet Flow"
              animationDuration={300}
              fill="url(#colorInlet)"
            />
            <Line 
              type="monotone" 
              dataKey="outlet" 
              stroke="#a855f7" 
              strokeWidth={3}
              dot={false}
              name="Outlet Flow"
              animationDuration={300}
              fill="url(#colorOutlet)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
