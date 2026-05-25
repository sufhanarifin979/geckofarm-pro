import { CreditCard, Database, Trash2 } from 'lucide-react';
import { Gecko, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { forwardRef, memo } from 'react';

interface ProCardComponentProps {
  gecko: Gecko;
  profile: UserProfile | null;
  scale?: number;
  isPublic?: boolean;
}

export const ProCardComponent = memo(forwardRef<HTMLDivElement, ProCardComponentProps>(({ 
  gecko, 
  profile, 
  scale = 1,
  isPublic = false 
}, ref) => {
  return (
    <div 
      className={cn(
        "flex justify-center transition-transform origin-top",
        isPublic ? "w-full min-h-screen py-10 px-4 items-start bg-slate-50" : ""
      )}
    >
      <div 
        ref={ref} 
        className={cn(
          "w-[900px] h-[1200px] bg-white relative overflow-hidden flex flex-col font-sans shrink-0 border border-slate-200 shadow-2xl rounded-[16px]",
          isPublic ? "scale-[0.4] sm:scale-[0.8] md:scale-100 origin-top" : ""
        )}
        style={{ 
          backgroundColor: '#ffffff',
          padding: '40px',
          transform: !isPublic ? `scale(${scale})` : undefined
        }}
        id="id-card-view"
      >
           {/* 1. Header Area */}
           <div className="shrink-0 mb-4">
              <div className="flex justify-between items-center px-1">
                 <span className="text-[24px] font-[800] text-black uppercase tracking-[4px] leading-none">Gecko Farm Pro</span>
                 <span className="text-[17px] font-[600] text-[#888888] uppercase tracking-normal leading-none text-right">Authentic Pedigree Certificate</span>
              </div>
              <div className="h-[3px] bg-[#1a1a1a] w-full mt-[12px]" />
           </div>
           
           {/* 2. Photo Area */}
           <div className="flex justify-center my-[20px] shrink-0">
              <div className="w-[60%] aspect-square overflow-hidden rounded-[16px] shadow-sm bg-slate-50 border border-slate-100">
                 {gecko.photoUrl ? (
                   <img 
                     src={gecko.photoUrl} 
                     className="w-full h-full object-cover" 
                     crossOrigin="anonymous"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <CreditCard className="w-32 h-32" />
                   </div>
                 )}
              </div>
           </div>

           {/* Data Sections */}
           <div className="flex-1 flex flex-col px-1 min-h-0">
               {/* Block 1: Name & Sex Selection */}
               <div className="mb-4 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                     <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px] mb-1">Name / ID</div>
                     <div className="text-[42px] font-[800] text-[#111827] leading-none truncate pr-4">
                        {gecko.name}
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right shrink-0">
                     <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px]">Sexing</div>
                     <div 
                       className="px-6 py-2.5 rounded-[99px] text-[20px] font-[800] uppercase text-white shadow-md flex items-center gap-2"
                       style={{ 
                         backgroundColor: gecko.gender.toLowerCase() === 'female' ? '#E83E8C' : 
                                         gecko.gender.toLowerCase() === 'male' ? '#3b82f6' : 
                                         '#64748b' 
                       }}
                     >
                        <span className="text-[24px] leading-none mb-1">
                          {gecko.gender.toLowerCase() === 'female' ? '♀' : gecko.gender.toLowerCase() === 'male' ? '♂' : ''}
                        </span>
                        <span>{gecko.gender === 'unsex' ? 'UNSEXED' : gecko.gender}</span>
                     </div>
                  </div>
               </div>
               
               {/* Block 2: Morph */}
               <div className="pb-4 border-b border-[#E5E7EB] mb-4">
                  <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px] mb-1">Morph Genetic</div>
                  <div className="text-[42px] font-[800] text-[#111827] uppercase leading-[1.1] break-words line-clamp-2">
                     {gecko.morph}
                  </div>
               </div>
               
               {/* Block 3: Grid */}
               <div className="grid grid-cols-2 py-4 border-b border-[#E5E7EB]">
                  <div className="space-y-1 pr-6 border-r border-[#E5E7EB]">
                     <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px]">Albino Strain</div>
                     <div className="text-[32px] font-[800] text-[#111827] uppercase truncate">
                        {gecko.albinoStrain || 'None'}
                     </div>
                  </div>
                  <div className="space-y-1 pl-6">
                     <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px]">Hatch Date</div>
                     <div className="text-[32px] font-[800] text-[#111827] truncate">
                        {gecko.birthDate || 'N/A'}
                     </div>
                  </div>
               </div>
               
               {/* Block 4: Lineage */}
               <div className="grid grid-cols-2 py-4 border-b border-[#E5E7EB]">
                  <div className="space-y-1 pr-6 border-r border-[#E5E7EB]">
                     <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px]">Sire Lineage</div>
                     <div className="text-[26px] font-[800] italic text-[#111827] uppercase leading-tight line-clamp-2">
                        {gecko.sireName || 'Unknown'}
                     </div>
                  </div>
                  <div className="space-y-1 pl-6">
                     <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px]">Dam Lineage</div>
                     <div className="text-[26px] font-[800] italic text-[#111827] uppercase leading-tight line-clamp-2">
                        {gecko.damName || 'Unknown'}
                     </div>
                  </div>
               </div>
               
               {/* Footer Area */}
               <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-[90px] h-[90px] rounded-[12px] bg-white border border-[#E5E7EB] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                         {profile?.farmPhotoUrl ? (
                           <img src={profile.farmPhotoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-slate-50">
                              <Database className="w-10 h-10 text-slate-200" />
                           </div>
                         )}
                      </div>
                      <div className="flex flex-col">
                         <div className="text-[14px] font-[700] text-[#999999] uppercase tracking-[1px]">Official Records By</div>
                         <div className="text-[36px] font-[800] text-[#111827] tracking-tight uppercase truncate max-w-[450px]">
                            {profile?.farmName || 'KINGS GECKO'}
                         </div>
                      </div>
                  </div>
               </div>
           </div>
      </div>
    </div>
  );
}));

ProCardComponent.displayName = 'ProCardComponent';
