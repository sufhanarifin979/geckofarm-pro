import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, MessageCircle, Wallet, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function PremiumModal({ isOpen, onClose, profile }: PremiumModalProps) {
  const handleConfirmWA = () => {
    if (!profile) return;
    const phone = "+6285777719980";
    const message = `Halo Admin, saya ingin aktivasi Premium untuk akun: ${profile.email}. Saya sudah melakukan pembayaran sebesar Rp.50000.`;
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight leading-none">Aktivasi Premium User</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mt-1">Unlock Annual Access</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Pricing Section */}
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Annual Payment</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-emerald-600">Rp</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tighter">50.000</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Akses Setahun (Annual)</p>
              </div>

              {/* QRIS Placeholder */}
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Scan QRIS Below</div>
                <div className="aspect-square w-full max-w-[240px] mx-auto bg-white border-4 border-slate-50 rounded-3xl p-3 shadow-md relative group flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://i.ibb.co.com/nVGVmyF/IMG-20260428-115652.png" 
                    alt="QRIS Payment" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold mt-0.5">1</div>
                    <p className="text-[11px] font-bold text-slate-600 font-sans">Scan & Bayar via QRIS</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold mt-0.5">2</div>
                    <p className="text-[11px] font-bold text-slate-600 font-sans">Screenshot bukti bayar</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold mt-0.5">3</div>
                    <p className="text-[11px] font-bold text-slate-600 font-sans">Klik tombol konfirmasi di bawah</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleConfirmWA}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
              >
                <MessageCircle size={18} />
                Konfirmasi Pembayaran via WA
              </button>
              
              <div className="flex items-center justify-center gap-1.5 opacity-40">
                <CheckCircle2 size={12} />
                <span className="text-[8px] font-black uppercase tracking-widest">Verified Payment Processing</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
