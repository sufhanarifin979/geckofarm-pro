import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, markFirestoreSuccess, registerListener } from './lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Gecko, Pairing, Clutch, UserProfile } from './types';

interface GeckoContextType {
  geckos: Gecko[];
  pairings: Pairing[];
  clutches: Clutch[];
  loading: boolean;
}

const GeckoContext = createContext<GeckoContextType | undefined>(undefined);

export function GeckoProvider({ profile, children }: { profile: UserProfile | null, children: React.ReactNode }) {
  const [geckos, setGeckos] = useState<Gecko[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) {
      setGeckos([]);
      setPairings([]);
      setClutches([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Load cached data from localStorage immediately (Offline-First / Quota resiliency)
    try {
      const cachedG = localStorage.getItem(`cache_geckos_${profile.uid}`);
      const cachedP = localStorage.getItem(`cache_pairings_${profile.uid}`);
      const cachedC = localStorage.getItem(`cache_clutches_${profile.uid}`);
      if (cachedG) {
        setGeckos(JSON.parse(cachedG));
      }
      if (cachedP) {
        setPairings(JSON.parse(cachedP));
      }
      if (cachedC) {
        setClutches(JSON.parse(cachedC));
      }
    } catch (e) {
      console.warn("Failed to load local cache into GeckoProvider:", e);
    }

    const gQuery = query(
      collection(db, 'geckos'),
      where('ownerId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const pQuery = query(
      collection(db, 'pairings'),
      where('ownerId', '==', profile.uid)
    );

    const cQuery = query(
      collection(db, 'clutches'),
      where('ownerId', '==', profile.uid)
    );

    let activeUnsubG: (() => void) | null = null;
    let activeUnsubP: (() => void) | null = null;
    let activeUnsubC: (() => void) | null = null;
    let isUnmounted = false;

    const activeTimeouts = new Set<NodeJS.Timeout>();
    const scheduleTimeout = (fn: () => void, delay: number) => {
      if (isUnmounted) return;
      const timer = setTimeout(() => {
        activeTimeouts.delete(timer);
        fn();
      }, delay);
      activeTimeouts.add(timer);
    };

    const maxRetries = 5;

    function subscribeGeckos(retries = 0) {
      if (isUnmounted) return;
      if (activeUnsubG) activeUnsubG();

      const rawUnsub = onSnapshot(gQuery, (snapshot) => {
        markFirestoreSuccess();
        const gList: Gecko[] = [];
        const seen = new Set();
        snapshot.forEach(docSnap => {
          if (!seen.has(docSnap.id)) {
            gList.push({ id: docSnap.id, ...docSnap.data() } as Gecko);
            seen.add(docSnap.id);
          }
        });
        if (!isUnmounted) {
          setGeckos(gList);
          try {
            localStorage.setItem(`cache_geckos_${profile.uid}`, JSON.stringify(gList));
          } catch (e) {
            console.warn("Failed to cache geckos in local storage:", e);
          }
        }
      }, (error) => {
        console.warn(`GeckoProvider Geckos Error (attempt ${retries + 1}/${maxRetries}):`, error);
        if (!isUnmounted && retries < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retries), 10000);
          console.log(`Scheduling Geckos query retry in ${delay}ms...`);
          scheduleTimeout(() => subscribeGeckos(retries + 1), delay);
        }
      });

      activeUnsubG = registerListener(rawUnsub);
    }

    function subscribePairings(retries = 0) {
      if (isUnmounted) return;
      if (activeUnsubP) activeUnsubP();

      const rawUnsub = onSnapshot(pQuery, (snapshot) => {
        markFirestoreSuccess();
        const pList: Pairing[] = [];
        const seen = new Set();
        snapshot.forEach(docSnap => {
          if (!seen.has(docSnap.id)) {
            pList.push({ id: docSnap.id, ...docSnap.data() } as Pairing);
            seen.add(docSnap.id);
          }
        });
        if (!isUnmounted) {
          setPairings(pList);
          try {
            localStorage.setItem(`cache_pairings_${profile.uid}`, JSON.stringify(pList));
          } catch (e) {
            console.warn("Failed to cache pairings in local storage:", e);
          }
        }
      }, (error) => {
        console.warn(`GeckoProvider Pairings Error (attempt ${retries + 1}/${maxRetries}):`, error);
        if (!isUnmounted && retries < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retries), 10000);
          console.log(`Scheduling Pairings query retry in ${delay}ms...`);
          scheduleTimeout(() => subscribePairings(retries + 1), delay);
        }
      });

      activeUnsubP = registerListener(rawUnsub);
    }

    function subscribeClutches(retries = 0) {
      if (isUnmounted) return;
      if (activeUnsubC) activeUnsubC();

      const rawUnsub = onSnapshot(cQuery, (snapshot) => {
        markFirestoreSuccess();
        const cList: Clutch[] = [];
        const seen = new Set();
        snapshot.forEach(docSnap => {
          if (!seen.has(docSnap.id)) {
            cList.push({ id: docSnap.id, ...docSnap.data() } as Clutch);
            seen.add(docSnap.id);
          }
        });
        if (!isUnmounted) {
          setClutches(cList);
          setLoading(false);
          try {
            localStorage.setItem(`cache_clutches_${profile.uid}`, JSON.stringify(cList));
          } catch (e) {
            console.warn("Failed to cache clutches in local storage:", e);
          }
        }
      }, (error) => {
        console.warn(`GeckoProvider Clutches Error (attempt ${retries + 1}/${maxRetries}):`, error);
        if (!isUnmounted && retries < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retries), 10000);
          console.log(`Scheduling Clutches query retry in ${delay}ms...`);
          scheduleTimeout(() => subscribeClutches(retries + 1), delay);
        } else {
          if (!isUnmounted) {
            setLoading(false);
          }
        }
      });

      activeUnsubC = registerListener(rawUnsub);
    }

    subscribeGeckos();
    subscribePairings();
    subscribeClutches();

    const backupTimer = setTimeout(() => {
      if (!isUnmounted) {
        setLoading(false);
      }
    }, 1500);

    return () => {
      isUnmounted = true;
      activeTimeouts.forEach(clearTimeout);
      activeTimeouts.clear();
      if (activeUnsubG) activeUnsubG();
      if (activeUnsubP) activeUnsubP();
      if (activeUnsubC) activeUnsubC();
      clearTimeout(backupTimer);
    };
  }, [profile?.uid]);

  return (
    <GeckoContext.Provider value={{ geckos, pairings, clutches, loading }}>
      {children}
    </GeckoContext.Provider>
  );
}

export function useGeckos() {
  const context = useContext(GeckoContext);
  if (context === undefined) {
    throw new Error('useGeckos must be used within a GeckoProvider');
  }
  return context;
}
