import { useState, useEffect, lazy, Suspense } from 'react';

console.log("App.tsx: Module is loading...");

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getOrCreateUserProfile, updateProfileCache, isFirestoreQuotaExceeded, subscribeToQuotaStatus, unsubscribeAllListeners } from './lib/firebase';
import { UserProfile } from './types';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Registry from './components/Registry';
import Breeding from './components/Breeding';
import Incubator from './components/Incubator';
import MorphCalculator from './components/MorphCalculator';
import Export from './components/Export';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import PublicProfile from './components/PublicProfile';
import { GeckoProvider } from './GeckoProvider';
import { Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { APP_LOGO_URL } from './constants';

const Knowledge = lazy(() => import('./components/knowledge/Knowledge'));

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profileState, setProfileState] = useState<UserProfile | null>(null);
  const [quotaWarning, setQuotaWarning] = useState(false);

  useEffect(() => {
    addLog("App: Memasang listener subscribeToQuotaStatus...");
    const unsubscribeQuota = subscribeToQuotaStatus((exceeded) => {
      addLog(`App: Status kuota terdeteksi -> ${exceeded ? 'EXCEEDED' : 'NORMAL'}`);
      setQuotaWarning(exceeded);
      
      if (!exceeded && user) {
        addLog("App: Kuota terdeteksi pulih kembali! Memuat ulang data dari Firestore...");
        getOrCreateUserProfile(user)
          .then((p) => {
            setProfile(p);
            setHasError(null);
            addLog("App: Data profil berhasil diperbarui dari Firestore secara dinamis!");
          })
          .catch((err) => {
            const errStr = err instanceof Error ? err.message : String(err);
            console.warn("Gagal memuat ulang profil setelah kuota pulih:", errStr);
          });
      }
    });

    return () => {
      unsubscribeQuota();
    };
  }, [user]);

  // Intercept profile updates to sync cache automatically
  const setProfile = (newProfile: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => {
    setProfileState(prev => {
      const updated = typeof newProfile === 'function' ? newProfile(prev) : newProfile;
      if (updated && updated.uid) {
        updateProfileCache(updated.uid, updated);
      }
      return updated;
    });
  };

  const profile = profileState;
  const isAdmin = user?.email === 'sufhan.arifin979@gmail.com' || profile?.email === 'sufhan.arifin979@gmail.com';

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  // Diagnostic states
  const [logs, setLogs] = useState<string[]>(["App: Module loaded"]);
  const [hasError, setHasError] = useState<string | null>(null);
  const [isSlow, setIsSlow] = useState(false);

  const addLog = (msg: string) => {
    console.log("[Diagnostic]", msg);
    setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addLog("App: Memulai inisialisasi...");

    const slowTimer = setTimeout(() => {
      addLog("App: Loading terdeteksi lambat (>10 detik), menampilkan info bantuan.");
      setIsSlow(true);
    }, 10000);

    const handleGlobalError = (e: ErrorEvent) => {
      const msg = `Global Error: ${e.message} at ${e.filename}:${e.lineno}`;
      addLog(msg);
      setHasError(e.message);
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
      addLog(`Unhandled Rejection: ${msg}`);
      setHasError(msg);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      addLog("App: Install prompt terdeteksi");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (!auth) {
      addLog("App ERROR: Firebase Auth instance tidak dapat diinisialisasi.");
      setHasError("Firebase Auth gagal diinisialisasi");
    } else {
      addLog("App: Firebase Auth terdeteksi, mendaftarkan onAuthStateChanged...");
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      addLog(`onAuthStateChanged dipicu. User: ${u ? u.email : 'null (logged out)'}`);
      if (u) {
        setLoading(true); // Maintain loading screen while fetching profile
      }
      try {
        if (u) {
          addLog("Mencoba memproses profil pengguna...");
          setUser(u);
          let userProfile;
          try {
            userProfile = await getOrCreateUserProfile(u);
            if (isFirestoreQuotaExceeded) {
              setQuotaWarning(true);
            }
          } catch (profileErr: any) {
            const errStri = profileErr instanceof Error ? profileErr.message : String(profileErr);
            addLog(`Gagal memuat profil asli: ${errStri}. Menggunakan profil fallback lokal.`);
            setHasError(errStri);
            setQuotaWarning(true);
            const isAutoPremium = u.email === 'sufhan.arifin979@gmail.com';
            userProfile = {
              uid: u.uid,
              email: u.email || '',
              farmName: 'My Gecko Farm (Offline/Local)',
              farmPhotoUrl: '',
              subscription: isAutoPremium ? 'premium' : 'free',
              geckoCount: 0,
              pairingCount: 0,
              clutchCount: 0,
              planLimit: isAutoPremium ? 10000 : 10
            };
          }
          setProfile(userProfile);
          addLog("Profil pengguna berhasil dimuat");
        } else {
          addLog("Status Auth: Pengguna belum masuk.");
          unsubscribeAllListeners();
          setUser(null);
          setProfile(null);
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addLog(`ERROR saat state-change: ${errorMsg}`);
        setHasError(errorMsg);
        // Do not force sign-out unless absolutely necessary, let them stay authenticated but with offline banner if wanted
      } finally {
        addLog("Status loading dinonaktifkan.");
        setLoading(false);
      }
    });

    return () => {
      console.log("App.tsx: Unmounting App component, unsubscribing from auth");
      unsubscribe();
      clearTimeout(slowTimer);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []); // Empty dependency array ensures this listener is registered exactly once on mount

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 gap-6">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative w-24 h-24"
        >
          {/* Logo container with pulse effect */}
          <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] animate-ping" />
          <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/10 overflow-hidden border-2 border-emerald-500/10">
            <img 
              src="https://i.ibb.co.com/chZdXkQz/Logo.png" 
              alt="Geckofarm"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check text-emerald-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52.01C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>';
                  parent.appendChild(icon.firstChild as Node);
                }
              }}
            />
          </div>
        </motion.div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-[10px]">Geckofarm Pro</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
          </div>
        </div>

        {isSlow && (
          <div className="mt-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl max-w-sm w-full text-center animate-fade-in shadow-xl flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi-off"><line x1="2" y1="2" x2="22" y2="22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"/><path d="M5 12.5a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.5 8"/><path d="M1.5 8a15.91 15.91 0 0 1 7.29-2.58"/><path d="M8.58 13.58A4.91 4.91 0 0 1 12 13a4.9 4.9 0 0 1 2.33.61"/></svg>
            </div>
            
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Koneksi Melambat
            </h3>
            
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Aplikasi memerlukan waktu lebih lama dari biasanya untuk memuat. Silakan periksa jaringan internet Anda atau coba muat ulang halaman.
            </p>

            {hasError && (
              <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-left text-[11px] leading-relaxed">
                <strong className="block text-rose-800 mb-0.5">⚠️ Masalah Terdeteksi:</strong> 
                {isAdmin ? hasError : "Koneksi ke server sedang mengalami gangguan sementara atau sedang dalam pemeliharaan berkala."}
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/10 active:scale-[0.98]"
            >
              Coba Muat Ulang Halaman
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/v/:id" element={<PublicProfile />} />
        <Route path="*" element={
          !user ? <Auth /> : (
            <div className="dashboard-grid relative">
              <Sidebar 
                profile={profile} 
                isCollapsed={!sidebarOpen}
                setIsCollapsed={(val) => setSidebarOpen(!val)}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                canInstall={canInstall}
                onInstall={handleInstallClick}
              />
              
              <main className="main-content flex-1 w-full">
                <TopBar 
                  profile={profile} 
                  isSidebarCollapsed={!sidebarOpen}
                  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                />
                
                {quotaWarning && (
                  isAdmin ? (
                    <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-3 shadow-sm animate-pulse flex-shrink-0">
                      <span className="text-xl">⚠️</span>
                      <div className="flex-1">
                        <p className="font-bold">Firestore Quota Limit Exceeded (Spark Plan / Daily Limit)</p>
                        <p className="text-amber-700 font-normal mt-0.5">Database telah mencapai batas harian Free Tier (Quota limit exceeded). Anda tetap dapat melihat aplikasi di mode **Offline/Fallback**. Batas kuota harian akan direset otomatis oleh Google keesokan harinya.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mx-4 mt-4 p-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-3 shadow-sm animate-pulse flex-shrink-0">
                      <span className="text-xl">🛠️</span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">Sistem Sedang Dioptimalkan (Under Maintenance)</p>
                        <p className="text-slate-600 font-normal mt-0.5">Kami sedang melakukan pemeliharaan dan optimalisasi sistem secara berkala untuk kenyamanan Anda. Aplikasi tetap dapat digunakan dalam mode performa hemat.</p>
                      </div>
                    </div>
                  )
                )}
                
                <div className="flex-1 min-h-0 pb-12 sm:pb-20">
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-20">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                  }>
                    <GeckoProvider profile={profile}>
                      <Routes>
                        <Route path="/" element={<Dashboard profile={profile} />} />
                        <Route path="/registry" element={<Registry profile={profile} setProfile={setProfile} />} />
                        <Route path="/breeding" element={<Breeding profile={profile} />} />
                        <Route path="/incubator" element={<Incubator profile={profile} setProfile={setProfile} />} />
                        <Route path="/knowledge" element={<Knowledge profile={profile} />} />
                        <Route path="/knowledge/:id" element={<Knowledge profile={profile} />} />
                        <Route path="/morph-calculator" element={<MorphCalculator profile={profile} />} />
                        <Route path="/export" element={<Export profile={profile} />} />
                        <Route path="/settings" element={<Settings profile={profile} setProfile={setProfile} />} />
                        <Route path="/admin" element={profile?.email === 'sufhan.arifin979@gmail.com' ? <AdminPanel /> : <Navigate to="/" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </GeckoProvider>
                  </Suspense>
                </div>
              </main>
            </div>
          )
        } />
      </Routes>
    </Router>
  );
}
