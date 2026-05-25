import React from 'react';
import { Morph } from '../../types';
import { motion } from 'motion/react';
import { ChevronRight, Zap, Info } from 'lucide-react';

interface MorphCardProps {
  key?: string;
  morph: Morph;
  onSelect: (id: string) => void;
  index: number;
}

export default function MorphCard({ morph, onSelect, index }: MorphCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onSelect(morph.id!)}
      className="group bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
    >
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:rotate-12 transition-all">
        <Zap size={140} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1.5">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] ${
              morph.genetic_type === 'dominant' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              morph.genetic_type === 'recessive' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' :
              'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {morph.genetic_type === 'dominant' ? 'Dominan' : 
               morph.genetic_type === 'recessive' ? 'Resesif' : 'Poligenik'}
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors leading-tight">
              {morph.name}
            </h3>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
            <ChevronRight size={18} />
          </div>
        </div>

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-3 mb-8 leading-relaxed">
          {morph.description}
        </p>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex -space-x-1.5">
               {morph.traits?.slice(0, 3).map((t, i) => (
                 <div 
                   key={`tr-${t}-${i}`}
                   className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[7px] font-black uppercase text-slate-500 dark:text-slate-400 shadow-sm"
                   title={t}
                 >
                    {t[0]}
                 </div>
               ))}
             </div>
             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
               {morph.traits?.length} Karakteristik
             </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-0.5">Estimasi Harga</span>
            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/5 px-2 py-0.5 rounded-md">
              {morph.price_range}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
