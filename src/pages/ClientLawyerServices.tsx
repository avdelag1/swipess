/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Scale, Clock, MessageSquare, ChevronRight, ChevronDown,
  ArrowLeft, AlertTriangle, FileText, Home, DollarSign,
  Users, Gavel, Lock, Send, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface LegalIssueCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
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
    icon: <Home className="w-5 h-5" />,
    description: 'Problems with your landlord or property owner',
    subcategories: [
      { id: 'lease-violation', title: 'Lease Violations', description: 'Landlord not following the lease terms' },
      { id: 'security-deposit', title: 'Security Deposit Disputes', description: 'Issues recovering your deposit' },
      { id: 'maintenance', title: 'Maintenance Issues', description: 'Landlord not maintaining the property' },
      { id: 'illegal-entry', title: 'Illegal Entry', description: 'Landlord entering without notice' },
      { id: 'eviction', title: 'Wrongful Eviction', description: 'Being evicted unfairly or illegally' }
    ]
  },
  {
    id: 'rent-issues',
    title: 'Rent & Payment Issues',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Disputes about rent payments or charges',
    subcategories: [
      { id: 'rent-increase', title: 'Unlawful Rent Increase', description: 'Rent raised without proper notice' },
      { id: 'hidden-fees', title: 'Hidden Fees', description: 'Unexpected charges not in the lease' },
      { id: 'payment-disputes', title: 'Payment Disputes', description: 'Disagreements about amounts paid' },
      { id: 'late-fees', title: 'Excessive Late Fees', description: 'Unfair late payment penalties' }
    ]
  },
  {
    id: 'contract-issues',
    title: 'Contract & Agreement Issues',
    icon: <FileText className="w-5 h-5" />,
    description: 'Problems with rental agreements or contracts',
    subcategories: [
      { id: 'unfair-terms', title: 'Unfair Contract Terms', description: 'One-sided or illegal clauses' },
      { id: 'contract-review', title: 'Contract Review', description: 'Need help understanding terms' },
      { id: 'contract-breach', title: 'Contract Breach', description: 'Other party not honoring agreement' },
      { id: 'early-termination', title: 'Early Termination', description: 'Need to break lease early' }
    ]
  },
  {
    id: 'discrimination',
    title: 'Discrimination & Rights',
    icon: <Users className="w-5 h-5" />,
    description: 'Discrimination or rights violations',
    subcategories: [
      { id: 'housing-discrimination', title: 'Housing Discrimination', description: 'Denied housing unfairly' },
      { id: 'harassment', title: 'Harassment', description: 'Being harassed by landlord' },
      { id: 'privacy-violation', title: 'Privacy Violations', description: 'Your privacy being invaded' },
      { id: 'accessibility', title: 'Accessibility Issues', description: 'Disability accommodation problems' }
    ]
  },
  {
    id: 'other-legal',
    title: 'Other Legal Matters',
    icon: <Gavel className="w-5 h-5" />,
    description: 'Other legal questions or concerns',
    subcategories: [
      { id: 'general-advice', title: 'General Legal Advice', description: 'General questions about tenant rights' },
      { id: 'document-help', title: 'Document Assistance', description: 'Help with legal documents' },
      { id: 'mediation', title: 'Mediation Request', description: 'Need third-party mediation' },
      { id: 'other', title: 'Other Issue', description: 'Issue not listed above' }
    ]
  }
];

const ClientLawyerServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<{ category: string; subcategory: string } | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lawyerContactRequested, setLawyerContactRequested] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setSelectedIssue(null);
  };

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    setSelectedIssue({ category: categoryId, subcategory: subcategoryId });
  };

  const handleSubmitRequest = async () => {
    if (!selectedIssue || !description.trim()) {
      toast.error('Please select an issue type and provide a description');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Legal help request submitted!');
  };

  const handleReset = () => {
    setSelectedIssue(null);
    setDescription('');
    setSubmitted(false);
    setExpandedCategory(null);
  };

  return (
    <div className="w-full min-h-screen overflow-x-hidden p-6 pt-24 pb-48 scrollbar-hide bg-background relative selection:bg-rose-500/30">
      
      {/* 🛸 BACKGROUND GLOWS */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-rose-500/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[30%] bg-indigo-500/20 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* 🛸 Swipess HEADER */}
        <div className="space-y-4">
           <PageHeader title="LAWYER SERVICES" showBack={true} />
           <div className="flex flex-col gap-1 px-1">
             <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed max-w-sm", isLight ? "text-black" : "text-white")}>
               Professional Legal Authority Matrix v14.0
             </p>
             
             {/* 🛸 AUTHORIZATION BADGE */}
             <div className={cn("mt-4 flex items-center justify-between px-6 py-4 rounded-[1.8rem] border backdrop-blur-3xl shadow-xl transition-all", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1rem] bg-rose-500/20 flex items-center justify-center text-rose-500 font-black italic border border-rose-500/30 shadow-inner">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className={cn("text-[9px] uppercase tracking-[0.3em] font-black opacity-30", isLight ? "text-black" : "text-white")}>Authorized Identity</p>
                    <h4 className={cn("text-[13px] font-black italic tracking-tight truncate max-w-[150px] sm:max-w-none", isLight ? "text-black" : "text-white")}>{user?.email}</h4>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic">
                  Verified Matrix
                </Badge>
             </div>
           </div>
        </div>

        {/* 🛸 DIRECT LAWYER CONTACT */}
        <Card className={cn("rounded-[2.5rem] overflow-hidden border shadow-3xl relative group", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
          {/* Animated Background Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
          
          <CardContent className="p-8 sm:p-12 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-24 h-24 bg-blue-500/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-blue-500/30 shadow-2xl animate-pulse">
                <Gavel className="w-10 h-10 text-blue-400" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Direct Lawyer Consultation</h3>
                <p className={cn("text-[13px] font-bold tracking-tight leading-relaxed max-w-lg opacity-60", isLight ? "text-black" : "text-white")}>
                  Initiate a secure telemetry link with our specialized rental authority. We will dispatch your verified identity details for an immediate case audit.
                </p>
                <div className="pt-2">
                  <Button 
                    onClick={() => {
                      setLawyerContactRequested(true);
                      toast.success("Notification sent! A lawyer will contact you shortly.");
                      triggerHaptic('success');
                    }}
                    disabled={lawyerContactRequested}
                    className={cn(
                      "h-14 px-10 rounded-2xl font-black uppercase italic tracking-[0.2em] text-[11px] transition-all shadow-xl active:scale-95",
                      lawyerContactRequested 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    )}
                  >
                    {lawyerContactRequested ? (
                      <><CheckCircle2 className="w-4 h-4 mr-3" /> Link Established</>
                    ) : (
                      "Contact Personal Lawyer"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Info */}
        <div className={cn("rounded-[2rem] p-8 border backdrop-blur-3xl flex items-start gap-6", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
          <div className="w-12 h-12 rounded-[1.2rem] bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
             <Lock className="w-6 h-6 text-purple-400" />
          </div>
          <div className="space-y-3">
            <h3 className={cn("text-base font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>Premium Legal Service</h3>
            <p className={cn("text-[12px] font-bold tracking-tight opacity-40 leading-relaxed", isLight ? "text-black" : "text-white")}>
              To receive a high-fidelity personalized legal solution, please select a consultation matrix below.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Badge variant="outline" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-purple-500/20 text-purple-400 bg-purple-500/5">Basic Consultation</Badge>
              <Badge variant="outline" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-purple-500/20 text-purple-400 bg-purple-500/5">Document Review</Badge>
              <Badge variant="outline" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-purple-500/20 text-purple-400 bg-purple-500/5">Full Representation</Badge>
            </div>
          </div>
        </div>

        {submitted ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <Card className={cn("max-w-xl w-full rounded-[3rem] overflow-hidden border shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
              <CardContent className="p-12 text-center space-y-8">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-2xl border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="space-y-3">
                  <h3 className={cn("text-3xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Matrix Updated!</h3>
                  <p className={cn("text-[14px] font-bold tracking-tight opacity-60 leading-relaxed", isLight ? "text-black" : "text-white")}>
                    Your legal help request has been dispatched to the authority matrix. Our team will audit your case and get back to you with available protocols.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button variant="outline" onClick={handleReset} className={cn("h-14 px-8 rounded-2xl font-black uppercase italic tracking-widest text-[11px]", isLight ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10")}>
                    New Request
                  </Button>
                  <Button onClick={() => navigate('/client/settings')} className="h-14 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase italic tracking-widest text-[11px] shadow-xl">
                    Exit Terminal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Issue Selection */}
            <div className="space-y-6">
              <div className="px-1 flex items-center gap-4">
                <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Issue Selection Matrix</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
              </div>

              <div className={cn("rounded-[2.8rem] overflow-hidden border shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                <ScrollArea className="max-h-[500px] scrollbar-hide">
                  <div className="divide-y divide-white/5">
                    {legalIssueCategories.map((category) => (
                      <div key={category.id}>
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className={cn("w-full p-6 flex items-center gap-6 transition-all text-left group hover:bg-white/[0.02]", expandedCategory === category.id && "bg-white/[0.02]")}
                        >
                          <div className="w-14 h-14 bg-indigo-500/20 rounded-[1.2rem] flex items-center justify-center shrink-0 text-indigo-400 border border-indigo-500/30 shadow-xl group-hover:scale-110 transition-transform">
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className={cn("text-[15px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{category.title}</h4>
                            <p className={cn("text-[11px] font-bold uppercase tracking-widest opacity-30 truncate", isLight ? "text-black" : "text-white")}>{category.description}</p>
                          </div>
                          {expandedCategory === category.id ? (
                            <ChevronDown className="w-6 h-6 opacity-20" />
                          ) : (
                            <ChevronRight className="w-6 h-6 opacity-20" />
                          )}
                        </button>

                        <AnimatePresence>
                          {expandedCategory === category.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                              className="overflow-hidden"
                            >
                              <div className={cn("p-4 space-y-2", isLight ? "bg-black/[0.02]" : "bg-white/[0.02]")}>
                                {category.subcategories.map((sub) => (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleSubcategorySelect(category.id, sub.id)}
                                    className={cn(
                                      "w-full ml-2 mr-2 p-5 rounded-[1.5rem] flex items-center gap-5 transition-all text-left border border-transparent",
                                      selectedIssue?.subcategory === sub.id 
                                        ? "bg-rose-500/20 border-rose-500/30 shadow-lg" 
                                        : "hover:bg-white/5"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                      selectedIssue?.subcategory === sub.id
                                        ? "border-rose-500 bg-rose-500 shadow-glow"
                                        : "border-white/20"
                                    )}>
                                      {selectedIssue?.subcategory === sub.id && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                      <h5 className={cn("text-[13px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{sub.title}</h5>
                                      <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-30", isLight ? "text-black" : "text-white")}>{sub.description}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Description Input */}
            <AnimatePresence>
              {selectedIssue && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="pt-4"
                >
                  <Card className={cn("rounded-[2.8rem] overflow-hidden border shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className={cn("text-xl font-black uppercase italic tracking-tighter flex items-center gap-3", isLight ? "text-black" : "text-white")}>
                        <MessageSquare className="w-6 h-6 text-rose-500" />
                        Audit Description
                      </CardTitle>
                      <CardDescription className={cn("text-[11px] font-bold uppercase tracking-widest opacity-40 italic", isLight ? "text-black" : "text-white")}>
                        Provide mission-critical details for the legal audit matrix
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-8">
                      <div className="space-y-3">
                        <Label htmlFor="description" className={cn("text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-1", isLight ? "text-black" : "text-white")}>Case Protocol Message</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the incident, timestamps, and all relevant telemetry..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={6}
                          className={cn(
                            "rounded-[1.8rem] border p-6 text-[14px] font-bold tracking-tight transition-all focus:ring-2 focus:ring-rose-500/50 outline-none placeholder:opacity-20",
                            isLight ? "bg-white border-black/10 text-black" : "bg-black/40 border-white/10 text-white"
                          )}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          className={cn("h-14 flex-1 rounded-2xl font-black uppercase italic tracking-widest text-[11px]", isLight ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10")}
                        >
                          Reset Audit
                        </Button>
                        <Button
                          onClick={handleSubmitRequest}
                          disabled={isSubmitting || !description.trim()}
                          className="h-14 flex-[2] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase italic tracking-widest text-[11px] shadow-xl active:scale-95 transition-all"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3" />
                              Transmitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-3" />
                              Dispatch Request
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* 🛸 HOW IT WORKS - TERMINAL LOGS STYLE */}
        <div className="space-y-6 pt-10">
           <div className="px-1 flex items-center gap-4">
              <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Resolution Protocol</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
           </div>

           <div className={cn("rounded-[2.8rem] p-10 border shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-10", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             {[
               { id: '01', title: 'Category Sync', desc: 'Identify the specific legal category within the authority matrix.' },
               { id: '02', title: 'Case Audit', desc: 'Provide mission-critical details for immediate situation analysis.' },
               { id: '03', title: 'Matrix Response', desc: 'Our elite legal team reviews and dispatches resolution options.' },
               { id: '04', title: 'Protocol Activation', desc: 'Activate a legal package for full representing authority.' }
             ].map((step) => (
               <div key={step.id} className="flex gap-6 group">
                 <div className="w-12 h-12 rounded-[1rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 font-black italic shadow-inner transition-transform group-hover:scale-110">
                   {step.id}
                 </div>
                 <div className="space-y-1">
                   <h4 className={cn("text-sm font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{step.title}</h4>
                   <p className={cn("text-[11px] font-bold tracking-tight opacity-40 leading-relaxed", isLight ? "text-black" : "text-white")}>{step.desc}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
      
      {/* 🛸 FIXED TELEMETRY TAG */}
      <p className="fixed bottom-6 right-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Legal Terminal v14.0</p>
    </div>
  );
};

export default ClientLawyerServices;
