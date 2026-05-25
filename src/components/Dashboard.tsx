import { UserProfile, Gecko } from '../types';
import { 
  Plus, 
  Users, 
  Heart, 
  Box, 
  ChevronRight, 
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import PremiumModal from './PremiumModal';
import Analytics from './Analytics';

import { useGeckos } from '../GeckoProvider';

interface DashboardProps {
  profile: UserProfile | null;
}

export default function Dashboard({ profile }: DashboardProps) {
  const { geckos } = useGeckos();
  const [stats, setStats] = useState({
    totalGeckos: 0,
    activePairings: 0,
    incubating: 0,
    recentGeckos: [] as Gecko[]
  });
  const [loading, setLoading] = useState(true);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setStats({
      totalGeckos: profile.geckoCount,
      activePairings: profile.pairingCount,
      incubating: profile.clutchCount,
      recentGeckos: geckos.slice(0, 3)
    });
    setLoading(false);
  }, [profile, geckos]);

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-500 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Registry</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">{stats.totalGeckos}</h3>
          </div>
        </div>
 
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Heart size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Pairs</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">{stats.activePairings}</h3>
          </div>
        </div>
 
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Box size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Incubating</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">{stats.incubating}</h3>
          </div>
        </div>
 
        <Link to="/registry" className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg shadow-slate-900/20 text-white flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-all active:scale-95 group">
          <Plus size={24} className="mb-2 group-hover:rotate-90 transition-transform text-emerald-400" />
          <div className="text-[10px] font-black uppercase tracking-widest">New Registry</div>
        </Link>
      </div>

      {/* Analytics Section */}
      <Analytics profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">Recent Registry</h3>
              <Link to="/registry" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group">
                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="registry-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Morph</th>
                    <th>Sex</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentGeckos.map((gecko) => (
                    <tr key={gecko.id}>
                      <td>
                        <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden shadow-sm">
                          {gecko.photoUrl ? (
                            <img src={gecko.photoUrl} alt={gecko.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Users size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-bold text-slate-800 whitespace-normal">{gecko.name}</td>
                      <td className="text-slate-500 text-sm whitespace-normal min-w-[120px]">{gecko.morph}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          gecko.gender === 'male' ? 'bg-blue-100 text-blue-700' : 
                          gecko.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {gecko.gender}
                        </span>
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          gecko.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 
                          gecko.status === 'sold' ? 'bg-slate-100 text-slate-600' : 
                          gecko.status === 'dead' ? 'bg-rose-100 text-rose-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {gecko.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {stats.recentGeckos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 font-medium italic">
                        No recent records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6 h-full min-h-[400px]">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest mb-1.5">News & Advertisements</h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Terhubung dengan komunitas dan partner eksklusif kami.</p>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {/* Faunary.id - Minimal Row Layout */}
              <a 
                href="https://faunary.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-900 rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all block"
              >
                <div className="flex items-center p-3 gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-white/5">
                    <img 
                      src="https://i.ibb.co.com/1YW3MJW6/IMG-20260506-WA0017.png" 
                      alt="Faunary" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-[9px] font-black text-white uppercase tracking-wider">Faunary.id</h4>
                      <span className="text-[6px] bg-emerald-500/20 text-emerald-400 px-1 rounded-sm font-bold uppercase">Official Partner</span>
                    </div>
                    <p className="text-[8px] text-slate-400 font-medium leading-tight">Reptile Management Platform Indonesia</p>
                  </div>
                </div>
              </a>

              {/* Octa Pulse Ad - Minimal Card */}
              <a 
                href="https://s.shopee.co.id/AUqbwRBlf1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white rounded-xl overflow-hidden border border-slate-100 group cursor-pointer hover:shadow-sm transition-all block"
              >
                <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                   <img 
                     src="https://i.ibb.co.com/ZpB3MLQP/IMG-20260419-173717.png" 
                     alt="Octa Pulse" 
                     className="w-full h-full object-contain p-2 group-hover:scale-105 transition-all duration-500"
                     referrerPolicy="no-referrer"
                   />
                   <div className="absolute top-2 right-2 bg-orange-500 px-1.5 py-0.5 rounded text-[6px] font-black text-white uppercase tracking-widest shadow-sm">Shopee Partner</div>
                </div>
                <div className="p-3 bg-slate-50/30">
                  <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-tight">OCTA PULSE KALSIUM & MULTI VITAMIN</h4>
                  <p className="text-[8px] text-slate-400 mt-0.5">Nutrisi lengkap untuk kesehatan reptil.</p>
                </div>
              </a>
            </div>
          </div>
 
          <div className="bg-emerald-600 rounded-2xl p-6 shadow-lg shadow-emerald-600/20 text-white flex flex-col gap-4">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-1">Scale your business</h3>
              <p className="text-[10px] opacity-80 font-medium">Unlock unlimited registry and genetic analysis tools.</p>
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setIsPremiumModalOpen(true)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest text-center hover:bg-slate-800 transition-all border border-slate-800 shadow-xl"
              >
                Unlock Premium Features
              </button>
              <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest text-center leading-none">
                Unlimited registry • Full tools access
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        profile={profile} 
      />
    </div>
  );
}
