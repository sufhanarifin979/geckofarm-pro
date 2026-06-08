import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, increment, deleteField } from 'firebase/firestore';
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

// Initialize Firestore with robust local offline persistence.
// We avoid MultipleTabManager in sandboxed iframe or dev-environments to prevent runtime 
// BroadcastChannel/IndexedDB friction (which causes "FIRESTORE INTERNAL ASSERTION FAILED" crashes).
let firestoreDb;
try {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  
  if (isIframe) {
    console.log("Firestore: Running inside an iframe preview. Initializing standard cache for absolute stability.");
    // In iframe sandbox, standard getFirestore/initializeFirestore is safest.
    try {
      firestoreDb = getFirestore(app, firebaseConfig?.firestoreDatabaseId || undefined);
    } catch {
      firestoreDb = getFirestore(app);
    }
  } else {
    // If not in iframe, initialize with a stable persistent local cache (single-tab, which is highly reliable)
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({}) // Defaults to single-tab manager, avoiding buggy cross-tab locking
    }, firebaseConfig?.firestoreDatabaseId || undefined);
    console.log("Firestore: Initialized with stable single-tab persistentLocalCache!");
  }
} catch (e) {
  console.warn("Firestore persistent initialization failed, falling back to standard memory-only cache:", e);
  try {
    firestoreDb = getFirestore(app, firebaseConfig?.firestoreDatabaseId || undefined);
  } catch (err) {
    firestoreDb = getFirestore(app);
  }
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

// Memory and Session cache to prevent repeated reads and save Firestore quota
let profileCache: { [uid: string]: UserProfile } = {};
export let isFirestoreQuotaExceeded = false;

// Global memory caches to save Firestore reads on non-realtime collections
let morphsCache: any[] | null = null;
let adminUsersCache: any[] | null = null;

export const getCachedMorphs = () => morphsCache;
export const setCachedMorphs = (data: any[]) => {
  morphsCache = data;
};
export const clearCachedMorphs = () => {
  morphsCache = null;
  try {
    localStorage.removeItem('cache_encyclopedia_morphs');
  } catch (e) {}
};

export const getCachedAdminUsers = () => adminUsersCache;
export const setCachedAdminUsers = (data: any[]) => {
  adminUsersCache = data;
};
export const clearCachedAdminUsers = () => {
  adminUsersCache = null;
};

type QuotaListener = (exceeded: boolean) => void;
const quotaListeners = new Set<QuotaListener>();

export const subscribeToQuotaStatus = (listener: QuotaListener) => {
  quotaListeners.add(listener);
  listener(isFirestoreQuotaExceeded);
  return () => {
    quotaListeners.delete(listener);
  };
};

export const setFirestoreQuotaExceeded = (exceeded: boolean) => {
  const changed = isFirestoreQuotaExceeded !== exceeded;
  isFirestoreQuotaExceeded = exceeded;

  if (!exceeded) {
    // Clear any potential quota-related storage flags
    try {
      sessionStorage.removeItem('firestoreQuotaExceeded');
      sessionStorage.removeItem('isFirestoreQuotaExceeded');
      sessionStorage.removeItem('quotaWarning');
      localStorage.removeItem('firestoreQuotaExceeded');
      localStorage.removeItem('isFirestoreQuotaExceeded');
      localStorage.removeItem('quotaWarning');
    } catch (e) {
      console.warn("Failed to clear quota storage flags:", e);
    }
  }

  if (changed) {
    if (!exceeded) {
      // Hard clear the local in-memory and sessionStorage profiles to discard fallback profiles
      clearProfileCache();
    }
    quotaListeners.forEach(listener => {
      try {
        listener(exceeded);
      } catch (e) {
        console.error("Error in quota listener callback:", e);
      }
    });
  }
};

export function markFirestoreSuccess() {
  if (isFirestoreQuotaExceeded) {
    console.log("DIAGNOSTIC: Firestore query succeeded, recovering from quota limit!");
    setFirestoreQuotaExceeded(false);
  }
}

export const updateProfileCache = (uid: string, updated: UserProfile) => {
  profileCache[uid] = updated;
  try {
    sessionStorage.setItem(`profile_${uid}`, JSON.stringify(updated));
  } catch (e) {
    console.warn("Storage item setting failed:", e);
  }
};

export const clearProfileCache = () => {
  profileCache = {};
  try {
    sessionStorage.clear();
  } catch (e) {}
};

const activeListeners = new Set<() => void>();

export const registerListener = (unsubscribe: () => void): (() => void) => {
  activeListeners.add(unsubscribe);
  return () => {
    unsubscribe();
    activeListeners.delete(unsubscribe);
  };
};

export const unsubscribeAllListeners = () => {
  console.log(`Unsubscribing from all ${activeListeners.size} active Firestore listeners...`);
  activeListeners.forEach(unsub => {
    try {
      unsub();
    } catch (e) {
      console.warn("Failed to unsubscribe active listener during cleanup:", e);
    }
  });
  activeListeners.clear();
};

export const signOut = async () => {
  try {
    unsubscribeAllListeners();
    clearProfileCache();
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
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuota = errMsg.toLowerCase().includes('quota') || 
                  errMsg.toLowerCase().includes('resource-exhausted') || 
                  (error as any)?.code === 'resource-exhausted';
  
  if (isQuota) {
    setFirestoreQuotaExceeded(true);
    console.warn("DIAGNOSTIC: Firestore Quota Exceeded flag set to true.");
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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
  // 1. Fast Cache Check: Memory Cache
  if (profileCache[user.uid]) {
    console.log("CACHE HIT (memory): returning cached profile for user:", user.uid);
    return profileCache[user.uid];
  }

  // 2. Fast Cache Check: Session Storage
  try {
    const sessionCached = sessionStorage.getItem(`profile_${user.uid}`);
    if (sessionCached) {
      console.log("CACHE HIT (sessionStorage): returning cached profile for user:", user.uid);
      const parsed = JSON.parse(sessionCached) as UserProfile;
      profileCache[user.uid] = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to check sessionStorage:", e);
  }

  // 3. Firestore Read (only if cache misses)
  try {
    console.log("Fetching profile from Firestore (Cache Miss) for user:", user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // Successfully read userDoc - clear quota exceeded flag!
    setFirestoreQuotaExceeded(false);
    
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
  
      let finalProfile: UserProfile;
      if (needsUpdate) {
        console.log("Updating profile fields:", updates);
        try {
          await updateDoc(userDocRef, updates);
        } catch (updateError) {
          console.warn("Soft migration update failed, continuing in-memory:", updateError);
        }
        finalProfile = { uid: user.uid, ...rawData, ...updates } as UserProfile;
      } else {
        finalProfile = { uid: user.uid, ...rawData } as UserProfile;
      }
      
      // Update caches
      updateProfileCache(user.uid, finalProfile);
      return finalProfile;
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
      try {
        await setDoc(userDocRef, newUserProfile);
      } catch (createError) {
        console.warn("Soft profile creation failed, continuing in-memory:", createError);
      }
      const finalProfile = { uid: user.uid, ...newUserProfile } as UserProfile;
      updateProfileCache(user.uid, finalProfile);
      return finalProfile;
    }
  } catch (error: any) {
    console.error("Error in getOrCreateUserProfile (falling back to memory):", error);
    
    // Quota or network failure detection
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted') || error?.code === 'resource-exhausted') {
      setFirestoreQuotaExceeded(true);
    }

    const isAutoPremium = user.email === 'sufhan.arifin979@gmail.com';
    const fallbackProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      farmName: 'My Gecko Farm (Offline/Local)',
      farmPhotoUrl: '',
      subscription: isAutoPremium ? 'premium' : 'free',
      geckoCount: 0,
      pairingCount: 0,
      clutchCount: 0,
      planLimit: isAutoPremium ? 10000 : 10
    };
    
    // Save fallback to cache so we don't query Firestore again in subsequent renders/checks
    updateProfileCache(user.uid, fallbackProfile);
    return fallbackProfile;
  }
};
