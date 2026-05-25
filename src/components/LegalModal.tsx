import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const content = {
    privacy: {
      title: 'Kebijakan Privasi Gecko Farm Pro',
      icon: <Shield className="text-emerald-500" size={24} />,
      sections: [
        {
          heading: 'Selamat Datang',
          text: 'Selamat datang di Gecko Farm Pro. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda.'
        },
        {
          heading: 'Data yang Kami Kumpulkan',
          list: [
            'Informasi Akun: Alamat email yang digunakan untuk login melalui akun Google guna mengidentifikasi kepemilikan data Anda.',
            'Data Inventaris: Nama gecko, jenis morph, foto, status inkubasi, dan catatan pasangan ternak (breeding pairs) yang Anda masukkan ke dalam sistem.',
            'Informasi Transaksi: Data konfirmasi pembayaran yang dikirimkan melalui WhatsApp untuk keperluan verifikasi status Premium.'
          ]
        },
        {
          heading: 'Penggunaan Data',
          text: 'Kami menggunakan informasi Anda untuk menyediakan layanan manajemen reptil, mensinkronisasi data Anda di berbagai perangkat melalui Firebase, serta memberikan akses eksklusif ke fitur premium seperti Analisis Genetik AI.'
        },
        {
          heading: 'Keamanan Data',
          text: 'Data Anda disimpan secara aman menggunakan infrastruktur Google Firebase. Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.'
        }
      ]
    },
    terms: {
      title: 'Ketentuan Layanan Gecko Farm Pro',
      icon: <FileText className="text-blue-500" size={24} />,
      sections: [
        {
          heading: 'Persetujuan Layanan',
          text: 'Dengan menggunakan aplikasi Gecko Farm Pro, Anda menyetujui ketentuan-ketentuan berikut:'
        },
        {
          heading: 'Penggunaan Layanan',
          list: [
            'Aplikasi ini disediakan untuk membantu pengelolaan inventaris dan perhitungan genetik reptil.',
            'Pengguna dilarang melakukan tindakan yang dapat merusak integritas sistem atau mencoba mengakses Admin Console tanpa izin sah.'
          ]
        },
        {
          heading: 'Keanggotaan Premium',
          text: 'Status Premium didapatkan melalui pembayaran satu kali (atau sesuai ketentuan) yang diverifikasi secara manual oleh Admin melalui WhatsApp. Fitur Analisis Genetik AI hanya tersedia bagi pengguna dengan status Premium yang aktif.'
        },
        {
          heading: 'Disclaimer Perhitungan Genetik',
          text: 'Fitur kalkulator dan Analisis Genetik AI memberikan hasil berdasarkan probabilitas biologis. Hasil tetasan nyata di kandang dapat bervariasi karena faktor genetik yang kompleks dan lingkungan. Gecko Farm Pro tidak bertanggung jawab atas ketidaksesuaian hasil tetasan dengan prediksi aplikasi.'
        }
      ]
    }
  };

  const activeContent = content[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-emerald-50 flex items-center justify-between shrink-0 bg-emerald-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-emerald-100/50">
                  {activeContent.icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}</h2>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">Official Documentation</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-emerald-100"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="space-y-8 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                    {activeContent.title}
                  </h1>
                  <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                </div>

                <div className="space-y-6">
                  {activeContent.sections.map((section, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">{section.heading}</h3>
                      {section.text && (
                        <p className="text-sm font-medium text-slate-600 leading-relaxed font-sans">
                          {section.text}
                        </p>
                      )}
                      {section.list && (
                        <ul className="space-y-3 mt-2">
                          {section.list.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm font-medium text-slate-600 leading-relaxed font-sans">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terakhir diperbarui: April 2026</p>
                  <div className="flex items-center gap-2">
                     <Shield size={14} className="text-emerald-500 opacity-30" />
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Protected Document</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
               <button 
                 onClick={onClose}
                 className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
               >
                 Tutup Halaman
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
