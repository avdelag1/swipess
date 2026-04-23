import { useState, useMemo } from 'react';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Scale, MessageSquare, ChevronRight, ChevronDown,
  FileText, Home, DollarSign,
  Users, Gavel, Lock, Send, CheckCircle2,
  Building2, UserX, Briefcase, Shield, ChevronLeft, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { useActiveMode } from '@/hooks/useActiveMode';
import { ArrowLeft, ShieldCheck, Database, Eye, Globe, UserCheck, User } from "lucide-react";

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

const clientLegalCategories: LegalIssueCategory[] = [
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
  }
];

const ownerLegalCategories: LegalIssueCategory[] = [
  {
    id: 'tenant-issues',
    title: 'Tenant Issues',
    icon: <UserX className="w-5 h-5" />,
    description: 'Problems with tenants or renters',
    subcategories: [
      { id: 'non-payment', title: 'Non-Payment of Rent', description: 'Tenant not paying rent on time' },
      { id: 'property-damage', title: 'Property Damage', description: 'Tenant damaged the property' },
      { id: 'lease-violation', title: 'Lease Violations', description: 'Tenant breaking lease terms' },
      { id: 'eviction-process', title: 'Eviction Process', description: 'Need help with legal eviction' }
    ]
  },
  {
    id: 'contract-legal',
    title: 'Lease & Contract Agreements',
    icon: <FileText className="w-5 h-5" />,
    description: 'Legal help with contracts and leases',
    subcategories: [
      { id: 'lease-creation', title: 'Lease Agreement Creation', description: 'Create legally binding leases' },
      { id: 'contract-review', title: 'Contract Review', description: 'Review existing agreements' },
      { id: 'rental-rules', title: 'Rental Rules Documentation', description: 'Create enforceable property rules' }
    ]
  },
  {
    id: 'property-legal',
    title: 'Property & Real Estate',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Legal matters related to property',
    subcategories: [
      { id: 'property-sale', title: 'Property Sale Assistance', description: 'Legal help selling property' },
      { id: 'zoning-permits', title: 'Zoning & Permits', description: 'Rental zoning questions' },
      { id: 'liability-protection', title: 'Liability Protection', description: 'Protect yourself from lawsuits' }
    ]
  },
  {
    id: 'financial-legal',
    title: 'Financial & Tax',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Financial and tax-related legal matters',
    subcategories: [
      { id: 'security-deposit', title: 'Security Deposit Issues', description: 'Deposit return disputes' },
      { id: 'rent-collection', title: 'Rent Collection', description: 'Legal collection methods' },
      { id: 'tax-compliance', title: 'Tax Compliance', description: 'Rental income tax questions' }
    ]
  }
];

const LegalHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, isLight } = useAppTheme();
  const { activeMode } = useActiveMode();
  
  const isOwner = activeMode === 'owner';
  const categories = isOwner ? ownerLegalCategories : clientLegalCategories;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const docParam = searchParams.get('doc') as 'privacy' | 'terms' | 'agl' | null;
  const currentDoc = docParam || 'hub';
  
  const setCurrentDoc = (doc: 'hub' | 'privacy' | 'terms' | 'agl') => {
    if (doc === 'hub') {
      setSearchParams({});
    } else {
      setSearchParams({ doc });
    }
  };

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

  const handleReset = () => {
    setSubmitted(false);
    setSelectedIssue(null);
    setDescription('');
    setExpandedCategory(null);
    setCurrentDoc('hub');
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
    toast.success('Legal help request submitted! 🚀');
  };

  const currentCategory = useMemo(() => 
    categories.find(c => c.id === selectedIssue?.category),
    [categories, selectedIssue]
  );

  const currentSubcategory = useMemo(() => 
    currentCategory?.subcategories.find(s => s.id === selectedIssue?.subcategory),
    [currentCategory, selectedIssue]
  );

  return (
    <div className="w-full min-h-screen bg-background relative selection:bg-rose-500/30 overflow-x-hidden">
      
      {/* 🛸 ATMOSPHERIC ATMOSPHERE */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
         <div className={cn(
           "absolute top-[-10%] left-[-10%] w-[60%] h-[40%] blur-[130px] rounded-full",
           isOwner ? "bg-purple-500/30" : "bg-rose-500/30"
         )} />
         <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[30%] bg-indigo-500/20 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 HEADER */}
        <div className="space-y-4">
           <PageHeader 
             title={isOwner ? "OWNER LEGAL HUB" : "TENANT LEGAL HUB"} 
             showBack={true} 
           />
            <div className="flex flex-col gap-1 px-1">
              <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed", isLight ? "text-black" : "text-white")}>
                Professional Legal Authority Matrix v15.0
              </p>
              
              {/* 🛸 LEGAL HERO VISUAL */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 relative w-full h-48 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl"
              >
                <QuickFilterImage 
                  src="/images/filters/owner_lawyer_card.png" 
                  alt="Legal Authority"
                  className="opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Live Legal Protocol Active</span>
                  </div>
                </div>
              </motion.div>

              {/* 🛸 AUTHORIZATION STATUS */}
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={cn(
                 "mt-6 p-6 rounded-[2rem] border backdrop-blur-3xl flex items-center justify-between transition-all",
                 isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5"
               )}
             >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-white font-black italic shadow-2xl transition-transform",
                    isOwner ? "bg-purple-600 shadow-purple-500/20" : "bg-rose-600 shadow-rose-500/20"
                  )}>
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <p className={cn("text-[9px] uppercase tracking-[0.4em] font-black opacity-30", isLight ? "text-black" : "text-white")}>Verified Account</p>
                    <h4 className={cn("text-[15px] font-black italic tracking-tighter truncate max-w-[150px] sm:max-w-none uppercase", isLight ? "text-black" : "text-white")}>
                      {user?.email?.split('@')[0]}
                    </h4>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border-none",
                  isOwner ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
                )}>
                  {isOwner ? "Owner Mode" : "Tenant Mode"}
                </Badge>
             </motion.div>
           </div>
        </div>

        {/* 🛸 DIRECT DISPATCH CARD */}
        <Card className={cn(
          "rounded-[2.8rem] overflow-hidden border shadow-3xl relative group transition-all duration-500",
          isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5"
        )}>
          {/* Dynamic Gradient Background */}
          <div className={cn(
            "absolute -inset-1 blur-2xl opacity-30 transition duration-1000",
            isOwner ? "bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20" : "bg-gradient-to-r from-blue-500/20 via-rose-500/20 to-blue-500/20"
          )} />
          
          <CardContent className="p-8 sm:p-12 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className={cn(
                "w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border shadow-2xl animate-pulse transition-colors duration-500",
                isOwner ? "bg-purple-500/20 border-purple-500/30" : "bg-blue-500/20 border-blue-500/30"
              )}>
                <Gavel className={cn("w-10 h-10", isOwner ? "text-purple-400" : "text-blue-400")} />
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>
                  Direct Lawyer Consultation
                </h3>
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
                        : (isOwner ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white")
                    )}
                  >
                    {lawyerContactRequested ? (
                      <><CheckCircle2 className="w-4 h-4 mr-3" /> Request Sent</>
                    ) : (
                      "Contact Authorized Lawyer"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentDoc === 'hub' ? (
          submitted ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <Card className={cn("max-w-xl w-full rounded-[3.5rem] overflow-hidden border shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
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
                    <Button onClick={() => navigate(isOwner ? '/owner/dashboard' : '/client/dashboard')} className={cn("h-14 px-8 rounded-2xl text-white font-black uppercase italic tracking-widest text-[11px] shadow-xl", isOwner ? "bg-purple-600" : "bg-rose-600")}>
                      Return to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-12">
              {/* Category Selection */}
              <div className="space-y-6">
                <div className="px-1 flex items-center gap-4">
                  <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Authority Matrix</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
                </div>

                <div className={cn("rounded-[2.8rem] overflow-hidden border shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                  <ScrollArea className="max-h-[500px]">
                    <div className={cn("divide-y", isLight ? "divide-black/10" : "divide-white/5")}>
                      {categories.map((category) => (
                        <div key={category.id}>
                          <button
                            onClick={() => handleCategoryClick(category.id)}
                            className={cn(
                              "w-full p-8 flex items-center gap-6 transition-all text-left group",
                              expandedCategory === category.id 
                                ? (isLight ? "bg-black/5" : "bg-white/[0.04]") 
                                : (isLight ? "hover:bg-black/[0.02]" : "hover:bg-white/[0.02]")
                            )}
                          >
                            <div className={cn(
                              "w-14 h-14 rounded-[1.2rem] flex items-center justify-center shrink-0 border shadow-xl group-hover:scale-110 transition-transform",
                              isOwner ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            )}>
                              {category.icon}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className={cn("text-lg font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{category.title}</h4>
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
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="overflow-hidden bg-black/5"
                              >
                                <div className="p-4 space-y-2">
                                  {category.subcategories.map((sub) => (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleSubcategorySelect(category.id, sub.id)}
                                      className={cn(
                                        "w-full p-5 rounded-[1.5rem] flex items-center gap-5 transition-all text-left border border-transparent",
                                        selectedIssue?.subcategory === sub.id 
                                          ? (isOwner ? "bg-purple-500/20 border-purple-500/30 shadow-lg" : "bg-rose-500/20 border-rose-500/30 shadow-lg")
                                          : "hover:bg-white/5"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedIssue?.subcategory === sub.id
                                          ? (isOwner ? "border-purple-500 bg-purple-500" : "border-rose-500 bg-rose-500")
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
                    className="space-y-6 pt-4"
                  >
                     <div className="px-1 flex items-center gap-4">
                      <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Case Protocol</span>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
                    </div>

                    <Card className={cn("rounded-[3rem] overflow-hidden border shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                      <CardHeader className="p-8 pb-4">
                        <CardTitle className={cn("text-xl font-black uppercase italic tracking-tighter flex items-center gap-4", isLight ? "text-black" : "text-white")}>
                          <MessageSquare className={cn("w-7 h-7", isOwner ? "text-purple-500" : "text-rose-500")} />
                          Audit Intelligence
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 pt-4 space-y-8">
                        <div className="space-y-4">
                          <div className={cn("p-4 rounded-2xl flex items-center gap-4 border", isLight ? "bg-black/[0.03] border-black/5" : "bg-white/[0.03] border-white/5")}>
                             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isOwner ? "bg-purple-500/20 text-purple-400" : "bg-rose-500/20 text-rose-400")}>
                               {currentCategory?.icon}
                             </div>
                             <div>
                               <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-30", isLight ? "text-black" : "text-white")}>Target Issue</p>
                               <h4 className={cn("text-[13px] font-black uppercase italic", isLight ? "text-black" : "text-white")}>{currentSubcategory?.title}</h4>
                             </div>
                          </div>

                          <Textarea
                            id="description"
                            placeholder="Describe the incident, timestamps, and all relevant telemetry..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className={cn(
                              "rounded-[2rem] border p-8 text-[15px] font-bold tracking-tight transition-all focus:ring-2 outline-none placeholder:opacity-20",
                              isOwner ? "focus:ring-purple-500/50" : "focus:ring-rose-500/50",
                              isLight ? "bg-white border-black/10 text-black" : "bg-black/40 border-white/10 text-white"
                            )}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            variant="ghost"
                            onClick={handleReset}
                            className={cn("h-16 flex-1 rounded-[2rem] font-black uppercase italic tracking-widest text-[11px]", isLight ? "hover:bg-black/5" : "hover:bg-white/5")}
                          >
                            Reset Audit
                          </Button>
                          <Button
                            onClick={handleSubmitRequest}
                            disabled={isSubmitting || !description.trim()}
                            className={cn(
                              "h-16 flex-[2] rounded-[2rem] text-white font-black uppercase italic tracking-widest text-[11px] shadow-2xl transition-all active:scale-95",
                              isOwner ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/30" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
                            )}
                          >
                            {isSubmitting ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            ) : (
                              <>
                                <Send className="w-5 h-5 mr-3" />
                                Dispatch Case to Matrix
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Operation Protocol */}
              <div className="space-y-6 pt-10">
                <div className="px-1 flex items-center gap-4">
                    <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Resolution Protocol</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
                </div>

                <div className={cn(
                  "rounded-[3rem] p-10 border shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-10", 
                  isLight ? "bg-white border-black/5 shadow-sm" : "bg-white/[0.04] border-white/5"
                )}>
                  {[
                    { id: '01', title: 'Matrix Sync', desc: 'Identify the specific legal category within the authority matrix.' },
                    { id: '02', title: 'Case Audit', desc: 'Provide mission-critical details for immediate situation analysis.' },
                    { id: '03', title: 'Expert Match', desc: 'Our elite legal team reviews and dispatches resolution options.' },
                    { id: '04', title: 'Secure Link', desc: 'Your assigned lawyer initiates contact via secure terminal.' }
                  ].map((step) => (
                    <div key={step.id} className="flex gap-6 group">
                      <div className={cn(
                        "w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 font-black italic shadow-inner transition-transform group-hover:scale-110 border",
                        isOwner ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      )}>
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

              {/* 🛸 LEGAL DOCUMENTS */}
              <div className="space-y-6 pt-10">
                <div className="px-1 flex items-center gap-4">
                    <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Legal Protocols</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
                </div>

                <div className={cn(
                  "rounded-[3rem] border shadow-3xl overflow-hidden", 
                  isLight ? "bg-white border-black/5 shadow-sm" : "bg-white/[0.04] border-white/5"
                )}>
                  {[
                    { icon: FileText, label: 'Terms of Service', doc: 'terms', color: 'text-blue-500' },
                    { icon: Shield, label: 'Privacy Policy', doc: 'privacy', color: 'text-rose-500' },
                    { icon: BookOpen, label: 'Acceptable Use (AGL)', doc: 'agl', color: 'text-purple-500' },
                    { icon: Scale, label: 'Contracts Matrix', path: isOwner ? '/owner/contracts' : '/client/contracts', color: 'text-emerald-500' },
                  ].map((item, idx, arr) => (
                    <div key={item.label}>
                      <button
                        onClick={() => { 
                          triggerHaptic('tap'); 
                          if (item.doc) {
                            setCurrentDoc(item.doc as any);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          } else if (item.path) {
                            navigate(item.path);
                          }
                        }}
                        className="w-full flex items-center gap-6 p-6 hover:bg-white/[0.02] transition-all text-left group"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 border", 
                          isLight ? "bg-black/5 border-black/5" : "bg-white/[0.03] border-white/5",
                          item.color
                        )}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className={cn("text-sm font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{item.label}</div>
                          <div className={cn("text-[10px] font-bold uppercase tracking-widest opacity-30 mt-0.5", isLight ? "text-black" : "text-white")}>Execute Document Matrix</div>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-20" />
                      </button>
                      {idx < arr.length - 1 && <div className={cn("h-[1px] w-full", isLight ? "bg-black/10" : "bg-white/5")} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Inline Document Viewer */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <button 
              onClick={() => setCurrentDoc('hub')}
              className={cn(
                "flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] italic mb-8 hover:opacity-70 transition-opacity",
                isOwner ? "text-purple-500" : "text-rose-500"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Back to Matrix
            </button>

            <div className="space-y-4">
              <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                {currentDoc === 'privacy' && "Privacy Policy"}
                {currentDoc === 'terms' && "Terms of Service"}
                {currentDoc === 'agl' && "Acceptable Use"}
              </h1>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={cn(
                  "px-3 py-1 text-[9px] font-black uppercase tracking-widest italic border-none",
                  isOwner ? "bg-purple-500/10 text-purple-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  Official Protocol
                </Badge>
                <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-30 italic", isLight ? "text-black" : "text-white")}>
                  Last Updated: Nov 2025
                </span>
              </div>
            </div>

            <Card className={cn("p-10 rounded-[3.5rem] border shadow-3xl backdrop-blur-3xl", isLight ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/5")}>
              <div className="space-y-16">
                {currentDoc === 'privacy' && [
                  { id: '01', icon: Database, title: 'Information We Collect', content: 'We collect information you provide directly: Profile details (name, photos, bio), search criteria, messages, property listings, and secure payment data.' },
                  { id: '02', icon: Eye, title: 'How We Use Your Information', content: 'Information is used to optimize the discovery experience, connect property owners with potential clients, process transactions, and maintain platform security.' },
                  { id: '03', icon: Globe, title: 'Data Sharing and Disclosure', content: 'Profile data is visible to other users for matching. We share data with trusted infrastructure partners (Supabase, Google) only as required for service operation.' },
                  { id: '04', icon: CheckCircle2, title: 'Your Rights and Choices', content: 'You maintain absolute control over your personal information. Access, correction, and permanent deletion of account and data are available via Profile Settings.' },
                  { id: '05', icon: Lock, title: 'Security Protocol', content: 'We implement high-standard SSL, OAuth 2.0 encryption, and regular security audits to maintain the total integrity of your information.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                      <span className={cn("text-[10px] font-black font-mono tracking-widest px-3 py-1 rounded-lg", isOwner ? "bg-purple-500/10 text-purple-500" : "bg-rose-500/10 text-rose-500")}>ARTICLE {section.id}</span>
                      <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <section.icon className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} />
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                    </div>
                    <p className={cn("text-[14px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity", isLight ? "text-black" : "text-white")}>
                      {section.content}
                    </p>
                  </section>
                ))}

                {currentDoc === 'terms' && [
                  { id: '01', icon: Gavel, title: 'Acceptance of Terms', content: 'By accessing or using the Swipess application, you agree to be bound by these Legal Terms and our Privacy Policy. Access is strictly restricted to compliant users.' },
                  { id: '02', icon: UserCheck, title: 'User Eligibility', content: 'You must be at least 18 years of age and possess the full legal capacity to enter into binding digital agreements to utilize our services.' },
                  { id: '03', icon: CheckCircle2, title: 'Account Security', content: 'You are exclusively responsible for the confidentiality and security of your account credentials. You must notify us immediately of any unauthorized access.' },
                  { id: '04', icon: Scale, title: 'Prohibited Actions', content: 'Users shall not post fraudulent information, harass others, or attempt to circumvent platform security. Violations result in immediate permanent account termination.' },
                  { id: '05', icon: FileText, title: 'Property Listings', content: 'Owners must provide certified property details, maintain accurate availability, and comply with all local rental laws and regulations.' },
                  { id: '06', icon: UserCheck, title: 'Client Responsibilities', content: 'Clients must maintain truthful profile data, communicate respectfully with owners, and honor all commitments established through the platform.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                      <span className={cn("text-[10px] font-black font-mono tracking-widest px-3 py-1 rounded-lg", isOwner ? "bg-purple-500/10 text-purple-500" : "bg-rose-500/10 text-rose-500")}>ARTICLE {section.id}</span>
                      <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <section.icon className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} />
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                    </div>
                    <p className={cn("text-[14px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity", isLight ? "text-black" : "text-white")}>
                      {section.content}
                    </p>
                  </section>
                ))}

                {currentDoc === 'agl' && [
                  { id: '01', icon: BookOpen, title: 'Community Standards', content: 'Treat all users with respect and dignity. Communicate honestly and transparently. Honor commitments and agreements made through the platform.' },
                  { id: '02', icon: Home, title: 'Owner Guidelines', content: 'Provide accurate and up-to-date listing information. Use genuine photos. Respond to inquiries in a timely manner. Comply with all local housing laws.' },
                  { id: '03', icon: User, title: 'Client Guidelines', content: 'Provide truthful profile information. Communicate rental needs clearly. Respect property during viewings. Honor rental commitments.' },
                  { id: '04', icon: UserX, title: 'Prohibited Content', content: 'False or misleading information, offensive, discriminatory, or hateful content, and adult material are strictly prohibited.' },
                  { id: '05', icon: Shield, title: 'Safety and Security', content: 'Verify the identity of users before meeting in person. Report suspicious behavior immediately. Do not share passwords or account credentials.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                      <span className={cn("text-[10px] font-black font-mono tracking-widest px-3 py-1 rounded-lg", isOwner ? "bg-purple-500/10 text-purple-500" : "bg-rose-500/10 text-rose-500")}>ARTICLE {section.id}</span>
                      <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <section.icon className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} />
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                    </div>
                    <p className={cn("text-[14px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity", isLight ? "text-black" : "text-white")}>
                      {section.content}
                    </p>
                  </section>
                ))}
              </div>
            </Card>

            <div className="flex justify-center pt-10">
              <Button
                onClick={() => setCurrentDoc('hub')}
                className={cn(
                  "h-16 px-16 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-2xl active:scale-95 transition-all",
                  isOwner ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                )}
              >
                RETURN TO MATRIX
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* 🛸 FIXED TELEMETRY TAG */}
      <p className="fixed bottom-6 right-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Legal Terminal v15.0</p>
    </div>
  );
};

export default LegalHub;
