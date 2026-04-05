// Middleware to verify Google Idtoken passed from the frontend for validation of user session
const { auth }= require('../firebase_init/initialize_firebase');
const {admin}= require('../firebase_init/initialize_firebase');

const validateGoogleToken = async (req, res, next) => {

    // 1. ALWAYS let OPTIONS requests pass without checking for a token
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    console.log("❌ No token provided in the Authorization header");
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  console.log("📨 Received token (first 50 chars):", idToken.slice(0, 50) + "...");
  console.log("📨 Token length:", idToken.length);

  try {
    if (!auth) {
      console.error("❌ Firebase Auth not initialized!");
      return res.status(500).json({ error: 'Server error: Firebase Auth not initialized' });
    }

    console.log("🔍 Attempting to verify token...");
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("✅ Token verified successfully for UID:", decodedToken.uid);
    
    req.user = decodedToken;

    // check if user already exists in the collection "users" inside Firestore; if not create one
    const userRef = admin.firestore().collection('users').doc(decodedToken.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      console.log("📝 Creating new user document for:", decodedToken.uid);
      await userRef.set({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      });
    } else {
      console.log("👤 User already exists:", decodedToken.uid);
    }

    return res.status(200).json({
      message: 'User authenticated and verified successfully ✅',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      },
    });
  } catch (error) {
    console.error("❌ Token verification failed");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    
    // Check if this is a Google API auth error
    if (error.message && error.message.includes("UNAUTHENTICATED")) {
      console.error("⚠️  CRITICAL: Firebase Admin SDK credentials are invalid or revoked!");
      console.error("⚠️  Check your firebaseConfig.json service account key");
      return res.status(500).json({ 
        error: 'Server error: Firebase Admin credentials invalid',
        detail: 'Service account authentication failed'
      });
    }

    return res.status(401).json({ 
      error: 'Unauthorized: Invalid or expired token',
      detail: error.message 
    });
  }
};
module.exports = {validateGoogleToken};