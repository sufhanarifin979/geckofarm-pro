import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Save, 
  X, 
  Dna, 
  Sparkles, 
  Zap, 
  AlertTriangle,
  Info,
  Link as LinkIcon,
  User,
  Loader2,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReferenceLink {
  title: string;
  url: string;
}

interface MorphEntry {
  id?: string;
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

export default function AdminEncyclopedia() {
  const [morphs, setMorphs] = useState<MorphEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);
  const [editingMorph, setEditingMorph] = useState<MorphEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<MorphEntry>>({
    name: '',
    slug: '',
    category: 'Base',
    rarity: 'Common',
    inheritance_type: 'Recessive',
    description: '',
    genetics: '',
    visual_traits: [],
    combo_compatibility: [],
    warnings: '',
    breeder_notes: '',
    image_url: '',
    selection_priority: [],
    tags: [],
    reference_links: [],
    credited_breeders: []
  });

  useEffect(() => {
    const q = query(collection(db, 'morphs'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        ...doc.data(),
        id: doc.id
      } as MorphEntry));
      setMorphs(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'morphs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      name, 
      slug: prev.slug === slugify(prev.name || '') ? slugify(name) : prev.slug 
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        updated_at: serverTimestamp()
      };

      if (editingMorph?.id) {
        await updateDoc(doc(db, 'morphs', editingMorph.id), payload);
      } else {
        await addDoc(collection(db, 'morphs'), {
          ...payload,
          created_at: serverTimestamp()
        });
      }
      
      setIsModalOpen(false);
      setEditingMorph(null);
      resetForm();
    } catch (error) {
      console.error('Error saving morph:', error);
      alert('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation || !deleteConfirmation.id) return;
    
    setIsDeleting(true);
    try {
      // Explicitly target the correct collection and document ID
      const morphRef = doc(db, 'morphs', deleteConfirmation.id);
      await deleteDoc(morphRef);
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('CRITICAL: Delete failed:', error);
      handleFirestoreError(error, OperationType.DELETE, `morphs/${deleteConfirmation.id}`);
      alert(`Gagal menghapus data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category: 'Base',
      rarity: 'Common',
      inheritance_type: 'Recessive',
      description: '',
      genetics: '',
      visual_traits: [],
      combo_compatibility: [],
      warnings: '',
      breeder_notes: '',
      image_url: '',
      selection_priority: [],
      tags: [],
      reference_links: [],
      credited_breeders: []
    });
  };

  const openEdit = (morph: MorphEntry) => {
    setEditingMorph(morph);
    setFormData(morph);
    setIsModalOpen(true);
  };

  const filteredMorphs = morphs.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Research Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Morph Research Inventory</h2>
          <p className="text-slate-500 text-sm font-medium">Curate the knowledge base for breeders worldwide.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingMorph(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} />
          New Research Entry
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search encyclopedia database..."
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:border-emerald-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {['all', 'Base', 'Albino', 'Snow', 'Combo', 'Pattern', 'Line-bred', 'Special'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterCategory === cat 
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Morph List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMorphs.map((morph) => (
            <motion.div 
              key={morph.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-emerald-500/50 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700">
                    {morph.image_url ? (
                      <img src={morph.image_url} alt={morph.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Dna size={20} /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm leading-tight">{morph.name}</h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{morph.category} • {morph.rarity}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(morph)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirmation({ id: morph.id!, name: morph.name })} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-6">
                {morph.description}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                    morph.rarity === 'Legendary' || morph.rarity === 'Holy Grail' ? 'bg-amber-500 text-white' :
                    morph.rarity === 'Rare' ? 'bg-indigo-500 text-white' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {morph.rarity}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                    {morph.inheritance_type}
                  </span>
                </div>
                <button 
                  onClick={() => openEdit(morph)}
                  className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-500 transition-colors hover:scale-105 active:scale-95"
                >
                  <Eye size={12} />
                  Details
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteConfirmation(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-rose-500/20"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Delete Research Entry?</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Anda akan menghapus data riset untuk <span className="text-slate-900 dark:text-white font-bold">{deleteConfirmation.name}</span>. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-4">
                <button 
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-[2] py-4 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => !isSaving && setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingMorph ? 'Edit Morph Research' : 'New Research Discovery'}
                  </h2>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Breeder Intelligence Editor</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      isPreviewMode ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPreviewMode ? <Eye size={14} /> : <Edit3 size={14} />}
                    {isPreviewMode ? 'Back to Edit' : 'Live Preview'}
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-900 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
                {isPreviewMode ? (
                  <div className="max-w-2xl mx-auto space-y-8">
                     <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-700">
                        {formData.image_url ? (
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <Dna size={48} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Visual Data</span>
                          </div>
                        )}
                     </div>
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <div className="flex gap-2">
                              <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[8px] font-black uppercase">{formData.category}</span>
                              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[8px] font-black uppercase">{formData.rarity}</span>
                           </div>
                           <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-none">{formData.name || 'Morph Name'}</h3>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{formData.description || 'Description will appear here...'}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Genetics</span>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{formData.genetics || 'Not specified'}</p>
                           </div>
                           <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inheritance</span>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{formData.inheritance_type}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto">
                    {/* Basic Info */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Info size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Core Identity Data</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morph Name</label>
                          <input 
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                            placeholder="e.g. RAPTOR"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug (URL ID)</label>
                          <input 
                            required
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-xs focus:border-emerald-500 transition-all"
                            placeholder="e.g. raptor-tremper-albino"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                          <select 
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none transition-all"
                          >
                            {['Base', 'Albino', 'Snow', 'Combo', 'Line-bred', 'Pattern', 'Special'].map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rarity Tier</label>
                          <select 
                            value={formData.rarity}
                            onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value as any }))}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none transition-all"
                          >
                            {['Common', 'Uncommon', 'Rare', 'Legendary', 'Holy Grail'].map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inheritance Type</label>
                          <select 
                            value={formData.inheritance_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, inheritance_type: e.target.value as any }))}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none transition-all"
                          >
                            {['Recessive', 'Incomplete Dominant', 'Dominant', 'Polygenetic', 'Line-bred'].map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* Media & Details */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <Sparkles size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Media & Visual Evidence</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">External Image URL</label>
                        <input 
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                          className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium text-sm focus:border-emerald-500 transition-all font-mono"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description (Historical & Visual)</label>
                        <textarea 
                          rows={6}
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-medium text-sm focus:border-emerald-500 transition-all no-scrollbar leading-relaxed"
                          placeholder="Jelaskan sejarah penemuan, ciri khas visual, dan keunikan morph ini secara mendalam..."
                        />
                      </div>
                    </section>

                    {/* Scientific Data */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-amber-500">
                        <Zap size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Scientific & Genetic Profile</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genetic Formula</label>
                          <input 
                            type="text"
                            value={formData.genetics}
                            onChange={(e) => setFormData(prev => ({ ...prev, genetics: e.target.value }))}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-sm focus:border-emerald-500 transition-all font-bold"
                            placeholder="e.g. bb/ee"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genetic Warnings</label>
                          <input 
                            type="text"
                            value={formData.warnings}
                            onChange={(e) => setFormData(prev => ({ ...prev, warnings: e.target.value }))}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/30 rounded-2xl font-medium text-sm focus:border-rose-500 transition-all text-rose-600 font-bold"
                            placeholder="e.g. Incompatible with other albino strains."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genetic Signatures (Visual Traits)</label>
                          <div className="space-y-2">
                            <input 
                              type="text"
                              value={formData.visual_traits?.join(', ') || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, visual_traits: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all"
                              placeholder="e.g. Red Eyes, White Tail, High Contrast..."
                            />
                            <p className="text-[9px] text-slate-400 italic">Separate by comma for multiple traits.</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Combo Potential (Compatibility)</label>
                          <div className="space-y-2">
                            <input 
                              type="text"
                              value={formData.combo_compatibility?.join(', ') || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, combo_compatibility: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all"
                              placeholder="e.g. Enigma, White & Yellow, Eclipse..."
                            />
                            <p className="text-[9px] text-slate-400 italic">Separate by comma for multiple combos.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breeder Grading Guide (Selection Priority)</label>
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, selection_priority: [...(prev.selection_priority || []), ''] }))}
                            className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-3 py-1 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            + Add Guide Point
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.selection_priority?.map((point, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                type="text"
                                value={point}
                                onChange={(e) => {
                                  const newPoints = [...(formData.selection_priority || [])];
                                  newPoints[idx] = e.target.value;
                                  setFormData(prev => ({ ...prev, selection_priority: newPoints }));
                                }}
                                className="flex-1 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                placeholder="e.g. High orange saturation"
                              />
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, selection_priority: prev.selection_priority?.filter((_, i) => i !== idx) }))}
                                className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        {(!formData.selection_priority || formData.selection_priority.length === 0) && (
                          <div 
                            onClick={() => setFormData(prev => ({ ...prev, selection_priority: [''] }))}
                            className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-center cursor-pointer hover:border-emerald-500/20 transition-all"
                          >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No grading points added. Click to add the first guide.</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breeder Professional Insight</label>
                        <textarea 
                          rows={4}
                          value={formData.breeder_notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, breeder_notes: e.target.value }))}
                          className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-medium text-sm focus:border-emerald-500 transition-all no-scrollbar italic"
                          placeholder="Berikan tips spesifik untuk breeding, tantangan genetika, atau saran manajemen pakan..."
                        />
                      </div>
                    </section>

                    {/* Resources & References */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <LinkIcon size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Citations & References</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Credited Breeders / Sources</label>
                             <div className="space-y-2">
                                <input 
                                  type="text"
                                  value={formData.credited_breeders?.join(', ') || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, credited_breeders: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                                  className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all"
                                  placeholder="Ron Tremper, Mark Bell..."
                                />
                                <p className="text-[9px] text-slate-400 italic">Separate by comma.</p>
                             </div>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Search Tags</label>
                             <div className="space-y-2">
                                <input 
                                  type="text"
                                  value={formData.tags?.join(', ') || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                                  className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all font-mono"
                                  placeholder="albino, raptor, gecko, research..."
                                />
                                <p className="text-[9px] text-slate-400 italic">Keywords for easier discovery.</p>
                             </div>
                         </div>
                      </div>

                      <div className="space-y-4 p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <LinkIcon size={18} className="text-indigo-400" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Research Reference Links</h4>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, reference_links: [...(prev.reference_links || []), { title: '', url: '' }] }))}
                            className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                          >
                            + Add Link
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {formData.reference_links?.map((link, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <input 
                                type="text"
                                placeholder="Title (e.g. World Gecko Genetics Paper)"
                                value={link.title}
                                onChange={(e) => {
                                  const newLinks = [...(formData.reference_links || [])];
                                  newLinks[idx].title = e.target.value;
                                  setFormData(prev => ({ ...prev, reference_links: newLinks }));
                                }}
                                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none"
                              />
                              <input 
                                type="url"
                                placeholder="URL (https://...)"
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...(formData.reference_links || [])];
                                  newLinks[idx].url = e.target.value;
                                  setFormData(prev => ({ ...prev, reference_links: newLinks }));
                                }}
                                className="flex-[2] px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:border-indigo-500 outline-none font-mono"
                              />
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, reference_links: prev.reference_links?.filter((_, i) => i !== idx) }))}
                                className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          {(!formData.reference_links || formData.reference_links.length === 0) && (
                            <p className="text-[10px] text-slate-400 italic text-center py-4">No reference links added yet.</p>
                          )}
                        </div>
                      </div>
                    </section>

                    <div className="pb-12 pt-8 flex gap-4">
                       <button 
                         type="button" 
                         onClick={() => !isSaving && setIsModalOpen(false)}
                         className="flex-1 py-5 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                       >
                         Discard Changes
                       </button>
                       <button 
                         disabled={isSaving}
                         type="submit"
                         className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                       >
                         {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                         {editingMorph ? 'Commit Research Update' : 'Publish New Research'}
                       </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
