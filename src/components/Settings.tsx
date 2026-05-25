import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Shield, 
  Crown, 
  Store, 
  Camera,
  ChevronRight,
  User,
  Info,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types';
import { db, signOut } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { compressImage, uploadFarmImage } from '../lib/imageUtils';
import PremiumModal from './PremiumModal';
import LegalModal from './LegalModal';

interface SettingsProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export default function Settings({ profile, setProfile }: SettingsProps) {
  const [formData, setFormData] = useState({
    farmName: profile?.farmName || '',
    farmPhotoUrl: profile?.farmPhotoUrl || ''
  });
  useEffect(() => {
    if (profile) {
      setFormData({
        farmName: profile.farmName || '',
        farmPhotoUrl: profile.farmPhotoUrl || ''
      });
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
    isOpen: false,
    type: 'privacy'
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    setError(null);
    try {
      let finalData = { ...formData };
      
      // Handle image upload if it's a new base64 image
      if (formData.farmPhotoUrl.startsWith('data:image')) {
        const uploadedUrl = await uploadFarmImage(profile.uid, formData.farmPhotoUrl);
        finalData.farmPhotoUrl = uploadedUrl;
      }

      await updateDoc(doc(db, 'users', profile.uid), finalData);
      setProfile({ ...profile, ...finalData });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save branding. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = async () => {
    if (!profile) return;
    if (window.confirm('Simulated Upgrade: Unlock unlimited slots and professional tools?')) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), { subscription: 'premium', planLimit: 10000 });
        setProfile({ ...profile, subscription: 'premium', planLimit: 10000 });
        alert('Success: Your account has been upgraded to Premium!');
      } catch (err: any) {
        console.error(err);
        alert(`Failed to upgrade: ${err.message || 'Check browser console'}`);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Configuration</h2>
        <h1 className="text-3xl font-bold text-slate-900">Farm Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-8 space-y-8 flex-1">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                    {formData.farmPhotoUrl ? (
                      <img src={formData.farmPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg cursor-pointer hover:bg-emerald-600 transition-all border-2 border-white">
                    <Camera size={16} />
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.readAsDataURL(e.target.files[0]);
                          reader.onload = async () => {
                            const compressed = await compressImage(reader.result as string);
                            setFormData({ ...formData, farmPhotoUrl: compressed });
                          };
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{profile?.farmName || "Unnamed Farm"}</h3>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {profile?.subscription === 'premium' ? 'Professional Member' : 'Free Member'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Farm Branding Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                    value={formData.farmName}
                    onChange={e => setFormData({ ...formData, farmName: e.target.value.toUpperCase() })}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Public Email Address</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400"
                    value={profile?.email ?? ''}
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                {showSuccess && (
                  <div className="text-emerald-600 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center">
                    <Check size={14} className="mr-1" />
                    Saved Successfully
                  </div>
                )}
                {error && (
                  <div className="text-red-500 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center">
                    <Info size={14} className="mr-1" />
                    {error}
                  </div>
                )}
              </div>
              <button 
                disabled={isSaving}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
              >
                {isSaving ? "Saving..." : "Save Branding"}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className={`rounded-2xl p-8 border text-white relative overflow-hidden transition-all duration-500 shadow-xl ${
            profile?.subscription === 'premium' ? "bg-slate-900 border-slate-800" : "bg-emerald-600 border-emerald-500"
          }`}>
            <Crown size={32} className="text-emerald-400 mb-6" />
            <h2 className="text-xl font-bold mb-4 uppercase tracking-tighter">Membership Details</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest">
                <span className="text-white/50">Current Plan</span>
                <span>{profile?.subscription === 'premium' ? 'Premium Pro' : 'Free Trial'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest">
                <span className="text-white/50">Registry Limit</span>
                <span>{profile?.planLimit} Units</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest">
                <span className="text-white/50">Premium Tools</span>
                <span>{profile?.subscription === 'premium' ? 'Unlocked' : 'Locked'}</span>
              </div>
            </div>

              {profile?.subscription !== 'premium' ? (
                <div className="flex flex-col items-center gap-4 mt-2">
                  <button 
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-2xl border border-slate-800"
                  >
                    Unlock Premium Features
                  </button>
                  <button 
                    onClick={handleUpgrade}
                    className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-all underline underline-offset-4"
                  >
                    Simulate Quick Upgrade (Dev)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Premium Status Active</p>
                  <p className="text-[9px] text-emerald-400/60 uppercase font-bold tracking-widest">Lifetime License</p>
                </div>
              )}
          </div>
          
          <PremiumModal 
            isOpen={isPremiumModalOpen} 
            onClose={() => setIsPremiumModalOpen(false)} 
            profile={profile} 
          />

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Shield size={20} className="text-emerald-500" />
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest leading-none">Security & Privacy</h3>
             </div>
             <div className="space-y-2">
                <button 
                  onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                  className="w-full flex justify-between items-center p-3 bg-slate-50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all group"
                >
                   <span>Privacy Policy</span>
                   <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600" />
                </button>
                <button 
                  onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                  className="w-full flex justify-between items-center p-3 bg-slate-50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all group"
                >
                   <span>Terms of Use</span>
                   <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600" />
                </button>
             </div>
          </div>

          <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 shadow-sm flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <LogOut size={20} className="text-red-500" />
                <h3 className="text-xs font-bold uppercase text-red-500 tracking-widest leading-none">Account Session</h3>
             </div>
             <p className="text-[10px] text-slate-500 font-medium px-1">
               Signing out will end your current session. You will need to sign in again to access your farm records.
             </p>
             <button 
                onClick={() => signOut()}
                className="w-full py-4 bg-white border border-red-200 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
             >
                <LogOut size={16} />
                Logout Account
             </button>
          </div>
        </div>
      </div>

      <LegalModal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
        type={legalModal.type} 
      />
    </div>
  );
}
