import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Dna, 
  ArrowRight, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  Activity, 
  Trophy,
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import MorphDetail from './MorphDetail';

interface ReferenceLink {
  title: string;
  url: string;
}

interface MorphEntry {
  id: string;
  name: string;
  slug: string;
  category: 'Base' | 'Albino' | 'Snow' | 'Combo' | 'Line-bred' | 'Pattern' | 'Special';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Holy Grail';
  inheritance_type: 'Recessive' | 'Incomplete Dominant' | 'Dominant' | 'Polygenetic' | 'Line-bred';
  description: string;
  genetics?: string;
  visual_traits?: string[];
  combo_compatibility?: string[];
  warnings?: string;
  breeder_notes?: string;
  image_url?: string;
  selection_priority?: string[];
  tags?: string[];
  reference_links?: ReferenceLink[];
  credited_breeders?: string[];
  created_at?: any;
  updated_at?: any;
}

interface MorphListItemProps {
  morph: MorphEntry;
  onSelect: (morph: MorphEntry) => void;
  index: number;
}

function MorphListItem({ morph, onSelect, index }: MorphListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="relative w-14 h-14 shrink-0">
            <div className={`w-full h-full rounded-2xl flex items-center justify-center overflow-hidden border-2 ${
              morph.rarity === 'Legendary' || morph.rarity === 'Holy Grail' ? 'border-amber-500/20 bg-amber-50' :
              morph.rarity === 'Rare' ? 'border-purple-500/20 bg-purple-50' :
              morph.rarity === 'Uncommon' ? 'border-blue-500/20 bg-blue-50' :
              'border-slate-200 bg-slate-50'
            }`}>
              {morph.image_url ? (
                <img 
                  src={morph.image_url} 
                  alt={morph.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Dna size={24} className={isExpanded ? 'animate-pulse text-slate-400' : 'text-slate-400'} />
              )}
            </div>
            {morph.rarity !== 'Common' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                 <Sparkles size={8} className="text-white" />
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-emerald-500 transition-colors">
                {morph.name}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                {morph.inheritance_type}
              </span>
              <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.15em]">
                {morph.category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {morph.warnings && (
            <ShieldAlert size={18} className="text-rose-500" />
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-all"
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-slate-800"
          >
            <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Layers size={14} className="text-emerald-500" />
                       Deskripsi Visual & Riset
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-4">
                      {morph.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-1 min-w-[140px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Rarity</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{morph.rarity}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-1 min-w-[140px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Genetics</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{morph.genetics || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Activity size={14} className="text-emerald-500" />
                       Breeder Insight
                    </h4>
                    <p className="text-xs text-slate-500 italic leading-relaxed mb-4">
                       {morph.breeder_notes || "No additional notes provided by researchers."}
                    </p>
                  </div>

                  {morph.selection_priority && morph.selection_priority.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Trophy size={14} />
                         Visual Grading Guide
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {morph.selection_priority.map((point, i) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(morph);
                    }}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    Buka Detail Lengkap
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Encyclopedia() {
  const [morphs, setMorphs] = useState<MorphEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [selectedMorph, setSelectedMorph] = useState<MorphEntry | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'morphs'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as MorphEntry));
      setMorphs(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'morphs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMorphs = useMemo(() => {
    return morphs.filter(m => {
      const query = searchQuery.toLowerCase();
      
      const matchesSearch = 
        m.name.toLowerCase().includes(query) || 
        m.description.toLowerCase().includes(query) ||
        m.tags?.some(k => k.toLowerCase().includes(query)) ||
        m.category.toLowerCase().includes(query);

      const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
      const matchesRarity = filterRarity === 'all' || m.rarity === filterRarity;
      
      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [morphs, searchQuery, filterCategory, filterRarity]);

  const categories = useMemo(() => {
    const cats = new Set(morphs.map(m => m.category));
    return Array.from(cats);
  }, [morphs]);

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
         <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
         <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Accessing Dynamic Research Database...</p>
       </div>
     );
  }

  if (selectedMorph) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <MorphDetail morph={selectedMorph as any} onBack={() => setSelectedMorph(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-xl group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari research morph (contoh: 'Tremper', 'Albino')..."
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all font-semibold text-slate-700 dark:text-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-4 no-scrollbar">
            <button 
              onClick={() => setFilterCategory('all')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                filterCategory === 'all' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Layers size={14} />
              Semua
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                  filterCategory === cat ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat === 'Base' && <Dna size={14} />}
                {cat === 'Albino' && <Sparkles size={14} />}
                {cat === 'Snow' && <ActivityIcon size={14} />}
                {cat === 'Combo' && <Zap size={14} />}
                {cat === 'Pattern' && <Layers size={14} />}
                {cat === 'Line-bred' && <Activity size={14} />}
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <select 
              className="flex-1 lg:flex-none px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-sm font-bold text-slate-600 dark:text-slate-300 focus:border-emerald-500/30 shadow-sm"
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
            >
              <option value="all">Semua Kelangkaan</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Legendary">Legendary</option>
              <option value="Holy Grail">Holy Grail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expandable List */}
      <div className="space-y-3">
        {filteredMorphs.map((morph, index) => (
          <MorphListItem 
            key={morph.id} 
            morph={morph} 
            onSelect={setSelectedMorph}
            index={index}
          />
        ))}
      </div>

      {filteredMorphs.length === 0 && (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
           <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl w-20 h-20 mx-auto mb-6 flex items-center justify-center text-slate-300">
             <Search size={32} />
           </div>
           <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Morph Tidak Ditemukan</h4>
           <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">Coba cari dengan kata kunci lain atau tunggu update research terbaru.</p>
        </div>
      )}

      {/* Pro Stats Footer */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 p-12 opacity-[0.05] -rotate-12 translate-x-1/4">
          <Zap size={200} />
        </div>
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="space-y-1">
             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Live Morphs</div>
             <div className="text-4xl font-black">{morphs.length}</div>
          </div>
          <div className="space-y-1">
             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Database Sync</div>
             <div className="text-4xl font-black">LIVE</div>
          </div>
          <div className="space-y-1">
             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Curation Multiplier</div>
             <div className="text-4xl font-black flex items-center justify-center sm:justify-start gap-2">
               x10
               <Sparkles className="text-amber-400" size={24} />
             </div>
          </div>
          <div className="space-y-1">
             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Integrity Level</div>
             <div className="text-4xl font-black">ENCRYPTED</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ActivityIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
