'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapWithLocation = dynamic(() => import('../../components/MapWithLocation'), {
  ssr: false,
});

export default function Tracking() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setLoading(false);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-black">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-zinc-900 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold text-black dark:text-white">
                📍 Location Tracking
              </h1>
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-400">Live Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapWithLocation />
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 max-w-sm z-[1000]">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
          Location Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>🗺️</span>
            <span>Interactive OpenStreetMap</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>📍</span>
            <span>Your current location is shown with a marker</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>🔍</span>
            <span>Click and drag to explore the map</span>
          </div>
        </div>
      </div>
    </div>
  );
}
