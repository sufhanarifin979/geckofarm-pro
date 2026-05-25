import React from 'react';
import { Morph } from '../../types';
import { motion } from 'motion/react';
import MorphCard from './MorphCard';

interface MorphListProps {
  morphs: Morph[];
  onSelect: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function MorphList({ morphs, onSelect, onLoadMore, hasMore }: MorphListProps) {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {morphs.map((morph, index) => {
          const key = morph.id ? `morph-${morph.id}` : `morph-idx-${index}`;
          return (
            <MorphCard 
              key={key} 
              morph={morph} 
              onSelect={onSelect} 
              index={index} 
            />
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={onLoadMore}
            className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm hover:shadow-xl"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}
    </div>
  );
}
