import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) {
      console.log("Auth: Login already in progress, ignoring click.");
      return;
    }
    
    console.log("Auth: Starting login flow...");
    setIsLoggingIn(true);
    
    // Safety timeout: if after 20 seconds we are still "isLoggingIn" but no auth state change happened
    const safetyTimeout = setTimeout(() => {
      console.log("Auth: Login timeout reached, resetting state.");
      setIsLoggingIn(false);
    }, 20000);

    try {
      await signInWithGoogle();
      console.log("Auth: signInWithGoogle call settled.");
      // App.tsx handles state change, unmounting this component
    } catch (error: any) {
      // Don't reset if another request is handling it
      if (error?.code === 'auth/cancelled-popup-request') {
        console.warn("Auth: Popup request suppressed because another is in progress.");
        return; 
      }
      
      console.error("Auth: Login failed", error);
      setIsLoggingIn(false);
      clearTimeout(safetyTimeout);
      
      // Provide more specific feedback for common errors
      if (error?.code === 'auth/popup-closed-by-user') {
        // Just reset state, user closed it.
      } else if (error?.code === 'auth/network-request-failed') {
        alert("Koneksi internet bermasalah. Periksa jaringan Anda.");
      } else if (error?.code === 'auth/internal-error') {
        alert("Terjadi kesalahan internal. Silakan muat ulang halaman.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center"
        id="login-card"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-lg border border-slate-100 overflow-hidden p-4">
            <img 
              src="https://i.ibb.co.com/chZdXkQz/Logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check text-emerald-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52.01C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>';
              }}
            />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gecko Farm Pro</h1>
        <p className="text-gray-500 mb-8">Management System Profesional untuk Peternak Leopard Gecko</p>
        
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl transition-colors shadow-sm font-medium ${
            isLoggingIn 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
          id="google-login-btn"
        >
          {isLoggingIn ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Menghubungkan...</span>
            </div>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span>Masuk dengan Google</span>
            </>
          )}
        </button>
        
        <p className="mt-8 text-xs text-gray-400">
          Dengan masuk, Anda menyetujui Ketentuan Layanan kami.
        </p>
      </motion.div>
    </div>
  );
}
