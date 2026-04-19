import { useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Scale, MessageSquare, ChevronRight, ChevronDown,
  Gavel, Lock, Send, CheckCircle2, Home, DollarSign, Users, Sparkles, Activity
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

const legalIssueCategories: LegalIssueCategory[] = [
  {
    id: 'landlord-issues',
    title: 'Landlord Issues',
    icon: Home,
    description: 'Problems with property management',
    subcategories: [
      { id: 'lease-violation', title: 'Lease Violations', description: 'Breach of agreement terms' },
      { id: 'security-deposit', title: 'Security Deposits', description: 'Disputes over refunds' },
      { id: 'maintenance', title: 'Asset Maintenance', description: 'Failed property upkeep' },
      { id: 'illegal-entry', title: 'Privacy Intrusions', description: 'Unauthorized entries' }
    ]
  },
  {
    id: 'rent-issues',
    title: 'Payment Disputes',
    icon: DollarSign,
    description: 'Matrix payment errors',
    subcategories: [
      { id: 'rent-increase', title: 'Unlawful Increase', description: 'Rate changes without notice' },
      { id: 'hidden-fees', title: 'Hidden Extraction', description: 'Unexpected platform charges' },
      { id: 'late-fees', title: 'Excessive Penalties', description: 'Unfair late payment fees' }
    ]
  },
  {
    id: 'discrimination',
    title: 'Identity Rights',
    icon: Users,
    description: 'Protection & Integrity',
    subcategories: [
      { id: 'housing-discrimination', title: 'Discrimination', description: 'Bias in selection process' },
      { id: 'harassment', title: 'Entity Harassment', description: 'Persistent unwanted contact' },
      { id: 'privacy-violation', title: 'Data Breaches', description: 'Private info exposure' }
    ]
  }
];

const ClientLawyerServices = () => {
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

  const handleReset = () => {
    triggerHaptic('light');
    setSelectedIssue(null);
    setDescription('');
    setExpandedCategory(null);
    setSubmitted(false);
  };

  const handleSubmitRequest = async () => {
    if (!selectedIssue || !description.trim()) {
      toast.error('Select an issue type and describe the situation');
      return;
    }
    setIsSubmitting(true);
    triggerHaptic('success');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Legal Help Dispatched');
  };

  return (
    <div className={cn("min-h-screen w-full transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC AMBIENCE */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="absolute top-[5%] left-[-10%] w-[60%] h-[40%] bg-blue-600/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-[#EB4898]/30 blur-[110px] rounded-full" />
      </div>

      <div className="p-6 pt-24 pb-48 max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* 🛸 NEXUS HEADER */}
        <div className="flex flex-col gap-3">
           <PageHeader title="LAWYER SERVICES" showBack={true} />
           <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed max-w-sm", isLight ? "text-black" : "text-white")}> Professional Legal Authority Matrix v14.0 </p>
        </div>

        {/* 🛸 IDENTITY SYNC STATUS */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={cn("p-8 rounded-[2.8rem] border flex items-center justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.4rem] bg-indigo-500 flex items-center justify-center shadow-2xl">
                   <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 italic">Verified Entity</p>
                   <h4 className={cn("text-xl font-black italic tracking-tighter uppercase leading-none mt-1", isLight ? "text-black" : "text-white")}>{user?.email?.split('@')[0]}</h4>
                </div>
             </div>
             <div className="bg-[#EB4898] px-4 py-2 rounded-full shadow-lg">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Sync Active</span>
             </div>
        </motion.div>

        {/* 🚩 DIRECT DISPATCH CARD */}
        <motion.div 
          whileHover={{ y: -8 }}
          className={cn(
            "p-10 rounded-[3.5rem] border shadow-3xl overflow-hidden relative group",
            isLight ? "bg-black/5 border-black/5" : "bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/20"
          )}
        >
          <Gavel className="absolute -top-10 -right-10 w-48 h-48 opacity-5 -rotate-12 transition-transform group-hover:rotate-0 duration-700" />
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-24 h-24 bg-indigo-500 rounded-[2.2rem] flex items-center justify-center shrink-0 shadow-3xl">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Urgent Dispatch</h3>
              <p className="text-white/60 text-[13px] font-bold leading-relaxed mb-8 max-w-lg italic">
                Connect directly with our specialized Legal Authority. We will transmit your identity logs for an immediate priority case review.
              </p>
              <Button 
                onClick={() => { setLawyerContactRequested(true); toast.success("Dispatch Notification Sent"); triggerHaptic('success'); }}
                disabled={lawyerContactRequested}
                className="h-16 px-12 rounded-[2rem] bg-white hover:bg-white/90 text-indigo-900 font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all"
              >
                {lawyerContactRequested ? "Contact Requested" : "DISPATCH NOW"}
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
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Request Confirmed</h3>
                  <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 max-w-xs mx-auto leading-relaxed">System logs have been successfully transmitted to the Legal Matrix. Await contact.</p>
               </div>
               <Button onClick={handleReset} className="h-16 px-12 rounded-[2rem] bg-[#EB4898] text-white font-black uppercase tracking-widest">Back to Hub</Button>
          </motion.div>
        ) : (
          <div className="space-y-12">
            
            {/* 🛸 MATRIX CATEGORIES */}
            <div className="space-y-6">
               <div className="flex items-center gap-4 px-2">
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Case Classification</span>
                  <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
               </div>
               
               <div className={cn("rounded-[3rem] overflow-hidden border shadow-3xl backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.03] border-white/5")}>
                  {legalIssueCategories.map((cat, idx) => (
                    <div key={cat.id}>
                       <button onClick={() => handleCategoryClick(cat.id)} className="w-full p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
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
                                        selectedIssue?.subcategory === sub.id ? "bg-indigo-500/10" : ""
                                      )}
                                   >
                                      <div>
                                         <h5 className={cn("text-[14px] font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{sub.title}</h5>
                                         <p className={cn("text-[8px] font-black uppercase tracking-widest mt-1 opacity-20", isLight ? "text-black" : "text-white")}>{sub.description}</p>
                                      </div>
                                      <div className={cn("w-5 h-5 rounded-full border-4 transition-all", selectedIssue?.subcategory === sub.id ? "bg-indigo-500 border-white/20 shadow-[0_0_10px_#6366f1]" : "border-white/10")} />
                                   </button>
                                ))}
                             </motion.div>
                          )}
                       </AnimatePresence>
                       {idx < legalIssueCategories.length - 1 && <div className={cn("h-[1px] mx-8", isLight ? "bg-black/5" : "bg-white/10")} />}
                    </div>
                  ))}
               </div>
            </div>

            {selectedIssue && (
               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className="flex items-center gap-4 px-2">
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Issue Analysis</span>
                      <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
                   </div>
                   
                   <div className={cn("p-10 rounded-[3rem] border backdrop-blur-3xl shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                           <MessageSquare className="w-5 h-5 text-[#EB4898]" />
                           <h3 className={cn("text-xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Case Description</h3>
                        </div>
                        <Textarea
                          placeholder="TRANSMIT CASE LOGS (MAX 2000 CHARS)..."
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
                                className="h-16 flex-1 rounded-[2rem] bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase italic tracking-widest shadow-2xl shadow-indigo-500/30"
                            >
                                {isSubmitting ? "TRANSMITTING..." : "DISPATCH CASE LOGS"}
                            </Button>
                        </div>
                      </div>
                   </div>
               </motion.div>
            )}

            {/* Matrix Logic */}
            <div className={cn("p-10 rounded-[3.5rem] border backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.02] border-white/[0.05]")}>
              <h4 className={cn("text-lg font-black uppercase italic tracking-tighter mb-8", isLight ? "text-black" : "text-white")}>Authority Framework</h4>
              <div className="grid gap-10">
                {[
                  { id: 1, label: 'CLASSIFICATION', desc: 'Identify the specific legal category that matches your event.' },
                  { id: 2, label: 'DESCRIPTION', desc: 'Describe the situation in technical detail for our matrix review.' },
                  { id: 3, label: 'DISPATCH', desc: 'Execute the transmission. Our authority team will initialize case sync.' },
                ].map(step => (
                   <div key={step.id} className="flex gap-6">
                      <div className="w-12 h-12 rounded-full border border-indigo-500/40 flex items-center justify-center shrink-0">
                         <span className="text-indigo-500 font-black italic">{step.id}</span>
                      </div>
                      <div>
                         <h5 className={cn("text-[10px] font-black uppercase tracking-[0.3em] italic", isLight ? "text-black" : "text-white")}>{step.label}</h5>
                         <p className={cn("text-[11px] font-bold opacity-30 mt-1 leading-relaxed italic", isLight ? "text-black" : "text-white")}>{step.desc}</p>
                      </div>
                   </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ClientLawyerServices;
