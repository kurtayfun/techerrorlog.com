import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from "firebase/app";
import { getFirestore as getClientFirestore } from "firebase/firestore/lite";
import firebaseConfig from "../../firebase-applet-config.json";

// Build configuration dynamically using environment variables first, falling back to JSON config.
// This prevents hardcoded credential leaks on public GitHub repositories when production env vars are configured.
const activeFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || (firebaseConfig as any).databaseId
};

// 1. Initialize Client SDK (works locally with API key and security rules, or in prod via Env Vars)
const clientApp = getClientApps().length 
  ? getClientApp() 
  : initClientApp({
      apiKey: activeFirebaseConfig.apiKey,
      authDomain: activeFirebaseConfig.authDomain,
      projectId: activeFirebaseConfig.projectId,
      storageBucket: activeFirebaseConfig.storageBucket,
      messagingSenderId: activeFirebaseConfig.messagingSenderId,
      appId: activeFirebaseConfig.appId,
    });

export const clientDb = activeFirebaseConfig.firestoreDatabaseId
  ? getClientFirestore(clientApp, activeFirebaseConfig.firestoreDatabaseId)
  : getClientFirestore(clientApp);

// 2. Initialize Admin SDK (works in Cloud Run with GCP service account credentials)
// NOTE: We disable the Admin SDK by setting firebaseAdminDb to null. This prevents
// PERMISSION_DENIED errors in environments where the container's GCP service account
// lacks Firestore permissions. The Client Web SDK (clientDb) is used instead, which
// works in all environments using the API Key and is authorized by our firestore.rules.
export const adminDb = clientDb; // Keep for client SDK backward compatibility
export const firebaseAdminDb = null;
