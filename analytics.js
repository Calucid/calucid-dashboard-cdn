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
  const docRef = doc(db, "website/", key + "/analytics/" + date);

  try {
    // Check if the document exists
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      // Initialize the document if it doesn't exist
      await setDoc(docRef, {
        pageViews: 0,
        sessions: 0,
      });
    }

    // Increment page views
    await updateDoc(docRef, { pageViews: increment(1) });

    // Increment sessions if it's a new session
    const sessionDocRef = doc(db, `website/${key}/sessions`, sessionId);
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
