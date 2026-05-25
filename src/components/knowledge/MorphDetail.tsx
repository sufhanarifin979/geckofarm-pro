import React from 'react';
import { 
  Dna, 
  ExternalLink, 
  Info,
  GitBranch,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Trophy,
  Zap,
  ArrowLeft,
  User,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'motion/react';

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
}

interface MorphDetailProps {
  morph: MorphEntry;
  onBack: () => void;
}

export default function MorphDetail({ morph, onBack }: MorphDetailProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] dark:opacity-[0.05] -rotate-12 translate-x-1/4 -translate-y-1/4">
            <Dna size={400} />
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                morph.inheritance_type === 'Dominant' ? 'bg-amber-100 text-amber-600 border-amber-200' : 
                morph.inheritance_type === 'Recessive' ? 'bg-blue-100 text-blue-600 border-blue-200' : 
                'bg-emerald-100 text-emerald-600 border-emerald-200'
              }`}>
                {morph.inheritance_type}
              </span>
              <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-800 flex items-center gap-2">
                <Zap size={14} className="text-emerald-400" />
                {morph.category}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                morph.rarity === 'Legendary' || morph.rarity === 'Holy Grail' ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                {morph.rarity}
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-8">
              {morph.name}
            </h2>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-8 whitespace-pre-wrap">
                {morph.description}
              </p>

              {morph.selection_priority && morph.selection_priority.length > 0 && (
                <div className="mb-8 p-8 bg-slate-950 rounded-[2rem] border border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Trophy size={80} className="text-emerald-500" />
                  </div>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Trophy size={14} />
                    Visual Selection & Grading Guide
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {morph.selection_priority.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                        <span className="text-xs font-bold text-slate-200 leading-tight uppercase tracking-tight">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {morph.breeder_notes && (
                <div className="mb-8">
                   <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <ShieldCheck size={14} />
                     Breeder Research Insights
                   </h4>
                   <div className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-500/5 p-6 rounded-3xl border-l-4 border-emerald-500 leading-relaxed italic">
                     {morph.breeder_notes}
                   </div>
                </div>
              )}
            </div>

            {morph.warnings && (
              <div className="p-6 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-3xl mb-10">
                <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <ShieldAlert size={16} />
                   Genetic Concerns / Warnings
                </h4>
                <p className="text-sm font-bold text-rose-600/80 leading-relaxed">
                   {morph.warnings}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 border-t border-slate-100 dark:border-slate-800">
               <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Genetic Formula</div>
                  <div className="text-lg font-mono font-black text-slate-900 dark:text-white">{morph.genetics || 'Unknown'}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Slug Reference</div>
                  <div className="text-lg font-mono font-black text-slate-400 dark:text-slate-600">{morph.slug}</div>
               </div>
            </div>
          </div>
        </div>

        {/* Citations & Breeders */}
        <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-slate-800">
          <div className="relative z-10 space-y-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-4">
                <span className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <User size={24} className="text-white" />
                </span>
                Credited Discoverers
              </h3>
              <div className="flex flex-wrap gap-2">
                {morph.credited_breeders?.length ? morph.credited_breeders.map((breeder, i) => (
                  <span key={i} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-emerald-400 tracking-widest uppercase">
                    {breeder}
                  </span>
                )) : (
                  <span className="text-slate-500 text-xs italic">No discoverer information currently indexed in research database.</span>
                )}
              </div>
            </div>

            {morph.reference_links?.length ? (
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-4">
                  <span className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <LinkIcon size={24} className="text-white" />
                  </span>
                  Research References
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {morph.reference_links.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between group/link transition-all"
                    >
                      <span className="text-xs font-black uppercase tracking-widest text-slate-200">{link.title}</span>
                      <ExternalLink size={16} className="text-slate-500 group-hover/link:text-indigo-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        <button 
          onClick={onBack}
          className="w-full py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3"
        >
          <ArrowLeft size={18} />
          Back to Archives
        </button>

        <div className="aspect-[4/5] bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] overflow-hidden group relative flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-xl">
            {morph.image_url ? (
                <img 
                  src={morph.image_url} 
                  alt={morph.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
            ) : (
                <div className="text-center p-8">
                    <Dna size={64} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Visual Record Pending</p>
                </div>
            )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Genetic Signatures</h4>
            <div className="flex flex-wrap gap-2">
              {morph.visual_traits?.length ? morph.visual_traits.map((t, i) => (
                <span key={i} className="text-[9px] font-black px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 rounded-xl uppercase tracking-tighter">{t}</span>
              )) : <span className="text-[9px] font-black text-slate-300 uppercase italic">Awaiting profile...</span>}
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Combo Potential</h4>
            <div className="flex flex-wrap gap-2">
              {morph.combo_compatibility?.length ? morph.combo_compatibility.map((c, i) => (
                <span key={i} className="text-[9px] font-black px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 rounded-xl uppercase tracking-tighter">{c}</span>
              )) : <span className="text-[9px] font-black text-slate-300 uppercase italic">Awaiting tests...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
