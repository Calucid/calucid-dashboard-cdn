// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAkHCm9B4KxAt3n3R6rsdUvMqiBoHE3MVE",
  authDomain: "calucid-dashboard.firebaseapp.com",
  projectId: "calucid-dashboard",
  storageBucket: "calucid-dashboard.firebasestorage.app",
  messagingSenderId: "198950789396",
  appId: "1:198950789396:web:c2ccc897a78f6dd4f6e201",
  measurementId: "G-G2NRCTBH0F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper Function: Get the current domain (hostname) without 'www.' and replace '.' with '-'
function getDomainKey() {
  let domain = window.location.hostname;
  if (domain.startsWith('www.')) domain = domain.slice(4); // Remove 'www.'
  return domain.replace(/\./g, '-'); // Replace '.' with '-'
}

// Helper Function: Generate a unique session ID for the user
function getOrSetSessionId() {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

// Helper Function: Get user's IP address using a public API
async function getUserIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return null;
  }
}

// Helper Function: Get current date in MM-DD-YYYY format
function getCurrentDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

// Main Function: Track Analytics
async function trackAnalytics() {
  const key = getDomainKey();
  if (!key) {
    console.error("No domain found for analytics tracking.");
    return;
  }

  const sessionId = getOrSetSessionId();
  const ipAddress = await getUserIp();
  const date = getCurrentDate();

  const docRef = doc(db, "websites/", key + "/analytics/" + date);

  try {
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      await setDoc(docRef, { pageViews: 0, sessions: 0 });
    }

    await updateDoc(docRef, { pageViews: increment(1) });

    const sessionDocRef = doc(db, `websites/${key}/sessions`, sessionId);
    const sessionSnapshot = await getDoc(sessionDocRef);
    if (!sessionSnapshot.exists()) {
      await setDoc(sessionDocRef, { sessionId, timestamp: Date.now(), ipAddress });
      await updateDoc(docRef, { sessions: increment(1) });
    }
  } catch (error) {
    console.error("Error tracking analytics:", error);
  }
}

// Automatically Track Analytics on Route Changes
function trackRouteChanges() {
  // Track the initial page load
  trackAnalytics();

  // Detect route changes using the 'popstate' and 'pushState' events
  window.addEventListener('popstate', trackAnalytics); // For back/forward navigation

  // Override `pushState` and `replaceState` to detect React Router's programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    trackAnalytics(); // Trigger analytics on navigation
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    trackAnalytics(); // Trigger analytics on navigation
  };
}

// Initialize Tracking
trackRouteChanges();
