import { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  FileText, 
  Database, 
  CreditCard, 
  Printer, 
  Crown, 
  Lock,
  Share2,
  ChevronRight,
  Printer as PrinterIcon,
  QrCode as QrIcon,
  Camera,
  Layers,
  MapPin,
  Calendar
} from 'lucide-react';
import { Gecko, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import PremiumModal from './PremiumModal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { ProCardComponent } from './ProCardComponent';
import { useGeckos } from '../GeckoProvider';

interface ExportProps {
  profile: UserProfile | null;
}

export default function Export({ profile }: ExportProps) {
  const { geckos } = useGeckos();
  const [selectedGecko, setSelectedGecko] = useState<Gecko | null>(null);
  const [currentGeckoId, setCurrentGeckoId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'card' | 'label'>('general');
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Calculate scale to fit container while maintaining fixed dimensions
  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const horizontalPadding = window.innerWidth < 640 ? 16 : 96;
      const containerWidth = previewContainerRef.current.offsetWidth - horizontalPadding;
      const targetWidth = activeTab === 'card' ? 900 : 227;
      
      if (containerWidth < targetWidth) {
        setPreviewScale(containerWidth / targetWidth);
      } else if (activeTab === 'label' && containerWidth > targetWidth * 1.5) {
        // Allow labels to scale up slightly if there's plenty of room
        setPreviewScale(1.5);
      } else {
        setPreviewScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [activeTab]);

  useEffect(() => {
    if (selectedGecko) {
      const gId = selectedGecko.id || '';
      setCurrentGeckoId(gId);
      console.log("QR ID:", gId);
      console.log("Full Public URL:", `${getPublicUrl()}/v/${gId}`);
    } else {
      setCurrentGeckoId('');
    }
  }, [selectedGecko]);

  const exportToExcel = () => {
    const data = geckos.map((g, index) => ({
      'No': index + 1,
      'Nama': g.name,
      'Morph': g.morph,
      'Jenis Kelamin': g.gender === 'male' ? 'M' : g.gender === 'female' ? 'F' : 'U',
      'Tanggal Lahir': g.birthDate,
      'Status': g.status,
      'Project': g.project || '-',
      'Sire': g.sireName || '-',
      'Dam': g.damName || '-',
      'Strain': g.albinoStrain || '-',
      'Berat (g)': g.weight || '-',
      'Notes': g.info || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const wscols = [
      { wch: 5 },  // No
      { wch: 15 }, // Nama
      { wch: 25 }, // Morph
      { wch: 10 }, // Gender
      { wch: 15 }, // Birth
      { wch: 12 }, // Status
      { wch: 15 }, // Project
      { wch: 15 }, // Sire
      { wch: 15 }, // Dam
      { wch: 15 }, // Strain
      { wch: 10 }, // Weight
      { wch: 30 }  // Notes
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gecko Registry");
    XLSX.writeFile(wb, `Registry_${profile?.farmName || 'Geckofarm'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const farmName = profile?.farmName || 'Geckofarm Pro';
    const dateStr = new Date().toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // --- PREMIUM HEADER ---
    // Dark accent sidebar
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 10, doc.internal.pageSize.height, 'F');
    
    // Header section
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text(farmName.toUpperCase(), 20, 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('OFFICIAL GECKO REGISTRY CERTIFICATE', 20, 26);
    
    // Info Block
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`PROPERTY OF: ${farmName}`, 20, 34);
    doc.text(`ISSUED DATE: ${dateStr}`, 20, 38);
    doc.text(`TOTAL COUNT: ${geckos.length} GECKOS`, 20, 42);

    const tableData = geckos.map((g, index) => [
      index + 1,
      g.name || '-',
      g.morph || '-',
      g.gender === 'male' ? 'Male' : g.gender === 'female' ? 'Female' : 'Unknown',
      g.birthDate || '-',
      g.status || '-',
      g.weight ? `${g.weight}g` : '-',
      g.project || '-',
      g.sireName || '-',
      g.damName || '-'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['#', 'GECKO NAME', 'MORPH / GENOTYPE', 'SEX', 'HATCH DATE', 'STATUS', 'WEIGHT', 'PROJECT', 'SIRE', 'DAM']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: 'middle',
        font: 'helvetica',
        lineColor: [203, 213, 225], // slate-300
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 32 },
        2: { cellWidth: 48 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 15 },
        7: { cellWidth: 25 },
        8: { cellWidth: 25 },
        9: { cellWidth: 25 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] 
      },
      margin: { left: 20, right: 14, bottom: 30 },
      didDrawPage: (data) => {
        // Simple elegant footer
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const footerText = 'GECKOFARM PRO - PROFESSIONAL BREEDING MANAGEMENT SYSTEM';
        doc.text(footerText, 20, doc.internal.pageSize.height - 10);
        
        const pageLabel = `PAGE ${doc.getNumberOfPages()}`;
        doc.text(pageLabel, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    });

    // Signature Area
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY < doc.internal.pageSize.height - 40) {
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Authorized Signature,', doc.internal.pageSize.width - 60, finalY);
      doc.line(doc.internal.pageSize.width - 60, finalY + 15, doc.internal.pageSize.width - 14, finalY + 15);
      doc.text(farmName.toUpperCase(), doc.internal.pageSize.width - 60, finalY + 20);
    }

    doc.save(`REGISTRY_${farmName.replace(/\s+/g, '_').toUpperCase()}.pdf`);
  };

  const downloadCard = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const el = cardRef.current;
      
      const dataUrl = await toPng(el, {
        cacheBust: true,
        width: 900,
        height: 1200,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: 'none'
        }
      });

      const link = document.createElement('a');
      link.download = `ID_Card_${selectedGecko?.name || 'gecko'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mendownload ID Card. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadLabel = async () => {
    if (!labelRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(labelRef.current, {
        cacheBust: true,
        width: 227,
        height: 151,
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          margin: '0',
          padding: '8px 10px',
          border: '1px solid #000000',
          boxSizing: 'border-box'
        }
      });

      const link = document.createElement('a');
      link.download = `Label_${selectedGecko?.name || 'gecko'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mendownload Label. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const getPublicUrl = () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      
      // If we are in the AI Studio dev environment, replace 'dev' with 'pre'
      // This is the most crucial part for QR code scanning success
      if (origin.includes('-dev-')) {
        const publicOrigin = origin.replace('-dev-', '-pre-');
        console.log("[QR-DEBUG] Dev environment detected. Using share origin:", publicOrigin);
        return publicOrigin;
      }
      
      return origin;
    } catch (e) {
      console.error('Error getting public URL:', e);
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
  };

  const handleShare = async () => {
    const ref = activeTab === 'card' ? cardRef : labelRef;
    if (!ref.current || !selectedGecko || isExporting) return;

    setIsExporting(true);
    try {
      const isCard = activeTab === 'card';
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        width: isCard ? 900 : 227,
        height: isCard ? 1200 : 151,
        pixelRatio: isCard ? 2 : 3,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          margin: '0',
          padding: isCard ? '40px' : '12px',
          borderRadius: isCard ? '16px' : '0',
          boxShadow: 'none'
        }
      });
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      if (!blob) throw new Error('Failed to create blob');

      const file = new File([blob], `${activeTab === 'card' ? 'ID_Card' : 'Label'}_${selectedGecko.name}.png`, { type: 'image/png' });
      
      // Use document ID for sharing to ensure it matches PublicProfile routing
      const targetId = selectedGecko.id || (selectedGecko as any).gecko_id;
      const shareUrl = `${getPublicUrl()}/v/${targetId}`;
      console.log("[QR-DEBUG] Sharing URL:", shareUrl);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${activeTab === 'card' ? 'ID Card' : 'Label'} - ${selectedGecko.name}`,
            text: `Check out this ${activeTab === 'card' ? 'ID Card' : 'registry label'} for ${selectedGecko.name}!\nView details here: ${shareUrl}`,
            url: shareUrl
          });
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return; 
          }
          throw shareErr;
        }
      } else if (navigator.share) {
        try {
          await navigator.share({
            title: `${selectedGecko.name} - Geckofarm Pro`,
            text: `Gecko: ${selectedGecko.name}\nMorph: ${selectedGecko.morph}\nFrom: ${profile?.farmName || 'My Farm'}`,
            url: shareUrl
          });
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
          throw shareErr;
        }
      } else {
        activeTab === 'card' ? downloadCard() : downloadLabel();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        // Special case for iframe/security restrictions
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
           activeTab === 'card' ? downloadCard() : downloadLabel();
        } else {
           alert('Gagal membagikan. Foto akan didownload ke galeri sebagai gantinya.');
           activeTab === 'card' ? downloadCard() : downloadLabel();
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  const printThermal = async () => {
    if (!labelRef.current || !selectedGecko || isExporting) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(labelRef.current, {
        cacheBust: true,
        width: 227,
        height: 151,
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          margin: '0',
          padding: '8px 10px',
          border: '1px solid #000000',
          boxSizing: 'border-box'
        }
      });

      const printWindow = window.open('', '_blank', 'width=600,height=600');
      if (!printWindow) {
        alert('Please allow popups to print');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label - ${selectedGecko.name}</title>
            <style>
              @page {
                size: 60mm 40mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                width: 100%;
                height: auto;
                max-width: 60mm;
                display: block;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print error:', error);
      alert('Gagal menyiapkan print. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const isPremium = profile?.subscription === 'premium';

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32 px-4 sm:px-6">
      {/* Header */}
      <div className="pt-4 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center sm:text-left">Export & Tools</h1>
          <p className="text-slate-500 text-sm font-medium text-center sm:text-left">Kelola data dan buat dokumen profesional dalam satu tempat.</p>
        </div>
      </div>

      {/* Category 1: DATABASE BACKUP */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="h-6 w-1 bg-green-500 rounded-full" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Database Backup</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={exportToExcel}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-5 text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Excel Spreadsheet</h3>
              <p className="text-slate-400 text-[10px] font-medium leading-tight">Data registrasi format Excel.</p>
            </div>
            <Download className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors" />
          </button>

          <button 
            onClick={exportToPDF}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-5 text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">General Export</h3>
              <p className="text-slate-400 text-[10px] font-medium leading-tight">Laporan koleksi format PDF.</p>
            </div>
            <Download className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </section>

      {/* Category 2: CREATE DOCUMENT */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
             <div className="h-6 w-1 bg-blue-500 rounded-full" />
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Create Document</h2>
          </div>
          {activeTab !== 'general' && (
            <button 
              onClick={() => {
                setActiveTab('general');
                setSelectedGecko(null);
              }}
              className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
            >
              Kembali ke Menu
            </button>
          )}
        </div>

        {activeTab === 'general' ? (
          <div className="space-y-6">
            {/* Dropdown Gecko */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Camera className="w-4 h-4 text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Pilih Gecko</h3>
              </div>
              <div className="relative">
                <select 
                  value={selectedGecko?.id || ''} 
                  onChange={(e) => {
                    const g = geckos.find(x => x.id === e.target.value);
                    setSelectedGecko(g || null);
                  }}
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all cursor-pointer appearance-none shadow-inner"
                  style={{ 
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 1.25rem center', 
                    backgroundSize: '1rem' 
                  }}
                >
                  <option value="">Pilih Koleksi Anda</option>
                  {geckos.map(gecko => (
                    <option key={gecko.id} value={gecko.id}>
                      {gecko.name} — {gecko.morph}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-2 gap-4">
               {/* Pro ID Card */}
               <button 
                 onClick={() => {
                   if (!selectedGecko) {
                      alert('Silakan pilih gecko terlebih dahulu');
                      return;
                   }
                   setActiveTab('card');
                 }}
                 className="bg-white h-[110px] rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-4 text-center transition-all hover:shadow-md active:scale-95 group relative"
               >
                 <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                   <CreditCard className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-tight">Pro ID Card</span>
                 {!isPremium && (
                   <div className="absolute top-2 right-2">
                     <Crown size={12} className="text-amber-400" />
                   </div>
                 )}
               </button>

               {/* ID Label */}
               <button 
                 onClick={() => {
                   if (!selectedGecko) {
                      alert('Silakan pilih gecko terlebih dahulu');
                      return;
                   }
                   setActiveTab('label');
                 }}
                 className="bg-white h-[110px] rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-4 text-center transition-all hover:shadow-md active:scale-95 group relative"
               >
                 <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                   <PrinterIcon className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-tight">Gecko ID Label</span>
                 {!isPremium && (
                   <div className="absolute top-2 right-2">
                     <Crown size={12} className="text-amber-400" />
                   </div>
                 )}
               </button>
            </div>
          </div>
        ) : (
          /* Preview Section */
          <div className="space-y-8">
               {!isPremium && (
                <div className="bg-amber-50/60 border border-amber-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-50">
                      <Lock className="w-8 h-8" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-black text-amber-800 text-sm uppercase tracking-tight">Fitur Premium Terkunci</h4>
                      <p className="text-xs text-amber-600/80 font-medium max-w-xs mx-auto leading-relaxed">
                        Upgrade ke PRO untuk menyimpan dan mencetak desain eksklusif ini.
                      </p>
                   </div>
                   <button 
                     onClick={() => setIsPremiumModalOpen(true)}
                     className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
                   >
                      <Crown className="w-3 h-3 text-amber-400" /> Unlock Premium Features
                   </button>
                </div>
              )}

               <div 
                ref={previewContainerRef}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col relative overflow-hidden h-[600px] sm:h-[700px]"
              >
                  <div className="flex-1 flex flex-col relative overflow-y-auto">
                        <div className="flex-1 flex flex-col items-center px-0 py-4 sm:p-8 space-y-8 pb-[160px]">
                            <div className={cn("w-full transition-all duration-500 flex justify-center", !isPremium && "blur-md grayscale opacity-50 select-none")}>
                              {activeTab === 'card' && (
                                <div 
                                  className="flex justify-center transition-transform origin-top"
                                  style={{ 
                                    width: '900px', 
                                    height: `${1200 * previewScale}px`,
                                    transform: `scale(${previewScale})`
                                  }}
                                >
                                    <ProCardComponent 
                                      ref={cardRef} 
                                      gecko={selectedGecko} 
                                      profile={profile} 
                                      scale={1} 
                                    />
                                </div>
                              )}

                              {activeTab === 'label' && (
                                <div 
                                  className="flex justify-center transition-transform origin-top"
                                  style={{ 
                                    width: '227px', 
                                    height: `${151 * previewScale}px`,
                                    transform: `scale(${previewScale})`
                                  }}
                                >
                                   <div 
                                     ref={labelRef} 
                                     className="bg-white flex flex-col font-sans overflow-hidden shrink-0 flex-none"
                                     style={{ 
                                       width: '227px', 
                                       height: '151px', 
                                       backgroundColor: '#ffffff',
                                       padding: '8px 10px',
                                       boxSizing: 'border-box',
                                       border: '1px solid #000000'
                                     }}
                                     id="label-view"
                                   >
                                      <div className="flex gap-3 h-[115px] overflow-hidden">
                                          {/* QR Code Section */}
                                          <div className="flex flex-col items-center justify-center shrink-0 w-[82px]" id="qrfix">
                                             <div className="p-2 bg-white border border-black shadow-sm flex items-center justify-center">
                                                {currentGeckoId && (
                                                  <QRCodeSVG 
                                                    value={`${getPublicUrl()}/v/${currentGeckoId}`} 
                                                    size={64}
                                                    level="H"
                                                    includeMargin={false}
                                                  />
                                                )}
                                             </div>
                                             <div className="text-[6px] font-black text-black uppercase tracking-wider mt-2 text-center leading-tight">SCAN TO VERIFY</div>
                                          </div>

                                          {/* Main Info Section */}
                                          <div className="flex-1 flex flex-col min-w-0">
                                             {/* NAME/ID */}
                                             <div className="flex flex-col justify-center border-b border-black/20 pt-0 pl-0 pr-0 pb-1 mt-0 mb-[-2px] min-h-[26px]">
                                                <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">NAME / ID</div>
                                                <div className="text-[8px] font-black text-black uppercase break-words line-clamp-2 leading-tight">{selectedGecko.name}</div>
                                             </div>
                                             
                                             {/* GENETIC MORPH */}
                                             <div className="flex flex-col justify-center border-b border-black/20 py-1 min-h-[32px]">
                                                <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">GENETIC MORPH</div>
                                                <div className="text-[8px] font-black text-black uppercase line-clamp-3 leading-tight break-words">{selectedGecko.morph}</div>
                                             </div>

                                             {/* STRAIN & HATCH DATE */}
                                             <div className="grid grid-cols-2 gap-0 border-b border-black/20 py-1 min-h-[26px]">
                                                <div className="flex flex-col justify-center pr-2 border-r border-black/20 h-full">
                                                   <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">STRAIN</div>
                                                   <div className="text-[7px] font-black text-black uppercase break-words line-clamp-1 leading-none">{selectedGecko.albinoStrain || 'None'}</div>
                                                </div>
                                                <div className="flex flex-col justify-center pl-2 h-full">
                                                   <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">HATCH DATE</div>
                                                   <div className="text-[7px] font-black text-black uppercase truncate leading-none">{selectedGecko.birthDate || '-'}</div>
                                                </div>
                                             </div>

                                             {/* SIRE & DAM */}
                                             <div className="grid grid-cols-2 gap-0 py-1 min-h-[26px] mt-[-1px] mb-0">
                                                <div className="flex flex-col justify-center pr-2 border-r border-black/20 h-full">
                                                   <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">SIRE</div>
                                                   <div className="text-[7px] font-bold text-slate-600 uppercase break-words line-clamp-2 italic leading-[1.1]">{selectedGecko.sireName || '-'}</div>
                                                </div>
                                                <div className="flex flex-col justify-center pl-2 h-full mt-[3px]">
                                                   <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-[-4px] mb-0.5">DAM</div>
                                                   <div className="text-[7px] font-bold text-slate-600 uppercase break-words line-clamp-2 italic leading-[1.1] mt-0">{selectedGecko.damName || '-'}</div>
                                                </div>
                                             </div>
                                          </div>
                                      </div>

                                      {/* Footer Area */}
                                      <div className="mt-0 mb-[-3px] pt-1.5 border-t border-black/30 flex items-center justify-between">
                                         <div className="text-[7px] font-black uppercase tracking-widest text-black truncate max-w-[140px] mt-[-2px]">
                                            {profile?.farmName || 'GECKO FARM'}
                                         </div>
                                         <div className="flex items-center gap-2">
                                            <div className="text-[7px] font-black text-white px-2 py-0.5 rounded-sm bg-slate-900 uppercase tracking-widest">
                                               {selectedGecko.gender}
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                              )}
                        </div>
                    </div>

                    <div className="sticky bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t border-slate-100 flex flex-row justify-center gap-2 sm:gap-3 z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                           <button 
                             onClick={activeTab === 'card' ? downloadCard : downloadLabel}
                             disabled={isExporting}
                             className={cn(
                               "flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-4 rounded-[1.25rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 text-center leading-tight shadow-xl",
                               isExporting ? "opacity-70 cursor-not-allowed" : "hover:bg-slate-800"
                             )}
                           >
                             {isExporting ? (
                               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             ) : (
                               <Download className="w-4 h-4 shrink-0" /> 
                             )}
                             <span>{isExporting ? 'Processing...' : 'Download to Gallery'}</span>
                           </button>
                           
                           {activeTab === 'card' ? (
                             <button 
                               onClick={handleShare}
                               disabled={isExporting}
                               className={cn(
                                 "flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-4 rounded-[1.25rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 text-center leading-tight",
                                 isExporting ? "opacity-70 cursor-not-allowed" : "hover:bg-slate-200"
                               )}
                             >
                               <Share2 className="w-4 h-4 shrink-0" />
                               <span>Share Card</span>
                             </button>
                           ) : (
                             <button 
                               onClick={printThermal}
                               disabled={isExporting}
                               className={cn(
                                 "flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-4 rounded-[1.25rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 text-center leading-tight",
                                 isExporting ? "opacity-70 cursor-not-allowed" : "hover:bg-slate-200"
                               )}
                             >
                               <Printer className="w-4 h-4 shrink-0" />
                               <span>Print Thermal</span>
                             </button>
                           )}
                        </div>
                  </div>
               </div>
          </div>
        )}
      </section>
      
      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        profile={profile} 
      />
    </div>
  );
}
