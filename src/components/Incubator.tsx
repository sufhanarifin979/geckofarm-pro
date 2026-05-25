import { useState, useEffect } from 'react';
import { 
  Box, 
  Thermometer, 
  Timer, 
  ChevronRight, 
  Info,
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Waves,
  Egg,
  Calendar,
  Plus,
  Activity,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Clutch, Pairing, UserProfile, Gecko } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { cn, formatDate } from '../lib/utils';
import { differenceInDays, addDays, format, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useGeckos } from '../GeckoProvider';

interface IncubatorProps {
  profile: UserProfile | null;
}

export default function Incubator({ profile }: IncubatorProps) {
  const navigate = useNavigate();
  const { geckos } = useGeckos();
  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<{ temp: number; humidity: number } | null>(null);
  
  // Hatching Modal State
  const [isHatchModalOpen, setIsHatchModalOpen] = useState(false);
  const [selectedClutch, setSelectedClutch] = useState<Clutch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    // Get weather data based on geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`
          );
          const data = await response.json();
          if (data.current) {
            setWeather({
              temp: data.current.temperature_2m,
              humidity: data.current.relative_humidity_2m
            });
          }
        } catch (error) {
          console.error("Error fetching weather:", error);
        }
      }, (error) => {
        console.error("Geolocation error:", error);
      });
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    
    const cQuery = query(collection(db, 'clutches'), where('ownerId', '==', profile.uid));
    const pQuery = query(collection(db, 'pairings'), where('ownerId', '==', profile.uid));

    const unsubC = onSnapshot(cQuery, (snap) => {
      const list: Clutch[] = [];
      const seen = new Set();
      snap.forEach(docSnap => {
        if (!seen.has(docSnap.id)) {
          list.push({ id: docSnap.id, ...docSnap.data() } as Clutch);
          seen.add(docSnap.id);
        }
      });
      setClutches(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'clutches'));

    const unsubP = onSnapshot(pQuery, (snap) => {
      const list: Pairing[] = [];
      const seen = new Set();
      snap.forEach(docSnap => {
        if (!seen.has(docSnap.id)) {
          list.push({ id: docSnap.id, ...docSnap.data() } as Pairing);
          seen.add(docSnap.id);
        }
      });
      setPairings(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'pairings'));

    return () => { unsubC(); unsubP(); };
  }, [profile]);

  // Only show clutches where (hatchedCount + failedCount) < eggCount or hatchedDate is not reached
  const activeClutches = clutches.filter(c => (c.hatchedCount + (c.failedCount || 0)) < c.eggCount);

  const handleUpdateHatched = async (clutchId: string, currentHatched: number, currentFailed: number, max: number, isFail: boolean = false) => {
    const totalProcessed = currentHatched + currentFailed;
    if (totalProcessed + 1 > max) return;
    
    setIsProcessing(true);
    try {
      const updateData: any = {};
      if (isFail) {
        updateData.failedCount = currentFailed + 1;
      } else {
        updateData.hatchedCount = currentHatched + 1;
      }

      const newTotal = (isFail ? currentFailed + 1 : currentHatched + 1) + (isFail ? currentHatched : currentFailed);
      if (newTotal === max) {
        updateData.hatchDate = new Date().toISOString().split('T')[0];
      }

      await updateDoc(doc(db, 'clutches', clutchId), updateData);
      addToast(isFail ? "Data Gagal/Slug tercatat!" : "Data berhasil ditambahkan!");
      setIsHatchModalOpen(false);
    } catch (error) {
      console.error("Error updating hatch count:", error);
      handleFirestoreError(error, OperationType.UPDATE, `clutches/${clutchId}`);
      addToast("Gagal memperbarui data.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHatchAndRegister = async (clutch: Clutch) => {
    const nextCount = clutch.hatchedCount + 1;
    const totalProcessed = nextCount + (clutch.failedCount || 0);
    if (totalProcessed > clutch.eggCount) return;

    setIsProcessing(true);
    try {
      // 1. Update clutch first
      const updateData: any = { hatchedCount: nextCount };
      if (totalProcessed === clutch.eggCount) {
        updateData.hatchDate = new Date().toISOString().split('T')[0];
      }
      await updateDoc(doc(db, 'clutches', clutch.id!), updateData);

      // 2. Prepare data for registration
      const pairing = pairings.find(p => p.id === clutch.pairingId);
      const sire = geckos.find(g => g.id === pairing?.sireId);
      const dam = geckos.find(g => g.id === pairing?.damId);

      const prefilledData = {
        birthDate: new Date().toISOString().split('T')[0],
        sireId: pairing?.sireId || '',
        damId: pairing?.damId || '',
        sireName: pairing?.sireName || '',
        damName: pairing?.damName || '',
        morph: `${sire?.morph || ''} X ${dam?.morph || ''}`.trim().replace(/^ X | X $/g, '') || '',
        note: `Hatched from Clutch #${clutch.clutchNumber} (${pairing?.sireName} x ${pairing?.damName})`
      };

      addToast("Penetasan berhasil dicatat!");
      
      // Navigate to registry with prefilled data
      navigate('/registry', { state: { prefilledData, autoOpen: true } });
    } catch (error) {
      addToast("Gagal memproses data.", "error");
    } finally {
      setIsProcessing(false);
      setIsHatchModalOpen(false);
    }
  };

  // Group active clutches by pairingId
  const groupedClutches = activeClutches.reduce((acc, clutch) => {
    const pid = clutch.pairingId;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(clutch);
    return acc;
  }, {} as Record<string, Clutch[]>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 overflow-hidden pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Incubator</h1>
          <p className="text-slate-500 text-[11px] md:text-xs font-medium md:mt-1 font-sans">Monitor status inkubasi telur secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-sm self-start">
           <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1">
              <Thermometer size={14} className={cn("transition-colors", weather ? "text-rose-500" : "text-slate-400")} />
              <span className="text-[13px] sm:text-sm font-bold text-slate-700">{weather ? `${weather.temp.toFixed(1)}°C` : '28.5°C'}</span>
           </div>
           <div className="w-[1px] h-4 bg-slate-200" />
           <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1">
              <Waves size={14} className={cn("transition-colors", weather ? "text-sky-500" : "text-slate-400")} />
              <span className="text-[13px] sm:text-sm font-bold text-slate-700">{weather ? `${weather.humidity}%` : '75%'}</span>
           </div>
           {weather && (
             <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg ml-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Live</span>
             </div>
           )}
        </div>
      </div>

      {activeClutches.length > 0 ? (
        <div className="space-y-10">
          {(Object.entries(groupedClutches) as [string, Clutch[]][]).map(([pairingId, pairClutches], groupIdx) => {
            const pairing = pairings.find(p => p.id === pairingId);
            
            return (
              <div key={pairingId} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-2 flex items-center gap-3 shadow-md max-w-[85%] sm:max-w-full overflow-hidden">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                      <div className="px-2 sm:px-2.5 py-1 rounded-lg border border-white/20 bg-white/5 flex-auto min-w-0 max-w-full">
                        <span className="font-black text-white text-[10px] sm:text-[11px] uppercase tracking-tight block truncate">{pairing?.sireName || 'Sire'}</span>
                      </div>
                      <span className="text-slate-500 font-black text-[10px] sm:text-xs shrink-0">×</span>
                      <div className="px-2 sm:px-2.5 py-1 rounded-lg border border-white/20 bg-white/5 flex-auto min-w-0 max-w-full">
                        <span className="font-black text-white text-[10px] sm:text-[11px] uppercase tracking-tight block truncate">{pairing?.damName || 'Dam'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[1px] flex-1 bg-slate-200/60 min-w-[10px]"></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0">
                    {pairClutches.length} <span className="hidden xs:inline">Clutches</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pairClutches.map((clutch, i) => {
                    const daysIn = isNaN(new Date(clutch.layDate).getTime()) ? 0 : differenceInDays(new Date(), new Date(clutch.layDate));
                    const estHatchDate = isNaN(new Date(clutch.layDate).getTime()) ? new Date() : addDays(new Date(clutch.layDate), 45);
                    const progress = isNaN(daysIn) ? 0 : Math.min((daysIn / 45) * 100, 100);

                    // Logic warna progress bar
                    const today = new Date();
                    const isOverdue = isAfter(today, estHatchDate);
                    const isNearHatch = !isOverdue && differenceInDays(estHatchDate, today) <= 7;

                    return (
                      <motion.div
                        key={clutch.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col",
                          isOverdue ? "border-emerald-200 ring-2 ring-emerald-50" : "border-slate-100 ring-0 hover:border-emerald-100"
                        )}
                      >
                        {/* Card Header */}
                        <div className={cn(
                          "p-5 border-b",
                          isOverdue ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50/30 border-slate-50"
                        )}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border uppercase transition-colors",
                                isOverdue ? "bg-emerald-500 text-white border-emerald-400 shadow-sm animate-blink" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                              )}>
                                C{clutch.clutchNumber}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                                    Clutch Details
                                  </h4>
                                  {isOverdue && (
                                    <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase animate-blink">Overdue</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-400 leading-none">{formatDate(clutch.layDate)}</span>
                                  </div>
                                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                                  <div className="flex items-center gap-1">
                                    <Egg size={12} className={isOverdue ? "text-emerald-500" : "text-emerald-500"} />
                                    <span className={cn("text-xs font-black leading-none", isOverdue ? "text-emerald-600" : "text-emerald-600")}>{clutch.eggCount} Eggs</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Stats */}
                        <div className="p-5 space-y-5 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incubasi</p>
                              <div className="flex items-baseline gap-1">
                                <span className={cn("text-2xl font-black leading-none", isOverdue ? "text-emerald-600" : "text-slate-900")}>{daysIn}</span>
                                <span className="text-xs font-black text-slate-400 uppercase">Hari</span>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Menetas</p>
                              <div className="flex items-center justify-end gap-1.5">
                                <Timer size={14} className={cn(isOverdue ? "text-emerald-500" : isNearHatch ? "text-amber-500" : "text-emerald-500")} />
                                <span className={cn("text-sm font-black uppercase", isOverdue ? "text-emerald-600 animate-blink" : "text-slate-700")}>{format(estHatchDate, 'dd MMM')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                             <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    isOverdue ? "bg-emerald-500 animate-blink shadow-[0_0_12px_rgba(16,185,129,0.5)]" :
                                    isNearHatch ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" :
                                    "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                  )} 
                                />
                             </div>
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-slate-400">Dimulai</span>
                                <span className={cn(
                                  "font-black",
                                  isOverdue ? "text-emerald-600" : isNearHatch ? "text-amber-600" : "text-blue-600"
                                )}>
                                  {isOverdue ? 'Waktunya Menetas!' : `${Math.round(progress)}% Selesai`}
                                </span>
                             </div>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 sm:p-5 pt-0 mt-auto">
                          <div className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl border border-slate-100 transition-colors",
                            isOverdue ? "bg-emerald-50/30" : "bg-slate-50"
                          )}>
                             <div className="flex items-center gap-2 pl-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  (clutch.hatchedCount + (clutch.failedCount || 0)) >= clutch.eggCount ? "bg-emerald-500" : 
                                  isOverdue ? "bg-emerald-500 animate-blink" :
                                  isNearHatch ? "bg-amber-500 animate-pulse" : "bg-blue-500"
                                )} />
                                <span className="text-[10px] sm:text-xs font-black text-slate-600 uppercase">
                                  {clutch.hatchedCount} Menetas {clutch.failedCount ? `(${clutch.failedCount} Gagal)` : ''} / {clutch.eggCount}
                                </span>
                             </div>
                             
                             <button 
                                onClick={() => {
                                  setSelectedClutch(clutch);
                                  setIsHatchModalOpen(true);
                                }}
                                disabled={(clutch.hatchedCount + (clutch.failedCount || 0)) >= clutch.eggCount}
                                className={cn(
                                  "w-full sm:w-auto px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2",
                                  (clutch.hatchedCount + (clutch.failedCount || 0)) >= clutch.eggCount 
                                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default" 
                                    : isOverdue
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:shadow-lg animate-blink"
                                      : clutch.hatchedCount > 0 
                                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-lg"
                                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:shadow-lg"
                                )}
                              >
                                {(clutch.hatchedCount + (clutch.failedCount || 0)) >= clutch.eggCount ? (
                                  <>
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span>Selesai</span>
                                  </>
                                ) : (
                                  <>
                                    {clutch.hatchedCount > 0 ? <Activity size={14} /> : <Plus size={14} />}
                                    <span>{clutch.hatchedCount > 0 ? 'Hatch Lagi' : 'Record Hatch'}</span>
                                  </>
                                )}
                              </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Box className="w-10 h-10 text-slate-300" />
           </div>
           <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Incubator Kosong</h2>
           <p className="text-slate-400 text-sm max-w-[250px] mt-2 font-medium">Tambahkan clutch di menu Breeding untuk melihat progress inkubasi di sini.</p>
        </div>
      )}

      {/* Record Hatch Confirmation Modal */}
      <AnimatePresence>
        {isHatchModalOpen && selectedClutch && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => !isProcessing && setIsHatchModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Egg size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Record Hatching</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirmation required</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHatchModalOpen(false)}
                  disabled={isProcessing}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Clutch</span>
                    <span className="text-xs font-black text-slate-800 uppercase">Clutch #{selectedClutch.clutchNumber}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${(selectedClutch.hatchedCount / selectedClutch.eggCount) * 100}%` }}
                    />
                    <div 
                      className="absolute top-0 right-0 h-full bg-rose-500 transition-all duration-500" 
                      style={{ width: `${((selectedClutch.failedCount || 0) / selectedClutch.eggCount) * 100}%` }}
                    />
                 </div>
                 <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Current Progress</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase">
                      {selectedClutch.hatchedCount} Hatched {selectedClutch.failedCount ? `/ ${selectedClutch.failedCount} Failed` : ''} / {selectedClutch.eggCount} Eggs
                    </span>
                 </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateHatched(selectedClutch.id!, selectedClutch.hatchedCount, selectedClutch.failedCount || 0, selectedClutch.eggCount)}
                    disabled={isProcessing}
                    className="py-4 bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center justify-center gap-2 group active:scale-95 px-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors"><Check size={16} /></div>
                    <span>Hatch Only</span>
                  </button>

                  <button 
                    onClick={() => handleUpdateHatched(selectedClutch.id!, selectedClutch.hatchedCount, selectedClutch.failedCount || 0, selectedClutch.eggCount, true)}
                    disabled={isProcessing}
                    className="py-4 bg-slate-50 border border-slate-200 hover:bg-white hover:border-rose-500 hover:text-rose-600 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center justify-center gap-2 group active:scale-95 px-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors"><XCircle size={16} /></div>
                    <span>Gagal/Slug</span>
                  </button>
                </div>

                <button 
                  onClick={() => handleHatchAndRegister(selectedClutch)}
                  disabled={isProcessing}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-95 group"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin text-white" /> : <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={16} /></div>}
                  <span>Hatch & Register Gecko</span>
                </button>
              </div>

              <div className="mt-6 flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase tracking-tight">
                  "Hatch & Register" akan mengarahkan Anda ke form inventaris dengan data silsilah yang terisi otomatis.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-[90vw] sm:max-w-xs transition-all">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "w-full px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-xl",
                toast.type === 'success' ? "bg-slate-900 border-slate-800" : "bg-rose-600 border-rose-500"
              )}
            >
              {toast.type === 'success' ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-rose-600">
                  <AlertTriangle size={12} />
                </div>
              )}
              <p className="text-[11px] font-black text-white uppercase tracking-wider">{toast.message}</p>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-auto text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Loader2(props: any) {
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
      className={cn("lucide lucide-loader-2", props.className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
