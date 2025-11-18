'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import Link from 'next/link';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [pendingRequests, setPendingRequests] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user has admin role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUserName(userDoc.data().name || user.email || 'Admin');
          await loadStats();
          setLoading(false);
        } else {
          // Not an admin, redirect to login
          await signOut(auth);
          router.push('/login');
        }
      } else {
        // Not logged in, redirect to login
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadStats = async () => {
    try {
      // Get pending service requests count
      const q = query(
        collection(db, 'service_requests'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      setPendingRequests(snapshot.size);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
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
            <h1 className="text-xl font-semibold text-black dark:text-white">
              Water Management Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Welcome, {userName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Admin Dashboard
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome to the Water Management System admin dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Pending Requests
                </p>
                <p className="text-3xl font-bold text-black dark:text-white">
                  {pendingRequests}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-black dark:text-white">
                  -
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Water Readings
                </p>
                <p className="text-3xl font-bold text-black dark:text-white">
                  -
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">💧</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/readings"
            className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Sensor Readings
                </h3>
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              View real-time water flow and sensor data
            </p>
          </Link>

          <Link
            href="/service-requests"
            className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔧</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Service Requests
                </h3>
                {pendingRequests > 0 && (
                  <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded-full">
                    {pendingRequests} pending
                  </span>
                )}
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              View and manage all service requests from users
            </p>
          </Link>

          <Link
            href="/tracking"
            className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📍</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Location Tracking
                </h3>
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              View live location tracking on interactive map
            </p>
          </Link>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  User Management
                </h3>
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Coming soon...
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💧</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Water Analytics
                </h3>
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Coming soon...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
