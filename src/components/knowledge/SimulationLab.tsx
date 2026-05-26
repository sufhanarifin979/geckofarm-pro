import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FlaskConical, 
  ChevronRight, 
  Zap, 
  Trash2, 
  Info,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Dna,
  Eye,
  Activity,
  Share2,
  Lock,
  ArrowUpCircle,
  Target
} from 'lucide-react';
import { 
  CORE_GENES, 
  VISUAL_TRAITS, 
  PATTERN_TRAITS,
  SPECIAL_GENES,
  calculatePairing, 
  GeneticState, 
  PredictionResult,
  GeneDefinition,
  ALL_GENES,
  TraitDefinition
} from './geneticsEngine';
import { UserProfile } from '../../types';
import PremiumModal from '../PremiumModal';

export interface ParentState {
  id: string;
  label: string;
  visual: string[];
  hets: string[];
  visualTraits: string[];
  patternTraits: string[];
  traitLevels: Record<string, 'Low' | 'Medium' | 'High' | 'Extreme'>;
}

export default function SimulationLab({ profile }: { profile: UserProfile | null }) {
  const [parentSire, setParentSire] = useState<ParentState>({ 
    id: 'sire', 
    label: 'SIRE PARENT', 
    visual: [], 
    hets: [], 
    visualTraits: [], 
    patternTraits: [],
    traitLevels: {}
  });
  const [parentDam, setParentDam] = useState<ParentState>({ 
    id: 'dam', 
    label: 'DAM PARENT', 
    visual: [], 
    hets: [], 
    visualTraits: [], 
    patternTraits: [],
    traitLevels: {}
  });
  const [activeParent, setActiveParent] = useState<'sire' | 'dam' | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const isPremium = profile?.subscription === 'premium' || profile?.email === 'sufhan.arifin979@gmail.com';

  const results = useMemo(() => {
    if (!showResults) return [];
    try {
      return calculatePairing(parentSire, parentDam);
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Gagal menghitung genetika. Silakan reset dan coba lagi.');
      return [];
    }
  }, [parentSire, parentDam, showResults]);

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <div className="bg-slate-900 rounded-[3rem] p-12 text-center border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Decorative background DNA */}
          <div className="absolute top-0 right-0 p-8 text-emerald-500/5 -translate-y-1/4 translate-x-1/4">
            <Dna size={300} strokeWidth={1} />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
              <Lock size={40} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tight">Genetic Lab Locked</h2>
              <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                Fitur simulasi genetika tingkat lanjut hanya tersedia untuk akun Premium. Buka akses sekarang untuk simulasi tanpa batas.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setIsPremiumModalOpen(true)}
                className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3"
              >
                <ArrowUpCircle size={18} />
                Upgrade to Premium
              </button>
            </div>

            <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800">
              <div className="space-y-1">
                   <div className="text-emerald-600 font-black text-xs">UNLIMITED</div>
                   <div className="text-[8px] text-slate-400 uppercase tracking-widest">Simulations</div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-emerald-600 font-black text-xs">ADVANCED</div>
                   <div className="text-[8px] text-slate-400 uppercase tracking-widest">Combo Intelligence</div>
                 </div>
                 <div className="hidden sm:block space-y-1">
                   <div className="text-emerald-600 font-black text-xs">BREEDER</div>
                   <div className="text-[8px] text-slate-400 uppercase tracking-widest">Grade Reports</div>
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

  const handleCalculate = () => {
    setIsCalculating(true);
    setError(null);
    // Simulate complex calculation for UX
    setTimeout(() => {
      setShowResults(true);
      setIsCalculating(false);
    }, 800);
  };

  const toggleGene = (parentId: 'sire' | 'dam', geneId: string, action: 'visual' | 'hets' | 'super' | 'pos-het') => {
    const setter = parentId === 'sire' ? setParentSire : setParentDam;
    setter(prev => {
      const newState = { ...prev };
      const gene = ALL_GENES[geneId];
      if (!gene) return prev;

      const wasInVisual = newState.visual.includes(geneId);
      const wasInHets = newState.hets.includes(geneId);

      if (action === 'visual') {
        if (gene.type === 'recessive') {
          // Visual Recessive = 2 copies
          if (wasInVisual) newState.visual = newState.visual.filter(id => id !== geneId);
          else {
            newState.visual = [...newState.visual.filter(id => id !== geneId), geneId];
            newState.hets = newState.hets.filter(id => id !== geneId);
          }
        } else {
          // Visual Dominant/Codominant = 1 copy
          if (wasInHets) newState.hets = newState.hets.filter(id => id !== geneId);
          else {
            newState.hets = [geneId, ...newState.hets.filter(id => id !== geneId)];
            newState.visual = newState.visual.filter(id => id !== geneId);
          }
        }
      } else if (action === 'super') {
        // Super = 2 copies
        if (wasInVisual) newState.visual = newState.visual.filter(id => id !== geneId);
        else {
          newState.visual = [geneId, ...newState.visual.filter(id => id !== geneId)];
          newState.hets = newState.hets.filter(id => id !== geneId);
        }
      } else if (action === 'hets') {
        // Het = 1 copy
        if (wasInHets) newState.hets = newState.hets.filter(id => id !== geneId);
        else {
          newState.hets = [geneId, ...newState.hets.filter(id => id !== geneId)];
          newState.visual = newState.visual.filter(id => id !== geneId);
        }
      }

      // Albino Exclusivity Logic
      if (gene.group === 'albino') {
        newState.visual = newState.visual.filter(id => id === geneId || ALL_GENES[id]?.group !== 'albino');
        newState.hets = newState.hets.filter(id => id === geneId || ALL_GENES[id]?.group !== 'albino');
      }

      return newState;
    });
  };

  const setTraitLevel = (parentId: 'sire' | 'dam', traitId: string, level: 'Low' | 'Medium' | 'High' | 'Extreme', category: 'traits' | 'patterns') => {
    const setter = parentId === 'sire' ? setParentSire : setParentDam;
    setter(prev => {
      const newState = { ...prev };
      const listField = category === 'traits' ? 'visualTraits' : 'patternTraits';
      
      if (newState.traitLevels[traitId] === level) {
         const newLevels = { ...newState.traitLevels };
         delete newLevels[traitId];
         newState.traitLevels = newLevels;
         newState[listField] = newState[listField].filter(id => id !== traitId);
      } else {
         newState.traitLevels = { ...newState.traitLevels, [traitId]: level };
         if (!newState[listField].includes(traitId)) {
           newState[listField] = [...newState[listField], traitId];
         }
      }
      return newState;
    });
  };

  const handleShare = async () => {
    const formatParent = (p: ParentState) => {
      const v = p.visual.map(id => ALL_GENES[id]?.name).join(', ') || 'None';
      const h = p.hets.map(id => `Het ${ALL_GENES[id]?.name}`).join(', ') || 'None';
      return `Visual: ${v}, Hets: ${h}`;
    };
    const text = `Breeding Prediction: ${formatParent(parentSire)} x ${formatParent(parentDam)}\nCheck out these results on Geckofarm Pro!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gecko Genetics Prediction',
          text,
          url: window.location.href,
        });
      } catch (err: any) {
        // Silently handle cancellation
        if (err.name !== 'AbortError' && err.message !== 'Share canceled') {
          console.error('Share failed:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Prediction results copied to clipboard!');
    }
  };

  const reset = () => {
    const defaultState: ParentState = { 
      id: '', 
      label: '', 
      visual: [], 
      hets: [], 
      visualTraits: [], 
      patternTraits: [],
      traitLevels: {}
    };
    setParentSire({ ...defaultState, id: 'sire', label: 'SIRE PARENT' });
    setParentDam({ ...defaultState, id: 'dam', label: 'DAM PARENT' });
    setShowResults(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Simulation Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl mb-2">
          <FlaskConical size={32} />
        </div>
              <h3 className="text-3xl font-black text-black dark:text-black uppercase tracking-tight">Lab Simulasi Genetik</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">
          Kecerdasan Tingkat Breeder Lanjut. Prediksi hasil, kenali kombo secara otomatis, dan identifikasi risiko kesehatan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Sire (Male) Selector */}
        <ParentSelector 
          state={parentSire} 
          onSelect={() => setActiveParent('sire')}
          isActive={activeParent === 'sire'}
        />

        {/* Dam (Female) Selector */}
        <ParentSelector 
          state={parentDam} 
          onSelect={() => setActiveParent('dam')}
          isActive={activeParent === 'dam'}
        />
      </div>

      {/* Selection Modal / Sidebar Overlay */}
      <AnimatePresence>
        {activeParent && (
          <SelectionOverlay 
            parent={activeParent === 'sire' ? parentSire : parentDam}
            onClose={() => setActiveParent(null)}
            onToggle={(geneId, action) => toggleGene(activeParent, geneId, action)}
            onLevelSet={(traitId, level, category) => setTraitLevel(activeParent, traitId, level, category)}
          />
        )}
      </AnimatePresence>

      {/* Action Button */}
      {!showResults && (
        <div className="flex justify-center">
          <button 
            onClick={handleCalculate}
            disabled={isCalculating}
            className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-3"
          >
            {isCalculating ? (
              <>
                <Activity size={18} className="animate-spin" />
                Menganalisis Genetika...
              </>
            ) : (
              <>
                Jalankan Prediksi Genetik
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2.5rem] flex items-center gap-4 text-rose-500 max-w-lg mx-auto">
          <AlertTriangle size={24} />
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
          <button onClick={reset} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Fix</button>
        </div>
      )}

      {/* Result Section */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <Sparkles size={20} className="text-emerald-500 font-bold" />
                Prediksi Hasil Anakan
              </h3>
              <div className="flex items-center gap-4">
                 <button 
                  onClick={handleShare}
                  className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <Share2 size={18} />
                </button>
                 <button 
                  onClick={reset}
                  className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full"
                >
                  Reset Lab
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((result, i) => (
                <ResultCard key={i} result={result} />
              ))}
            </div>

            {/* Breeder Insights Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex items-center gap-6 md:col-span-2">
                <div className="p-4 bg-emerald-600 rounded-2xl">
                  <TrendingDown size={24} />
                </div>
                <div className="space-y-1">
                  <h6 className="text-sm font-black uppercase tracking-widest text-emerald-400">Wawasan Breeder</h6>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Simulasi ini menangani pewarisan multi-lokus. Sifat line-bred (Tangerine, Black Night, dll.) dihitung berdasarkan kemungkinan ekspresivitas daripada probabilitas Mendelian sederhana.
                  </p>
                </div>
              </div>
              <div className="p-6 bg-amber-600/10 border-2 border-amber-600/20 rounded-[2.5rem] flex items-center gap-6">
                 <AlertTriangle size={24} className="text-amber-600 shrink-0" />
                 <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-tight uppercase tracking-wide">
                   Het dihitung sebagai 100%, 66%, atau 50% possible berdasarkan genotip parental.
                 </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ParentSelector({ state, onSelect, isActive }: { state: ParentState; onSelect: () => void; isActive: boolean }) {
  const allGenes = [...state.visual, ...state.hets, ...state.visualTraits, ...state.patternTraits];
  
  return (
    <div 
      className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer group relative overflow-hidden backdrop-blur-sm ${
        isActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 ring-4 ring-emerald-500/10' : 
        'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-500/50'
      }`}
      onClick={onSelect}
    >
      <div className="absolute top-0 right-0 p-8 text-slate-200 dark:text-slate-800/50 -translate-y-1/4 translate-x-1/4">
        {state.id === 'sire' ? <Zap size={140} strokeWidth={2} /> : <Dna size={140} strokeWidth={2} />}
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
             <span className="text-[10px] font-black text-black dark:text-black uppercase tracking-[0.2em]">{state.label}</span>
             <h4 
               className="text-2xl font-black uppercase text-black dark:text-black"
             >
               {state.id === 'sire' ? 'INDUKAN JANTAN' : 'INDUKAN BETINA'}
             </h4>
           </div>
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
             allGenes.length > 0 ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
           }`}>
             {state.id === 'sire' ? <Zap size={24} /> : <Dna size={24} />}
           </div>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
          {allGenes.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl opacity-50">
               <Sparkles size={20} className="text-slate-400 mb-2" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Genetics</span>
            </div>
          ) : (
            <>
              {state.visual.map(id => (
                <span key={id} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                  {id.startsWith('super-') ? id.replace('super-', 'Super ').replace('-', ' ') : (ALL_GENES[id]?.name || id)}
                </span>
              ))}
              {state.hets.map(id => (
                <span key={id} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800">
                  {ALL_GENES[id]?.type === 'recessive' ? `Het ${ALL_GENES[id]?.name}` : ALL_GENES[id]?.name}
                </span>
              ))}
              {state.patternTraits.map(id => (
                <span key={id} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                  {PATTERN_TRAITS[id]?.name} {state.traitLevels[id] && `[${state.traitLevels[id]}]`}
                </span>
              ))}
              {state.visualTraits.map(id => (
                <span key={id} className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                  {VISUAL_TRAITS[id]?.name} {state.traitLevels[id] && `[${state.traitLevels[id]}]`}
                </span>
              ))}
            </>
          )}
        </div>

        <div className="pt-4 flex items-center justify-between">
           <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
             <Activity size={14} className="text-emerald-500" />
             {allGenes.length} Trait Aktif
           </div>
           <div className="p-2 bg-emerald-500 rounded-full text-white">
             <ChevronRight size={16} />
           </div>
        </div>
      </div>
    </div>
  );
}

function SelectionOverlay({ parent, onClose, onToggle, onLevelSet }: { 
  parent: ParentState; 
  onClose: () => void; 
  onToggle: (id: string, action: 'visual' | 'hets' | 'super' | 'pos-het') => void;
  onLevelSet: (id: string, level: 'Low' | 'Medium' | 'High' | 'Extreme', category: 'traits' | 'patterns') => void;
}) {
  const renderGeneControls = (gene: GeneDefinition) => {
    switch (gene.type) {
      case 'recessive':
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => onToggle(gene.id, 'visual')}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                parent.visual.includes(gene.id) ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-950 text-slate-400'
              }`}
            >
              Visual
            </button>
            <button 
              onClick={() => onToggle(gene.id, 'hets')}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                parent.hets.includes(gene.id) ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-950 text-slate-400'
              }`}
            >
              Het
            </button>
          </div>
        );
      case 'dominant':
        return (
          <div className="space-y-2">
            {gene.warning && (
              <div className="flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl gap-3">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                <p className="text-[8px] font-bold text-amber-600 dark:text-amber-400 leading-tight uppercase">{gene.warning}</p>
              </div>
            )}
            <button 
              onClick={() => onToggle(gene.id, 'visual')}
              className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                parent.visual.includes(gene.id) || parent.hets.includes(gene.id) ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-950 text-slate-400'
              }`}
            >
              Present
            </button>
          </div>
        );
      case 'codominant':
        return (
          <div className="space-y-2">
            {gene.warning && (
              <div className="flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl gap-3">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                <p className="text-[8px] font-bold text-amber-600 dark:text-amber-400 leading-tight uppercase">{gene.warning}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onToggle(gene.id, 'visual')}
                className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  parent.hets.includes(gene.id) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-slate-950 text-slate-400'
                }`}
              >
                Visual
              </button>
              {gene.super_form && (
                <button 
                  onClick={() => onToggle(gene.id, 'super')}
                  className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    parent.visual.includes(gene.id) ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-800/20' : 'bg-white dark:bg-slate-950 text-slate-400'
                  }`}
                >
                  Super
                </button>
              )}
            </div>
          </div>
        );
      case 'controversial':
      case 'special':
        return (
          <div className="space-y-2">
            <div className="flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl gap-3">
               <AlertTriangle size={14} className="text-amber-500 shrink-0" />
               <p className="text-[8px] font-bold text-amber-600 dark:text-amber-400 leading-tight uppercase">{gene.warning}</p>
            </div>
            <button 
              onClick={() => onToggle(gene.id, 'visual')}
              className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                parent.visual.includes(gene.id) || parent.hets.includes(gene.id) ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-950 text-slate-400'
              }`}
            >
              Visual / Present
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTraitControls = (id: string, trait: TraitDefinition, category: 'traits' | 'patterns') => {
    const levels: ('Low' | 'Medium' | 'High' | 'Extreme')[] = ['Low', 'Medium', 'High', 'Extreme'];
    const currentLevel = parent.traitLevels[id];

    return (
      <div key={id} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{trait.name}</span>
        <div className="grid grid-cols-4 gap-1">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => onLevelSet(id, level, category)}
              className={`py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all ${
                currentLevel === level ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-xl bg-slate-950/60"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Set Genetics: {parent.id}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Classification: Adaptive Genetic Analysis</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {/* 1. CORE GENETICS */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                <Dna size={20} />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">1. CORE GENETICS</h4>
            </div>

            <div className="space-y-10 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
              {/* Recessive */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h5 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">RECESSIVE (Visual / Het)</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['tremper-albino', 'bell-albino', 'rainwater-albino', 'eclipse', 'blizzard', 'murphy-patternless'].map(id => {
                    const gene = ALL_GENES[id];
                    if (!gene) return null;
                    return (
                      <div key={id} className={`p-5 rounded-[2rem] border-2 transition-all ${
                        parent.visual.includes(gene.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 shadow-md' : 
                        parent.hets.includes(gene.id) ? 'border-amber-500 bg-amber-50 dark:bg-slate-800/50' :
                        'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{gene.name}</span>
                {gene.group === 'albino' && <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Strain Tidak Kompatibel</span>}
              </div>
                          {gene.isSpecial && <AlertTriangle size={14} className="text-amber-500" />}
                        </div>
                        {renderGeneControls(gene)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dom/Codom Visual Only */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h5 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">DOMINANT & CO-DOMINANT (Visual Only)</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['enigma', 'lemon-frost', 'white-yellow', 'tug-snow'].map(id => {
                    const gene = ALL_GENES[id];
                    if (!gene) return null;
                    return (
                      <div key={id} className={`p-5 rounded-[2rem] border-2 transition-all ${
                        parent.visual.includes(gene.id) || parent.hets.includes(gene.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5' : 
                        'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{gene.name}</span>
                          {gene.isSpecial && <AlertTriangle size={14} className="text-amber-500" />}
                        </div>
                        {renderGeneControls(gene)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dom/Codom Visual/Super */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <h5 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">DOMINANT & CO-DOMINANT (Visual / Super)</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['mack-snow', 'giant'].map(id => {
                    const gene = ALL_GENES[id];
                    if (!gene) return null;
                    return (
                      <div key={id} className={`p-5 rounded-[2rem] border-2 transition-all ${
                        parent.visual.includes(gene.id) || parent.hets.includes(gene.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5' : 
                        'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{gene.name}</span>
                        </div>
                        {renderGeneControls(gene)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 2. PATTERN TRAITS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                <FlaskConical size={20} />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">2. PATTERN TRAITS</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['bold-stripe', 'red-stripe', 'reverse-stripe', 'patternless-stripe', 'jungle', 'aberrant', 'bandit'].map(id => {
                const trait = PATTERN_TRAITS[id] || VISUAL_TRAITS[id];
                if (!trait) return null;
                return renderTraitControls(id, trait as any, PATTERN_TRAITS[id] ? 'patterns' : 'traits');
              })}
            </div>
          </section>

          {/* 3. TANGERINE & SATURATION LINES */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
                <Zap size={20} />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">3. TANGERINE & SATURATION LINES</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {['tangerine', 'mandarin', 'sht', 'shtct', 'shtctb', 'blood', 'inferno', 'firebold', 'electric', 'atomic', 'tangerine-tornado', 'tangelo', 'sunset', 'sunspot'].map(id => {
                const trait = VISUAL_TRAITS[id];
                if (!trait) return null;
                return renderTraitControls(id, trait as any, 'traits');
              })}
            </div>
          </section>

          {/* 4. GREEN / EMERINE LINES */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                <Sparkles size={20} />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">4. GREEN / EMERINE LINES</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['emerine', 'blood-emerine', 'lime', 'neon'].map(id => {
                const trait = VISUAL_TRAITS[id];
                if (!trait) return null;
                return renderTraitControls(id, trait as any, 'traits');
              })}
            </div>
          </section>

          {/* 5. DARK / CONTRAST LINES */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20">
                <Activity size={20} />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">5. DARK / CONTRAST LINES</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['black-night', 'melanistic', 'abyssinian'].map(id => {
                const trait = VISUAL_TRAITS[id];
                if (!trait) return null;
                return renderTraitControls(id, trait as any, 'traits');
              })}
            </div>
          </section>

          {/* 6. DESIGNER / PROJECT LINES */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                <Target size={20} />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">6. DESIGNER / PROJECT LINES</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['halloween', 'rainbow-stripe'].map(id => {
                const trait = VISUAL_TRAITS[id];
                if (!trait) return null;
                return renderTraitControls(id, trait as any, 'traits');
              })}
            </div>
          </section>

          {/* 7. STRUCTURAL / VISUAL REFINEMENT */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <Eye size={20} />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">7. STRUCTURAL / VISUAL REFINEMENT</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['carrot-tail', 'baldy'].map(id => {
                const trait = VISUAL_TRAITS[id];
                if (!trait) return null;
                return renderTraitControls(id, trait as any, 'traits');
              })}
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
           <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs">Konfirmasi Pengaturan Genetik</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
function ResultCard({ result }: { result: PredictionResult }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] relative overflow-hidden group shadow-xl transition-all ${
        result.isBreedingTarget ? 'ring-2 ring-emerald-500/50' : ''
      }`}
    >
      <div className="p-8 space-y-8">
        {/* HEADER: Identity and Probability Metrics */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <section className="space-y-4 flex-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                  result.rarity === 'Holy Grail' ? 'bg-indigo-500 text-white' :
                  result.rarity === 'Legendary' ? 'bg-amber-500 text-white' :
                  result.rarity === 'Rare' ? 'bg-emerald-500 text-white' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {result.rarity}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                  result.projectLevel === 'Professional' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' :
                  result.projectLevel === 'Advanced' ? 'border border-slate-900 dark:border-white text-slate-900 dark:text-white' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  Project {result.projectLevel}
                </span>
              </div>
              <h5 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-tight group-hover:text-emerald-500 transition-colors">
                {result.primaryName}
              </h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identitas Fenotipe Utama</p>
            </div>
  
            {/* TRAIT PROFILE CHIPS */}
            <div className="flex flex-wrap gap-1.5">
              {result.traitProfile.map((trait, idx) => (
                <span key={idx} className="text-[8px] font-black px-2 py-1 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase rounded-md border border-slate-100 dark:border-slate-800">
                  {trait}
                </span>
              ))}
            </div>
          </section>

          {/* Metrics Column */}
          <div className="flex flex-col items-end gap-1 text-right shrink-0 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50">
             <div className="text-3xl font-black text-emerald-500">{result.probability}%</div>
             <div className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Prob. Pewarisan</div>
             <div className="mt-3 flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col items-end">
                   <span className="text-[6px] font-bold text-slate-400 uppercase">Konf. Visual</span>
                   <span className="text-[9px] font-black text-emerald-500/70">{result.confidenceMetrics.visualProjection}%</span>
                </div>
                <div className="w-[1px] h-4 bg-slate-100 dark:bg-slate-800" />
                <div className="flex flex-col items-end">
                   <span className="text-[6px] font-bold text-slate-400 uppercase">Akurasi Gen.</span>
                   <span className="text-[9px] font-black text-blue-500/70">{result.confidenceMetrics.geneticAccuracy}%</span>
                </div>
             </div>
          </div>
        </div>

        {/* 2. COMPREHENSIVE TRAIT BREAKDOWN */}
        <div className="grid grid-cols-2 gap-2">
           <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Genetika Visual</span>
              <div className="flex flex-wrap gap-1">
                 {result.visualGenes.map(id => (
                   <span key={id} className="text-[6px] font-black text-slate-900 dark:text-white uppercase">{ALL_GENES[id]?.name}</span>
                 ))}
                 {result.visualGenes.length === 0 && <span className="text-[6px] font-black text-slate-400 uppercase">Tidak Ada</span>}
              </div>
           </div>
           <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest block mb-1">Sifat Ekspresi</span>
              <div className="flex flex-wrap gap-1">
                 {[...result.visualTraits, ...result.patternTraits].map(id => (
                   <span key={id} className="text-[6px] font-black text-slate-900 dark:text-white uppercase">{VISUAL_TRAITS[id]?.name || PATTERN_TRAITS[id]?.name}</span>
                 ))}
                 {[...result.visualTraits, ...result.patternTraits].length === 0 && <span className="text-[6px] font-black text-slate-400 uppercase">Tidak Ada</span>}
              </div>
           </div>
        </div>

        {/* Expandable Sections */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors border-t border-slate-50 dark:border-slate-850"
        >
          {isExpanded ? 'Sembunyikan Analisis Profesional' : 'Tampilkan Analisis Genetik Lanjut'}
          <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-6 pt-4"
            >
              {/* 3. HIDDEN HET ANALYSIS */}
              <section className="space-y-3">
                 <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Dna size={12} className="text-slate-300" />
                   Profil Pembawa (Genetika Tersembunyi)
                 </h6>
                 <div className="grid grid-cols-2 gap-2">
                   {result.hets.map(id => (
                     <div key={id} className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[7px] font-black text-emerald-500 uppercase">Pembawa Terjamin</div>
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Het {ALL_GENES[id]?.name}</div>
                     </div>
                   ))}
                   {result.posHets?.map(ph => (
                     <div key={ph.geneId} className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[7px] font-black text-amber-500 uppercase">Spekulatif ({ph.prob}%)</div>
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Poss Het {ALL_GENES[ph.geneId]?.name}</div>
                     </div>
                   ))}
                   {result.hets.length === 0 && (result.posHets?.length || 0) === 0 && (
                     <div className="col-span-2 py-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl opacity-30">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Data Pembawa Tidak Ditemukan</span>
                     </div>
                   )}
                 </div>
              </section>

              {/* 4. PERFORMANCE METRICS */}
              <section className="space-y-3">
                 <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} className="text-slate-300" />
                    Intelijen Pasar & Pembiakan
                 </h6>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <div className="text-[8px] font-black text-slate-400 uppercase">Nilai Project</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: `${result.breedingValue}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500">{result.breedingValue}</span>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[8px] font-black text-slate-400 uppercase">Kesulitan</div>
                      <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{result.projectDifficulty}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[8px] font-black text-slate-400 uppercase">Permintaan Global</div>
                      <div className="text-[10px] font-black text-amber-500 uppercase">{result.breederDemand}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[8px] font-black text-slate-400 uppercase">Daya Tarik Breeder</div>
                      <div className="text-[10px] font-black text-indigo-500 uppercase">{result.desirability}%</div>
                   </div>
                 </div>
              </section>

              {/* 5. VISUAL STYLE PREDICTION OVERLAY */}
              {result.visualPrediction && (
                <section className="p-5 bg-slate-900 rounded-[2rem] space-y-4 border border-slate-800 shadow-inner">
                   <div className="flex items-center justify-between">
                      <h6 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Proyeksi Gaya Visual</h6>
                      <Sparkles size={14} className="text-emerald-400/50" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <span className="text-[7px] font-black text-slate-500 uppercase">Profil Kontras</span>
                         <p className="text-[10px] font-bold text-slate-200">{result.visualPrediction.contrast}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] font-black text-slate-500 uppercase">Intensitas Saturasi</span>
                         <p className="text-[10px] font-bold text-slate-200">{result.visualPrediction.saturation}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] font-black text-slate-500 uppercase">Kecenderungan Pola</span>
                         <p className="text-[10px] font-bold text-slate-200">{result.visualPrediction.pattern}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] font-black text-slate-500 uppercase">Pengaruh Melanistik</span>
                         <p className="text-[10px] font-bold text-slate-200">{result.visualPrediction.melanistic}</p>
                      </div>
                      <div className="space-y-1 col-span-2 pt-2 border-t border-slate-800">
                         <span className="text-[7px] font-black text-slate-500 uppercase">Proyeksi Okular (Mata)</span>
                         <p className="text-[10px] font-bold text-emerald-400">{result.visualPrediction.eyeAppearance}</p>
                      </div>
                   </div>
                </section>
              )}

              {/* 6. BREEDING ARCHITECTURE INSIGHT */}
              {result.breederInsight && (
                <section className="p-5 bg-emerald-500/5 rounded-[2rem] space-y-2 border border-emerald-500/10">
                   <div className="flex items-center gap-2 text-emerald-500">
                     <FlaskConical size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Wawasan Kecerdasan Breeder AI</span>
                   </div>
                   <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                     "{result.breederInsight}"
                   </p>
                </section>
              )}

              {/* 7. TARGET PROJECTS */}
              {result.futureProjects && result.futureProjects.length > 0 && (
                <section className="space-y-3">
                   <div className="flex items-center gap-2 text-indigo-500">
                     <TrendingDown size={14} className="rotate-180" />
                     <h6 className="text-[9px] font-black uppercase tracking-widest">Potensi Ekspansi Silsilah</h6>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {result.futureProjects.map(p => (
                       <span key={p} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                         Project {p}
                       </span>
                     ))}
                   </div>
                </section>
              )}

              {/* 8. GENETIC SECURITY PROTOCOL */}
              {result.isWarning && (
                <section className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-500">
                  <AlertTriangle size={18} className="shrink-0" />
                  <div className="space-y-1">
                     <span className="text-[9px] font-black uppercase tracking-widest">Peringatan Protokol Keamanan</span>
                     <p className="text-[10px] font-bold leading-tight uppercase">{result.warningMessage}</p>
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

