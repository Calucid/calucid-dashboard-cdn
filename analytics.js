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
  let domain = window.location.hostname; // Get the domain name (e.g., www.example.com or example.com)
  
  // Remove 'www.' if it exists at the start of the domain
  if (domain.startsWith('www.')) {
    domain = domain.slice(4); // Remove the first 4 characters (i.e., 'www.')
  }

  // Replace '.' with '-' in the domain
  domain = domain.replace(/\./g, '-'); // Replace all '.' characters with '-'

  return domain; // Return the modified domain
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
    return data.ip;  // Return the IP address
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return null; // Return null if IP can't be fetched
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

// Track Analytics
async function trackAnalytics() {
  const key = getDomainKey(); // Use the current domain as the key, with '.' replaced by '-'
  console.log("Tracking analytics for domain:", key);

  if (!key) {
    console.error("No domain found for analytics tracking.");
    return;
  }

  const sessionId = getOrSetSessionId();
  const ipAddress = await getUserIp(); // Fetch the IP address

  const date = getCurrentDate(); // Dynamically generate the date

  // Reference for Firestore document based on the domain key
  const docRef = doc(db, "websites/", key + "/analytics/" + date);

  try {
    // Check if the document exists
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      // Initialize the document if it doesn't exist
      await setDoc(docRef, {
        totalpageviews: 0,
        sessions: 0,
      });
    }

    // Increment page views
    await updateDoc(docRef, { totalpageviews: increment(1) });

    // Increment sessions if it's a new session
    const sessionDocRef = doc(db, `websites/${key}/sessions`, sessionId);
    const sessionSnapshot = await getDoc(sessionDocRef);
    if (!sessionSnapshot.exists()) {
      await setDoc(sessionDocRef, {
        sessionId: sessionId,
        timestamp: Date.now(),
        ipAddress: ipAddress,  // Save IP address to the session document
      });
      await updateDoc(docRef, { sessions: increment(1) });
    }
  } catch (error) {
    console.error("Error tracking analytics:", error);
  }
}

// Initialize Tracking
trackAnalytics();
