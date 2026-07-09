import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from "firebase/app";
import { getFirestore as getClientFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// 1. Initialize Client SDK (works locally with API key and security rules)
const clientApp = getClientApps().length ? getClientApp() : initClientApp(firebaseConfig);
export const clientDb = firebaseConfig.firestoreDatabaseId
  ? getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId)
  : getClientFirestore(clientApp);

// 2. Initialize Admin SDK (works in Cloud Run with GCP service account credentials)
// NOTE: We disable the Admin SDK by setting firebaseAdminDb to null. This prevents
// PERMISSION_DENIED errors in environments where the container's GCP service account
// lacks Firestore permissions. The Client Web SDK (clientDb) is used instead, which
// works in all environments using the API Key and is authorized by our firestore.rules.
export const adminDb = clientDb; // Keep for client SDK backward compatibility
export const firebaseAdminDb = null;
