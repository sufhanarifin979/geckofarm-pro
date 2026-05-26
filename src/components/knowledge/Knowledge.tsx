import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FlaskConical,
  Zap,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EnhancedMorph } from './morphDatabase';
import { UserProfile } from '../../types';
import AdminEncyclopedia from '../AdminEncyclopedia';
import PremiumModal from '../PremiumModal';

// Sub-components
import Encyclopedia from './Encyclopedia';
import MorphDetail from './MorphDetail';
import SimulationLab from './SimulationLab';

export default function Knowledge({ profile }: { profile: UserProfile | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [activeTab, setActiveTab] = useState<'encyclopedia' | 'lab' | 'admin'>('encyclopedia');
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const isAdmin = profile?.email === 'sufhan.arifin979@gmail.com';
  const isPremium = profile?.subscription === 'premium' || isAdmin;
  const isLightMode = activeTab === 'encyclopedia' || activeTab === 'lab';

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isLightMode ? 'bg-white' : 'dark bg-slate-950'}`}>
      {/* Header */}
      <header className={`border-b px-6 py-6 transition-all duration-500 ${
        isLightMode 
          ? 'bg-white border-slate-200' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className={`text-2xl font-black flex items-center gap-3 transition-colors ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                <BookOpen className="text-emerald-500" size={28} />
                Ensiklopedia Morph
              </h1>
              <p className={`text-sm font-medium transition-colors ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}>Ensiklopedia & Lab Genetika Pro</p>
            </div>
          </div>

          <div className={`flex items-center p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full transition-colors ${
            isLightMode ? 'bg-slate-100' : 'bg-slate-800'
          }`}>
            <button
               onClick={() => setActiveTab('encyclopedia')}
               className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                 activeTab === 'encyclopedia' 
                   ? (isLightMode ? 'bg-white text-emerald-600 shadow-sm' : 'bg-slate-900 text-emerald-500 shadow-sm')
                   : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-200'
               }`}
             >
               <BookOpen size={16} />
               Ensiklopedia
             </button>
             <button
               onClick={() => {
                 if (isPremium) {
                   setActiveTab('lab');
                 } else {
                   setIsPremiumModalOpen(true);
                 }
               }}
               className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                 activeTab === 'lab' 
                   ? (isLightMode ? 'bg-white text-emerald-600 shadow-sm' : 'bg-slate-900 text-emerald-500 shadow-sm')
                   : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-200'
               }`}
             >
               <FlaskConical size={16} />
               Lab Genetik
               {!isPremium && <Lock size={12} className="text-slate-400" />}
             </button>
             {isAdmin && (
               <button
                 onClick={() => setActiveTab('admin')}
                 className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                   activeTab === 'admin' 
                     ? (isLightMode ? 'bg-white text-emerald-500 shadow-sm' : 'bg-slate-900 text-emerald-400 shadow-sm')
                     : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-200'
                 }`}
               >
                 <Zap size={16} />
                 Admin
               </button>
             )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
             <div className="px-4 py-2 bg-slate-900 dark:bg-emerald-500/10 border border-slate-800 dark:border-emerald-500/20 rounded-2xl flex items-center gap-2">
                <Zap size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Alat Pembiakan Premium</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-8 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'encyclopedia' ? (
              <motion.div
                key="encyclopedia"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Encyclopedia />
              </motion.div>
            ) : activeTab === 'lab' ? (
              <motion.div
                key="lab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SimulationLab profile={profile} />
              </motion.div>
            ) : (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AdminEncyclopedia />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        profile={profile} 
      />
    </div>
  );
}

