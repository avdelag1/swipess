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
import { haptics } from '@/utils/microPolish';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { useActiveMode } from '@/hooks/useActiveMode';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { Helmet } from 'react-helmet-async';
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
    <div className="w-full bg-background relative selection:bg-rose-500/30 min-h-screen">
      
      {/* 🛸 SWIPESS SEO ARCHITECTURE */}
      <Helmet>
        <title>Legal Center | Swipess Authority</title>
        <meta name="description" content="Secure legal terminal for Swipess protocols, terms of use, and professional legal dispatch." />
      </Helmet>

      {/* 🛸 ATMOSPHERIC DEPTH */}
      <AtmosphericLayer variant={isOwner ? "indigo" : "rose"} opacity={0.25} />

      <main className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 pt-8 pb-48 relative z-10 space-y-20">
        
        {/* 🛸 PREMIUM HEADER SECTION */}
        <AnimatePresence mode="wait">
          {currentDoc !== 'hub' ? (
            <motion.div 
              key={currentDoc}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-16"
            >
              <button 
                onClick={() => { haptics.tap(); setCurrentDoc('hub'); }}
                className={cn(
                  "flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.5em] italic mb-12 hover:opacity-70 transition-all hover:translate-x-[-4px]",
                  isLight ? "text-black" : "text-white"
                )}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Legal Hub
              </button>

              <div className="space-y-6">
                <h1 className={cn("text-5xl sm:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]", isLight ? "text-black" : "text-white")}>
                  {currentDoc === 'privacy' && "Privacy Protocol"}
                  {currentDoc === 'terms' && "Terms of Use"}
                  {currentDoc === 'agl' && "Acceptable Use"}
                </h1>
                <div className="flex items-center gap-6">
                  <Badge variant="outline" className={cn(
                    "px-5 py-2 text-[10px] font-black uppercase tracking-widest italic border-none shadow-xl",
                    isOwner ? "bg-purple-500 text-white shadow-purple-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                  )}>
                    Verified Protocol
                  </Badge>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-30 italic", isLight ? "text-black" : "text-white")}>
                    Revision Node: 2024.Q2.7
                  </span>
                </div>
              </div>

              <Card className={cn("p-12 sm:p-20 rounded-[4rem] border shadow-[0_50px_100px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-all duration-700", isLight ? "bg-white border-black/5" : "bg-white/[0.03] border-white/5")}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-16">
                  {currentDoc === 'privacy' && [
                    { id: '01', icon: Database, title: 'Telemetry Collection', content: 'We collect data you provide directly: Profile identities, search telemetry, secure messaging packets, and property metadata.' },
                    { id: '02', icon: Eye, title: 'Operational Usage', content: 'Data is utilized to synchronize the discovery experience, bridge property owners with verified clients, and maintain platform integrity.' },
                    { id: '03', icon: Globe, title: 'Node Distribution', content: 'Public identity data is visible to peers for matching. Critical telemetry is shared only with verified infrastructure nodes (Supabase, Google).' },
                    { id: '04', icon: CheckCircle2, title: 'Identity Ownership', content: 'You maintain absolute authority over your personal telemetry. Access, correction, and permanent erasure are available via System Settings.' },
                    { id: '05', icon: Lock, title: 'Security Cipher', content: 'We implement high-grade SSL, OAuth 2.0 encryption, and regular case-audits to ensure the total integrity of your information.' },
                  ].map((section) => (
                    <section key={section.id} className="group space-y-6">
                      <div className="flex items-center gap-4">
                        <span className={cn("text-[10px] font-black font-mono tracking-widest px-4 py-1.5 rounded-full border", isOwner ? "bg-purple-500/5 text-purple-500 border-purple-500/10" : "bg-rose-500/5 text-rose-500 border-rose-500/10")}>PROTOCOL {section.id}</span>
                        <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                      </div>
                      <div className="flex items-start gap-5">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", isLight ? "bg-black/5 text-black" : "bg-white/10 text-white")}>
                           <section.icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                          <p className={cn("text-[15px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity duration-500", isLight ? "text-black" : "text-white")}>
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </section>
                  ))}

                  {currentDoc === 'terms' && [
                    { id: '01', icon: Gavel, title: 'Ecosystem Acceptance', content: 'By accessing the Swipess terminal, you agree to be bound by these Operating Terms. Access is strictly restricted to compliant identities.' },
                    { id: '02', icon: UserCheck, title: 'Eligibility Node', content: 'You must be at least 18 years of age and possess full legal capacity to enter into binding digital real estate agreements.' },
                    { id: '03', icon: CheckCircle2, title: 'Cipher Security', content: 'You are exclusively responsible for your account credentials. You must report any unauthorized terminal access immediately.' },
                    { id: '04', icon: Scale, title: 'Conduct Protocol', content: 'Users shall not transmit fraudulent telemetry, harass peers, or attempt to bypass security layers. Violations result in permanent lockout.' },
                    { id: '05', icon: FileText, title: 'Asset Verification', content: 'Owners must provide certified asset details and comply with all local rental legalities and regional regulations.' },
                  ].map((section) => (
                    <section key={section.id} className="group space-y-6">
                      <div className="flex items-center gap-4">
                        <span className={cn("text-[10px] font-black font-mono tracking-widest px-4 py-1.5 rounded-full border", isOwner ? "bg-purple-500/5 text-purple-500 border-purple-500/10" : "bg-rose-500/5 text-rose-500 border-rose-500/10")}>ARTICLE {section.id}</span>
                        <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                      </div>
                      <div className="flex items-start gap-5">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", isLight ? "bg-black/5 text-black" : "bg-white/10 text-white")}>
                           <section.icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                          <p className={cn("text-[15px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity duration-500", isLight ? "text-black" : "text-white")}>
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </section>
                  ))}

                  {currentDoc === 'agl' && [
                    { id: '01', icon: BookOpen, title: 'Community Standards', content: 'Treat all users with respect and dignity. Communicate honestly and transparently. Honor commitments and agreements made through the platform.' },
                    { id: '02', icon: Home, title: 'Asset Integrity', content: 'Provide accurate and up-to-date listing information. Use genuine photos. Respond to inquiries in a timely manner.' },
                    { id: '03', icon: Shield, title: 'Safety Protocol', content: 'Verify user identities before physical interaction. Report suspicious telemetry immediately. Protect your account credentials.' },
                  ].map((section) => (
                    <section key={section.id} className="group space-y-6">
                      <div className="flex items-center gap-4">
                        <span className={cn("text-[10px] font-black font-mono tracking-widest px-4 py-1.5 rounded-full border", isOwner ? "bg-purple-500/5 text-purple-500 border-purple-500/10" : "bg-rose-500/5 text-rose-500 border-rose-500/10")}>SECTION {section.id}</span>
                        <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                      </div>
                      <div className="flex items-start gap-5">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", isLight ? "bg-black/5 text-black" : "bg-white/10 text-white")}>
                           <section.icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                          <p className={cn("text-[15px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity duration-500", isLight ? "text-black" : "text-white")}>
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </Card>

              <div className="flex justify-center pt-12">
                <Button
                  variant="outline"
                  className={cn(
                    "h-16 px-12 rounded-2xl font-black uppercase italic tracking-[0.3em] transition-all active:scale-[0.98] border-2 text-[11px] shadow-2xl",
                    isOwner 
                      ? "border-purple-500/30 text-purple-500 bg-purple-500/5 hover:bg-purple-500/10 shadow-purple-500/10" 
                      : "border-rose-500/30 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 shadow-rose-500/10"
                  )}
                  onClick={() => { haptics.tap(); setCurrentDoc('hub'); }}
                >
                  RETURN TO LEGAL HUB
                </Button>
              </div>
            </motion.div>
          ) : submitted ? (
            <motion.div 
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto"
            >
            <Card className={cn(
              "rounded-[4rem] overflow-hidden border shadow-[0_60px_120px_rgba(0,0,0,0.15)] text-center p-16 sm:p-24 relative backdrop-blur-3xl",
              isLight ? "bg-white border-black/5" : "bg-black border-white/5"
            )}>
              <div className={cn(
                "absolute top-0 left-0 w-full h-2 bg-gradient-to-r",
                isOwner ? "from-purple-500 to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]" : "from-rose-500 to-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.5)]"
              )} />
              <CardContent className="space-y-12">
                <div className={cn("w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-3xl mx-auto mb-8 animate-pulse", isOwner ? "bg-purple-500 shadow-purple-500/40" : "bg-rose-500 shadow-rose-500/40")}>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-white" />
                  </motion.div>
                </div>
                <div className="space-y-4">
                  <h3 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Request Logged</h3>
                  <p className={cn("text-[16px] font-bold tracking-tight opacity-50 leading-relaxed max-w-lg mx-auto italic", isLight ? "text-black" : "text-white")}>
                    Your legal help request has been successfully dispatched to the Swipess Authority nodes. Our specialist protocols are now auditing your submission.
                  </p>
                </div>
                <div className="pt-10 w-full max-w-sm mx-auto space-y-4">
                  <Button
                    onClick={() => { haptics.tap(); setSubmitted(false); setCurrentDoc('hub'); }}
                    className={cn(
                      "w-full h-16 rounded-2xl font-black uppercase italic tracking-[0.2em] text-[12px] shadow-2xl transition-all active:scale-95",
                      isOwner ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/30" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
                    )}
                  >
                    Return to Hub
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => { haptics.tap(); handleReset(); }} 
                    className={cn("w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-[11px] opacity-40 hover:opacity-100", isLight ? "text-black" : "text-white")}
                  >
                    Log New Incident
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            key="hub"
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-24"
          >
            {/* 🛸 PRIMARY FEATURE CARD */}
            <Card className={cn(
              "rounded-[4.5rem] overflow-hidden border shadow-3xl relative group transition-all duration-700",
              isLight ? "bg-black/[0.02] border-black/5 shadow-sm" : "bg-white/[0.04] border-white/5 shadow-2xl"
            )}>
              <div className={cn(
                "absolute -inset-1 blur-3xl opacity-20 transition duration-1000 group-hover:opacity-40",
                isOwner ? "bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-500" : "bg-gradient-to-r from-blue-500 via-rose-600 to-blue-500"
              )} />
              
              <CardContent className="p-12 sm:p-24 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  <div className={cn(
                    "w-32 h-32 rounded-[3rem] flex items-center justify-center shrink-0 border shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-700 group-hover:rotate-12 group-hover:scale-110",
                    isOwner ? "bg-purple-500 border-purple-400/30 text-white" : "bg-blue-600 border-blue-400/30 text-white"
                  )}>
                    <Gavel className="w-14 h-14" />
                  </div>
                  <div className="flex-1 text-center lg:text-left space-y-6">
                    <h2 className={cn("text-5xl sm:text-7xl font-black uppercase italic tracking-tighter leading-[0.85]", isLight ? "text-black" : "text-white")}>Professional Legal Dispatch</h2>
                    <p className={cn("text-[18px] font-bold opacity-50 leading-relaxed italic max-w-2xl", isLight ? "text-black" : "text-white")}>
                      Connect with specialized legal protocols for contract disputes, evictions, or general real estate law. Verified Swipess members receive high-priority triage nodes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-20">
              {/* 🛸 PROTOCOL NAVIGATOR */}
              <div className="xl:col-span-7 space-y-10">
                <div className="px-2 flex items-center gap-6">
                  <span className={cn("text-[12px] font-black uppercase tracking-[0.4em] opacity-30 italic", isLight ? "text-black" : "text-white")}>Operational Protocols</span>
                  <div className={cn("h-[1px] flex-1", isLight ? "bg-black/10" : "bg-white/10")} />
                </div>

                <div className={cn(
                  "rounded-[3.5rem] overflow-hidden border shadow-2xl transition-all duration-500",
                  isLight ? "bg-white border-black/5 shadow-sm" : "bg-white/[0.02] border-white/5 shadow-2xl"
                )}>
                  <div className={cn("divide-y", isLight ? "divide-black/5" : "divide-white/5")}>
                    {categories.map((category) => (
                      <div key={category.id} className="group">
                        <button
                          onClick={() => { haptics.tap(); handleCategoryClick(category.id); }}
                          className={cn(
                            "w-full p-10 flex items-center gap-8 transition-all text-left",
                            expandedCategory === category.id 
                              ? (isLight ? "bg-black/[0.03]" : "bg-white/[0.06]") 
                              : (isLight ? "hover:bg-black/[0.01]" : "hover:bg-white/[0.02]")
                          )}
                        >
                          <div className={cn(
                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border shadow-xl transition-all duration-500 group-hover:scale-110",
                            isOwner ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}>
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className={cn("text-xl font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{category.title}</h4>
                            <p className={cn("text-[12px] font-bold uppercase tracking-widest opacity-30 truncate", isLight ? "text-black" : "text-white")}>{category.description}</p>
                          </div>
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-all", isLight ? "border-black/5" : "border-white/5", expandedCategory === category.id && "rotate-180 bg-primary/10 border-primary/20")}>
                             <ChevronDown className={cn("w-5 h-5 opacity-40", expandedCategory === category.id && "opacity-100 text-primary")} />
                          </div>
                        </button>

                        <AnimatePresence mode="wait">
                          {expandedCategory === category.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <div className={cn("p-6 space-y-4", isLight ? "bg-black/[0.01]" : "bg-black/20")}>
                                {category.subcategories.map((sub) => (
                                  <button
                                    key={sub.id}
                                    onClick={() => { haptics.tap(); handleSubcategorySelect(category.id, sub.id); }}
                                    className={cn(
                                      "w-full p-8 rounded-[2.5rem] flex items-center gap-6 transition-all text-left border shadow-sm group/sub",
                                      selectedIssue?.subcategory === sub.id 
                                        ? (isOwner ? "bg-purple-500/10 border-purple-500/30 shadow-xl" : "bg-rose-500/10 border-rose-500/30 shadow-xl")
                                        : (isLight ? "bg-white hover:bg-black/[0.02] border-black/5" : "bg-white/[0.03] hover:bg-white/[0.08] border-white/5")
                                    )}
                                  >
                                    <div className={cn(
                                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                      selectedIssue?.subcategory === sub.id
                                        ? (isOwner ? "border-purple-500 bg-purple-500" : "border-rose-500 bg-rose-500")
                                        : "border-white/10 group-hover/sub:border-white/30"
                                    )}>
                                      {selectedIssue?.subcategory === sub.id && (
                                        <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <h5 className={cn("text-[15px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{sub.title}</h5>
                                      <p className={cn("text-[11px] font-bold uppercase tracking-widest opacity-30", isLight ? "text-black" : "text-white")}>{sub.description}</p>
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
                </div>
              </div>

              {/* 🛸 CASE AUDIT ENGINE */}
              <div className="xl:col-span-5 space-y-10">
                <AnimatePresence mode="wait">
                  {selectedIssue ? (
                    <motion.div
                      key="active-case"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-10"
                    >
                      <div className="px-2 flex items-center gap-6">
                        <span className={cn("text-[12px] font-black uppercase tracking-[0.4em] opacity-30 italic", isLight ? "text-black" : "text-white")}>Incident Telemetry</span>
                        <div className={cn("h-[1px] flex-1", isLight ? "bg-black/10" : "bg-white/10")} />
                      </div>

                      <Card className={cn(
                        "rounded-[3.5rem] overflow-hidden border shadow-3xl transition-all duration-500 relative",
                        isLight ? "bg-white border-black/5" : "bg-white/[0.04] border-white/5"
                      )}>
                        <CardHeader className="p-10 pb-6 border-b border-white/5">
                          <CardTitle className={cn("text-2xl font-black uppercase italic tracking-tighter flex items-center gap-5", isLight ? "text-black" : "text-white")}>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl", isOwner ? "bg-purple-500/20 text-purple-400" : "bg-rose-500/20 text-rose-400")}>
                               <MessageSquare className="w-6 h-6" />
                            </div>
                            Audit Intelligence
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                          <div className="space-y-6">
                            <div className={cn("p-6 rounded-[2rem] flex items-center gap-6 border transition-all", isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.03] border-white/10")}>
                               <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl", isOwner ? "bg-purple-500 text-white" : "bg-rose-500 text-white")}>
                                 {currentCategory?.icon}
                               </div>
                               <div>
                                 <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-30", isLight ? "text-black" : "text-white")}>PROTOCOL TARGET</p>
                                 <h4 className={cn("text-[15px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{currentSubcategory?.title}</h4>
                               </div>
                            </div>

                            <div className="relative group">
                              <Textarea
                                id="description"
                                placeholder="Describe the incident, timestamps, and all relevant case telemetry for our specialist nodes..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={8}
                                className={cn(
                                  "rounded-[2.5rem] border p-10 text-[16px] font-bold tracking-tight transition-all focus:ring-4 outline-none placeholder:opacity-20 resize-none",
                                  isOwner ? "focus:ring-purple-500/20 border-purple-500/10 shadow-purple-500/5" : "focus:ring-rose-500/20 border-rose-500/10 shadow-rose-500/5",
                                  isLight ? "bg-white border-black/10 text-black" : "bg-black/60 border-white/5 text-white"
                                )}
                              />
                              <div className="absolute bottom-6 right-8 opacity-20 group-hover:opacity-100 transition-opacity">
                                 <Send className="w-5 h-5 rotate-12" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <Button
                              onClick={() => { haptics.success(); handleSubmitRequest(); }}
                              disabled={isSubmitting || !description.trim()}
                              className={cn(
                                "h-20 w-full rounded-[2.5rem] text-white font-black uppercase italic tracking-[0.2em] text-[13px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all active:scale-95",
                                isOwner ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/30" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
                              )}
                            >
                              {isSubmitting ? (
                                <div className="flex items-center gap-3">
                                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                   <span>Dispatching Protocol...</span>
                                </div>
                              ) : (
                                <>
                                  <Send className="w-5 h-5 mr-4" />
                                  Initiate Case Audit
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => { haptics.tap(); handleReset(); }}
                              className={cn("h-14 w-full rounded-[1.5rem] font-black uppercase italic tracking-[0.25em] text-[10px] opacity-30 hover:opacity-100 transition-all", isLight ? "text-black" : "text-white")}
                            >
                              Abort & Reset Audit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-selection"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-8 p-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000"
                    >
                       <div className={cn("w-32 h-32 rounded-[3.5rem] border-2 border-dashed flex items-center justify-center", isLight ? "border-black/10" : "border-white/10")}>
                          <ShieldCheck className="w-14 h-14" />
                       </div>
                       <div className="space-y-2">
                          <h4 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Triage Ready</h4>
                          <p className={cn("text-[12px] font-black uppercase tracking-[0.3em] max-w-xs", isLight ? "text-black" : "text-white")}>Select a protocol target to begin specialized legal audit</p>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 🛸 DIGITAL DOCUMENT GRID */}
            <div className="space-y-12">
              <div className="px-2 flex items-center gap-6">
                  <span className={cn("text-[12px] font-black uppercase tracking-[0.4em] opacity-30 italic", isLight ? "text-black" : "text-white")}>System Documents</span>
                  <div className={cn("h-[1px] flex-1", isLight ? "bg-black/10" : "bg-white/10")} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { icon: FileText, label: 'Terms of Use', doc: 'terms', color: 'bg-blue-600 text-white shadow-blue-500/20' },
                   { icon: Shield, label: 'Privacy Protocol', doc: 'privacy', color: 'bg-rose-600 text-white shadow-rose-500/20' },
                   { icon: BookOpen, label: 'AUP Standards', doc: 'agl', color: 'bg-purple-600 text-white shadow-purple-500/20' },
                   { icon: Scale, label: 'Smart Contracts', path: isOwner ? '/owner/contracts' : '/client/contracts', color: 'bg-emerald-600 text-white shadow-emerald-500/20' },
                 ].map((item) => (
                   <button
                      key={item.label}
                      onClick={() => { 
                        haptics.tap(); 
                        if (item.doc) {
                          setCurrentDoc(item.doc as any);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={cn(
                        "p-8 rounded-[3rem] border backdrop-blur-3xl flex flex-col items-start gap-8 transition-all group hover:translate-y-[-8px] active:scale-95 shadow-xl",
                        isLight ? "bg-white border-black/5" : "bg-white/[0.04] border-white/5"
                      )}
                   >
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", item.color)}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                         <h4 className={cn("text-lg font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{item.label}</h4>
                         <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-30", isLight ? "text-black" : "text-white")}>Authorized Protocol Node</p>
                      </div>
                      <div className={cn("mt-auto w-full flex items-center justify-between pt-4 border-t", isLight ? "border-black/5" : "border-white/5")}>
                         <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity", isLight ? "text-black" : "text-white")}>Open Document</span>
                         <ChevronRight className="w-4 h-4 opacity-20 group-hover:translate-x-1 transition-transform" />
                      </div>
                   </button>
                 ))}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      
      {/* 🛸 FIXED TELEMETRY TAG */}
      <p className="fixed bottom-6 right-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Legal Terminal v15.0</p>
    </div>
  );
};

export default LegalHub;
