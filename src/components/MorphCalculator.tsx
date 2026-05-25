import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, 
  Dna, 
  Info, 
  RefreshCw, 
  Sparkles, 
  Wand2, 
  Loader2, 
  Microscope, 
  Lock, 
  BookOpen,
  Trash2,
  AlertTriangle,
  Zap,
  ChevronRight,
  Plus,
  ShieldAlert,
  Target,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import PremiumModal from './PremiumModal';
import { 
  VISUAL_TRAITS, 
  PATTERN_TRAITS,
  calculatePairing, 
  GeneticState, 
  PredictionResult,
  GeneDefinition,
  ALL_GENES
} from './knowledge/geneticsEngine';

// Global AI Cache
const aiResponseCache = new Map<string, string>();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between AI calls

// Restricted Gene Registry for Morph Calculator Pro
const RESTRICTED_RECESSIVE: Record<string, GeneDefinition> = {
  'tremper-albino': { id: 'tremper-albino', name: 'Tremper Albino', type: 'recessive', group: 'albino' },
  'bell-albino': { id: 'bell-albino', name: 'Bell Albino', type: 'recessive', group: 'albino' },
  'rainwater-albino': { id: 'rainwater-albino', name: 'Rainwater Albino', type: 'recessive', group: 'albino' },
  'eclipse': { id: 'eclipse', name: 'Eclipse', type: 'recessive' },
  'blizzard': { id: 'blizzard', name: 'Blizzard', type: 'recessive' },
  'murphy-patternless': { id: 'murphy-patternless', name: 'Murphy Patternless', type: 'recessive' },
};

const RESTRICTED_CODOMINANT: Record<string, GeneDefinition> = {
  'mack-snow': { id: 'mack-snow', name: 'Mack Snow', type: 'codominant', super_form: 'super-snow' },
  'giant': { id: 'giant', name: 'Giant', type: 'codominant', super_form: 'super-giant' },
};

const RESTRICTED_DOMINANT: Record<string, GeneDefinition> = {
  'tug-snow': { id: 'tug-snow', name: 'TUG Snow', type: 'dominant' },
  'white-yellow': { id: 'white-yellow', name: 'White & Yellow', type: 'dominant' },
  'enigma': { id: 'enigma', name: 'Enigma', type: 'dominant', warning: 'Enigma Syndrome Risk' },
  'lemon-frost': { id: 'lemon-frost', name: 'Lemon Frost', type: 'dominant', warning: 'Fatal Cancer Risk' },
};

const CALCULATOR_GENES = { 
  ...RESTRICTED_RECESSIVE, 
  ...RESTRICTED_CODOMINANT, 
  ...RESTRICTED_DOMINANT 
};

interface MorphCalculatorProps {
  profile: UserProfile | null;
}

export default function MorphCalculator({ profile }: MorphCalculatorProps) {
  const [sire, setSire] = useState<GeneticState>({ visual: [], hets: [], visualTraits: [], patternTraits: [], traitLevels: {} });
  const [dam, setDam] = useState<GeneticState>({ visual: [], hets: [], visualTraits: [], patternTraits: [], traitLevels: {} });
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [activeParent, setActiveParent] = useState<'sire' | 'dam' | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'prob' | 'ai' | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const aiLockRef = useRef(false);

  // Determistic Genetic Key for Caching
  const getGeneticKey = (s: GeneticState, d: GeneticState) => {
    const sKey = `s:${[...s.visual].sort().join(',')}|${[...s.hets].sort().join(',')}`;
    const dKey = `d:${[...d.visual].sort().join(',')}|${[...d.hets].sort().join(',')}`;
    return `${sKey};${dKey}`;
  };

  const calculate = () => {
    const pairingResults = calculatePairing(sire, dam);
    setResults(pairingResults);
    setIsCalculated(true);
    setActiveTab('prob');
    setRateLimitMessage(null);
  };

  const reset = () => {
    setSire({ visual: [], hets: [], visualTraits: [], patternTraits: [], traitLevels: {} });
    setDam({ visual: [], hets: [], visualTraits: [], patternTraits: [], traitLevels: {} });
    setResults([]);
    setIsCalculated(false);
    setAiAnalysis(null);
    setActiveTab(null);
  };

  const toggleGene = (parentId: 'sire' | 'dam', geneId: string, type: 'visual' | 'hets' | 'traits' | 'patterns' | 'super' | 'linebred', level?: string) => {
    const setter = parentId === 'sire' ? setSire : setDam;
    const gene = type === 'linebred' 
      ? (VISUAL_TRAITS[geneId] || PATTERN_TRAITS[geneId])
      : CALCULATOR_GENES[geneId as keyof typeof CALCULATOR_GENES];

    setter(prev => {
      const newState = { ...prev };
      
      if (type === 'linebred') {
        const isVisual = prev.visualTraits.includes(geneId);
        const isPattern = prev.patternTraits.includes(geneId);
        const currentLevel = prev.traitLevels?.[geneId];

        if (level && currentLevel === level) {
          // Toggle off
          newState.visualTraits = newState.visualTraits.filter(id => id !== geneId);
          newState.patternTraits = newState.patternTraits.filter(id => id !== geneId);
          if (newState.traitLevels) {
            const { [geneId]: _, ...rest } = newState.traitLevels;
            newState.traitLevels = rest;
          }
        } else if (level) {
          // Set level
          const isFromPattern = !!PATTERN_TRAITS[geneId];
          if (isFromPattern) {
            if (!isPattern) newState.patternTraits = [...newState.patternTraits, geneId];
          } else {
            if (!isVisual) newState.visualTraits = [...newState.visualTraits, geneId];
          }
          newState.traitLevels = { ...newState.traitLevels, [geneId]: level };
        }
        return newState;
      }
      
      // Albino Conflict Prevention - If selecting an albino, remove other albinos
      if ((gene as any)?.group === 'albino') {
        const otherAlbinos = Object.values(RESTRICTED_RECESSIVE)
          .filter(g => g.group === 'albino' && g.id !== geneId)
          .map(g => g.id);
        
        newState.visual = newState.visual.filter(id => !otherAlbinos.includes(id));
        newState.hets = newState.hets.filter(id => !otherAlbinos.includes(id));
      }

      if (type === 'visual') {
        if (gene?.type === 'recessive') {
          // Recessive Visual: 2 copies
          if (newState.visual.includes(geneId)) {
            newState.visual = newState.visual.filter(id => id !== geneId);
          } else {
            newState.visual = [...newState.visual, geneId];
            newState.hets = newState.hets.filter(id => id !== geneId);
          }
        } else if (gene?.type === 'codominant') {
          // Co-dominant "Visual" (Het form in UI terms for Mack Snow etc)
          if (newState.hets.includes(geneId)) {
            newState.hets = newState.hets.filter(id => id !== geneId);
          } else {
            newState.hets = [...newState.hets, geneId];
            newState.visual = newState.visual.filter(id => id !== geneId);
          }
        } else if (gene?.type === 'dominant') {
          // Dominant: Just one copy needed for expression
          if (newState.hets.includes(geneId)) {
            newState.hets = newState.hets.filter(id => id !== geneId);
          } else {
            newState.hets = [...newState.hets, geneId];
          }
        }
      } else if (type === 'hets') {
        // Only for recessive
        if (newState.hets.includes(geneId)) {
          newState.hets = newState.hets.filter(id => id !== geneId);
        } else {
          newState.hets = [...newState.hets, geneId];
          newState.visual = newState.visual.filter(id => id !== geneId);
        }
      } else if (type === 'super') {
        // Only for co-dominant (Homozygous)
        if (newState.visual.includes(geneId)) {
          newState.visual = newState.visual.filter(id => id !== geneId);
        } else {
          newState.visual = [...newState.visual, geneId];
          newState.hets = newState.hets.filter(id => id !== geneId);
        }
      }
      return newState;
    });
  };

  const isPremium = profile?.subscription === 'premium' || profile?.email === 'sufhan.arifin979@gmail.com';

  const analyzeWithAI = async () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }

    if (aiLockRef.current) return;
    
    const geneticKey = getGeneticKey(sire, dam);
    
    // Check Cache First
    if (aiResponseCache.has(geneticKey)) {
      setAiAnalysis(aiResponseCache.get(geneticKey)!);
      setActiveTab('ai');
      return;
    }

    // Rate Limiting Check
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      setRateLimitMessage(`Harmonizing AI... Silakan tunggu ${waitTime} detik lagi.`);
      setTimeout(() => setRateLimitMessage(null), 2000);
      return;
    }

    setIsAnalyzing(true);
    setRateLimitMessage(null);
    setAiAnalysis(null);
    aiLockRef.current = true;

    const formatParent = (p: GeneticState) => {
      const v = p.visual.map(id => ALL_GENES[id]?.name).join(', ') || 'None';
      const h = p.hets.map(id => `Het ${ALL_GENES[id]?.name}`).join(', ') || 'None';
      const t = p.visualTraits.map(id => (p.traitLevels?.[id] ? `${p.traitLevels[id]} ` : '') + (VISUAL_TRAITS[id]?.name || id)).join(', ') || 'None';
      const pt = p.patternTraits.map(id => (p.traitLevels?.[id] ? `${p.traitLevels[id]} ` : '') + (PATTERN_TRAITS[id]?.name || id)).join(', ') || 'None';
      return `Visual: ${v}, Hets: ${h}, Traits: ${t}, Patterns: ${pt}`;
    };

    const resultsContext = results.length > 0 
      ? `Hasil perhitungan probabilitas Mendelian:\n${results.slice(0, 5).map(r => `- ${r.name}: ${r.probability}% (Rarity: ${r.rarity})`).join('\n')}\n${results.length > 5 ? '...dan lainnya.' : ''}`
      : 'Belum ada hasil kalkulasi spesifik.';

    const prompt = `Analisis Breeder Report untuk Leopard Gecko:
Parent 1: ${formatParent(sire)}
Parent 2: ${formatParent(dam)}
Probabilitas Genetik: ${resultsContext}`;

    try {
      const response = await fetch('/api/analyze-morph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.text || "Tidak dapat menghasilkan analisis saat ini.";
      
      // Update Cache
      aiResponseCache.set(geneticKey, analysisText);
      lastRequestTime = Date.now();
      
      setAiAnalysis(analysisText);
      setActiveTab('ai');
    } catch (error: any) {
       console.error("AI Analysis failed:", error);
       setAiAnalysis(`### Layanan AI Bermasalah\n${error?.message || "Terjadi kesalahan koneksi."}\n\nHasil kalkulasi genetik lokal tetap tersedia di tab "Results".`);
       setActiveTab('ai'); // Still switch but show error message
    } finally {
      setIsAnalyzing(false);
      aiLockRef.current = false;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 overflow-hidden pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-black tracking-tight">Morph Calculator Pro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Professional Breeder-Grade Inheritance Calculator.</p>
        </div>
        <Link 
          to="/knowledge" 
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 hover:bg-emerald-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-all shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-400 group"
        >
          <BookOpen className="w-4 h-4 text-emerald-500 group-hover:text-white transition-colors" />
          Morph Knowledge
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <ParentCard parent={sire} type="Sire" onClick={() => setActiveParent('sire')} />
        <ParentCard parent={dam} type="Dam" onClick={() => setActiveParent('dam')} />
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col sm:flex-row justify-center gap-5 w-full">
          <button 
            onClick={calculate}
            className={cn(
              "flex items-center justify-center gap-4 px-10 py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl active:scale-95 flex-1 max-w-sm group border-4",
              activeTab === 'prob' 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"
            )}
          >
            <div className="p-2 bg-emerald-500 rounded-xl group-hover:rotate-180 transition-transform duration-500">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            Kalkulasi Probabilitas
          </button>

          <button 
            onClick={analyzeWithAI}
            disabled={isAnalyzing}
            className={cn(
              "flex items-center justify-center gap-4 px-10 py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl active:scale-95 border-4 flex-1 max-w-sm group relative overflow-hidden",
              isAnalyzing 
                ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed" 
                : activeTab === 'ai'
                  ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400 text-white shadow-emerald-500/20"
                  : isPremium
                    ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-emerald-500 hover:border-emerald-500/50"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-800"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all duration-500",
              isAnalyzing ? "bg-slate-200 dark:bg-slate-700" : (isPremium || activeTab === 'ai') ? "bg-white/20 group-hover:rotate-12" : "bg-slate-200 dark:bg-slate-800"
            )}>
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (isPremium || activeTab === 'ai') ? (
                <Sparkles className="w-4 h-4 text-amber-300" />
              ) : (
                <Lock className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <div className="flex flex-col items-start">
              <span>{isAnalyzing ? "Menganalisis..." : "Breeder AI Analysis"}</span>
              {rateLimitMessage && (
                <span className="text-[8px] font-bold text-rose-500 animate-pulse lowercase">{rateLimitMessage}</span>
              )}
            </div>
            {isAnalyzing && (
              <motion.div 
                className="absolute bottom-0 left-0 h-1 bg-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: "linear" }}
              />
            )}
          </button>
        </div>

        {/* Dynamic Tab Switcher (only show if both exist) */}
        {isCalculated && aiAnalysis && !isAnalyzing && (
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('prob')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'prob' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Results
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'ai' ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-emerald-500"
              )}
            >
              AI Insight
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'prob' && isCalculated && results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3 bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/20">
              <div className="p-2 bg-emerald-500 rounded-xl text-white">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Kalkulasi Probabilitas Genetik</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statistical Mendelian Inheritance Results</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((res, i) => (
                <ResultCardItem key={i} result={res} />
              ))}
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => setActiveTab(null)} 
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 border-transparent hover:border-rose-500/20"
              >
                Clear Probabilities
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'ai' && aiAnalysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/20 rounded-[1.5rem] text-emerald-400 ring-1 ring-emerald-500/50">
                    <Microscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">AI Professional Analysis</h3>
                    <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-[0.2em] mt-1">Breeder-Grade Intelligence Report</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab(null)}
                  className="p-3 bg-white/5 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 rounded-2xl transition-all border border-white/5"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <div className="prose prose-invert prose-emerald max-w-none text-slate-300 relative z-10">
                <ReactMarkdown
                  components={{
                    h3: ({ node, ...props }) => (
                      <h3 className="text-lg font-black text-amber-500 uppercase tracking-[0.1em] mt-12 mb-6 flex items-center gap-3 border-l-4 border-amber-500 pl-4 bg-amber-500/5 py-4 rounded-r-2xl" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-slate-300 mb-6 leading-relaxed text-sm md:text-base font-medium" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="space-y-4 mb-10 list-none pl-0" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="flex items-start gap-3 text-slate-400 text-sm md:text-base leading-relaxed" {...props}>
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span>{props.children}</span>
                      </li>
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="text-amber-400 font-black px-1.5 py-0.5 bg-amber-400/10 rounded-md border border-amber-400/20 shadow-sm" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <div className="my-10 p-6 bg-rose-500/5 border-l-4 border-rose-500 shadow-2xl rounded-r-[2rem] flex gap-4 items-start relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <AlertTriangle size={80} />
                        </div>
                        <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={24} />
                        <div className="text-rose-100 text-sm md:text-base italic font-bold leading-relaxed relative z-10">
                          {props.children}
                        </div>
                      </div>
                    )
                  }}
                >
                  {aiAnalysis}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeParent && (
          <SelectionOverlay 
            parent={activeParent === 'sire' ? sire : dam}
            onClose={() => setActiveParent(null)}
            onToggle={(id, type, level) => toggleGene(activeParent, id, type, level)}
          />
        )}
      </AnimatePresence>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        profile={profile} 
      />
    </div>
  );
}

function ParentCard({ parent, type, onClick }: { parent: GeneticState; type: string; onClick: () => void }) {
  const total = parent.visual.length + parent.hets.length + parent.visualTraits.length + parent.patternTraits.length;

  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[2.5rem] border-4 transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
        type === 'Sire' ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-500/5 dark:border-blue-900/50' : 'bg-pink-50/50 border-pink-100 dark:bg-pink-500/5 dark:border-pink-900/50'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${type === 'Sire' ? 'text-blue-500' : 'text-pink-500'}`}>{type} Parent</span>
          <h4 className="text-2xl font-black text-black dark:text-black uppercase leading-none">Indukan {type === 'Sire' ? 'Jantan' : 'Betina'}</h4>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'Sire' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'}`}>
          {type === 'Sire' ? <Zap size={24} /> : <Dna size={24} />}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[80px] content-start">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-full opacity-30 mt-4">
            <Plus size={24} className="mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Select Genetics</span>
          </div>
        ) : (
          <>
            {parent.visual.map(id => {
              const gene = CALCULATOR_GENES[id as keyof typeof CALCULATOR_GENES];
              const isSuper = gene?.type === 'codominant';
              return (
                <span key={id} className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all",
                  isSuper 
                    ? "bg-amber-500 border-amber-400 text-white shadow-amber-500/20"
                    : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800"
                )}>
                  {isSuper ? 'Super ' : ''}{gene?.name || id}
                </span>
              );
            })}
            {parent.hets.map(id => {
              const gene = CALCULATOR_GENES[id as keyof typeof CALCULATOR_GENES];
              const isVisual = gene?.type === 'codominant' || gene?.type === 'dominant';
              return (
                <span key={id} className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all",
                  isVisual
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}>
                  {isVisual ? '' : 'Het '}{gene?.name || id}
                </span>
              );
            })}
            {parent.patternTraits.map(id => (
              <span key={id} className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                {parent.traitLevels?.[id] && `${parent.traitLevels[id]} `}{PATTERN_TRAITS[id]?.name || id}
              </span>
            ))}
            {parent.visualTraits.map(id => (
              <span key={id} className="px-3 py-1.5 bg-indigo-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-400/20">
                {parent.traitLevels?.[id] && `${parent.traitLevels[id]} `}{VISUAL_TRAITS[id]?.name || id}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SelectionOverlay({ parent, onClose, onToggle }: { parent: GeneticState; onClose: () => void; onToggle: (id: string, type: 'visual' | 'hets' | 'traits' | 'patterns' | 'super' | 'linebred', level?: string) => void }) {
  // Check if any albino is already selected
  const selectedAlbino = Object.values(RESTRICTED_RECESSIVE).find(g => 
    g.group === 'albino' && (parent.visual.includes(g.id) || parent.hets.includes(g.id))
  );

  const LINE_BREED_IDS = [
    'tangerine', 'hypo', 'shtct', 'emerine', 'bold-stripe', 
    'red-stripe', 'reverse-stripe', 'patternless-stripe', 'lavender', 'black-night'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/60"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Genetic Registry</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select Morph combinations for calculation</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-slate-100 dark:border-slate-700">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* RECESSIVE GENES */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Dna size={16} className="text-emerald-500" />
                Recessive (Visual / Het)
              </h4>
              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg uppercase">Requires 2 copies for Visual</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(RESTRICTED_RECESSIVE).map((gene: GeneDefinition) => {
                const isLocked = selectedAlbino && gene.group === 'albino' && selectedAlbino.id !== gene.id;
                const isVisual = parent.visual.includes(gene.id);
                const isHet = parent.hets.includes(gene.id);

                return (
                  <div key={gene.id} className={cn(
                    "p-5 rounded-[2rem] border-2 transition-all relative overflow-hidden",
                    isLocked 
                      ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-40 grayscale" 
                      : isVisual || isHet
                        ? "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5"
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30"
                  )}>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{gene.name}</span>
                      {isLocked ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg">
                          <ShieldAlert size={12} />
                          <span className="text-[8px] font-black uppercase">Conflict</span>
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                      )}
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <button 
                        disabled={isLocked}
                        onClick={() => onToggle(gene.id, 'visual')}
                        className={cn(
                          "flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border-2",
                          isVisual 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl" 
                            : "bg-white dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        Visual
                      </button>
                      <button 
                        disabled={isLocked}
                        onClick={() => onToggle(gene.id, 'hets')}
                        className={cn(
                          "flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border-2",
                          isHet 
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/20" 
                            : "bg-white dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        Het
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CO-DOMINANT GENES */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={16} className="text-amber-500" />
                Co-Dominant (Visual / Super)
              </h4>
              <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-lg uppercase">Variable Expression</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(RESTRICTED_CODOMINANT).map((gene: GeneDefinition) => {
                const isVisual = parent.hets.includes(gene.id);
                const isSuper = parent.visual.includes(gene.id);

                return (
                  <div key={gene.id} className={cn(
                    "p-5 rounded-[2rem] border-2 transition-all",
                    isVisual || isSuper
                      ? "border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/5 text-amber-600 shadow-xl shadow-amber-500/5 text-amber-600"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{gene.name}</span>
                      <Sparkles size={14} className={isSuper ? "text-amber-500" : "text-slate-300"} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onToggle(gene.id, 'visual')}
                        className={cn(
                          "flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border-2",
                          isVisual 
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-xl" 
                            : "bg-white dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        Visual
                      </button>
                      <button 
                        onClick={() => onToggle(gene.id, 'super')}
                        className={cn(
                          "flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border-2",
                          isSuper 
                            ? "bg-amber-500 text-white border-amber-400 shadow-xl shadow-amber-500/20" 
                            : "bg-white dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        Super
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* DOMINANT GENES */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} className="text-blue-500" />
                Dominant (Visual Only)
              </h4>
              <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg uppercase">Expressed in 1 Copy</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.values(RESTRICTED_DOMINANT).map((gene: GeneDefinition) => {
                const isVisual = parent.hets.includes(gene.id);
                return (
                  <button 
                    key={gene.id}
                    onClick={() => onToggle(gene.id, 'visual')}
                    className={cn(
                      "p-6 rounded-[2rem] text-center border-2 transition-all relative group flex flex-col items-center gap-2",
                      isVisual 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-xl shadow-blue-500/20" 
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-slate-400 hover:border-blue-200"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{gene.name}</span>
                    {gene.warning ? (
                      <AlertTriangle size={14} className="text-amber-500" />
                    ) : (
                      <Zap size={14} className={isVisual ? "text-blue-500" : "text-slate-200"} />
                    )}
                    {isVisual && (
                      <motion.div 
                        layoutId="active-check"
                        className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"
                      >
                        <Plus size={10} className="rotate-45" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* LINE-BREED TRAITS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={16} className="text-indigo-500" />
                Line-Breed Selection
              </h4>
              <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg uppercase">Select Level (Low/Medium/High)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LINE_BREED_IDS.map((id) => {
                const trait = VISUAL_TRAITS[id] || PATTERN_TRAITS[id];
                if (!trait) return null;
                const currentLevel = parent.traitLevels?.[id];
                const isSelected = !!currentLevel;

                return (
                  <div key={id} className={cn(
                    "p-5 rounded-[2rem] border-2 transition-all",
                    isSelected
                      ? "border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-500/5 shadow-xl shadow-indigo-500/5"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{trait.name}</span>
                      <Target size={14} className={isSelected ? "text-indigo-500" : "text-slate-300"} />
                    </div>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High'].map((lvl) => (
                        <button 
                          key={lvl}
                          onClick={() => onToggle(id, 'linebred', lvl)}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shadow-sm border-2",
                            currentLevel === lvl 
                              ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20" 
                              : "bg-white dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          )}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
           <button onClick={onClose} className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:text-white group shadow-xl">
             <span className="flex items-center justify-center gap-3">
               Apply Genetics Selection
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </span>
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultCardItem({ result }: { result: PredictionResult }) {
  return (
    <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
            result.rarity === 'Holy Grail' ? 'bg-indigo-100 text-indigo-600' :
            result.rarity === 'Legendary' ? 'bg-amber-100 text-amber-600' :
            result.rarity === 'Rare' ? 'bg-emerald-100 text-emerald-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {result.rarity}
          </span>
          <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-tight group-hover:text-emerald-500 transition-colors pr-12">{result.name}</h4>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-emerald-500">{result.probability}%</div>
          <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Prob</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {result.visualGenes.map(id => (
          <span key={id} className="text-[8px] font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-500 uppercase rounded-md">Visual {ALL_GENES[id]?.name}</span>
        ))}
        {result.patternTraits.map(id => (
          <span key={id} className="text-[8px] font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-500 uppercase rounded-md">
            {result.traitLevels?.[id] && `${result.traitLevels[id]} `}{PATTERN_TRAITS[id]?.name || id}
          </span>
        ))}
        {result.visualTraits.map(id => (
          <span key={id} className="text-[8px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-500/5 text-blue-500 uppercase rounded-md">
            {result.traitLevels?.[id] && `${result.traitLevels[id]} `}{VISUAL_TRAITS[id]?.name || id}
          </span>
        ))}
      </div>

      {(result.hets.length > 0 || (result.posHets && result.posHets.length > 0)) && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] mb-4 border border-slate-100 dark:border-slate-800">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
            <Target size={10} className="text-emerald-500" />
            Genotype Breakdown
          </span>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {result.hets.map(id => (
              <span key={id} className="text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase">
                100% Het {ALL_GENES[id]?.name}
              </span>
            ))}
            {result.posHets?.map(ph => (
              <span key={ph.geneId} className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                {ph.prob === 100/3 * 2 ? '66%' : ph.prob === 50 ? '50%' : `${Math.round(ph.prob)}%`} Het {ALL_GENES[ph.geneId]?.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.isWarning && (
        <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase leading-tight">{result.warningMessage}</p>
        </div>
      )}
    </div>
  );
}
