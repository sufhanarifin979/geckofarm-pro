import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, increment, deleteField } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Defensive initialization
let app;
try {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error("Firebase config is missing or invalid");
  }
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.error("Firebase App initialization failed:", e);
  // Create a dummy app object to prevent downstream crashes if possible, 
  // though auth/db will likely fail.
  app = !getApps().length ? initializeApp({ apiKey: "none", authDomain: "none", projectId: "none" }) : getApp();
}

export const auth = getAuth(app);

// Graceful firestore initialization
let firestoreDb;
try {
  firestoreDb = getFirestore(app, firebaseConfig?.firestoreDatabaseId || undefined);
} catch (e) {
  console.error("Firestore init failed, falling back to default:", e);
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getOrCreateUserProfile = async (user: User): Promise<UserProfile> => {
  try {
    console.log("Fetching profile for user:", user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    const isAutoPremium = user.email === 'sufhan.arifin979@gmail.com';
  
    if (userDoc.exists()) {
      console.log("Profile found, migrating/checking fields...");
      const rawData = userDoc.data();
      let needsUpdate = false;
      const updates: any = {};
  
      // Migration: handle old isPremium field
      if (rawData.isPremium !== undefined && rawData.subscription === undefined) {
        updates.subscription = rawData.isPremium ? 'premium' : 'free';
        updates.isPremium = deleteField();
        needsUpdate = true;
      }
  
      // Ensure all required fields exist
      if (rawData.geckoCount === undefined) { updates.geckoCount = 0; needsUpdate = true; }
      if (rawData.pairingCount === undefined) { updates.pairingCount = 0; needsUpdate = true; }
      if (rawData.clutchCount === undefined) { updates.clutchCount = 0; needsUpdate = true; }
      if (rawData.farmName === undefined) { updates.farmName = 'My Gecko Farm'; needsUpdate = true; }
      if (rawData.planLimit === undefined) { 
        updates.planLimit = (rawData.subscription === 'premium' || rawData.isPremium || isAutoPremium) ? 10000 : 10; 
        needsUpdate = true; 
      }
      if (rawData.subscription === undefined) {
         updates.subscription = isAutoPremium ? 'premium' : 'free';
         needsUpdate = true;
      }
  
      if (isAutoPremium && (rawData.subscription !== 'premium' || (rawData.planLimit || 0) < 10000)) {
         updates.subscription = 'premium';
         updates.planLimit = 10000;
         needsUpdate = true;
      }
  
      if (needsUpdate) {
        console.log("Updating profile fields:", updates);
        await updateDoc(userDocRef, updates);
        return { uid: user.uid, ...rawData, ...updates } as UserProfile;
      }
      
      return { uid: user.uid, ...rawData } as UserProfile;
    } else {
      console.log("No profile found, creating new one for:", user.email);
      const newUserProfile: Omit<UserProfile, 'uid'> = {
        email: user.email || '',
        farmName: 'My Gecko Farm',
        farmPhotoUrl: '',
        subscription: isAutoPremium ? 'premium' : 'free',
        geckoCount: 0,
        pairingCount: 0,
        clutchCount: 0,
        planLimit: isAutoPremium ? 10000 : 10
      };
      await setDoc(userDocRef, newUserProfile);
      return { uid: user.uid, ...newUserProfile } as UserProfile;
    }
  } catch (error) {
    console.error("Error in getOrCreateUserProfile:", error);
    throw error;
  }
};
