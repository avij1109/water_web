// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfIQqjq3e5OhQnk4uum7ze3Vau_2Nmz3Y",
  authDomain: "water-management-9f786.firebaseapp.com",
  databaseURL: "https://water-management-9f786-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "water-management-9f786",
  storageBucket: "water-management-9f786.firebasestorage.app",
  messagingSenderId: "958770955322",
  appId: "1:958770955322:web:63d8e20beec83258f2e103",
  measurementId: "G-3HSJY0LE30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

export { app, analytics, auth, db, realtimeDb };