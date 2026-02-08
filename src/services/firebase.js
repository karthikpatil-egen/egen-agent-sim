import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'egen-agent-sim',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app;
let auth;
let db;
let firebaseAvailable = false;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseAvailable = true;
  }
} catch (e) {
  console.warn('Firebase not configured, running in local-only mode');
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: 'egen.ai' });

export async function signInWithGoogle() {
  if (!firebaseAvailable) {
    // Demo mode: return a mock user
    return {
      uid: 'demo-user',
      email: 'demo@egen.ai',
      displayName: 'Demo User',
      photoURL: null,
    };
  }
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email;
  if (!email.endsWith('@egen.ai')) {
    await signOut(auth);
    throw new Error('Please sign in with your @egen.ai email address.');
  }
  return result.user;
}

export async function logOut() {
  if (firebaseAvailable && auth) {
    await signOut(auth);
  }
}

export async function saveProject(userId, projectData) {
  if (!firebaseAvailable) return projectData.id || 'local-project';
  const projectId = projectData.id || doc(collection(db, 'projects')).id;
  await setDoc(doc(db, 'projects', projectId), {
    ...projectData,
    id: projectId,
    userId,
    updatedAt: serverTimestamp(),
    createdAt: projectData.createdAt || serverTimestamp(),
  }, { merge: true });
  return projectId;
}

export async function getProject(projectId) {
  if (!firebaseAvailable) return null;
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? snap.data() : null;
}

export async function updateProjectDeliverables(projectId, deliverables) {
  if (!firebaseAvailable) return;
  await updateDoc(doc(db, 'projects', projectId), { deliverables, updatedAt: serverTimestamp() });
}

export { auth, db, firebaseAvailable };
