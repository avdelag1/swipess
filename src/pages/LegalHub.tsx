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
      
      {/* 🛸 ATMOSPHERIC ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden z-0">
         <div className={cn(
           "absolute top-[-10%] left-[-10%] w-[60%] h-[40%] blur-[130px] rounded-full",
           isOwner ? "bg-purple-500/30" : "bg-rose-500/30"
         )} />
         <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[30%] bg-indigo-500/20 blur-[100px] rounded-full" />
      </div>

      <main className="container mx-auto px-4 sm:px-6 pt-28 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 PREMIUM HEADER SECTION */}
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h1 className={cn(
                "text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none",
                isLight ? "text-black" : "text-white"
              )}>
                {isOwner ? "LEGAL HUB" : "TENANT HUB"}
              </h1>
              <p className={cn("text-[11px] font-black uppercase tracking-[0.4em] italic opacity-40 leading-relaxed", isLight ? "text-black" : "text-white")}>
                Professional Legal Ecosystem v15.0
              </p>
            </div>
            
            {/* 🛸 AUTHORIZATION STATUS */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-6 rounded-[2.5rem] border backdrop-blur-3xl flex items-center justify-between transition-all",
                isLight ? "bg-black/5 border-black/5 shadow-sm" : "bg-white/[0.04] border-white/5 shadow-2xl"
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
                  <h4 className={cn("text-[15px] font-black italic tracking-tighter truncate max-w-[120px] sm:max-w-none uppercase", isLight ? "text-black" : "text-white")}>
                    {user?.email?.split('@')[0]}
                  </h4>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border-none shadow-sm",
                isOwner ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
              )}>
                {isOwner ? "Owner Mode" : "Tenant Mode"}
              </Badge>
            </motion.div>
        </div>

        {currentDoc !== 'hub' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <button 
              onClick={() => { haptics.tap(); setCurrentDoc('hub'); }}
              className={cn(
                "flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] italic mb-8 hover:opacity-70 transition-opacity",
                isOwner ? "text-purple-500" : "text-rose-500"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Back to Hub
            </button>

            <div className="space-y-4">
              <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                {currentDoc === 'privacy' && "Privacy Protocol"}
                {currentDoc === 'terms' && "Terms of Use"}
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
                  System Updated: 2024.1
                </span>
              </div>
            </div>

            <Card className={cn("p-10 rounded-[3.5rem] border shadow-3xl backdrop-blur-3xl", isLight ? "bg-white border-black/5" : "bg-white/[0.03] border-white/5")}>
              <div className="space-y-16">
                {currentDoc === 'privacy' && [
                  { id: '01', icon: Database, title: 'Telemetry Collection', content: 'We collect data you provide directly: Profile identities, search telemetry, secure messaging packets, and property metadata.' },
                  { id: '02', icon: Eye, title: 'Operational Usage', content: 'Data is utilized to synchronize the discovery experience, bridge property owners with verified clients, and maintain platform integrity.' },
                  { id: '03', icon: Globe, title: 'Node Distribution', content: 'Public identity data is visible to peers for matching. Critical telemetry is shared only with verified infrastructure nodes (Supabase, Google).' },
                  { id: '04', icon: CheckCircle2, title: 'Identity Ownership', content: 'You maintain absolute authority over your personal telemetry. Access, correction, and permanent erasure are available via System Settings.' },
                  { id: '05', icon: Lock, title: 'Security Cipher', content: 'We implement high-grade SSL, OAuth 2.0 encryption, and regular case-audits to ensure the total integrity of your information.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                      <span className={cn("text-[10px] font-black font-mono tracking-widest px-3 py-1 rounded-lg", isOwner ? "bg-purple-500/10 text-purple-500" : "bg-rose-500/10 text-rose-500")}>PROTOCOL {section.id}</span>
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
                  { id: '01', icon: Gavel, title: 'Ecosystem Acceptance', content: 'By accessing the Swipess terminal, you agree to be bound by these Operating Terms. Access is strictly restricted to compliant identities.' },
                  { id: '02', icon: UserCheck, title: 'Eligibility Node', content: 'You must be at least 18 years of age and possess full legal capacity to enter into binding digital real estate agreements.' },
                  { id: '03', icon: CheckCircle2, title: 'Cipher Security', content: 'You are exclusively responsible for your account credentials. You must report any unauthorized terminal access immediately.' },
                  { id: '04', icon: Scale, title: 'Conduct Protocol', content: 'Users shall not transmit fraudulent telemetry, harass peers, or attempt to bypass security layers. Violations result in permanent lockout.' },
                  { id: '05', icon: FileText, title: 'Asset Verification', content: 'Owners must provide certified asset details and comply with all local rental legalities and regional regulations.' },
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
                  { id: '02', icon: Home, title: 'Asset Integrity', content: 'Provide accurate and up-to-date listing information. Use genuine photos. Respond to inquiries in a timely manner.' },
                  { id: '03', icon: Shield, title: 'Safety Protocol', content: 'Verify user identities before physical interaction. Report suspicious telemetry immediately. Protect your account credentials.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                      <span className={cn("text-[10px] font-black font-mono tracking-widest px-3 py-1 rounded-lg", isOwner ? "bg-purple-500/10 text-purple-500" : "bg-rose-500/10 text-rose-500")}>SECTION {section.id}</span>
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
                onClick={() => { haptics.tap(); setCurrentDoc('hub'); }}
                className={cn(
                  "h-16 px-16 rounded-full font-black uppercase italic tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-[12px]",
                  isOwner ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                )}
              >
                RETURN TO HUB
              </Button>
            </div>
          </motion.div>
        ) : submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className={cn(
              "rounded-[3rem] overflow-hidden border shadow-3xl text-center p-12 sm:p-20 relative",
              isLight ? "bg-white border-black/5" : "bg-black border-white/5"
            )}>
              <div className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r",
                isOwner ? "from-purple-500 to-indigo-500" : "from-rose-500 to-rose-300"
              )} />
              <CardContent className="space-y-10">
                <div className={cn(
                  "w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl border mb-6",
                  isOwner ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-rose-500/20 border-rose-500/30 text-rose-400"
                )}>
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <div className="space-y-3">
                  <h3 className={cn("text-4xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Request Logged</h3>
                  <p className={cn("text-[14px] font-bold tracking-tight opacity-60 leading-relaxed max-w-md mx-auto", isLight ? "text-black" : "text-white")}>
                    Your legal help request has been dispatched to the Swipess legal team. Our team will audit your case and get back to you with available protocols.
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
          <div className="space-y-16">
            {/* 🛸 DIRECT DISPATCH CARD */}
            <Card className={cn(
              "rounded-[3rem] overflow-hidden border shadow-3xl relative group transition-all duration-500",
              isLight ? "bg-black/5 border-black/5 shadow-sm" : "bg-white/[0.04] border-white/5 shadow-2xl"
            )}>
              <div className={cn(
                "absolute -inset-1 blur-2xl opacity-30 transition duration-1000",
                isOwner ? "bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20" : "bg-gradient-to-r from-blue-500/20 via-rose-500/20 to-blue-500/20"
              )} />
              
              <CardContent className="p-8 sm:p-14 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className={cn(
                    "w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border shadow-2xl animate-pulse transition-colors duration-500",
                    isOwner ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  )}>
                    <Gavel className="w-10 h-10" />
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-3">
                    <h2 className={cn("text-3xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Professional Legal Dispatch</h2>
                    <p className={cn("text-[14px] font-bold opacity-60 leading-relaxed italic", isLight ? "text-black" : "text-white")}>
                      Connect with specialized legal protocols for contract disputes, evictions, or general real estate law. Verified Swipess members receive priority triage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Selection */}
            <div className="space-y-8">
              <div className="px-1 flex items-center gap-4">
                <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Legal Protocols</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
              </div>

              <div className={cn(
                "rounded-[3rem] overflow-hidden border shadow-3xl",
                isLight ? "bg-white border-black/5 shadow-sm" : "bg-white/[0.02] border-white/5 shadow-2xl"
              )}>
                <div className={cn("divide-y", isLight ? "divide-black/5" : "divide-white/5")}>
                  {categories.map((category) => (
                    <div key={category.id} className="group">
                      <button
                        onClick={() => { haptics.tap(); handleCategoryClick(category.id); }}
                        className={cn(
                          "w-full p-8 flex items-center gap-6 transition-all text-left",
                          expandedCategory === category.id 
                            ? (isLight ? "bg-black/5" : "bg-white/[0.04]") 
                            : (isLight ? "hover:bg-black/[0.02]" : "hover:bg-white/[0.02]")
                        )}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-[1.2rem] flex items-center justify-center shrink-0 border shadow-xl group-hover:scale-110 transition-transform duration-500",
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
                            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                            className="overflow-hidden"
                          >
                            <div className={cn("p-4 space-y-3", isLight ? "bg-black/[0.02]" : "bg-white/[0.01]")}>
                              {category.subcategories.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => { haptics.tap(); handleSubcategorySelect(category.id, sub.id); }}
                                  className={cn(
                                    "w-full p-6 rounded-[2rem] flex items-center gap-5 transition-all text-left border border-transparent shadow-sm",
                                    selectedIssue?.subcategory === sub.id 
                                      ? (isOwner ? "bg-purple-500/20 border-purple-500/30 shadow-lg" : "bg-rose-500/20 border-rose-500/30 shadow-lg")
                                      : (isLight ? "bg-white/50 hover:bg-white" : "bg-white/[0.02] hover:bg-white/[0.05]")
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
                                    <h5 className={cn("text-[14px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{sub.title}</h5>
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
              </div>

              {/* Case Audit section */}
              <AnimatePresence>
                {selectedIssue && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                     <div className="px-1 flex items-center gap-4">
                      <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Case Protocol</span>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
                    </div>

                    <Card className={cn("rounded-[3rem] overflow-hidden border shadow-3xl", isLight ? "bg-white border-black/5 shadow-sm" : "bg-white/[0.02] border-white/5 shadow-2xl")}>
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
                                Submit Case
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 🛸 LEGAL DOCUMENTS GRID */}
              <div className="space-y-8 pt-10">
                <div className="px-1 flex items-center gap-4">
                    <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic", isLight ? "text-black" : "text-white")}>Digital Protocols</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {[
                     { icon: FileText, label: 'Terms of Use', doc: 'terms', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                     { icon: Shield, label: 'Privacy Protocol', doc: 'privacy', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                     { icon: BookOpen, label: 'AUP Protocol', doc: 'agl', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                     { icon: Scale, label: 'Smart Contracts', path: isOwner ? '/owner/contracts' : '/client/contracts', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
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
                          "p-6 rounded-[2.5rem] border backdrop-blur-3xl flex items-center gap-5 transition-all text-left group hover:scale-[1.02] active:scale-95 shadow-sm",
                          isLight ? "bg-white border-black/5" : "bg-white/[0.04] border-white/5"
                        )}
                     >
                        <div className={cn("w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 border", item.color)}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                           <h4 className={cn("text-[14px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{item.label}</h4>
                           <p className={cn("text-[9px] font-bold uppercase tracking-widest opacity-30 mt-0.5", isLight ? "text-black" : "text-white")}>Access Document Node</p>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-20" />
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* 🛸 FIXED TELEMETRY TAG */}
      <p className="fixed bottom-6 right-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Legal Terminal v15.0</p>
    </div>
  );
};

export default LegalHub;
