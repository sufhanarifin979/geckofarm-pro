import React, { useMemo } from 'react';
import { Gecko } from '../types';
import { motion } from 'motion/react';
import { Camera, Sparkles, User as UserIcon } from 'lucide-react';

interface LineageChartProps {
  subject: Gecko;
  allGeckos: Gecko[];
  onSelectGecko?: (gecko: Gecko) => void;
}

const GENETIC_TRAITS = [
  { name: 'Tremper', color: 'bg-orange-400' },
  { name: 'Bell', color: 'bg-red-400' },
  { name: 'Rainwater', color: 'bg-yellow-400' },
  { name: 'Eclipse', color: 'bg-slate-900' },
  { name: 'Mack Snow', color: 'bg-slate-300' },
  { name: 'Enigma', color: 'bg-purple-400' },
  { name: 'Black Night', color: 'bg-slate-950' },
  { name: 'Pied', color: 'bg-white border-slate-200' },
];

export default function LineageChart({ subject, allGeckos, onSelectGecko }: LineageChartProps) {
  // Resolve parents and grandparents
  const sire = allGeckos.find(g => g.id === subject.sireId);
  const dam = allGeckos.find(g => g.id === subject.damId);

  const sireOfSire = sire ? allGeckos.find(g => g.id === sire.sireId) : null;
  const damOfSire = sire ? allGeckos.find(g => g.id === sire.damId) : null;
  const sireOfDam = dam ? allGeckos.find(g => g.id === dam.sireId) : null;
  const damOfDam = dam ? allGeckos.find(g => g.id === dam.damId) : null;

  const renderNode = (gecko: Gecko | null, manualName: string | null, label: string, isSubject = false) => {
    const name = gecko?.name || manualName || 'Unknown';
    const photo = gecko?.photoUrl;
    const morph = gecko?.morph || '';
    
    const detectedTraits = GENETIC_TRAITS.filter(t => morph.toLowerCase().includes(t.name.toLowerCase()));

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center group relative ${isSubject ? 'z-20' : 'z-10'}`}
      >
        <div 
          onClick={() => gecko && onSelectGecko?.(gecko)}
          className={`
            relative transition-all duration-500 ease-out
            ${isSubject ? 'w-24 h-24 rounded-[2.5rem] border-[6px] border-emerald-500 shadow-2xl shadow-emerald-200/50' : 'w-16 h-16 rounded-2xl border-2 border-slate-100 shadow-sm'}
            ${gecko ? 'cursor-pointer hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1' : 'cursor-default opacity-80'}
            bg-white overflow-hidden
          `}
        >
          {photo ? (
            <img src={photo} alt={name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isSubject ? 'text-emerald-100' : 'text-slate-100'}`}>
              {isSubject ? <Sparkles size={32} /> : <UserIcon size={24} />}
            </div>
          )}
          
          {/* Genetic Trait Dots */}
          <div className="absolute top-1 right-1 flex flex-col gap-0.5">
            {detectedTraits.map((t, idx) => (
              <div 
                key={idx} 
                title={t.name}
                className={`w-1.5 h-1.5 rounded-full border-[0.5px] border-white shadow-sm ${t.color}`} 
              />
            ))}
          </div>

          {/* Gender Indicator Line */}
          {gecko && (
            <div className={`absolute bottom-0 inset-x-0 h-1.5 ${
              gecko.gender === 'male' ? 'bg-blue-500' : 
              gecko.gender === 'female' ? 'bg-rose-500' : 'bg-slate-400'
            }`} />
          )}
        </div>

        <div className={`mt-3 text-center transition-all ${isSubject ? 'max-w-[140px]' : 'max-w-[100px]'}`}>
          <div className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${
            label.includes('Sire') ? 'text-blue-500/80' : label.includes('Dam') ? 'text-rose-500/80' : 'text-emerald-500'
          }`}>
            {label}
          </div>
          <div className={`font-black text-slate-800 truncate uppercase tracking-tight leading-tight ${isSubject ? 'text-sm' : 'text-[10px]'}`}>
            {name}
          </div>
          {morph && (
            <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
              {morph.split(/[\s,+/]+/).slice(0, 3).map((m, i) => (
                <span key={i} className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-1 rounded">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full relative py-8 select-none">
      {/* SVG Connections Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minHeight: '400px' }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
          </linearGradient>
          <marker id="dot" markerWidth="4" markerHeight="4" refX="2" refY="2">
            <circle cx="2" cy="2" r="1.5" fill="#e2e8f0" />
          </marker>
        </defs>

        {/* Grandparents to Parents */}
        <GenerationLines topY={60} bottomY={160} width={100} />
        
        {/* Parents to Subject */}
        <GenerationLines topY={200} bottomY={320} width={50} isLast />
      </svg>

      {/* Tiers Container */}
      <div className="flex flex-col gap-16 relative">
        {/* Tier 1: Grandparents */}
        <div className="grid grid-cols-4 gap-2 px-2">
          {renderNode(sireOfSire, sire?.sireName || null, 'Sire Line')}
          {renderNode(damOfSire, sire?.damName || null, 'Dam Line')}
          {renderNode(sireOfDam, dam?.sireName || null, 'Sire Line')}
          {renderNode(damOfDam, dam?.damName || null, 'Dam Line')}
        </div>

        {/* Tier 2: Parents */}
        <div className="grid grid-cols-2 gap-12 px-8">
          {renderNode(sire, subject.sireName, 'Sire (Father)')}
          {renderNode(dam, subject.damName, 'Dam (Mother)')}
        </div>

        {/* Tier 3: Subject */}
        <div className="flex justify-center">
          {renderNode(subject, null, 'Subject', true)}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-12 pt-6 border-t border-slate-50 flex flex-wrap justify-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-100" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sire Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-100" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dam Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-100" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</span>
        </div>
        
        <div className="w-full sm:w-[1px] h-[1px] sm:h-3 bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Trait Indicators:</span>
          <div className="flex gap-2">
             {GENETIC_TRAITS.slice(0, 8).map((t, idx) => (
               <div key={idx} className="group relative flex items-center">
                 <div className={`w-2.5 h-2.5 rounded-full border-[0.5px] border-slate-200 shadow-sm cursor-help ${t.color}`} />
                 <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                   {t.name}
                 </span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerationLines({ topY, bottomY, width, isLast = false }: { topY: number; bottomY: number; width: number; isLast?: boolean }) {
  // width is % of parent container
  const leftX = 50 - width / 4;
  const rightX = 50 + width / 4;
  const midX = 50;

  if (isLast) {
    // Two nodes to one
    return (
      <>
        {/* Sire connection */}
        <path 
          d={`M ${25}% ${topY} C ${25}% ${(topY + bottomY) / 2}, ${50}% ${(topY + bottomY) / 2}, ${50}% ${bottomY}`}
          fill="none" 
          stroke="url(#lineGrad)" 
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Dam connection */}
        <path 
          d={`M ${75}% ${topY} C ${75}% ${(topY + bottomY) / 2}, ${50}% ${(topY + bottomY) / 2}, ${50}% ${bottomY}`}
          fill="none" 
          stroke="url(#lineGrad)" 
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    );
  }

  // Four nodes to two
  return (
    <>
      {/* Sire's Side */}
      <path 
        d={`M ${12.5}% ${topY} C ${12.5}% ${(topY + bottomY) / 2}, ${25}% ${(topY + bottomY) / 2}, ${25}% ${bottomY}`}
        fill="none" 
        stroke="#f1f5f9" 
        strokeWidth="1.5"
      />
      <path 
        d={`M ${37.5}% ${topY} C ${37.5}% ${(topY + bottomY) / 2}, ${25}% ${(topY + bottomY) / 2}, ${25}% ${bottomY}`}
        fill="none" 
        stroke="#f1f5f9" 
        strokeWidth="1.5"
      />

      {/* Dam's Side */}
      <path 
        d={`M ${62.5}% ${topY} C ${62.5}% ${(topY + bottomY) / 2}, ${75}% ${(topY + bottomY) / 2}, ${75}% ${bottomY}`}
        fill="none" 
        stroke="#f1f5f9" 
        strokeWidth="1.5"
      />
      <path 
        d={`M ${87.5}% ${topY} C ${87.5}% ${(topY + bottomY) / 2}, ${75}% ${(topY + bottomY) / 2}, ${75}% ${bottomY}`}
        fill="none" 
        stroke="#f1f5f9" 
        strokeWidth="1.5"
      />
    </>
  );
}
