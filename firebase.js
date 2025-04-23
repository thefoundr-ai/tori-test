// Firebase initialization for Tori backend with simplified query support
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with service account credentials
try {
  // The service account credentials will be provided as an environment variable in Vercel
  // For local development, you can use the JSON file directly
  let serviceAccount;
  
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    // For production: Parse the credentials from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  } else {
    // For local development: Load from file (not recommended for production)
    console.warn('Using local service account file - not recommended for production');
    serviceAccount = require('./service-account.json');
  }
  
  // Initialize the Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Export Firestore database instance with ignoreUndefinedProperties setting
const db = admin.firestore();
// Add this line to ignore undefined values in Firestore queries
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db };
