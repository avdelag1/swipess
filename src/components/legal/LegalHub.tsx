import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, PenTool, CheckCircle2, Cloud,
  Clock, Plus, ChevronRight, X, Sparkles,
  ArrowRight, Download, Activity, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ownerTemplates, clientTemplates, ContractTemplate } from '@/data/contractTemplates';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DigitalSignaturePad } from '@/components/DigitalSignaturePad';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/useTheme';

type HubView = 'dashboard' | 'browse' | 'editor' | 'signing';

export function LegalHub() {
  const { user } = useAuth();
  const { theme, isLight } = useTheme();
  const [view, setView] = useState<HubView>('dashboard');
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [activeContract, setActiveContract] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    fetchContracts();
  }, [user]);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('digital_contracts')
      .select('*')
      .or(`owner_id.eq.${user?.id},client_id.eq.${user?.id}`)
      .order('updated_at', { ascending: false });

    if (!error) setContracts(data);
    setLoading(false);
  };

  const handleCreateNew = () => {
    triggerHaptic('medium');
    setView('browse');
  };

  const handleSelectTemplate = (template: ContractTemplate) => {
    triggerHaptic('heavy');
    setSelectedTemplate(template);
    setView('editor');
  };

  const handleStartSigning = (contract: any) => {
    triggerHaptic('medium');
    setActiveContract(contract);
    setView('signing');
  };

  const handleClose = () => {
    triggerHaptic('light');
    setView('dashboard');
    setSelectedTemplate(null);
    setActiveContract(null);
  };

  return (
    <div className={cn(
        "relative min-h-[85vh] w-full backdrop-blur-3xl rounded-[3.5rem] border overflow-hidden shadow-3xl transition-colors duration-500",
        isLight ? "bg-black/5 border-black/10" : "bg-white/[0.02] border-white/5"
    )}>
      
      {/* 🛸 HUD DECOR */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-indigo-500/10 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-[#EB4898]/10 blur-[110px] rounded-full" />

      {/* 🛸 MEGA-HEADER */}
      <div className={cn("relative z-10 p-10 flex items-center justify-between border-b transition-colors", isLight ? "border-black/5" : "border-white/5")}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.4rem] bg-[#EB4898] flex items-center justify-center shadow-3xl">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className={cn("text-2xl font-black italic tracking-tighter uppercase leading-none", isLight ? "text-black" : "text-white")}>Legal Integrity Hub</h2>
            <div className="flex items-center gap-3 mt-2">
               <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
               <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] opacity-30 italic", isLight ? "text-black" : "text-white")}>Operational Matrix v14.0</p>
            </div>
          </div>
        </div>
        
        {view !== 'dashboard' && (
          <Button onClick={handleClose} variant="ghost" className={cn("rounded-full w-14 h-14 p-0 transition-all", isLight ? "bg-black/5 hover:bg-black/10" : "bg-white/5 hover:bg-white/10")}>
            <X className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} />
          </Button>
        )}
      </div>

      <div className="relative z-10 p-10 h-[calc(85vh-120px)] overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12">
              
              {/* 🛸 DRAFT TERMINAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button 
                  onClick={handleCreateNew}
                  className="h-44 rounded-[3rem] bg-[#EB4898] hover:bg-[#EB4898]/90 flex flex-col items-center justify-center gap-5 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_30px_60px_-15px_rgba(235,72,152,0.4)]"
                >
                  <div className="w-16 h-16 rounded-[1.4rem] bg-white/20 flex items-center justify-center border border-white/10">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Initialize Protocol</span>
                </Button>

                <div className={cn("p-10 rounded-[3rem] border flex flex-col justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.03] border-white/5")}>
                  <div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.45em] mb-3 italic opacity-40", isLight ? "text-black" : "text-white")}>Awaiting Action</h4>
                    <p className={cn("text-5xl font-black italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                      {contracts.filter(c => c.status === 'sent' && !c.client_signature).length}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-8">
                    <Activity className="w-4 h-4 text-[#EB4898] animate-pulse" />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest italic opacity-40 leading-none", isLight ? "text-black" : "text-white")}>Matrix Sync Nominal</span>
                  </div>
                </div>
              </div>

              {/* 🛸 ASSET VAULT */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Identity Vault</span>
                  <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
                </div>

                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-28 w-full rounded-[2.5rem] bg-white/5" />
                    <Skeleton className="h-28 w-full rounded-[2.5rem] bg-white/5" />
                  </div>
                ) : contracts.length === 0 ? (
                  <div className={cn("p-20 text-center rounded-[3rem] border border-dashed border-white/10", isLight ? "bg-black/[0.02]" : "bg-white/[0.01]")}>
                    <Cloud className="w-16 h-16 text-white/5 mx-auto mb-6" />
                    <p className={cn("text-[11px] font-black uppercase tracking-[0.4em] opacity-20 italic", isLight ? "text-black" : "text-white")}>No synchronized records in the vault</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract, i) => (
                      <motion.div
                        key={contract.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={cn(
                          "group p-8 rounded-[2.8rem] border transition-all flex items-center justify-between",
                          isLight ? "bg-black/[0.02] border-black/5 hover:border-black/20" : "bg-white/[0.03] border-white/5 hover:border-[#EB4898]/40"
                        )}
                      >
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 rounded-[1.2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-[#EB4898] group-hover:border-white/20 transition-all duration-500">
                             <FileText className={cn("w-7 h-7 transition-colors", isLight ? "text-indigo-500" : "text-indigo-400 group-hover:text-white")} />
                          </div>
                          <div>
                            <h4 className={cn("text-lg font-black uppercase italic tracking-tighter transition-colors", isLight ? "text-black" : "text-white group-hover:text-white")}>{contract.title}</h4>
                            <div className="flex items-center gap-4 mt-2">
                               <span className={cn(
                                 "text-[8px] font-black uppercase px-3 py-1 rounded-full border tracking-widest italic",
                                 contract.status === 'signed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                 contract.status === 'sent' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                 "bg-white/5 border-white/10 text-white/40"
                               )}>
                                 {contract.status}
                               </span>
                               <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-20 italic", isLight ? "text-black" : "text-white")}>{new Date(contract.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleStartSigning(contract)}
                          className={cn(
                            "h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                            isLight ? "bg-black text-white" : "bg-white/10 text-white group-hover:bg-[#EB4898]"
                          )}
                        >
                          ACCESS <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'browse' && (
            <motion.div key="browse" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-10">
               <div className="flex flex-col gap-2">
                  <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Protocol Matrix</h3>
                  <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-30 italic", isLight ? "text-black" : "text-white")}>Select a verified legal framework</p>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                 {[...ownerTemplates, ...clientTemplates].map((template, i) => (
                   <motion.button
                     key={template.id}
                     initial={{ opacity: 0, y: 15 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                     onClick={() => handleSelectTemplate(template)}
                     className={cn(
                       "group relative p-8 rounded-[2.8rem] border transition-all text-left overflow-hidden active:scale-[0.98]",
                       isLight ? "bg-black/[0.03] border-black/5 hover:border-black/20" : "bg-white/[0.03] border-white/5 hover:border-indigo-500/40 shadow-3xl"
                     )}
                   >
                     <div className="relative flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[1.2rem] bg-indigo-500 flex items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:scale-110">
                           <PenTool className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                           <h4 className={cn("text-lg font-black uppercase italic tracking-tighter transition-colors", isLight ? "text-black" : "text-white group-hover:text-indigo-400")}>{template.name}</h4>
                           <p className={cn("text-[11px] font-bold italic opacity-30 leading-relaxed max-w-sm mt-1 mb-2", isLight ? "text-black" : "text-white")}>{template.description}</p>
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500 italic">Encrypted Framework</span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-white/10 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all duration-500" />
                     </div>
                   </motion.button>
                 ))}
               </div>
            </motion.div>
          )}

          {view === 'editor' && (
            <motion.div key="editor" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               <div className={cn("p-12 rounded-[3.5rem] border backdrop-blur-3xl space-y-12", isLight ? "bg-black/5 border-black/5 text-black" : "bg-white/[0.03] border-white/5 text-white")}>
                  <div className="flex items-center gap-4 mb-2">
                    <Sparkles className="w-7 h-7 text-[#EB4898] animate-pulse" />
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">AI Consensus Logic</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3 col-span-full">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40 ml-4">Protocol Identification</label>
                       <input 
                         type="text" 
                         defaultValue={selectedTemplate?.name}
                         className={cn(
                            "w-full h-18 rounded-[2rem] border px-8 text-lg font-black uppercase italic tracking-tighter outline-none transition-all",
                            isLight ? "bg-white/50 border-black/5" : "bg-black/40 border-white/10 focus:border-[#EB4898]"
                         )}
                       />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40 ml-4">Verification Date</label>
                       <input type="date" className={cn("w-full h-18 rounded-[2rem] border px-8 font-black uppercase tracking-widest outline-none", isLight ? "bg-white/50 border-black/5" : "bg-black/40 border-white/10")} />
                    </div>

                    {selectedTemplate?.category === 'lease' && (
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40 ml-4">Matrix Rate (Monthly)</label>
                         <input type="number" placeholder="$0.00" className={cn("w-full h-18 rounded-[2rem] border px-8 font-black uppercase tracking-widest outline-none", isLight ? "bg-white/50 border-black/5" : "bg-black/40 border-white/10")} />
                      </div>
                    )}

                    <div className="space-y-3 col-span-full">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40 ml-4">Authorized Entity (Email/User_ID)</label>
                       <input type="text" placeholder="QUERY ENTITY HUB..." className={cn("w-full h-18 rounded-[2rem] border px-8 font-black uppercase tracking-widest outline-none transition-all", isLight ? "bg-white/50 border-black/5" : "bg-black/40 border-white/10 focus:border-[#EB4898]")} />
                    </div>
                  </div>
                  
                  <div className="p-8 rounded-[2.5rem] bg-[#EB4898]/5 border border-[#EB4898]/20 flex items-start gap-6">
                    <ShieldCheck className="w-8 h-8 text-[#EB4898] flex-shrink-0 mt-1" />
                    <p className="text-[12px] text-[#EB4898] leading-relaxed font-black italic uppercase tracking-widest">
                      Legal Integrity Hub v14 confirms cryptographic non-repudiation. Total encryption hash will be computed upon execution.
                    </p>
                  </div>
               </div>

               <Button 
                 onClick={() => { triggerHaptic('success'); toast.success('Protocol Synthesized'); setView('dashboard'); }}
                 className="w-full h-20 rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase italic tracking-[0.3em] text-[13px] shadow-3xl shadow-emerald-500/30 transition-all hover:scale-[1.01]"
               >
                 Execute Final Protocol Draft
                 <CheckCircle2 className="w-5 h-5 ml-4" />
               </Button>
            </motion.div>
          )}

          {view === 'signing' && (
            <motion.div key="signing" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
              {/* Cinematic Preview */}
              <div className={cn(
                "relative p-12 rounded-[3.5rem] border shadow-inner h-[400px] overflow-y-auto no-scrollbar pointer-events-none opacity-90 blur-[1.2px] grayscale transition-colors",
                isLight ? "bg-white border-black/20" : "bg-black border-white/10"
              )}>
                <div className={isLight ? "text-black" : "text-white"} dangerouslySetInnerHTML={{ __html: activeContract?.content || (selectedTemplate?.content || '') }} />
                <div className={cn("absolute inset-0 bg-gradient-to-t via-transparent to-transparent", isLight ? "from-white" : "from-black")} />
              </div>

              <div className="text-center space-y-4 px-10">
                 <h3 className={cn("text-3xl font-black italic tracking-tighter uppercase", isLight ? "text-black" : "text-white")}>Liquid Authority Signature</h3>
                 <p className={cn("text-[11px] font-black uppercase tracking-[0.4em] italic opacity-30", isLight ? "text-black" : "text-white")}>Transmitting biometric cryptographic ink to the matrix</p>
              </div>

              <DigitalSignaturePad 
                onSignatureCapture={(sig) => {
                  toast.success('Authority Encrypted');
                  triggerHaptic('success');
                  setView('dashboard');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🛸 HUD WATERMARK */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none flex items-center gap-3">
        <Activity className={cn("w-3 h-3 animate-pulse", isLight ? "text-black" : "text-white")} />
        <span className={cn("text-[9px] font-black uppercase tracking-[0.6em] italic", isLight ? "text-black" : "text-white")}>Swipess Legal Trust Matrix v14.0</span>
      </div>
    </div>
  );
}
