import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Gecko, UserProfile } from './types';

interface GeckoContextType {
  geckos: Gecko[];
  loading: boolean;
}

const GeckoContext = createContext<GeckoContextType | undefined>(undefined);

export function GeckoProvider({ profile, children }: { profile: UserProfile | null, children: React.ReactNode }) {
  const [geckos, setGeckos] = useState<Gecko[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) {
      setGeckos([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'geckos'),
      where('ownerId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gList: Gecko[] = [];
      const seen = new Set();
      snapshot.forEach(docSnap => {
        if (!seen.has(docSnap.id)) {
          gList.push({ id: docSnap.id, ...docSnap.data() } as Gecko);
          seen.add(docSnap.id);
        }
      });
      setGeckos(gList);
      setLoading(false);
    }, (error) => {
      console.error('GeckoProvider Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  return (
    <GeckoContext.Provider value={{ geckos, loading }}>
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
