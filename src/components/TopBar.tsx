import { Bell, User as UserIcon, Settings, Edit2, Menu, ChevronLeft, Crown, Download } from 'lucide-react';
import { UserProfile } from '../types';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface TopBarProps {
  profile: UserProfile | null;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
}

export default function TopBar({ profile, isSidebarCollapsed, onToggleSidebar, onToggleMobileMenu }: TopBarProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBtn(true);
    });

    window.addEventListener('appinstalled', () => {
      // Log install to analytics
      console.log('INSTALL: Success');
      setShowInstallBtn(false);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <header className="flex justify-between items-center mb-6 w-full animate-in fade-in duration-700 py-2">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMobileMenu}
          className="lg:hidden w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm text-slate-600 active:scale-95 transition-all"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 ml-1 truncate max-w-[120px] sm:max-w-none">
            {profile?.subscription === 'premium' ? "Professional Manager" : "Free Registry"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-800 tracking-tight uppercase px-1 truncate max-w-[150px] sm:max-w-none">
              {profile?.farmName || "My Farm"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0 transition-all">
        {showInstallBtn && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all whitespace-nowrap"
          >
            <Download size={14} className="shrink-0" />
            <span className="hidden xs:inline">Install</span>
          </button>
        )}
        
        <div className="flex items-center gap-2 bg-white px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer group relative">
          {profile?.subscription === 'premium' && (
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white z-10">
              <Crown size={12} fill="currentColor" />
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-500 transition-all shadow-inner overflow-hidden">
            {profile?.farmPhotoUrl ? (
              <img src={profile.farmPhotoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon size={20} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
