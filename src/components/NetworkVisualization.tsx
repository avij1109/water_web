'use client';

import { useEffect, useState } from 'react';

interface NetworkVisualizationProps {
  valveStatus: string;
}

export default function NetworkVisualization({ valveStatus }: NetworkVisualizationProps) {
  const nodes = [
    { id: 'A', x: 15, y: 35, label: 'A', isValveNode: true }, // Valve-controlled node
    { id: 'B', x: 30, y: 15, label: 'B', isValveNode: false },
    { id: 'C', x: 70, y: 20, label: 'C', isValveNode: false },
    { id: 'D', x: 45, y: 55, label: 'D', isValveNode: false },
    { id: 'E', x: 75, y: 60, label: 'E', isValveNode: false },
  ];

  const connections = [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'D' },
    { from: 'B', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'C', to: 'E' },
    { from: 'D', to: 'E' },
  ];

  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const getNodeColor = (node: typeof nodes[0]) => {
    if (node.isValveNode) {
      return valveStatus === 'OPEN' ? 'bg-green-500' : 'bg-red-500';
    }
    return 'bg-green-500';
  };

  const getNodeGlow = (node: typeof nodes[0]) => {
    if (node.isValveNode) {
      return valveStatus === 'OPEN' 
        ? 'shadow-[0_0_30px_rgba(34,197,94,0.8)]' 
        : 'shadow-[0_0_30px_rgba(239,68,68,0.8)]';
    }
    return 'shadow-[0_0_20px_rgba(34,197,94,0.6)]';
  };

  return (
    <div className="relative w-full h-[400px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-lg overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {connections.map((conn, idx) => {
          const from = getNodePosition(conn.from);
          const to = getNodePosition(conn.to);
          return (
            <line
              key={idx}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke="#3b82f6"
              strokeWidth="2"
              opacity="0.6"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            zIndex: 2,
          }}
        >
          {/* Node circle */}
          <div
            className={`relative w-16 h-16 rounded-full ${getNodeColor(node)} ${getNodeGlow(node)} 
              flex items-center justify-center transition-all duration-500 ${
                node.isValveNode ? 'animate-pulse' : ''
              }`}
          >
            <span className="text-white text-xl font-bold z-10">{node.label}</span>
            
            {/* Ripple effect for valve node */}
            {node.isValveNode && (
              <>
                <div className={`absolute inset-0 rounded-full ${
                  valveStatus === 'OPEN' ? 'bg-green-500' : 'bg-red-500'
                } opacity-30 animate-ping`}></div>
                <div className={`absolute inset-0 rounded-full ${
                  valveStatus === 'OPEN' ? 'bg-green-400' : 'bg-red-400'
                } opacity-20 animate-pulse`}></div>
              </>
            )}
          </div>

          {/* Node label */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-300 font-semibold whitespace-nowrap">
            {node.isValveNode ? 'Valve' : `Node ${node.label}`}
          </div>

          {/* Status indicator for valve node */}
          {node.isValveNode && (
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-bold ${
              valveStatus === 'OPEN' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {valveStatus}
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700 z-10">
        <div className="text-xs text-slate-300 font-semibold mb-2">Network Status</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              valveStatus === 'OPEN' ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}></div>
            <span className="text-xs text-slate-300">Valve Node: {valveStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-300">Active Nodes: 4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
