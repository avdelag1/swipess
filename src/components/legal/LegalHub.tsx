import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ShieldCheck, PenTool, CheckCircle2, 
  Clock, Plus, ChevronRight, X, Sparkles,
  ArrowRight, Search, Filter, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ownerTemplates, clientTemplates, ContractTemplate } from '@/data/contractTemplates';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DigitalSignaturePad } from '@/components/DigitalSignaturePad';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type HubView = 'dashboard' | 'browse' | 'editor' | 'signing';

function Badge({ children, className, variant = "secondary" }: { children: React.ReactNode, className?: string, variant?: "secondary" | "primary" }) {
  const { isLight } = useAppTheme();
  return (
    <span className={cn(
      "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-colors",
      variant === "secondary" ? (isLight ? "bg-black/5 text-black/70" : "bg-white/5 text-white/70") : "bg-primary/20 text-primary border border-primary/20",
      className
    )}>
      {children}
    </span>
  );
}

export function ContractsVault() {
  const { user } = useAuth();
  const { theme, isLight } = useAppTheme();
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

    if (!error) setContracts(data || []);
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
    setView('dashboard');
    setSelectedTemplate(null);
    setActiveContract(null);
  };

  return (
    <div className={cn(
      "relative w-full backdrop-blur-3xl rounded-[3rem] border shadow-2xl transition-colors duration-500",
      isLight ? "bg-white/80 border-black/5" : "bg-black/50 border-white/10"
    )}>
      {/* 🛸 BACKGROUND DECOR */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* 🛸 HEADER */}
      <div className={cn("relative z-10 p-8 flex items-center justify-between border-b", isLight ? "border-black/5" : "border-white/5")}>
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/10")}>
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className={cn("text-xl font-black tracking-tight uppercase italic", isLight ? "text-black" : "text-white")}>Contracts Vault</h2>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-20", isLight ? "text-black" : "text-white")}>Secured Digital Protocols v2.0</p>
          </div>
        </div>
        
        {view !== 'dashboard' && (
          <Button variant="ghost" onClick={handleClose} className={cn("rounded-full w-10 h-10 p-0 hover:bg-black/5", isLight ? "hover:bg-black/5" : "hover:bg-white/5")}>
            <X className={cn("w-5 h-5", isLight ? "text-black/70" : "text-white/70")} />
          </Button>
        )}
      </div>

      <div className="relative z-10 p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* 🛸 QUICK ACTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Button 
                  onClick={handleCreateNew}
                  className="h-44 rounded-[2.5rem] bg-primary hover:bg-primary/90 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Draft New Protocol</span>
                </Button>

                <div className={cn("p-10 rounded-[2.5rem] border flex flex-col justify-between", isLight ? "bg-black/[0.03] border-black/5" : "bg-white/5 border-white/10")}>
                  <div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-widest opacity-70 mb-2", isLight ? "text-black" : "text-white")}>Awaiting Signature</h4>
                    <p className={cn("text-5xl font-black italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                      {contracts.filter(c => c.status === 'sent' && !c.client_signature).length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 italic mt-6">
                    <Clock className="w-3 h-3" />
                    <span>Real-time Syncing</span>
                  </div>
                </div>
              </div>

              {/* 🛸 VAULT LIST */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-70", isLight ? "text-black" : "text-white")}>Active Vault</h3>
                  <Download className={cn("w-4 h-4 opacity-20", isLight ? "text-black" : "text-white")} />
                </div>

                {loading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className={cn("h-28 w-full rounded-[2.2rem]", isLight ? "bg-black/5" : "bg-white/5")} />)
                ) : contracts.length === 0 ? (
                  <div className={cn("p-16 text-center rounded-[3rem] border border-dashed", isLight ? "bg-black/[0.02] border-black/10" : "bg-white/[0.02] border-white/10")}>
                    <FileText className={cn("w-12 h-12 mx-auto mb-6 opacity-10", isLight ? "text-black" : "text-white")} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-20", isLight ? "text-black" : "text-white")}>No legal records found</p>
                  </div>
                ) : (
                  contracts.map((contract, i) => (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "group p-6 rounded-[2.5rem] border transition-all flex items-center justify-between",
                        isLight ? "bg-black/[0.03] border-black/5 hover:bg-black/[0.05]" : "bg-white/[0.03] border-white/5 hover:border-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn("w-16 h-16 rounded-[1.2rem] border flex items-center justify-center transition-colors", isLight ? "bg-black/5 border-black/5 group-hover:bg-primary/10 group-hover:border-primary/20" : "bg-white/5 border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20")}>
                          <FileText className={cn("w-7 h-7 text-white/70 group-hover:text-primary transition-colors")} />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className={cn("text-base font-black tracking-tighter uppercase italic transition-colors", isLight ? "text-black group-hover:text-primary" : "text-white group-hover:text-primary")}>{contract.title}</h4>
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                              contract.status === 'signed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                              contract.status === 'sent' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                              isLight ? "bg-black/5 border-black/10 text-black/70" : "bg-white/5 border-white/10 text-white/70"
                            )}>
                              {contract.status}
                            </span>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-20", isLight ? "text-black" : "text-white")}>{new Date(contract.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartSigning(contract)}
                        className={cn("h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic", isLight ? "bg-black text-white hover:bg-black/80" : "bg-white text-black hover:bg-white/80")}
                      >
                        {contract.status === 'signed' ? 'View' : 'Open'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'browse' && (
            <motion.div 
              key="browse"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className={cn("text-xl font-black uppercase tracking-tighter italic", isLight ? "text-black" : "text-white")}>Protocol Templates</h3>
                <div className="flex gap-2">
                  <Badge variant="primary">Certified</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[...ownerTemplates, ...clientTemplates].map((template, i) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                        "group relative p-8 rounded-[2.5rem] border transition-all text-left overflow-hidden active:scale-[0.98]",
                        isLight ? "bg-black/[0.03] border-black/5 hover:border-primary/40" : "bg-white/[0.03] border-white/5 hover:border-primary/40"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex items-center gap-6">
                      <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/10")}>
                        <PenTool className="w-7 h-7 text-white/20 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className={cn("text-base font-black tracking-tighter uppercase italic", isLight ? "text-black" : "text-white")}>{template.name}</h4>
                        <p className={cn("text-[11px] font-bold italic opacity-70 leading-relaxed", isLight ? "text-black" : "text-white")}>{template.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'editor' && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
               <div className={cn("p-10 rounded-[3rem] border space-y-10", isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.03] border-white/5")}>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic", isLight ? "text-black" : "text-white")}>AI Protocol Synthesis</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 col-span-full">
                       <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Document Title</label>
                       <input 
                         type="text" 
                         defaultValue={selectedTemplate?.name}
                         className={cn("w-full h-16 rounded-2xl border px-8 text-sm outline-none transition-all font-black uppercase tracking-widest", isLight ? "bg-black/[0.04] border-black/5 text-black focus:border-primary" : "bg-white/5 border-white/10 text-white focus:border-primary")}
                       />
                    </div>

                    <div className="space-y-3">
                       <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Effective Date</label>
                       <input type="date" className={cn("w-full h-16 rounded-2xl border px-8 text-sm outline-none", isLight ? "bg-black/[0.04] border-black/5 text-black" : "bg-white/5 border-white/10 text-white")} />
                    </div>

                    {selectedTemplate?.category === 'lease' && (
                      <div className="space-y-3">
                         <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Monthly Value</label>
                         <input type="number" placeholder="$0.00" className={cn("w-full h-16 rounded-2xl border px-8 text-sm outline-none", isLight ? "bg-black/[0.04] border-black/5 text-black" : "bg-white/5 border-white/10 text-white")} />
                      </div>
                    )}

                    <div className="space-y-3 col-span-full">
                       <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70", isLight ? "text-black" : "text-white")}>Counterparty ID</label>
                       <input type="text" placeholder="SCAN VERIFIED USERS..." className={cn("w-full h-16 rounded-2xl border px-8 text-[11px] font-black uppercase tracking-widest outline-none", isLight ? "bg-black/[0.04] border-black/5 text-black" : "bg-white/5 border-white/10 text-white")} />
                    </div>
                  </div>
                  
                  <div className={cn("p-8 rounded-[2rem] border flex items-start gap-5", isLight ? "bg-primary/5 border-primary/20" : "bg-primary/10 border-primary/20")}>
                    <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <p className={cn("text-[12px] leading-relaxed font-black uppercase italic tracking-wider", isLight ? "text-primary/80" : "text-primary/90")}>
                      Swipess Legal Trust v2.0 ensures this document is non-repudiable once signed. 
                      Biometric data will be attached to the final cryptographic hash.
                    </p>
                  </div>
               </div>

               <Button 
                 onClick={() => {
                   triggerHaptic('success');
                   toast.success('Legal Draft Synthesized');
                   setView('dashboard');
                 }}
                 className="w-full h-20 rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.3em] text-[12px] italic shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.01]"
               >
                 Initialize Protocol Draft
                 <CheckCircle2 className="w-5 h-5 ml-4" />
               </Button>
            </motion.div>
          )}

          {view === 'signing' && (
            <motion.div 
              key="signing"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className={cn("relative p-10 rounded-[3rem] border shadow-inner h-[400px] overflow-y-auto no-scrollbar pointer-events-none opacity-80 blur-[0.5px] grayscale", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/10")}>
                <div className={cn("prose max-w-none font-medium italic text-[13px] leading-relaxed", isLight ? "prose-slate" : "prose-invert")}>
                   <div dangerouslySetInnerHTML={{ __html: activeContract?.content || (selectedTemplate?.content || '') }} />
                </div>
                <div className={cn("absolute inset-0 pointer-events-none bg-gradient-to-t via-transparent to-transparent", isLight ? "from-white" : "from-black")} />
              </div>

              <div className="text-center space-y-4 px-6">
                 <h3 className={cn("text-3xl font-black tracking-tighter uppercase italic", isLight ? "text-black" : "text-white")}>Signature Protocol</h3>
                 <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] opacity-70 italic", isLight ? "text-black" : "text-white")}>Digital authenticity via biometric ink</p>
              </div>

              <DigitalSignaturePad 
                onSignatureCapture={(sig) => {
                  toast.success('Signature Encrypted Successfully');
                  triggerHaptic('success');
                  setView('dashboard');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🛸 FOOTER BRANDING */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
        <span className={cn("text-[9px] font-black uppercase tracking-[0.5em] italic", isLight ? "text-black" : "text-white")}>Swipess Legal Trust Foundation</span>
      </div>
    </div>
  );
}
