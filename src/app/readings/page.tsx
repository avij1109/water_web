'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { auth, db, realtimeDb } from '../../../firebase';
import Link from 'next/link';
import ZoneHeatmap from '@/components/ZoneHeatmap';
import NetworkVisualization from '@/components/NetworkVisualization';
import dynamic from 'next/dynamic';

const LiveFlowChart = dynamic(() => import('@/components/LiveFlowChart'), { ssr: false });

interface SensorReading {
  id: string;
  sensorName: string;
  zone: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: any;
  type: 'inlet' | 'outlet';
}

export default function Readings() {
  const [loading, setLoading] = useState(true);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [avgInletFlow, setAvgInletFlow] = useState(0);
  const [avgOutletFlow, setAvgOutletFlow] = useState(0);
  const [activeSensors, setActiveSensors] = useState(0);
  const [activeSolenoids, setActiveSolenoids] = useState(0);
  const [valveOn, setValveOn] = useState(true);
  const [incomingFlow, setIncomingFlow] = useState(0);
  const [outgoingFlow, setOutgoingFlow] = useState(0);
  const [valveStatus, setValveStatus] = useState('OPEN');
  const [leakDetected, setLeakDetected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setLoading(false);
          loadSensorData();
          connectToRealtimeDatabase();
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const connectToRealtimeDatabase = () => {
    // Listen to incoming flow
    const incomingRef = ref(realtimeDb, 'waterSystem/incoming');
    onValue(incomingRef, (snapshot) => {
      const value = snapshot.val() || 0;
      setIncomingFlow(value);
      setAvgInletFlow(value);
    });

    // Listen to outgoing flow
    const outgoingRef = ref(realtimeDb, 'waterSystem/outgoing');
    onValue(outgoingRef, (snapshot) => {
      const value = snapshot.val() || 0;
      setOutgoingFlow(value);
      setAvgOutletFlow(value);
    });

    // Listen to valve status
    const valveStatusRef = ref(realtimeDb, 'waterSystem/valveStatus');
    onValue(valveStatusRef, (snapshot) => {
      const status = snapshot.val() || 'OPEN';
      setValveStatus(status);
      setValveOn(status === 'OPEN');
    });

    // Leak detection logic
    const leakCheck = setInterval(() => {
      const diff = Math.abs(incomingFlow - outgoingFlow);
      setLeakDetected(diff > 10);
    }, 1000);

    return () => clearInterval(leakCheck);
  };

  const handleValveToggle = async () => {
    const newState = !valveOn;
    setValveOn(newState);
    
    try {
      if (newState) {
        await set(ref(realtimeDb, 'manualOpen'), true);
        await set(ref(realtimeDb, 'manualClose'), false);
      } else {
        await set(ref(realtimeDb, 'manualOpen'), false);
        await set(ref(realtimeDb, 'manualClose'), true);
      }
    } catch (error) {
      console.error('Error updating valve:', error);
    }
  };

  const loadSensorData = () => {
    // Mock data removed - will use real data from Firebase Realtime DB
    setSensorReadings([]);
    setActiveSensors(0);
    setActiveSolenoids(0);

    // In production, use Firestore listener:
    // const q = query(collection(db, 'sensor_readings'), orderBy('timestamp', 'desc'), limit(10));
    // const unsubscribe = onSnapshot(q, (snapshot) => {
    //   const readings: SensorReading[] = [];
    //   snapshot.forEach((doc) => {
    //     readings.push({ id: doc.id, ...doc.data() } as SensorReading);
    //   });
    //   setSensorReadings(readings);
    // });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="bg-white dark:bg-zinc-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold text-black dark:text-white">
                Sensor Readings
              </h1>
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Leak Alert */}
        {leakDetected && (
          <div className="mb-6 bg-red-600 border-2 border-red-400 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚠️</span>
              <div>
                <h3 className="text-xl font-bold text-white">LEAK DETECTED!</h3>
                <p className="text-red-100">
                  Water flow difference exceeds threshold. Please check the system immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {!leakDetected && (
          <div className="mb-6 bg-green-600 border-2 border-green-400 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✔️</span>
              <div>
                <h3 className="text-lg font-bold text-white">System Normal</h3>
                <p className="text-green-100">Water flow is within normal parameters.</p>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Real-time Monitoring</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Live water flow and sensor data from Arduino</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 rounded-full -mr-10 -mt-10 opacity-50"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-blue-100 text-sm">Incoming Flow</span>
              <span className="text-3xl">💧</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1 relative z-10">
              {incomingFlow.toFixed(1)} L/min
            </div>
            <div className="flex items-center gap-1 text-blue-100 text-sm relative z-10">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Live from Arduino</span>
            </div>
          </div>

          <div className="bg-purple-600 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 rounded-full -mr-10 -mt-10 opacity-50"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-purple-100 text-sm">Outgoing Flow</span>
              <span className="text-3xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1 relative z-10">
              {outgoingFlow.toFixed(1)} L/min
            </div>
            <div className="flex items-center gap-1 text-purple-100 text-sm relative z-10">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Live from Arduino</span>
            </div>
          </div>

          <div className={`rounded-xl p-6 shadow-lg relative overflow-hidden ${
            valveStatus === 'OPEN' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-50 ${
              valveStatus === 'OPEN' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            
            {/* Valve Toggle Button at Top */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className={`text-sm ${valveStatus === 'OPEN' ? 'text-green-100' : 'text-red-100'}`}>
                Valve Status
              </span>
              <button
                onClick={handleValveToggle}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  valveOn ? 'bg-white/30' : 'bg-white/30'
                } border-2 ${valveOn ? 'border-white' : 'border-white'}`}
                title={`Click to turn valve ${valveOn ? 'OFF' : 'ON'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                    valveOn ? 'translate-x-7' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>

            <div className="flex items-center justify-center mb-2 relative z-10">
              <span className="text-5xl">{valveStatus === 'OPEN' ? '🔓' : '🔒'}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1 relative z-10 text-center">
              {valveStatus}
            </div>
            <div className={`flex items-center gap-1 text-sm relative z-10 ${
              valveStatus === 'OPEN' ? 'text-green-100' : 'text-red-100'
            }`}>
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>Real-time status</span>
            </div>
          </div>

          <div className={`rounded-xl p-6 shadow-lg relative overflow-hidden ${
            leakDetected ? 'bg-red-600' : 'bg-orange-600'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-50 ${
              leakDetected ? 'bg-red-500' : 'bg-orange-500'
            }`}></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className={`text-sm ${leakDetected ? 'text-red-100' : 'text-orange-100'}`}>
                Flow Difference
              </span>
              <span className="text-3xl">{leakDetected ? '⚠️' : '📈'}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1 relative z-10">
              {Math.abs(incomingFlow - outgoingFlow).toFixed(1)} L/min
            </div>
            <div className={`flex items-center gap-1 text-sm relative z-10 ${
              leakDetected ? 'text-red-100' : 'text-orange-100'
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full ${
                leakDetected ? 'bg-yellow-300 animate-pulse' : 'bg-green-400'
              }`}></span>
              <span>{leakDetected ? 'Leak detected!' : 'Normal'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Flow Rate Chart */}
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-800/50">
            <h3 className="text-xl font-semibold text-white mb-4">Live Flow Rate</h3>
            <p className="text-blue-300 text-sm mb-4">Real-time inlet and outlet flow monitoring</p>
            <div className="relative h-80 bg-blue-950/50 rounded-lg">
              <LiveFlowChart />
            </div>
          </div>

          {/* Network Visualization */}
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-800/50">
            <h3 className="text-xl font-semibold text-white mb-4">Network Visualization</h3>
            <p className="text-blue-300 text-sm mb-4">Real-time network status with valve-controlled node</p>
            <NetworkVisualization valveStatus={valveStatus} />
          </div>
        </div>

        {/* Zone Heatmap Section */}
        <div className="mt-8 bg-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-800/50">
          <h3 className="text-xl font-semibold text-white mb-2">
            Zone Heatmap - Sensor & Solenoid Placement
          </h3>
          <p className="text-blue-300 text-sm mb-6">
            Temperature-based visualization of system nodes
          </p>
          <ZoneHeatmap />
        </div>
      </main>
    </div>
  );
}
