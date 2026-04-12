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
import { uiSounds } from '@/utils/uiSounds';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type HubView = 'dashboard' | 'browse' | 'editor' | 'signing';

export function LegalHub() {
  const { user } = useAuth();
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
    setView('dashboard');
    setSelectedTemplate(null);
    setActiveContract(null);
  };

  return (
    <div className="relative min-h-[80vh] w-full bg-background/50 backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative z-10 p-8 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Legal Integrity Center</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Secured Digital Protocols v2.0</p>
          </div>
        </div>
        
        {view !== 'dashboard' && (
          <Button variant="ghost" onClick={handleClose} className="rounded-full w-10 h-10 p-0 hover:bg-white/5">
            <X className="w-5 h-5 text-white/40" />
          </Button>
        )}
      </div>

      <div className="relative z-10 p-8 h-[calc(80vh-100px)] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats & Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleCreateNew}
                  className="h-40 rounded-[2.5rem] bg-primary hover:bg-primary/90 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_-15px_rgba(244,63,94,0.3)]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Draft New Contract</span>
                </Button>

                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Awaiting Action</h4>
                    <p className="text-3xl font-black text-white">
                      {contracts.filter(c => c.status === 'sent' && !c.client_signature).length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                    <Clock className="w-3 h-3" />
                    <span>Real-time Syncing</span>
                  </div>
                </div>
              </div>

              {/* Recent Active Documents */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-white tracking-widest uppercase opacity-40">Active Vault</h3>
                  <Download className="w-4 h-4 text-white/20" />
                </div>

                {loading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl bg-white/5" />)
                ) : contracts.length === 0 ? (
                  <div className="p-12 text-center rounded-[2rem] border border-dashed border-white/5 bg-white/[0.02]">
                    <FileText className="w-12 h-12 text-white/5 mx-auto mb-4" />
                    <p className="text-xs font-black text-white/20 uppercase tracking-widest">No legal records found</p>
                  </div>
                ) : (
                  contracts.map((contract, i) => (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                          <FileText className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white group-hover:text-primary transition-colors">{contract.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                              contract.status === 'signed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                              contract.status === 'sent' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                              "bg-white/5 border-white/10 text-white/40"
                            )}>
                              {contract.status}
                            </span>
                            <span className="text-[9px] font-medium text-white/20">Updated {new Date(contract.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartSigning(contract)}
                        className="rounded-xl h-10 px-4 bg-white/5 hover:bg-primary text-[10px] font-black uppercase tracking-widest"
                      >
                        {contract.status === 'signed' ? 'View' : 'Open'}
                        <ChevronRight className="w-3 h-3 ml-2" />
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
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Protocol Templates</h3>
                <div className="flex gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/20">Properties</Badge>
                  <Badge variant="outline" className="opacity-40">Vehicles</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[...ownerTemplates, ...clientTemplates].map((template, i) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectTemplate(template)}
                    className="group relative p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-primary/40 transition-all text-left overflow-hidden active:scale-[0.98]"
                  >
                    {/* Animated Hover Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PenTool className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">{template.name}</h4>
                        <p className="text-[11px] text-white/40 font-medium leading-relaxed">{template.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
               <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">AI Protocol Generation</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-full">
                       <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Document Title</label>
                       <input 
                         type="text" 
                         defaultValue={selectedTemplate?.name}
                         className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm text-white focus:border-primary outline-none transition-all font-black uppercase tracking-widest"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Effective Date</label>
                       <input type="date" className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm text-white outline-none" />
                    </div>

                    {selectedTemplate?.category === 'lease' && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Monthly Rent</label>
                         <input type="number" placeholder="$0.00" className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm text-white outline-none" />
                      </div>
                    )}

                    <div className="space-y-2 col-span-full">
                       <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Counterparty (Email/ID)</label>
                       <input type="text" placeholder="Search verified users..." className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm text-white outline-none" />
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-[11px] text-primary/80 leading-relaxed font-bold">
                      Swipess Legal Trust v2.0 ensures this document is non-repudiable once signed. 
                      Biometric data will be attached to the final cryptographic hash.
                    </p>
                  </div>
               </div>

               <Button 
                 onClick={() => {
                   toast.success('Legal Draft Synthesized');
                   setView('dashboard');
                 }}
                 className="w-full h-16 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.25em] text-[11px] shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.01]"
               >
                 Initialize Protocol Draft
                 <CheckCircle2 className="w-4 h-4 ml-3" />
               </Button>
            </motion.div>
          )}

          {view === 'signing' && (
            <motion.div 
              key="signing"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              {/* Immersive Doc Preview */}
              <div className="relative p-8 rounded-[3rem] bg-white border border-white/10 shadow-inner h-96 overflow-y-auto no-scrollbar pointer-events-none opacity-90 blur-[1px] grayscale">
                <div dangerouslySetInnerHTML={{ __html: activeContract?.content || (selectedTemplate?.content || '') }} />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>

              <div className="text-center space-y-3 px-6">
                 <h3 className="text-2xl font-black text-white tracking-tighter">Liquid Signature Protocol</h3>
                 <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest">Digital authenticity via cryptographic biometric ink</p>
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

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Swipess Legal Trust Foundation</span>
      </div>
    </div>
  );
}

function Badge({ children, className, variant = "secondary" }: any) {
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
      variant === "secondary" ? "bg-white/5 text-white/40" : "bg-primary/10 text-primary border border-primary/20",
      className
    )}>
      {children}
    </span>
  );
}
