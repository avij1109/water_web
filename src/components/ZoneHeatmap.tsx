// components/ZoneHeatmap.tsx
'use client';

import { useState } from 'react';

interface Zone {
  id: string;
  name: string;
  temperature: number;
  sensors: number;
  solenoids: number;
  position: { x: number; y: number };
}

export default function ZoneHeatmap() {
  const [zones, setZones] = useState<Zone[]>([
    { id: 'A1', name: 'Zone A1', temperature: 28, sensors: 3, solenoids: 2, position: { x: 15, y: 20 } },
    { id: 'A2', name: 'Zone A2', temperature: 32, sensors: 2, solenoids: 1, position: { x: 40, y: 15 } },
    { id: 'B1', name: 'Zone B1', temperature: 26, sensors: 4, solenoids: 3, position: { x: 65, y: 25 } },
    { id: 'B2', name: 'Zone B2', temperature: 29, sensors: 2, solenoids: 2, position: { x: 85, y: 20 } },
    { id: 'C1', name: 'Zone C1', temperature: 35, sensors: 3, solenoids: 2, position: { x: 25, y: 60 } },
    { id: 'C2', name: 'Zone C2', temperature: 42, sensors: 2, solenoids: 1, position: { x: 55, y: 65 } },
    { id: 'D1', name: 'Zone D1', temperature: 31, sensors: 3, solenoids: 2, position: { x: 80, y: 70 } },
  ]);

  const getTemperatureColor = (temp: number) => {
    if (temp >= 40) return 'bg-red-500';
    if (temp >= 35) return 'bg-orange-500';
    if (temp >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTemperatureGlow = (temp: number) => {
    if (temp >= 40) return 'shadow-[0_0_40px_rgba(239,68,68,0.6)]';
    if (temp >= 35) return 'shadow-[0_0_30px_rgba(249,115,22,0.5)]';
    if (temp >= 30) return 'shadow-[0_0_25px_rgba(234,179,8,0.4)]';
    return 'shadow-[0_0_20px_rgba(34,197,94,0.3)]';
  };

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-br from-blue-950 via-purple-900 to-blue-950 rounded-lg overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-8 grid-rows-8 h-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-blue-400"></div>
          ))}
        </div>
      </div>

      {/* Zones */}
      {zones.map((zone) => (
        <div
          key={zone.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 cursor-pointer"
          style={{
            left: `${zone.position.x}%`,
            top: `${zone.position.y}%`,
          }}
        >
          {/* Zone circle */}
          <div
            className={`relative w-24 h-24 rounded-full ${getTemperatureColor(
              zone.temperature
            )} ${getTemperatureGlow(zone.temperature)} flex flex-col items-center justify-center transition-all duration-300`}
          >
            <span className="text-white text-xs font-semibold">{zone.name}</span>
            <span className="text-white text-2xl font-bold">{zone.temperature}°C</span>
          </div>

          {/* Sensor and Solenoid badges */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 text-xs bg-blue-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-700">
            <span className="flex items-center gap-1 text-cyan-400">
              <span>💧</span>
              <span>{zone.sensors}</span>
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <span>⚡</span>
              <span>{zone.solenoids}</span>
            </span>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-blue-900/90 backdrop-blur-sm rounded-lg p-4 border border-blue-700">
        <h4 className="text-white text-sm font-semibold mb-3">Temperature Scale</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-blue-200">&lt; 30°C Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-blue-200">30-35°C Warm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-blue-200">35-40°C Hot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-blue-200">&gt; 40°C Critical</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-700">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-cyan-400">💧</span>
            <span className="text-blue-200">Sensors</span>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <span className="text-yellow-400">⚡</span>
            <span className="text-blue-200">Solenoids</span>
          </div>
        </div>
      </div>
    </div>
  );
}
