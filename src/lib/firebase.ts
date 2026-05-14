import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
console.log("Firebase App initialized with Project ID:", firebaseConfig.projectId);
console.log("Using Firestore Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);


export const auth = getAuth(app);

/**
 * Validates connection to Firestore as per instructions.
 */
export async function validateFirestoreConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    console.log("Firestore connectivity verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('incomplete')) {
      // Sometimes it returns incomplete if the doc doesn't exist but connection is ok
      console.log("Firestore connectivity verified (doc missing but reachable).");
      return;
    }
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Firestore connection failed: Client is offline.");
    } else {
      console.error("Firestore connection warning:", error);
    }
  }
}

// Initial connection test
validateFirestoreConnection();
