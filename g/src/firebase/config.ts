import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let cachedApp: FirebaseApp | null = null

export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  firestore: Firestore
  googleProvider: GoogleAuthProvider
}

export function getFirebaseServices(): FirebaseServices | null {
  if (!isFirebaseConfigured) {
    return null
  }

  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp(firebaseConfig)
  }

  return {
    app: cachedApp,
    auth: getAuth(cachedApp),
    firestore: getFirestore(cachedApp),
    googleProvider: new GoogleAuthProvider(),
  }
}
