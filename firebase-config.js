// =====================================================================
// FIREBASE PROJECT CONFIG
// =====================================================================
// Replace these placeholder values with your actual Firebase project config.
// Get this from: https://console.firebase.google.com
//   1. Open your project
//   2. Click the gear icon -> Project settings
//   3. Scroll down to "Your apps" -> Web app -> SDK setup and configuration
//   4. Copy the values from the firebaseConfig object
//
// NOTE: It is safe to keep these values in client-side code. Firebase's
// web config is designed to be public. Real security comes from Firestore
// Security Rules (see firestore.rules in this repo).
// =====================================================================

export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
