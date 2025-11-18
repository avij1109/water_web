// components/ServiceRequestMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different markers
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); font-size: 20px;">${emoji}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

interface ServiceRequestMapProps {
  userLocation: {
    latitude: number;
    longitude: number;
  };
  userName: string;
  jobDescription: string;
  onSendTanker?: () => void;
}

export default function ServiceRequestMap({ 
  userLocation, 
  userName, 
  jobDescription,
  onSendTanker 
}: ServiceRequestMapProps) {
  const [adminPosition, setAdminPosition] = useState<[number, number] | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  const userPos: [number, number] = [userLocation.latitude, userLocation.longitude];

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAdminPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.log("Location error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  const handleSendTanker = () => {
    setShowRoute(true);
    if (onSendTanker) {
      onSendTanker();
    }
  };

  // Calculate center point between admin and user
  const centerLat = adminPosition 
    ? (adminPosition[0] + userPos[0]) / 2 
    : userPos[0];
  const centerLng = adminPosition 
    ? (adminPosition[1] + userPos[1]) / 2 
    : userPos[1];

  return (
    <div className="h-full w-full flex flex-col">
      {/* Map Controls */}
      <div className="bg-white dark:bg-zinc-900 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-black dark:text-white mb-1">
              Service Request Location
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {userName} - {jobDescription}
            </p>
          </div>
          <button
            onClick={handleSendTanker}
            disabled={!adminPosition}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🚚</span>
            <span>{showRoute ? 'Route Shown' : 'Send Tanker'}</span>
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={adminPosition ? 13 : 15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location Marker */}
          <Marker 
            position={userPos}
            icon={createCustomIcon('#ef4444', '🚰')}
          >
            <Popup>
              <div className="p-2">
                <strong className="text-lg">Service Request</strong>
                <p className="text-sm mt-1"><strong>User:</strong> {userName}</p>
                <p className="text-sm"><strong>Issue:</strong> {jobDescription}</p>
                <p className="text-xs text-gray-600 mt-2">
                  📍 {userPos[0].toFixed(6)}°N, {userPos[1].toFixed(6)}°E
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Admin/Tanker Location Marker */}
          {adminPosition && (
            <Marker 
              position={adminPosition}
              icon={createCustomIcon('#10b981', '🚚')}
            >
              <Popup>
                <div className="p-2">
                  <strong className="text-lg">Water Tanker</strong>
                  <p className="text-sm mt-1">Your Location</p>
                  <p className="text-xs text-gray-600 mt-2">
                    📍 {adminPosition[0].toFixed(6)}°N, {adminPosition[1].toFixed(6)}°E
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Line */}
          {showRoute && adminPosition && (
            <Polyline
              positions={[adminPosition, userPos]}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-3 z-[1000]">
          <h4 className="font-semibold text-sm text-black dark:text-white mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span>🚰</span>
              <span className="text-zinc-600 dark:text-zinc-400">Service Request Location</span>
            </div>
            {adminPosition && (
              <div className="flex items-center gap-2">
                <span>🚚</span>
                <span className="text-zinc-600 dark:text-zinc-400">Water Tanker (Your Location)</span>
              </div>
            )}
            {showRoute && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-blue-500"></div>
                <span className="text-zinc-600 dark:text-zinc-400">Route</span>
              </div>
            )}
          </div>
        </div>

        {/* Distance Info */}
        {showRoute && adminPosition && (
          <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-3 z-[1000]">
            <h4 className="font-semibold text-sm text-black dark:text-white mb-1">Distance</h4>
            <p className="text-lg font-bold text-blue-600">
              {calculateDistance(adminPosition, userPos)} km
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Straight line distance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Calculate straight-line distance between two points (Haversine formula)
function calculateDistance(pos1: [number, number], pos2: [number, number]): string {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(pos2[0] - pos1[0]);
  const dLon = toRad(pos2[1] - pos1[1]);
  const lat1 = toRad(pos1[0]);
  const lat2 = toRad(pos2[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance.toFixed(2);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
