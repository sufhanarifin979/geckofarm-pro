import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './lib/firebase';
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

    // 1. Subscribe to Geckos
    const unsubG = onSnapshot(gQuery, (snapshot) => {
      const gList: Gecko[] = [];
      const seen = new Set();
      snapshot.forEach(docSnap => {
        if (!seen.has(docSnap.id)) {
          gList.push({ id: docSnap.id, ...docSnap.data() } as Gecko);
          seen.add(docSnap.id);
        }
      });
      setGeckos(gList);
    }, (error) => {
      console.warn('GeckoProvider Geckos Error:', error);
    });

    // 2. Subscribe to Pairings
    const unsubP = onSnapshot(pQuery, (snapshot) => {
      const pList: Pairing[] = [];
      const seen = new Set();
      snapshot.forEach(docSnap => {
        if (!seen.has(docSnap.id)) {
          pList.push({ id: docSnap.id, ...docSnap.data() } as Pairing);
          seen.add(docSnap.id);
        }
      });
      setPairings(pList);
    }, (error) => {
      console.warn('GeckoProvider Pairings Error:', error);
    });

    // 3. Subscribe to Clutches
    const unsubC = onSnapshot(cQuery, (snapshot) => {
      const cList: Clutch[] = [];
      const seen = new Set();
      snapshot.forEach(docSnap => {
        if (!seen.has(docSnap.id)) {
          cList.push({ id: docSnap.id, ...docSnap.data() } as Clutch);
          seen.add(docSnap.id);
        }
      });
      setClutches(cList);
      setLoading(false);
    }, (error) => {
      console.warn('GeckoProvider Clutches Error:', error);
      setLoading(false);
    });

    const backupTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      unsubG();
      unsubP();
      unsubC();
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
