'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ServiceRequestMap = dynamic(() => import('../../components/ServiceRequestMap'), {
  ssr: false,
});

interface ServiceRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  jobDescription: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  photoUrl: string;
  location: {
    latitude: number;
    longitude: number;
    geopoint: any;
  };
  createdAt: any;
  updatedAt: any;
}

export default function ServiceRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showMap, setShowMap] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user has admin role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setLoading(false);
          loadServiceRequests();
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadServiceRequests = () => {
    const q = query(
      collection(db, 'service_requests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: ServiceRequest[] = [];
      snapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() } as ServiceRequest);
      });
      setRequests(requestsData);
    });

    return unsubscribe;
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'service_requests', requestId), {
        status: newStatus,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleTrackRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowMap(true);
  };

  const handleSendTanker = async () => {
    if (!selectedRequest) return;
    
    try {
      await updateDoc(doc(db, 'service_requests', selectedRequest.id), {
        status: 'in-progress',
        tankerSent: true,
        tankerSentAt: new Date(),
        updatedAt: new Date(),
      });
      alert('Tanker dispatched successfully! Status updated to In Progress.');
      // Keep the map open so admin can see the route
    } catch (error) {
      console.error('Error sending tanker:', error);
      alert('Failed to dispatch tanker');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in-progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                Service Requests
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
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            All Service Requests ({requests.length})
          </h2>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No service requests found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    {request.photoUrl && (
                      <div className="md:w-48 h-48 flex-shrink-0">
                        <img
                          src={request.photoUrl}
                          alt="Service request"
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={() => window.open(request.photoUrl, '_blank')}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                            {request.jobDescription}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">User</p>
                          <p className="text-black dark:text-white font-medium">
                            {request.userName}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {request.userEmail}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">Scheduled</p>
                          <p className="text-black dark:text-white font-medium">
                            {request.scheduledDate} at {request.scheduledTime}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="mb-4">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Location</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-black dark:text-white">
                            📍 {request.location.latitude.toFixed(6)}°N,{' '}
                            {request.location.longitude.toFixed(6)}°E
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${request.location.latitude},${request.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                          >
                            View on Map →
                          </a>
                          <button
                            onClick={() => handleTrackRequest(request)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                          >
                            🗺️ Track Location
                          </button>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        <p>Created: {formatDate(request.createdAt)}</p>
                        <p>Updated: {formatDate(request.updatedAt)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {request.status !== 'pending' && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'pending')}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Mark Pending
                          </button>
                        )}
                        {request.status !== 'in-progress' && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'in-progress')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {request.status !== 'completed' && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'completed')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}
                        {request.status !== 'cancelled' && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'cancelled')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Map Modal */}
      {showMap && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Track Service Request
              </h2>
              <button
                onClick={() => setShowMap(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1">
              <ServiceRequestMap
                userLocation={selectedRequest.location}
                userName={selectedRequest.userName}
                jobDescription={selectedRequest.jobDescription}
                onSendTanker={handleSendTanker}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
