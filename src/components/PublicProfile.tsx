import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Gecko, UserProfile } from '../types';
import { ProCardComponent } from './ProCardComponent';
import { Loader2, AlertCircle, ShieldCheck, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [gecko, setGecko] = useState<Gecko | null>(null);
  const [farm, setFarm] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      console.log('Generating card PNG...');
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        width: 900,
        height: 1200,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          margin: '0',
          padding: '40px',
          borderRadius: '16px',
        }
      });

      const link = document.createElement('a');
      link.download = `Verified_Digital_Card_${gecko?.name || 'gecko'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!id) {
      console.log('No ID provided in URL');
      setError('ID Gecko tidak valid.');
      setLoading(false);
      return;
    }

    // DEBUG LOGS AS REQUESTED
    console.log("Project:", firebaseConfig?.projectId);
    console.log("Viewer ID:", id);
    console.log('[DEBUG-QR-SYSTEM] Current URL:', window.location.href);

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure Firestore is initialized implicitly by calling the first getDoc
        // We use doc(db, "geckos", id) as requested
        const geckoRef = doc(db, 'geckos', id);
        console.log('[DEBUG-QR-SYSTEM] Accessing Path:', geckoRef.path);
        
        const geckoSnap = await getDoc(geckoRef);
        console.log("Firestore Result:", geckoSnap.exists());
        
        if (!geckoSnap.exists()) {
          console.warn('[DEBUG-QR-SYSTEM] Document NOT FOUND for ID:', id);
          setError('Data gecko tidak ditemukan. Pastikan Anda sudah menekan tombol "Share" di pojok kanan atas editor AI Studio.');
          setLoading(false);
          return;
        }

        const data = geckoSnap.data();
        console.log('[DEBUG-QR-SYSTEM] Document Retrieved Name:', data.name);
        const geckoData = { ...data, id: geckoSnap.id } as Gecko;
        setGecko(geckoData);

        // Fetch owner profile from 'users' collection
        try {
          console.log('[DEBUG] Fetching owner profile for UID:', geckoData.ownerId);
          const farmSnap = await getDoc(doc(db, 'users', geckoData.ownerId));
          if (farmSnap.exists()) {
            console.log('[DEBUG] Owner profile retrieved:', farmSnap.data()?.farmName);
            setFarm({ uid: farmSnap.id, ...farmSnap.data() } as UserProfile);
          } else {
            console.log('[DEBUG] Owner profile document does not exist in users collection');
          }
        } catch (profileErr) {
          console.error('[DEBUG] Warning: Failed to fetch owner profile:', profileErr);
        }

      } catch (err) {
        console.error('[DEBUG] Critical fetch error:', err);
        setError('Terjadi kesalahan koneksi saat memuat data dari server.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative w-20 h-20"
        >
          <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-pulse" />
          <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 overflow-hidden">
            <img 
              src="https://i.ibb.co.com/chZdXkQz/Logo.png" 
              alt="Logo"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check text-emerald-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52.01C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>';
              }}
            />
          </div>
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-[10px]">Geckofarm Pro</p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !gecko) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center leading-relaxed">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Record Unavailable</h1>
        <p className="text-slate-500 text-sm max-w-sm mb-4">{error || 'Data rekaman gecko ini tidak ditemukan dalam database resmi kami.'}</p>
        
        {/* FALLBACK DETAIL ERROR AS REQUESTED */}
        <div className="mt-6 p-4 bg-slate-100 rounded-xl w-full max-w-xs text-left">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Debug Info</p>
          <p className="text-[9px] font-mono text-slate-600 truncate">Project: {firebaseConfig?.projectId}</p>
          <p className="text-[9px] font-mono text-slate-600">ID: {id}</p>
        </div>

        <Link 
          to="/" 
          className="mt-10 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-transform"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4 overflow-x-hidden font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full flex flex-col items-center"
      >
        {/* Verification Header */}
        <div className="bg-white px-8 py-4 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-emerald-100 flex items-center gap-3 mb-10">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">
            Official Digital Pedigree Verification
          </span>
        </div>

        {/* Pro Card Render */}
        <div className="w-full flex justify-center">
          <ProCardComponent 
            ref={cardRef} 
            gecko={gecko} 
            profile={farm} 
            isPublic={true} 
          />
        </div>

        {/* Controls Section */}
        <div className="mt-12 flex flex-col items-center gap-6 max-w-md w-full">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadCard}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-4 bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExporting ? 'Generating PNG...' : 'Download Verified Certificate'}
          </motion.button>
          
          <div className="flex flex-col items-center gap-2 opacity-40">
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Protected by Geckofarm Pro™ Security
             </p>
             <p className="text-[8px] font-medium text-slate-400">
                Verified by {farm?.farmName || 'Kings Gecko'} on Official Registry
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
