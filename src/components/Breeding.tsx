import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Plus, 
  ChevronRight, 
  Box, 
  Calendar, 
  Check, 
  Trash2, 
  X,
  Edit2,
  Database,
  Users,
  AlertCircle,
  Activity,
  ArrowUpDown
} from 'lucide-react';
import { Gecko, Pairing, Clutch, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import ConfirmationModal from './ConfirmationModal';

interface BreedingProps {
  profile: UserProfile | null;
}

export default function Breeding({ profile }: BreedingProps) {
  const [geckos, setGeckos] = useState<Gecko[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClutchModalOpen, setIsClutchModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPairing, setSelectedPairing] = useState<Pairing | null>(null);

  const FREE_PAIRING_LIMIT = 3;
  const isLimitReached = profile?.subscription !== 'premium' && pairings.length >= FREE_PAIRING_LIMIT;

  // Form states
  const [formData, setFormData] = useState({
    sireId: '',
    sireName: '',
    damId: '',
    damName: '',
    pairingDate: new Date().toISOString().split('T')[0]
  });

  const [clutchData, setClutchData] = useState({
    clutchNumber: 1,
    layDate: new Date().toISOString().split('T')[0],
    eggCount: 2,
    hatchedCount: 0
  });

  const [expandedPairingId, setExpandedPairingId] = useState<string | null>(null);
  
  // Sorting state for Incubation
  const [incubationSort, setIncubationSort] = useState<keyof Clutch>('hatchDate');
  const [incubationSortOrder, setIncubationSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Confirmation Modal States
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (!profile) return;
    
    const gQuery = query(collection(db, 'geckos'), where('ownerId', '==', profile.uid));
    const pQuery = query(collection(db, 'pairings'), where('ownerId', '==', profile.uid));
    const cQuery = query(collection(db, 'clutches'), where('ownerId', '==', profile.uid));

    const unsubG = onSnapshot(gQuery, (snap) => {
      const list: Gecko[] = [];
      const seen = new Set();
      snap.forEach(doc => {
        if (!seen.has(doc.id)) {
          list.push({ id: doc.id, ...doc.data() } as Gecko);
          seen.add(doc.id);
        }
      });
      setGeckos(list);
    }, (err) => console.error('Breeding Geckos Snapshot Error:', err));

    const unsubP = onSnapshot(pQuery, (snap) => {
      const list: Pairing[] = [];
      const seen = new Set();
      snap.forEach(doc => {
        if (!seen.has(doc.id)) {
          list.push({ id: doc.id, ...doc.data() } as Pairing);
          seen.add(doc.id);
        }
      });
      setPairings(list);
    }, (err) => console.error('Breeding Pairings Snapshot Error:', err));

    const unsubC = onSnapshot(cQuery, (snap) => {
      const list: Clutch[] = [];
      const seen = new Set();
      snap.forEach(doc => {
        if (!seen.has(doc.id)) {
          list.push({ id: doc.id, ...doc.data() } as Clutch);
          seen.add(doc.id);
        }
      });
      setClutches(list);
    }, (err) => console.error('Breeding Clutches Snapshot Error:', err));

    return () => { unsubG(); unsubP(); unsubC(); };
  }, [profile]);

  const handleAddPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Enforce limit for free users
    if (!isEditMode && isLimitReached) {
      alert(`Limit tercapai! Akun free hanya dapat memiliki maksimal ${FREE_PAIRING_LIMIT} pairing aktif. Silakan hapus pairing lama atau upgrade ke Premium.`);
      return;
    }

    try {
      const batch = writeBatch(db);
      if (isEditMode && selectedPairing?.id) {
        batch.update(doc(db, 'pairings', selectedPairing.id), {
          sireId: formData.sireId,
          sireName: formData.sireName || 'Unknown',
          damId: formData.damId,
          damName: formData.damName || 'Unknown',
          pairingDate: formData.pairingDate
        });
      } else {
        const newPairingRef = doc(collection(db, 'pairings'));
        batch.set(newPairingRef, {
          sireId: formData.sireId,
          sireName: formData.sireName || 'Unknown',
          damId: formData.damId,
          damName: formData.damName || 'Unknown',
          pairingDate: formData.pairingDate,
          ownerId: profile.uid,
          clutchCount: 0
        });
        batch.update(doc(db, 'users', profile.uid), { pairingCount: increment(1) });
      }
      await batch.commit();

      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedPairing(null);
      setFormData({ sireId: '', sireName: '', damId: '', damName: '', pairingDate: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error adding pairing:", error);
    }
  };

  const handleAddClutch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedPairing) return;

    try {
      const batch = writeBatch(db);
      const layDateObj = new Date(clutchData.layDate);
      const estimatedHatchDate = new Date(layDateObj);
      estimatedHatchDate.setDate(layDateObj.getDate() + 60); // Default 60 days incubation

      const newClutchRef = doc(collection(db, 'clutches'));
      batch.set(newClutchRef, {
        ...clutchData,
        hatchDate: estimatedHatchDate.toISOString().split('T')[0],
        pairingId: selectedPairing.id,
        ownerId: profile.uid
      });
      batch.update(doc(db, 'pairings', selectedPairing.id!), {
        clutchCount: increment(1)
      });
      batch.update(doc(db, 'users', profile.uid), { clutchCount: increment(1) });
      
      await batch.commit();

      setIsClutchModalOpen(false);
      setClutchData({ clutchNumber: 1, layDate: new Date().toISOString().split('T')[0], eggCount: 2, hatchedCount: 0 });
    } catch (error) {
      console.error("Error adding clutch:", error);
    }
  };

  const handleDeletePairing = async (id: string) => {
    if (!profile) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'pairings', id));
      batch.update(doc(db, 'users', profile.uid), { pairingCount: increment(-1) });
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 overflow-hidden pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Breeding Center</h1>
          <p className="text-slate-500 text-[11px] md:text-sm font-medium">Pantau setiap progres pairing dan penetasan.</p>
        </div>
        <button 
          onClick={() => {
            if (isLimitReached) return;
            setIsEditMode(false);
            setSelectedPairing(null);
            setFormData({ 
              sireId: '', 
              sireName: '', 
              damId: '', 
              damName: '', 
              pairingDate: new Date().toISOString().split('T')[0] 
            });
            setIsModalOpen(true);
          }}
          disabled={isLimitReached}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 rounded-xl font-bold transition-all active:scale-95 w-full md:w-auto",
            isLimitReached 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
              : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
          )}
        >
          <Heart className="w-5 h-5" />
          {isLimitReached ? "Limit Tercapai" : "Pairing Baru"}
        </button>
      </div>

      {profile?.subscription !== 'premium' && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-tight mb-1">Breeding Limit Info</p>
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              Anda menggunakan <span className="font-bold">{pairings.length} dari {FREE_PAIRING_LIMIT}</span> slot pairing gratis. 
              {isLimitReached ? " Sesi pairing baru tidak dapat ditambahkan sampai pairing lama dihapus." : " Anda masih bisa menambah pairing baru."} 
              Upgrade ke <span className="font-bold">Elite Member</span> untuk akses tanpa batas.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Pairings</h2>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pairings.length} Pairs</span>
          </div>
          
          {pairings.length > 0 ? (
            <div className="space-y-4">
              {pairings.map((pairing) => {
                const isExpanded = expandedPairingId === pairing.id;
                const pairingClutches = clutches.filter(c => c.pairingId === pairing.id);
                const totalEggs = pairingClutches.reduce((sum, c) => sum + (c.eggCount || 0), 0);
                const totalHatched = pairingClutches.reduce((sum, c) => sum + (c.hatchedCount || 0), 0);

                return (
                  <div key={pairing.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    {/* Header: Side-by-Side Visualization */}
                    <div 
                      onClick={() => setExpandedPairingId(isExpanded ? null : pairing.id!)}
                      className="p-5 cursor-pointer relative"
                    >
                      {/* Deleted Status Badge */}

                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between gap-4">
                          {/* SIRE */}
                          <div className="flex-1 text-center bg-blue-50/50 rounded-2xl p-3 border border-blue-100 relative group overflow-hidden">
                            <div className="absolute -bottom-2 -right-2 opacity-5 text-blue-500 transform -rotate-12 group-hover:scale-110 transition-transform">
                              <MaleIcon className="w-12 h-12" />
                            </div>
                            <span className="block text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Pejantan (Sire)</span>
                            <span className="block font-black text-slate-800 text-xs sm:text-sm truncate uppercase pr-2">{pairing.sireName}</span>
                          </div>

                          {/* CONNECTOR */}
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                              <Heart size={14} className="fill-red-500" />
                            </div>
                          </div>

                          {/* DAM */}
                          <div className="flex-1 text-center bg-pink-50/50 rounded-2xl p-3 border border-pink-100 relative group overflow-hidden">
                            <div className="absolute -bottom-2 -left-2 opacity-5 text-pink-500 transform rotate-12 group-hover:scale-110 transition-transform">
                              <FemaleIcon className="w-12 h-12" />
                            </div>
                            <span className="block text-[8px] font-black text-pink-600 uppercase tracking-widest mb-1">Indukan (Dam)</span>
                            <span className="block font-black text-slate-800 text-xs sm:text-sm truncate uppercase pl-2">{pairing.damName}</span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-center">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Clutches</span>
                            <span className="block text-sm font-black text-slate-800">{pairing.clutchCount || 0}</span>
                          </div>
                          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-center">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total Eggs</span>
                            <span className="block text-sm font-black text-slate-800">{totalEggs}</span>
                          </div>
                          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-center">
                            <span className="block text-[8px] font-black text-emerald-500 uppercase tracking-tighter mb-0.5">Hatched</span>
                            <span className="block text-sm font-black text-emerald-600">{totalHatched}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Calendar size={12} className="text-slate-300" />
                            {formatDate(pairing.pairingDate)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                            {isExpanded ? 'Tutup Detail' : 'Buka Detail'}
                            <ChevronRight size={14} className={cn("transition-transform duration-300", isExpanded && "rotate-90")} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed View (Expanded) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <div className="p-5 pt-0 border-t border-slate-50">
                            <div className="space-y-6 pt-4">
                              {/* Action Buttons */}
                              <div className="flex items-center justify-end gap-3 px-1">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPairing(pairing);
                                    setIsEditMode(true);
                                    setFormData({
                                      sireId: pairing.sireId || '',
                                      sireName: pairing.sireName || '',
                                      damId: pairing.damId || '',
                                      damName: pairing.damName || '',
                                      pairingDate: pairing.pairingDate || new Date().toISOString().split('T')[0]
                                    });
                                    setIsModalOpen(true);
                                  }}
                                  className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 hover:border-blue-100 shadow-sm"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setConfirmConfig({
                                      isOpen: true,
                                      title: 'Hapus Pairing',
                                      message: 'Apakah Anda yakin ingin menghapus catatan pairing ini? Semua data terkait akan ikut terhapus.',
                                      onConfirm: () => handleDeletePairing(pairing.id!)
                                    });
                                  }}
                                  className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-100 hover:border-red-100 shadow-sm"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              {/* Detailed Clutch Timeline */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                  <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <Box size={14} className="text-amber-500" />
                                    Clutch Timeline
                                  </h5>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedPairing(pairing); setIsClutchModalOpen(true); }}
                                    className="px-4 py-2 bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 hover:bg-slate-800 transition-all rounded-xl shadow-lg shadow-slate-200 active:scale-95"
                                  >
                                    <Plus size={12} /> New Clutch
                                  </button>
                                </div>

                                <div className="relative pl-6 space-y-4">
                                  {/* Timeline Vertical Line */}
                                  <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100" />

                                  {pairingClutches.length > 0 ? (
                                    pairingClutches
                                      .sort((a, b) => new Date(b.layDate).getTime() - new Date(a.layDate).getTime())
                                      .map((clutch, idx, arr) => {
                                        const successRate = clutch.hatchedCount / clutch.eggCount;
                                        const isFullHatch = successRate === 1;
                                        const isPartialHatch = successRate > 0 && successRate < 1;
                                        const isFailure = successRate === 0 && new Date(clutch.hatchDate || '') < new Date();

                                        return (
                                          <div key={clutch.id} className="relative">
                                            {/* Timeline Node */}
                                            <div className={cn(
                                              "absolute -left-[19px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-white shadow-sm z-10 transition-colors",
                                              isFullHatch ? "bg-emerald-500 ring-2 ring-emerald-100" : 
                                              isPartialHatch ? "bg-amber-500 ring-2 ring-amber-100" :
                                              isFailure ? "bg-rose-500 ring-2 ring-rose-100" : "bg-slate-200 ring-2 ring-slate-50"
                                            )} />

                                            <div className="group/item flex items-center justify-between p-4 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl transition-all shadow-sm">
                                              <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                                                  <span className="text-[7px] font-black text-slate-400">#</span>
                                                  <span className="text-[10px] font-black text-slate-600">{arr.length - idx}</span>
                                                </div>
                                                <div>
                                                  <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{formatDate(clutch.layDate)}</div>
                                                  <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded-md">{clutch.eggCount} Eggs</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[80px]">{clutch.incubator || 'Incubator A'}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hatched</div>
                                                  <div className={cn(
                                                    "text-sm font-black transition-colors",
                                                    isFullHatch ? "text-emerald-500" : 
                                                    isPartialHatch ? "text-amber-500" :
                                                    isFailure ? "text-rose-500" : "text-slate-400"
                                                  )}>
                                                    {clutch.hatchedCount} <span className="text-[9px] text-slate-300">/</span> {clutch.eggCount}
                                                  </div>
                                                </div>
                                                <button 
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setConfirmConfig({
                                                      isOpen: true,
                                                      title: 'Delete Clutch',
                                                      message: 'Are you sure you want to delete this clutch record?',
                                                      onConfirm: () => deleteDoc(doc(db, 'clutches', clutch.id!))
                                                    });
                                                  }}
                                                  className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-red-500 sm:opacity-0 group-hover/item:opacity-100 transition-all rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50"
                                                >
                                                  <Trash2 size={16} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
                                  ) : (
                                    <div className="py-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center px-6">
                                      <Database size={24} className="text-slate-100 mb-2" />
                                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No clutches logged yet</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 flex flex-col items-center justify-center text-center px-6 shadow-sm">
               <Heart className="w-12 h-12 text-slate-100 mb-4" />
               <h3 className="font-bold text-slate-800">No Active Pairings</h3>
               <p className="text-slate-400 text-xs font-medium max-w-[200px] mt-1">Mulai breeding session Anda dengan menekan tombol Pairing Baru.</p>
            </div>
          )}
        </div>


        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-amber-600" />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Incubation</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative group">
                <select 
                  value={incubationSort}
                  onChange={(e) => setIncubationSort(e.target.value as keyof Clutch)}
                  className="appearance-none text-[9px] font-black uppercase tracking-wider bg-white border border-slate-200 rounded-lg pl-2 pr-6 py-1.5 outline-none hover:border-amber-400 transition-colors cursor-pointer shadow-sm"
                >
                  <option value="hatchDate">Hatch</option>
                  <option value="layDate">Lay</option>
                  <option value="eggCount">Eggs</option>
                  <option value="hatchedCount">Hatch count</option>
                </select>
                <ChevronRight className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
              </div>
              <button 
                onClick={() => setIncubationSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={cn(
                  "p-1.5 rounded-lg border border-slate-200 bg-white transition-all hover:border-amber-400 hover:text-amber-500 shadow-sm",
                  incubationSortOrder === 'desc' && "bg-amber-50 border-amber-200 text-amber-600"
                )}
                title={incubationSortOrder === 'asc' ? "Sort Ascending" : "Sort Descending"}
              >
                <ArrowUpDown size={12} />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {(() => {
              const activeIncubations = clutches.filter(clutch => {
                const hatchDate = new Date(clutch.hatchDate || '');
                return hatchDate > new Date(); // Only show if not yet reached hatch date
              });

              return activeIncubations.length > 0 ? (
                activeIncubations
                  .sort((a, b) => {
                    const fieldA = a[incubationSort];
                    const fieldB = b[incubationSort];

                    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
                      return incubationSortOrder === 'asc' 
                        ? fieldA.localeCompare(fieldB)
                        : fieldB.localeCompare(fieldA);
                    }

                    const numA = (fieldA as number) || 0;
                    const numB = (fieldB as number) || 0;

                    return incubationSortOrder === 'asc' 
                      ? numA - numB
                      : numB - numA;
                  })
                  .map(clutch => {
                    const pairing = pairings.find(p => p.id === clutch.pairingId);
                    const layDate = new Date(clutch.layDate);
                    const hatchDate = new Date(clutch.hatchDate || '');
                    const totalDays = 60; // Assuming 60 days
                    const daysPassed = Math.floor((new Date().getTime() - layDate.getTime()) / (1000 * 60 * 60 * 24));
                    const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
                    const daysRemaining = Math.ceil((hatchDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={clutch.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 hover:border-amber-200 transition-all group">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 flex flex-col items-center justify-center text-amber-600 shadow-inner border border-amber-100 shrink-0">
                              <span className="text-[7px] sm:text-[8px] font-black uppercase">Clutch</span>
                              <span className="text-base sm:text-lg font-black leading-none mt-0.5">{clutch.clutchNumber}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <div className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white shadow-sm flex-auto min-w-0 max-w-full">
                                  <span className="font-black text-slate-800 text-[9px] sm:text-[10px] uppercase block truncate">{pairing?.sireName}</span>
                                </div>
                                <span className="text-slate-400 font-bold text-[10px] shrink-0">×</span>
                                <div className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white shadow-sm flex-auto min-w-0 max-w-full">
                                  <span className="font-black text-slate-800 text-[9px] sm:text-[10px] uppercase block truncate">{pairing?.damName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> {formatDate(clutch.layDate)}
                                </span>
                                <div className="flex items-center gap-1.5 font-black text-[9px] sm:text-[10px] text-amber-600 uppercase tracking-tight bg-amber-50 px-2 py-0.5 rounded-lg">
                                   {clutch.eggCount} Eggs
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                             <div className="flex items-center gap-1.5 text-amber-500 font-black text-[9px] sm:text-[10px] uppercase tracking-widest">
                                <Activity size={10} />
                                {daysRemaining} Days Left
                             </div>
                             <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{formatDate(clutch.hatchDate || '')}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                            <span>Incubation Progress</span>
                            <span className="text-amber-500">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-12 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-200 mb-4 shadow-sm">
                    <Box size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800">No Eggs in Incubation</h3>
                  <p className="text-slate-400 text-[11px] font-medium max-w-[200px] mt-1 leading-relaxed">Saat anda merecord clutch baru, progres inkubasi akan muncul di sini.</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add Pairing FAB (Mobile) */}
      <div className="fixed bottom-24 right-6 z-40 md:hidden">
        <button 
          onClick={() => {
            if (isLimitReached) return;
            setIsEditMode(false);
            setSelectedPairing(null);
            setFormData({ 
              sireId: '', 
              sireName: '', 
              damId: '', 
              damName: '', 
              pairingDate: new Date().toISOString().split('T')[0] 
            });
            setIsModalOpen(true);
          }}
          disabled={isLimitReached}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
            isLimitReached ? "bg-slate-300 text-slate-500" : "bg-red-600 text-white"
          )}
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Add Pairing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">
                  {isEditMode ? 'Edit Breeding Pair' : 'New Breeding Pair'}
                </h2>
                <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddPairing} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                       <MaleIcon className="w-3 h-3 text-blue-500" /> SIRE (Koleksi Jantan)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-500 transition-all font-sans"
                        value={formData.sireId}
                        onChange={e => {
                          const sire = geckos.find(g => g.id === e.target.value);
                          setFormData({ ...formData, sireId: e.target.value, sireName: sire?.name || formData.sireName });
                        }}
                      >
                        <option value="">Pilih Jantan...</option>
                        {geckos.filter(g => g.gender === 'male' && g.status !== 'sold' && g.status !== 'dead').map(g => (
                          <option key={g.id} value={g.id}>{g.name} - {g.morph}</option>
                        ))}
                      </select>
                      <input 
                        placeholder="Nama Jantan (Manual)..."
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-500 transition-all uppercase"
                        value={formData.sireName}
                        onChange={e => setFormData({ ...formData, sireName: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                       <FemaleIcon className="w-3 h-3 text-pink-500" /> DAM (Koleksi Betina)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-500 transition-all"
                        value={formData.damId}
                        onChange={e => {
                          const dam = geckos.find(g => g.id === e.target.value);
                          setFormData({ ...formData, damId: e.target.value, damName: dam?.name || formData.damName });
                        }}
                      >
                        <option value="">Pilih Betina...</option>
                        {geckos.filter(g => g.gender === 'female' && g.status !== 'sold' && g.status !== 'dead').map(g => (
                          <option key={g.id} value={g.id}>{g.name} - {g.morph}</option>
                        ))}
                      </select>
                      <input 
                        placeholder="Nama Betina (Manual)..."
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-500 transition-all uppercase"
                        value={formData.damName}
                        onChange={e => setFormData({ ...formData, damName: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Tanggal Pairing</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-500 transition-all"
                      value={formData.pairingDate}
                      onChange={e => setFormData({ ...formData, pairingDate: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {isEditMode ? 'Simpan Perubahan' : 'Mulai Pairing'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Clutch Modal */}
      <AnimatePresence>
        {isClutchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsClutchModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-amber-50/30">
                <div>
                   <h2 className="text-2xl font-black text-amber-800 tracking-tight">Record Clutch</h2>
                   <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Clutch #{selectedPairing?.clutchCount ? selectedPairing.clutchCount + 1 : 1}</p>
                </div>
                <button onClick={() => setIsClutchModalOpen(false)} className="p-2 hover:bg-amber-100 rounded-full transition-colors"><X className="w-6 h-6 text-amber-400" /></button>
              </div>
              <form onSubmit={handleAddClutch} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Nomor Clutch</label>
                      <input 
                        type="number" 
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={clutchData.clutchNumber || ''}
                        onChange={e => setClutchData({ ...clutchData, clutchNumber: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Jumlah Telur</label>
                      <input 
                        type="number" 
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={clutchData.eggCount || ''}
                        onChange={e => setClutchData({ ...clutchData, eggCount: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Tanggal Bertelur</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      value={clutchData.layDate}
                      onChange={e => setClutchData({ ...clutchData, layDate: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Simpan Data Clutch
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
}

function FemaleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v9" />
      <path d="M9 19h6" />
    </svg>
  )
}

function MaleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.4 5.4" />
      <path d="M15 5h4v4" />
    </svg>
  )
}
