import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Check, 
  AlertTriangle,
  ChevronRight,
  User as UserIcon,
  Venus as FemaleIcon,
  Mars as MaleIcon,
  HelpCircle,
  Camera,
  Layers,
  Scale,
  Activity,
  Calendar,
  Sparkles,
  Info,
  GitGraph,
  BookOpen
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gecko, UserProfile, WeightLog, ActivityLog } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, increment, getDocs, orderBy, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInYears, differenceInMonths } from 'date-fns';
import { cn } from '../lib/utils';
import ConfirmationModal from './ConfirmationModal';
import LineageChart from './LineageChart';
import { autoCropToSquare, uploadGeckoImage, deleteGeckoImage } from '../lib/imageUtils';
import Tooltip from './ui/Tooltip';
import { Loader2 } from 'lucide-react';
import { useGeckos } from '../GeckoProvider';

interface RegistryProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export default function Registry({ profile, setProfile }: RegistryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { geckos, loading } = useGeckos();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedGecko, setSelectedGecko] = useState<Gecko | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'details' | 'lineage'>('details');
  const [editingGecko, setEditingGecko] = useState<Gecko | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [geckoToDelete, setGeckoToDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const initialFormData: Partial<Gecko> = {
    name: '',
    morph: '',
    birthDate: '',
    gender: 'unsex',
    status: 'available',
    albinoStrain: 'None',
    sireId: '',
    damId: '',
    sireName: '',
    damName: '',
    info: '',
    note: '',
    photoUrl: ''
  };

  // Form states
  const [formData, setFormData] = useState<Partial<Gecko>>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [imgSrc, setImgSrc] = useState('');

  const [displayLimit, setDisplayLimit] = useState(4);

  useEffect(() => {
    if (selectedGecko?.id && isViewModalOpen) {
      fetchLogs(selectedGecko.id);
      fetchAiInsight(selectedGecko.id);
      setActiveViewTab('details');
    }
  }, [selectedGecko, isViewModalOpen]);

  // Handle auto-open and prefilled data from Hatching flow
  useEffect(() => {
    const state = location.state as any;
    if (state?.autoOpen && state?.prefilledData) {
      setFormData(prev => ({
        ...initialFormData,
        ...state.prefilledData
      }));
      setIsModalOpen(true);
      
      // Clean up state so it doesn't trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Helper for age formatting
  const getAge = (birthDate: string) => {
    if (!birthDate) return "0y 0m";
    try {
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return "0y 0m";
      const now = new Date();
      
      const totalMonths = differenceInMonths(now, birth);
      if (totalMonths < 0) return "0y 0m";
      
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      return `${years}y ${months}m`;
    } catch (e) {
      return "0y 0m";
    }
  };

  const currentSire = geckos.find(g => g.id === selectedGecko?.sireId);
  const currentDam = geckos.find(g => g.id === selectedGecko?.damId);

  // Grandparents lookups
  const sireOfSire = currentSire ? geckos.find(g => g.id === currentSire.sireId) : null;
  const damOfSire = currentSire ? geckos.find(g => g.id === currentSire.damId) : null;
  const sireOfDam = currentDam ? geckos.find(g => g.id === currentDam.sireId) : null;
  const damOfDam = currentDam ? geckos.find(g => g.id === currentDam.damId) : null;

  const fetchLogs = async (geckoId: string) => {
    const wRef = collection(db, 'geckos', geckoId, 'weight_history');
    const aRef = collection(db, 'geckos', geckoId, 'activity_logs');
    
    const [wSnap, aSnap] = await Promise.all([
      getDocs(query(wRef, orderBy('date', 'desc'))),
      getDocs(query(aRef, orderBy('date', 'desc')))
    ]);

    setWeightLogs(wSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightLog)));
    setActivityLogs(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
  };

  const fetchAiInsight = async (geckoId: string) => {
    try {
      const res = await fetch('/api/geckos/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geckoId })
      });
      const data = await res.json();
      setAiInsight(data.insight);
    } catch (e) {
      console.error(e);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', async () => {
        const result = reader.result?.toString() || '';
        const cropped = await autoCropToSquare(result);
        setImgSrc(cropped);
        setFormData(prev => ({ ...prev, photoUrl: cropped }));
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.morph?.trim()) errors.morph = 'Morph is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!validateForm()) {
      return;
    }

    if (!editingGecko && profile.geckoCount >= profile.planLimit) {
      addToast("Registration quota exceeded. Upgrade to Premium for more slots.", "error");
      return;
    }

    const isNewPhoto = imgSrc && imgSrc.startsWith('data:image');
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('[DEBUG] Starting handleSubmit sequence (base64 mode)');
      let finalPhotoUrl = formData.photoUrl || '';
      
      // 1. Process image if it's new
      if (isNewPhoto) {
        console.log('[DEBUG] Processing new image for Firestore storage');
        finalPhotoUrl = await uploadGeckoImage(profile.uid, '', imgSrc, (progress) => {
          setUploadProgress(progress);
        });
      }

      const batch = writeBatch(db);
      let geckoId = editingGecko?.id;
      const isEditing = !!geckoId;

      if (!isEditing) {
        console.log('[DEBUG] Mode: New Registration');
        const newGeckoRef = doc(collection(db, 'geckos'));
        geckoId = newGeckoRef.id;
        
        const rawData = { 
          ...formData, 
          photoUrl: finalPhotoUrl,
          ownerId: profile.uid,
          createdAt: serverTimestamp(),
          gecko_id: geckoId
        };
        const finalData = Object.fromEntries(
          Object.entries(rawData).filter(([key, value]) => value !== undefined && key !== 'id')
        );
        batch.set(newGeckoRef, finalData);
        batch.update(doc(db, 'users', profile.uid), { geckoCount: increment(1) });
      } else {
        console.log('[DEBUG] Mode: Edit Profile', { geckoId });
        const rawData = { 
          ...formData, 
          photoUrl: finalPhotoUrl, 
          ownerId: profile.uid,
          createdAt: formData.createdAt || serverTimestamp()
        };
        const finalData = Object.fromEntries(
          Object.entries(rawData).filter(([key, value]) => value !== undefined && key !== 'id')
        );
        batch.update(doc(db, 'geckos', geckoId!), finalData);
      }

      // Commit everything in one go
      console.log('[DEBUG] Committing Firestore batch');
      await batch.commit();
      console.log('[DEBUG] Firestore data saved');
      
      if (!isEditing) {
        setProfile(prev => prev ? { ...prev, geckoCount: prev.geckoCount + 1 } : null);
      }
      resetForm();
      addToast(isEditing ? "Profil berhasil diperbarui!" : "Gecko baru berhasil diregistrasi!");
    } catch (error) {
      console.error("[DEBUG] handleSubmit global catch", error);
      let errorMsg = "Gagal menyimpan data.";
      
      if (error instanceof Error) {
        if (error.message.includes("permission-denied")) {
          errorMsg = "Akses ditolak. Pastikan Anda sudah login dengan benar dan akun Anda aktif.";
        } else if (error.message.includes("quota-exceeded")) {
          errorMsg = "Kuota penyimpanan penuh. Silakan upgrade plan Anda.";
        } else {
          errorMsg = `Terjadi kesalahan: ${error.message}`;
        }
      }
      
      addToast(errorMsg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setImgSrc('');
    setIsModalOpen(false);
    setEditingGecko(null);
    setIsUploading(false);
  };

  const handleEdit = (gecko: Gecko) => {
    setEditingGecko(gecko);
    setFormData({
      name: gecko.name || '',
      morph: gecko.morph || '',
      birthDate: gecko.birthDate || '',
      gender: gecko.gender || 'unsex',
      status: gecko.status || 'available',
      albinoStrain: gecko.albinoStrain || 'None',
      sireId: gecko.sireId || '',
      damId: gecko.damId || '',
      sireName: gecko.sireName || '',
      damName: gecko.damName || '',
      info: gecko.info || '',
      note: gecko.note || '',
      photoUrl: gecko.photoUrl || '',
      createdAt: gecko.createdAt
    });
    setImgSrc(gecko.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'geckos', id));
      batch.update(doc(db, 'users', profile.uid), { geckoCount: increment(-1) });
      await batch.commit();
      
      // Also delete image from storage (best effort)
      await deleteGeckoImage(profile.uid, id);
      
      setProfile(prev => prev ? { ...prev, geckoCount: Math.max(0, prev.geckoCount - 1) } : null);
      addToast("Gecko berhasil dihapus.");
    } catch (error) {
      console.error(error);
      addToast("Gagal menghapus gecko.", "error");
    }
  };

  const filteredGeckos = useMemo(() => {
    const q = search.toLowerCase();
    return geckos.filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(q) || 
                           g.morph.toLowerCase().includes(q);
      const matchesGender = genderFilter === 'all' || g.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [geckos, search, genderFilter]);

  useEffect(() => {
    setDisplayLimit(4);
  }, [search, genderFilter]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-1">Stock Collection</h2>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gecko Registry</h1>
        </div>
        <Tooltip content="Add a new gecko to your collection">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full sm:w-auto btn-primary py-4 px-8 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Gecko
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="text-slate-600 group-focus-within:text-emerald-600 transition-colors" size={18} />
          </div>
          <input 
            type="text" 
            placeholder="SEARCH BY NAME OR MORPH..." 
            className="w-full h-14 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 outline-none transition-all uppercase placeholder:text-slate-500 tracking-wider"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
          />
        </div>

        <div className="flex bg-white p-1 h-14 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          {['all', 'male', 'female', 'unsex'].map(g => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`flex-1 px-4 sm:px-6 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden flex items-center justify-center min-w-[70px] ${
                genderFilter === g 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative w-16 h-16"
          >
            <div className="absolute inset-0 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden">
              <img 
                src="https://i.ibb.co.com/chZdXkQz/Logo.png" 
                alt="Logo"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity text-emerald-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
                }}
              />
            </div>
          </motion.div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Syncing Records</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredGeckos.slice(0, displayLimit).map((gecko) => (
              <motion.div 
                key={gecko.id} 
                className="bg-white px-4 pt-2.5 pb-1.5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between m-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex-shrink-0 relative overflow-hidden ring-2 ring-slate-50 group-hover:ring-emerald-100 transition-all">
                    {gecko.photoUrl ? (
                      <img src={gecko.photoUrl} alt={gecko.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Camera size={20} />
                      </div>
                    )}
                    <div className={`absolute bottom-0 inset-x-0 h-1.5 ${
                       gecko.gender === 'male' ? 'bg-blue-500' : 
                       gecko.gender === 'female' ? 'bg-rose-500' : 'bg-slate-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight whitespace-normal">{gecko.name}</h3>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        gecko.status === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        gecko.status === 'keep' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                        gecko.status === 'dead' ? 'bg-rose-500' :
                        'bg-slate-300'
                      }`} />
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-bold text-slate-600 tracking-tight uppercase whitespace-normal leading-tight">{gecko.morph}</p>
                      <Tooltip content="Search morph in Knowledge Base">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/knowledge?q=${encodeURIComponent(gecko.morph)}`);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-emerald-500 transition-colors"
                        >
                          <BookOpen size={10} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-[3px] mb-1 border-t border-slate-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Tooltip content="View Details">
                      <button 
                        onClick={() => { setSelectedGecko(gecko); setIsViewModalOpen(true); }}
                        className="p-2.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all border border-slate-50"
                      >
                        <Eye size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Edit Profile">
                      <button 
                        onClick={() => handleEdit(gecko)}
                        className="p-2.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all border border-slate-50"
                      >
                        <Edit2 size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Remove Gecko">
                      <button 
                        onClick={() => { setGeckoToDelete(gecko.id!); setIsDeleteModalOpen(true); }}
                        className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-slate-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </div>

                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${
                    gecko.gender === 'male' ? 'bg-blue-50 text-blue-600' : 
                    gecko.gender === 'female' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {gecko.gender}
                  </span>
                </div>
              </motion.div>
            ))}
            {filteredGeckos.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 text-slate-400">
                 <Layers size={32} className="mx-auto mb-2 opacity-50" />
                 <p className="text-xs font-bold uppercase tracking-widest">No matching geckos</p>
              </div>
            )}
          </div>

          {filteredGeckos.length > displayLimit && (
            <div className="flex justify-center mt-4">
              <Tooltip content="Load more geckos">
                <button 
                  onClick={() => setDisplayLimit(prev => prev + 4)}
                  className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm flex items-center gap-2"
                >
                  Lihat Lainnya
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      )}

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

      {/* Main View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedGecko && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setIsViewModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg max-h-[95vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col"
            >
               <Tooltip content="Close details" position="left">
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/20 backdrop-blur-xl rounded-full text-white hover:bg-black/40 transition-all"
                >
                  <X size={18} />
                </button>
              </Tooltip>

              {/* Header Image 1:1 */}
              <div className="w-full aspect-square bg-slate-100 relative flex-shrink-0">
                {selectedGecko.photoUrl ? (
                  <img src={selectedGecko.photoUrl} alt={selectedGecko.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <Camera size={64} className="mb-2 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Photo Available</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-50/50 px-4 sm:px-8 py-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex w-full justify-between items-center gap-4">
                  <Tooltip content="Show general information">
                    <button 
                      onClick={() => setActiveViewTab('details')}
                      className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                        activeViewTab === 'details' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Info size={14} />
                      Details
                    </button>
                  </Tooltip>
                  <Tooltip content="Show lineage chart">
                    <button 
                      onClick={() => setActiveViewTab('lineage')}
                      className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                        activeViewTab === 'lineage' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <GitGraph size={14} />
                      Lineage
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                {activeViewTab === 'details' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                      <div className="flex-1 min-w-0 w-full">
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight break-words">{selectedGecko.name}</h2>
                        <div className="mt-3 space-y-3">
                          <p className="text-sm sm:text-lg font-bold text-emerald-600 uppercase tracking-widest leading-relaxed break-words">
                            {selectedGecko.morph}
                          </p>
                          <Tooltip content="Open Encyclopedia">
                            <button 
                              onClick={() => navigate(`/knowledge?q=${encodeURIComponent(selectedGecko.morph)}`)}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                            >
                              <BookOpen size={12} />
                              Cari di Ensiklopedia
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        selectedGecko.gender === 'male' ? 'bg-blue-100 text-blue-600' :
                        selectedGecko.gender === 'female' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedGecko.gender}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Row 1: Albino Strain & Hatch Date */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50 relative">
                        <div className="space-y-1 pr-4 border-r border-slate-100">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Albino Strain</div>
                          <div className="text-base font-black text-emerald-600">
                            {selectedGecko.albinoStrain && selectedGecko.albinoStrain !== 'None' ? selectedGecko.albinoStrain : 'None'}
                          </div>
                        </div>
                        <div className="space-y-1 pl-4">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Hatch Date</div>
                          <div className="text-base font-black text-slate-800">{selectedGecko.birthDate || 'Unknown'}</div>
                        </div>
                      </div>

                      {/* Row 2: Sire & Dam Morph */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50 relative">
                        <div className="space-y-1 pr-4 border-r border-slate-100">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sire Morph</div>
                          <div className="text-sm font-bold text-slate-700 uppercase leading-snug break-words">{selectedGecko.sireName || 'N/A'}</div>
                        </div>
                        <div className="space-y-1 pl-4">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Dam Morph</div>
                          <div className="text-sm font-bold text-slate-700 uppercase leading-snug break-words">{selectedGecko.damName || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {selectedGecko.info && (
                      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 italic font-medium text-slate-800 text-sm leading-relaxed">
                        "{selectedGecko.info}"
                      </div>
                    )}

                    {selectedGecko.note && (
                      <div className="mt-4 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 text-slate-900 text-sm leading-relaxed">
                        <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Internal Note</div>
                        {selectedGecko.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LineageChart 
                      subject={selectedGecko} 
                      allGeckos={geckos} 
                      onSelectGecko={(g) => setSelectedGecko(g)}
                    />
                    
                    {/* Genetic Intelligence Legend */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em]">Genetic Trait Indicators</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { name: 'Tremper', color: 'bg-orange-400' },
                          { name: 'Bell', color: 'bg-red-400' },
                          { name: 'Rainwater', color: 'bg-yellow-400' },
                          { name: 'Eclipse', color: 'bg-slate-900' },
                          { name: 'Mack Snow', color: 'bg-slate-300' },
                          { name: 'Enigma', color: 'bg-purple-400' },
                          { name: 'Black Night', color: 'bg-slate-950' },
                          { name: 'Pied', color: 'bg-white border-slate-200' },
                        ].map((t, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full shadow-sm ${t.color}`} />
                             <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tight">{t.name}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-[8px] font-medium text-slate-600 italic">
                        * Trait dots appear automatically based on name and morph descriptions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit/Add Modal - Simplified to same design */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
               onClick={resetForm}
            />
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col"
            >
                <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-30">
                   <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{editingGecko ? 'Edit' : 'Add'} Gecko Profile</h2>
                   <Tooltip content="Cancel and close">
                     <button onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                   </Tooltip>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
                    <form id="gecko-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 pb-12">
                        <div className="space-y-8">
                            <div className="aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                                {imgSrc ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={imgSrc} 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                            <Tooltip content="Change photo">
                                              <label className="px-4 py-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-white/20 cursor-pointer hover:bg-black/80 transition-all flex items-center gap-2">
                                                  <Upload size={12} />
                                                  Ganti
                                                  <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
                                              </label>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ) : (
                                    <Tooltip content="Select a photo for your gecko">
                                      <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center hover:bg-slate-100/50 transition-colors">
                                          <Camera size={48} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                          <div className="text-center mt-4">
                                              <span className="text-xs font-black text-slate-800 uppercase tracking-widest block">Upload Photo</span>
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block px-4">Square format recommended</span>
                                          </div>
                                          <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
                                      </label>
                                    </Tooltip>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] px-1">Sexing Selection</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['male', 'female', 'unsex'].map(g => (
                                      <button 
                                        key={g}
                                        type="button" 
                                        onClick={() => setFormData(prev => ({...prev, gender: g as any}))}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                          formData.gender === g 
                                            ? 'bg-emerald-500 text-white shadow-md' 
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                      >
                                          {g === 'male' ? <MaleIcon size={14} /> : 
                                          g === 'female' ? <FemaleIcon size={14} /> : 
                                          <HelpCircle size={14} />}
                                          <span>{g}</span>
                                      </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex justify-between px-1">
                                  Gecko Name
                                  {formErrors.name && <span className="text-red-500 text-[8px] animate-pulse">{formErrors.name}</span>}
                                </label>
                                <input 
                                  placeholder="e.g. Apollo"
                                  className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold transition-all text-sm uppercase ${
                                    formErrors.name ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-emerald-500'
                                  }`} 
                                  value={formData.name} 
                                  onChange={e => {
                                    setFormData({...formData, name: e.target.value.toUpperCase()});
                                    if (formErrors.name) setFormErrors(prev => ({...prev, name: ''}));
                                  }} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex justify-between px-1">
                                  Morph Genetics
                                  {formErrors.morph && <span className="text-red-500 text-[8px] animate-pulse">{formErrors.morph}</span>}
                                </label>
                                <input 
                                  placeholder="e.g. Mack Snow Eclipse"
                                  className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold transition-all text-sm uppercase ${
                                    formErrors.morph ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-emerald-500'
                                  }`} 
                                  value={formData.morph} 
                                  onChange={e => {
                                    setFormData({...formData, morph: e.target.value.toUpperCase()});
                                    if (formErrors.morph) setFormErrors(prev => ({...prev, morph: ''}));
                                  }} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">
                                  Albino Strain
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {['None', 'Tremper', 'Bell', 'Rainwater'].map(strain => (
                                    <button
                                      key={strain}
                                      type="button"
                                      onClick={() => setFormData(prev => ({ ...prev, albinoStrain: strain as any }))}
                                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        formData.albinoStrain === strain
                                          ? 'bg-emerald-500 text-white shadow-md'
                                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                      }`}
                                    >
                                      {strain}
                                    </button>
                                  ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Birth/Hatch Date</label>
                                    <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Availability</label>
                                    <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                        <option value="available">Available</option>
                                        <option value="keep">Keep</option>
                                        <option value="sold">Sold</option>
                                        <option value="dead">Dead</option>
                                    </select>
                                </div>
                            </div>

                            {/* Sire & Dam Sections refined for mobile */}
                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sire Pedigree (Father)</label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <select 
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" 
                                      value={formData.sireId} 
                                      onChange={e => {
                                        const s = geckos.find(g => g.id === e.target.value);
                                        setFormData({...formData, sireId: e.target.value, sireName: s?.name || formData.sireName});
                                      }}
                                    >
                                        <option value="">Select from Stock...</option>
                                        {geckos.filter(g => g.gender === 'male' && g.status !== 'sold' && g.status !== 'dead').map(g => (
                                          <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <input 
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase" 
                                      placeholder="Or Enter Manual Name..."
                                      value={formData.sireName} 
                                      onChange={e => setFormData({...formData, sireName: e.target.value.toUpperCase()})} 
                                    />
                                </div>
                            </div>

                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                   <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dam Pedigree (Mother)</label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <select 
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" 
                                      value={formData.damId} 
                                      onChange={e => {
                                        const d = geckos.find(g => g.id === e.target.value);
                                        setFormData({...formData, damId: e.target.value, damName: d?.name || formData.damName});
                                      }}
                                    >
                                        <option value="">Select from Stock...</option>
                                        {geckos.filter(g => g.gender === 'female' && g.status !== 'sold' && g.status !== 'dead').map(g => (
                                          <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <input 
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase" 
                                      placeholder="Or Enter Manual Name..."
                                      value={formData.damName} 
                                      onChange={e => setFormData({...formData, damName: e.target.value.toUpperCase()})} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Additional Notes</label>
                                <textarea 
                                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm min-h-[120px] focus:border-emerald-500 outline-none transition-all uppercase" 
                                  placeholder="Temperament, health history, or special traits..."
                                  value={formData.note} 
                                  onChange={e => setFormData({...formData, note: e.target.value.toUpperCase()})} 
                                />
                            </div>
                            <div className="flex justify-center pt-10 pb-8">
                                  <Tooltip content={editingGecko ? 'Save changes to profile' : 'Register new gecko to stock'} className="w-full max-w-sm">
                                <button 
                                  className="group relative w-full py-6 px-10 bg-slate-900 text-white rounded-[2.5rem] font-bold uppercase tracking-[0.18em] text-[12px] shadow-[0_20px_50px_-12px_rgba(15,23,42,0.4)] active:scale-[0.97] transition-all overflow-hidden border border-white/5 disabled:opacity-70 disabled:cursor-not-allowed" 
                                  type="submit"
                                  disabled={isUploading}
                                >
                                    {/* Subtle gradient fill on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_100%] animate-shimmer" />
                                    
                                    <span className="relative flex items-center justify-center gap-5">
                                      {isUploading ? (
                                        <>
                                          <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2">
                                              <Loader2 size={16} className="animate-spin text-emerald-400" />
                                              <span className="mt-0.5">{uploadProgress > 0 ? `Uploading ${Math.round(uploadProgress)}%` : 'Syncing...'}</span>
                                            </div>
                                            {uploadProgress > 0 && (
                                              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-emerald-400 transition-all duration-300" 
                                                  style={{ width: `${uploadProgress}%` }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      ) : editingGecko ? (
                                        <>
                                          <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-white animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                          <span className="mt-0.5">Update Record</span>
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-white animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                          <span className="mt-0.5">Save Gecko</span>
                                        </>
                                      )}
                                    </span>
                                </button>
                              </Tooltip>
                            </div>
                        </div>
                    </form>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setGeckoToDelete(null); }}
        onConfirm={() => geckoToDelete && handleDelete(geckoToDelete)}
        title="Delete Gecko"
        message="Are you sure you want to delete this gecko record? This action cannot be undone and will update your collection quota."
      />

    </div>
  );
}
