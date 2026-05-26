import { useState, useEffect, lazy, Suspense } from 'react';

console.log("App.tsx: Module is loading...");

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getOrCreateUserProfile } from './lib/firebase';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
      addLog("App: Loading terdeteksi lambat (>3 detik), menampilkan diagnosis.");
      setIsSlow(true);
    }, 3000);

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
      try {
        if (u) {
          addLog("Mencoba memproses profil pengguna...");
          setUser(u);
          const userProfile = await getOrCreateUserProfile(u);
          setProfile(userProfile);
          addLog("Profil pengguna berhasil dimuat");
        } else {
          addLog("Status Auth: Pengguna belum masuk.");
          setUser(null);
          setProfile(null);
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addLog(`ERROR saat state-change: ${errorMsg}`);
        setHasError(errorMsg);
        if (u) {
          try {
            await auth.signOut();
            addLog("Keluar (signOut) berhasil setelah error profil");
          } catch (signOutError: any) {
            addLog(`Gagal signOut fallback: ${signOutError.message || String(signOutError)}`);
          }
          setUser(null);
          setProfile(null);
        }
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
          <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-3xl max-w-md w-full text-left font-mono text-xs text-slate-600 animate-fade-in shadow-xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 flex-shrink-0">
              <span className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Diagnosis Sistem</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">Menganalisis...</span>
            </div>
            
            {hasError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-sans font-medium text-xs leading-relaxed flex-shrink-0">
                <strong className="block text-rose-800 mb-0.5">⚠️ Masalah Terdeteksi:</strong> 
                {hasError}
                <div className="mt-1 text-[10px] text-rose-500 font-mono">
                  Kemungkinan besar API Key baru Anda dibatasi (Restricted), salah salin, atau Service Account bermasalah.
                </div>
              </div>
            )}
            
            <strong className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex-shrink-0">Log Aktivitas:</strong>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 border border-slate-150 p-2 rounded-xl bg-white min-h-[100px]">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-snug border-b border-slate-50 pb-1 last:border-0 last:pb-0 break-all">{log}</div>
              ))}
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/10 active:scale-[0.98] flex-shrink-0"
            >
              Coba Muat Ulang Halaman (Reload)
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
