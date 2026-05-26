import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Heart, 
  Box, 
  Calculator, 
  Download, 
  Settings as SettingsIcon, 
  LogOut,
  DownloadCloud,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { signOut } from '../lib/firebase';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  profile: UserProfile | null;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
  canInstall?: boolean;
  onInstall?: () => void;
}

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/registry', label: 'Registry', icon: BookOpen },
  { path: '/breeding', label: 'Breeding', icon: Heart },
  { path: '/incubator', label: 'Incubator', icon: Box },
  { path: '/morph-calculator', label: 'Morph Calc', icon: Calculator },
  { path: '/export', label: 'Export Data', icon: Download },
];

export default function Sidebar({ 
  profile, 
  isCollapsed, 
  setIsCollapsed, 
  mobileMenuOpen,
  setMobileMenuOpen,
  canInstall, 
  onInstall 
}: SidebarProps) {
  const location = useLocation();

  const sections = [
    {
      title: 'General',
      items: [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/registry', label: 'Registry', icon: BookOpen },
      ]
    },
    {
      title: 'Breeding',
      items: [
        { path: '/breeding', label: 'Pairs', icon: Heart },
        { path: '/incubator', label: 'Incubator', icon: Box },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/knowledge', label: 'Knowledge', icon: BookOpen },
        { path: '/morph-calculator', label: 'Genetic Calc', icon: Calculator },
        { path: '/export', label: 'Data Export', icon: Download },
      ]
    }
  ];

  if (profile?.email === 'sufhan.arifin979@gmail.com') {
    sections.push({
      title: 'Administration',
      items: [
        { path: '/admin', label: 'Admin Console', icon: ShieldCheck },
      ]
    });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          x: mobileMenuOpen ? 0 : (window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed lg:relative top-0 bottom-0 left-0 bg-[#070b14] text-slate-400 p-0 z-[70] flex flex-col shadow-2xl lg:shadow-none h-screen h-[100dvh] w-[280px]"
      >
        {/* Sidebar Toggle Button (Floating) - Desktop Only */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-emerald-500 text-white rounded-full items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-600 transition-colors z-50 border-2 border-white"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Branding Section */}
        <div className={`p-5 flex flex-col transition-all duration-300 pt-[calc(1.25rem+env(safe-area-inset-top))] ${isCollapsed ? 'items-center shrink-0' : 'mb-2'}`}>
          {/* App Branding */}
          <div className="flex items-center justify-between w-full relative">
            <div className={`flex items-center gap-3 transition-all ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-md ring-2 ring-emerald-500/10 flex-shrink-0 bg-[#070b14]">
                <img 
                  src="https://i.ibb.co.com/CKYFsmQx/geckofarm-logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col"
                >
                  <span className="text-slate-100 font-bold text-sm tracking-tight whitespace-nowrap leading-none">
                    Gecko Farm <span className="text-emerald-500 font-black ml-0.5">PRO</span>
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Farm Management</span>
                </motion.div>
              )}
            </div>

            {/* Mobile Close Button */}
            {mobileMenuOpen && (
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all font-bold"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Menu Sections */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 no-scrollbar py-4">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {!isCollapsed && (
                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] pl-4">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center h-10 px-4 rounded-xl transition-all duration-300 relative ${
                          isActive 
                            ? 'bg-slate-900/60 text-emerald-400' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
                        }`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="active-bar"
                            className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full"
                          />
                        )}
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
                        <motion.span 
                          initial={false}
                          animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
                          className={`font-bold tracking-tight whitespace-nowrap ml-3.5 text-[13px] ${isCollapsed ? 'hidden' : 'block'}`}
                        >
                          {item.label}
                        </motion.span>
                      </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions / Account */}
        <div className="px-3 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 border-t border-slate-900/50">
          {!isCollapsed && (
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-lg ${
                  profile?.subscription === 'premium' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                }`}>
                  {profile?.subscription === 'premium' ? 'Premium' : 'Free'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-tight">
                  {profile?.geckoCount || 0}/{profile?.planLimit || 10}
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-700 ease-out" 
                  style={{ width: `${Math.min(((profile?.geckoCount || 0) / (profile?.planLimit || 10)) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            {canInstall && (
              <button
                onClick={onInstall}
                className="w-full mb-2 flex items-center h-10 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-300 group"
              >
                <DownloadCloud className="w-5 h-5 flex-shrink-0 animate-bounce" />
                <motion.span 
                  initial={false}
                  animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
                  className={`font-black tracking-widest text-[10px] uppercase ml-3.5 ${isCollapsed ? 'hidden' : 'block'}`}
                >
                  Install App
                </motion.span>
              </button>
            )}

            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`group flex items-center h-10 px-4 rounded-xl transition-all duration-300 relative ${
                location.pathname === '/settings' 
                  ? 'bg-slate-900/60 text-emerald-400' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              {location.pathname === '/settings' && (
                <motion.div 
                  layoutId="active-bar"
                  className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full"
                />
              )}
              <SettingsIcon className="w-5 h-5 flex-shrink-0 transition-transform duration-300" />
              <motion.span 
                initial={false}
                animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
                className={`font-bold tracking-tight whitespace-nowrap ml-3.5 text-[13px] ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Settings
              </motion.span>
            </Link>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit the application?')) {
                  window.close();
                  // Fallback for browsers that don't allow window.close()
                  window.location.href = "about:blank";
                }
              }}
              className="w-full flex items-center h-10 px-4 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-300" />
              <motion.span 
                initial={false}
                animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -10 : 0 }}
                className={`font-bold tracking-tight whitespace-nowrap ml-3.5 text-[13px] ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Exit
              </motion.span>
            </button>
          </div>
        </div>

      </motion.aside>
    </>
  );
}
