import { useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, ChevronRight, ChevronDown,
  Gavel, Lock, Send, CheckCircle2, Building2, UserX, FileText, DollarSign, Shield, Activity, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface LegalIssueCategory {
  id: string;
  title: string;
  icon: any;
  description: string;
  subcategories: {
    id: string;
    title: string;
    description: string;
  }[];
}

const ownerLegalIssueCategories: LegalIssueCategory[] = [
  {
    id: 'tenant-issues',
    title: 'Tenant Issues',
    icon: UserX,
    description: 'Problems with renters or occupants',
    subcategories: [
      { id: 'non-payment', title: 'Non-Payment of Rent', description: 'Tenant withholding payment' },
      { id: 'property-damage', title: 'Asset Damage', description: 'Physical property destruction' },
      { id: 'lease-violation', title: 'Lease Breaches', description: 'Failure to honor agreement' },
      { id: 'eviction-process', title: 'Legal Eviction', description: 'Priority removal proceedings' }
    ]
  },
  {
    id: 'contract-legal',
    title: 'Lease Matrix',
    icon: FileText,
    description: 'Binding agreement authority',
    subcategories: [
      { id: 'lease-creation', title: 'Strategic Lease Drafting', description: 'Elite legally binding contracts' },
      { id: 'contract-review', title: 'Asset Protection Review', description: 'Full risk assessment of terms' }
    ]
  },
  {
    id: 'property-legal',
    title: 'Asset Integrity',
    icon: Building2,
    description: 'Real Estate Rights',
    subcategories: [
      { id: 'property-sale', title: 'Sale Dispatch', description: 'Legal authority for asset exit' },
      { id: 'liability-protection', title: 'Lawsuit Shield', description: 'Total entity protection' }
    ]
  }
];

const OwnerLawyerServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<{ category: string; subcategory: string } | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lawyerContactRequested, setLawyerContactRequested] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    triggerHaptic('light');
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setSelectedIssue(null);
  };

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    triggerHaptic('medium');
    setSelectedIssue({ category: categoryId, subcategory: subcategoryId });
  };

  const handleSubmitRequest = async () => {
    if (!selectedIssue || !description.trim()) {
      toast.error('Select an issue category and describe the situation');
      return;
    }
    setIsSubmitting(true);
    triggerHaptic('success');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Owner Dispatch Confirmed');
  };

  return (
    <div className={cn("min-h-screen w-full transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC AMBIENCE */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="absolute top-[5%] left-[-15%] w-[70%] h-[40%] bg-purple-600/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-rose-500/30 blur-[110px] rounded-full" />
      </div>

      <div className="p-6 pt-24 pb-48 max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* 🛸 OWNER MEGA-HEADER */}
        <div className="flex flex-col gap-3">
           <PageHeader title="OWNER LAWYER HUB" showBack={true} />
           <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed max-w-sm", isLight ? "text-black" : "text-white")}> Professional Property Authority Matrix v14.0 </p>
        </div>

        {/* 🛸 AUTHORITY STATUS */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={cn("p-8 rounded-[2.8rem] border flex items-center justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.4rem] bg-purple-600 flex items-center justify-center shadow-2xl">
                   <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 italic">Registered Owner</p>
                   <h4 className={cn("text-xl font-black italic tracking-tighter uppercase leading-none mt-1", isLight ? "text-black" : "text-white")}>{user?.email?.split('@')[0]}</h4>
                </div>
             </div>
             <div className="bg-purple-600 px-4 py-2 rounded-full shadow-lg">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Matrix Verified</span>
             </div>
        </motion.div>

        {/* 🛸 DISPATCH CARD */}
        <motion.div 
          whileHover={{ y: -8 }}
          className={cn(
            "p-10 rounded-[3.5rem] border shadow-3xl overflow-hidden relative group",
            isLight ? "bg-black/5 border-black/5" : "bg-gradient-to-br from-purple-900/40 to-black border-purple-500/20"
          )}
        >
          <Building2 className="absolute -top-10 -right-10 w-48 h-48 opacity-5 -rotate-12 transition-transform group-hover:rotate-0 duration-700" />
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-24 h-24 bg-purple-500 rounded-[2.2rem] flex items-center justify-center shrink-0 shadow-3xl">
              <Gavel className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Elite Real Estate Dispatch</h3>
              <p className="text-white/60 text-[13px] font-bold leading-relaxed mb-8 max-w-lg italic">
                Connect with our specialized Property Law Authority. We will transmit your asset logs for immediate priority legal review.
              </p>
              <Button 
                onClick={() => { setLawyerContactRequested(true); toast.success("Dispatch Notification Transmitted"); triggerHaptic('success'); }}
                disabled={lawyerContactRequested}
                className="h-16 px-12 rounded-[2rem] bg-white hover:bg-white/90 text-purple-900 font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all"
              >
                {lawyerContactRequested ? "Contact Requested" : "DISPATCH AUTHORITY"}
              </Button>
            </div>
          </div>
        </motion.div>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("p-12 rounded-[3.5rem] border text-center space-y-8", isLight ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-500/5 border-emerald-500/10")}>
               <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10 text-white" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Transmission Confirmed</h3>
                  <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 max-w-xs mx-auto leading-relaxed">Asset logs have been successfully synced with the Property Authority Matrix. Await contact.</p>
               </div>
               <Button onClick={handleReset} className="h-16 px-12 rounded-[2rem] bg-purple-600 text-white font-black uppercase tracking-widest">Back to Hub</Button>
          </motion.div>
        ) : (
          <div className="space-y-12">
            
            {/* 🛸 CLASSIFICATION MATRIX */}
            <div className="space-y-6">
               <div className="flex items-center gap-4 px-2">
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Asset Case Hub</span>
                  <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
               </div>
               
               <div className={cn("rounded-[3rem] overflow-hidden border shadow-3xl backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.03] border-white/5")}>
                  {ownerLegalIssueCategories.map((cat, idx) => (
                    <div key={cat.id}>
                       <button onClick={() => handleCategoryClick(cat.id)} className="w-full p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                                <cat.icon className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className={cn("text-lg font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>{cat.title}</h4>
                                <p className={cn("text-[9px] font-black uppercase tracking-widest mt-2 opacity-30", isLight ? "text-black" : "text-white")}>{cat.description}</p>
                             </div>
                          </div>
                          <ChevronDown className={cn("w-6 h-6 transition-transform duration-500", expandedCategory === cat.id ? "rotate-180 text-white" : "text-white/20")} />
                       </button>

                       <AnimatePresence>
                          {expandedCategory === cat.id && (
                             <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden", isLight ? "bg-black/[0.02]" : "bg-white/[0.02]")}>
                                {cat.subcategories.map(sub => (
                                   <button 
                                      key={sub.id} 
                                      onClick={() => handleSubcategorySelect(cat.id, sub.id)}
                                      className={cn(
                                        "w-full pl-24 pr-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-t",
                                        isLight ? "border-black/5" : "border-white/5",
                                        selectedIssue?.subcategory === sub.id ? "bg-purple-500/10" : ""
                                      )}
                                   >
                                      <div>
                                         <h5 className={cn("text-[14px] font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{sub.title}</h5>
                                         <p className={cn("text-[8px] font-black uppercase tracking-widest mt-1 opacity-20", isLight ? "text-black" : "text-white")}>{sub.description}</p>
                                      </div>
                                      <div className={cn("w-5 h-5 rounded-full border-4 transition-all", selectedIssue?.subcategory === sub.id ? "bg-purple-500 border-white/20 shadow-[0_0_10px_#8b5cf6]" : "border-white/10")} />
                                   </button>
                                ))}
                             </motion.div>
                          )}
                       </AnimatePresence>
                       {idx < ownerLegalIssueCategories.length - 1 && <div className={cn("h-[1px] mx-8", isLight ? "bg-black/5" : "bg-white/10")} />}
                    </div>
                  ))}
               </div>
            </div>

            {selectedIssue && (
               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className="flex items-center gap-4 px-2">
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Case Intelligence</span>
                      <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
                   </div>
                   
                   <div className={cn("p-10 rounded-[3rem] border backdrop-blur-3xl shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                           <MessageSquare className="w-5 h-5 text-purple-500" />
                           <h3 className={cn("text-xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Asset Incident Log</h3>
                        </div>
                        <Textarea
                          placeholder="TRANSMIT ASSET INCIDENTS (MAX 2000 CHARS)..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className={cn(
                            "min-h-[200px] rounded-[2rem] p-8 text-[14px] font-bold border transition-all resize-none outline-none",
                            isLight ? "bg-black/5 border-black/5 text-black" : "bg-white/[0.02] border-white/5 text-white placeholder:text-white/20 focus:border-white/20"
                          )}
                        />
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button onClick={handleReset} variant="ghost" className="h-16 rounded-[2rem] px-10 text-[10px] uppercase font-black tracking-widest opacity-40 hover:opacity-100">Cancel</Button>
                            <Button
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting || !description.trim()}
                                className="h-16 flex-1 rounded-[2rem] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic tracking-widest shadow-2xl shadow-purple-500/30"
                            >
                                {isSubmitting ? "SYNCING MATRIX..." : "TRANSMIT ASSET LOGS"}
                            </Button>
                        </div>
                      </div>
                   </div>
               </motion.div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerLawyerServices;

