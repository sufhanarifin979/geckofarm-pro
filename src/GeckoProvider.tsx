import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, markFirestoreSuccess, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Gecko, Pairing, Clutch, UserProfile } from './types';

interface GeckoContextType {
  geckos: Gecko[];
  pairings: Pairing[];
  clutches: Clutch[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const GeckoContext = createContext<GeckoContextType | undefined>(undefined);

export function GeckoProvider({ profile, children }: { profile: UserProfile | null, children: React.ReactNode }) {
  const [geckos, setGeckos] = useState<Gecko[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [loading, setLoading] = useState(true);

  // Define clear cached loading function so we can reuse it
  const loadFromCache = useCallback(() => {
    if (!profile?.uid) return;
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
  }, [profile?.uid]);

  // Load the data directly from Firestore on demand or on mount
  const refreshData = useCallback(async () => {
    if (!profile?.uid) {
      setGeckos([]);
      setPairings([]);
      setClutches([]);
      setLoading(false);
      return;
    }

    try {
      console.log(`[QUOTA SHIELD] Fetching fresh Gecko Farm data for ${profile.uid} on-demand`);
      
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

      // Fetch all three sets of data in parallel for speed
      const [geckosSnap, pairingsSnap, clutchesSnap] = await Promise.all([
        getDocs(gQuery),
        getDocs(pQuery),
        getDocs(cQuery)
      ]);

      markFirestoreSuccess();

      // Map geckos
      const gList: Gecko[] = [];
      const seenGecko = new Set();
      geckosSnap.forEach(docSnap => {
        if (!seenGecko.has(docSnap.id)) {
          gList.push({ id: docSnap.id, ...docSnap.data() } as Gecko);
          seenGecko.add(docSnap.id);
        }
      });

      // Map pairings
      const pList: Pairing[] = [];
      const seenPairing = new Set();
      pairingsSnap.forEach(docSnap => {
        if (!seenPairing.has(docSnap.id)) {
          pList.push({ id: docSnap.id, ...docSnap.data() } as Pairing);
          seenPairing.add(docSnap.id);
        }
      });

      // Map clutches
      const cList: Clutch[] = [];
      const seenClutch = new Set();
      clutchesSnap.forEach(docSnap => {
        if (!seenClutch.has(docSnap.id)) {
          cList.push({ id: docSnap.id, ...docSnap.data() } as Clutch);
          seenClutch.add(docSnap.id);
        }
      });

      // Update state and localStorage
      setGeckos(gList);
      setPairings(pList);
      setClutches(cList);
      setLoading(false);

      try {
        localStorage.setItem(`cache_geckos_${profile.uid}`, JSON.stringify(gList));
        localStorage.setItem(`cache_pairings_${profile.uid}`, JSON.stringify(pList));
        localStorage.setItem(`cache_clutches_${profile.uid}`, JSON.stringify(cList));
      } catch (e) {
        console.warn("Failed to update localStorage cache of gecko-farm records:", e);
      }

    } catch (error) {
      console.warn("GeckoProvider refreshData Firestore query failed. Falling back to local cache:", error);
      loadFromCache();
      setLoading(false);
    }
  }, [profile?.uid, loadFromCache]);

  useEffect(() => {
    if (!profile?.uid) {
      setGeckos([]);
      setPairings([]);
      setClutches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // 1. Immediately feed UI with the instant offline cache
    loadFromCache();

    // 2. Fetch fresh data dynamically in the background on mount
    refreshData().finally(() => {
      setLoading(false);
    });

  }, [profile?.uid, loadFromCache, refreshData]);

  return (
    <GeckoContext.Provider value={{ geckos, pairings, clutches, loading, refreshData }}>
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
