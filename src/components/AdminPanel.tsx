import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { 
  Users, 
  ShieldCheck, 
  Zap, 
  Search, 
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  User as UserIcon,
  Loader2,
  Mail,
  Calendar,
  Layers,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminEncyclopedia from './AdminEncyclopedia';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'encyclopedia'>('users');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profileData = snapshot.docs.map(doc => ({ 
        uid: doc.id, 
        ...doc.data() 
      } as UserProfile));
      setProfiles(profileData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpgrade = async (uid: string, currentSub: string) => {
    setUpdatingId(uid);
    try {
      const newSub = currentSub === 'premium' ? 'free' : 'premium';
      const newLimit = newSub === 'premium' ? 10000 : 10;
      await updateDoc(doc(db, 'users', uid), {
        subscription: newSub,
        planLimit: newLimit
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.farmName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.subscription === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: profiles.length,
    premium: profiles.filter(p => p.subscription === 'premium').length,
    free: profiles.filter(p => p.subscription === 'free').length
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Admin Infrastructure Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Admin Console</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage user subscriptions and global research data.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
           <button 
             onClick={() => setActiveTab('users')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeTab === 'users' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'
             }`}
           >
             <Users size={14} />
             Members
           </button>
           <button 
             onClick={() => setActiveTab('encyclopedia')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeTab === 'encyclopedia' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'
             }`}
           >
             <BookOpen size={14} />
             Encyclopedia
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Total Users', value: stats.total, icon: Users, color: 'text-slate-600' },
                { label: 'Premium', value: stats.premium, icon: Zap, color: 'text-emerald-500' },
                { label: 'Free Tier', value: stats.free, icon: Layers, color: 'text-blue-400' },
              ].map((stat, i) => (
                <div key={i} className="flex-1 min-w-[120px] bg-white dark:bg-slate-900 p-3 px-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{stat.label}</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search by email or farm name..."
                  className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:border-emerald-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                {(['all', 'free', 'premium'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === f 
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* User List Table (Desktop View for Admin is usually better) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Farm / User</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {filteredProfiles.map((p) => (
                      <motion.tr 
                        layout
                        key={p.uid} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-white dark:border-slate-700 shadow-sm">
                              {p.farmPhotoUrl ? (
                                <img src={p.farmPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon className="text-slate-300" size={20} />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase">{p.farmName || 'Unnamed Farm'}</span>
                              <span className="text-[10px] font-medium text-slate-400">{p.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            p.subscription === 'premium' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {p.subscription}
                          </span>
                        </td>
                        <td className="p-6">
                           <div className="flex flex-col gap-1 w-24">
                              <span className="text-[8px] font-black text-slate-400 uppercase">{p.geckoCount} / {p.planLimit}</span>
                              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{ width: `${(p.geckoCount / p.planLimit) * 100}%` }} />
                              </div>
                           </div>
                        </td>
                        <td className="p-6 text-right">
                          <button
                            disabled={updatingId === p.uid}
                            onClick={() => handleUpgrade(p.uid, p.subscription)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                          >
                            {updatingId === p.uid ? '...' : (p.subscription === 'premium' ? 'Downgrade' : 'Upgrade Premium')}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="encyclopedia-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AdminEncyclopedia />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

