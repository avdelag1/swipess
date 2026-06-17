import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bike, BookOpen, Briefcase, Building2, Car,
  CheckCircle2, ChevronDown, ChevronRight,
  DollarSign, FileSignature, FileText, Gavel, Home, Lock,
  MessageSquare, Scale as ScaleIcon, Send, Shield, ShoppingCart, Users, UserX
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { appToast } from '@/utils/appNotification';
import { useAuth } from '@/hooks/useAuth';
import { haptics } from '@/utils/microPolish';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { useActiveMode } from '@/hooks/useActiveMode';

import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Database, Eye, Globe, Package, ShieldCheck, UserCheck } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { ownerTemplates, clientTemplates } from '@/data/contractTemplates';

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
  },
  {
    id: 'services-rights',
    title: 'Service Provider Rights',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Your rights as a contractor or service worker',
    subcategories: [
      { id: 'unpaid-work', title: 'Unpaid Work Dispute', description: 'Not been paid for completed work' },
      { id: 'unfair-service-contract', title: 'Unfair Contract Terms', description: 'One-sided or illegal clauses in your contract' },
      { id: 'wrongful-termination', title: 'Wrongful Contract End', description: 'Agreement ended without valid cause' },
      { id: 'liability-claim', title: 'Liability & Claims', description: 'Being held responsible for damages unfairly' }
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
  },
  {
    id: 'services-legal',
    title: 'Services & Work Contracts',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Hire and manage cleaners, guards, managers & more',
    subcategories: [
      { id: 'service-contract', title: 'Service Contract Creation', description: 'Draft contracts for cleaners, guards, managers' },
      { id: 'worker-agreement', title: 'Worker Agreements', description: 'Formal employment and task agreements' },
      { id: 'vendor-contract', title: 'Vendor & Supplier Contracts', description: 'Agreements with external vendors' },
      { id: 'service-dispute', title: 'Service Provider Dispute', description: 'Resolve issues with contracted workers' }
    ]
  }
];

// Service packages are now fetched dynamically from legal_service_packages

const TEMPLATE_CATEGORY_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  lease:            { label: 'Lease Agreements',    color: 'bg-blue-500',    icon: <Home className="w-3.5 h-3.5" /> },
  purchase:         { label: 'Purchase Contracts',  color: 'bg-purple-500',  icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  service:          { label: 'Service Contracts',   color: 'bg-orange-500',  icon: <Briefcase className="w-3.5 h-3.5" /> },
  bicycle:          { label: 'Bicycle Contracts',   color: 'bg-cyan-500',    icon: <Bike className="w-3.5 h-3.5" /> },
  moto:             { label: 'Vehicle Contracts',   color: 'bg-red-500',     icon: <Car className="w-3.5 h-3.5" /> },
  promise:          { label: 'Promissory Notes',    color: 'bg-amber-500',   icon: <FileSignature className="w-3.5 h-3.5" /> },
  rental_agreement: { label: 'Rental Agreements',   color: 'bg-rose-500',    icon: <Home className="w-3.5 h-3.5" /> },
  rental:           { label: 'Rental Contracts',    color: 'bg-rose-500',    icon: <Home className="w-3.5 h-3.5" /> },
};

const CATEGORY_LABELS: Record<string, string> = {
  house_sale: 'House Sale',
  rental: 'Rental Agreements',
  eviction: 'Eviction',
  divorce: 'Divorce',
  nda: 'NDA',
  business: 'Business',
  dispute: 'Disputes',
  estate: 'Estate Planning',
};

const LegalHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { _theme, isLight } = useAppTheme();
  const { activeMode } = useActiveMode();
  
  const isOwner = activeMode === 'owner';
  const categories = isOwner ? ownerLegalCategories : clientLegalCategories;

  const { data: servicePackages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['legal_service_packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_service_packages' as any)
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('price');
      if (error) {
        logger.error('[LegalHub] fetch packages failed', error);
        return [];
      }
      return data || [];
    }
  });

  // Admins get a direct link from here into the review screen where every
  // submitted service request and smart contract lands.
  const [searchParams, setSearchParams] = useSearchParams();
  const docParam = searchParams.get('doc') as 'privacy' | 'terms' | 'agl' | null;
  const currentDoc = docParam || 'hub';
  
  const setCurrentDoc = (doc: 'hub' | 'privacy' | 'terms' | 'agl' | 'packages') => {
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
  const [requestedPackage, setRequestedPackage] = useState<string | null>(null);

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
    setRequestedPackage(null);
    setCurrentDoc('hub');
  };

  const handleRequestPackage = (pkgId: string, pkgName: string) => {
    setRequestedPackage(pkgId);
    setSelectedIssue({ category: 'service_package', subcategory: pkgId });
    setDescription(`I'm interested in the "${pkgName}" legal service package. Please contact me with more details.`);
  };

  const handleSubmitRequest = async () => {
    if (!selectedIssue || !description.trim()) {
      appToast.error('Please select an issue type and provide a description');
      return;
    }

    setIsSubmitting(true);
    try {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const caseNumber = `LC-${year}-${random}`;

      const { error } = await supabase.from('legal_cases' as any).insert({
        case_number: caseNumber,
        title: requestedPackage ? `Service Request: ${requestedPackage}` : `Legal Support: ${selectedIssue.category}`,
        description: description.trim(),
        case_type: 'user_complaint',
        priority: 'medium',
        status: 'open',
        parties_involved: {
          requester_id: user?.id || null,
          requester_role: activeMode,
          requested_package_id: requestedPackage || null,
          category: selectedIssue.category,
          subcategory: selectedIssue.subcategory,
        }
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      logger.error('[LegalHub] submission failed:', err);
      appToast.error('Failed to submit request');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    setSubmitted(true);
    appToast.success('Legal help request submitted!');
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
    <AmbientPageBackground className="w-full selection:bg-rose-500/30 min-h-screen">
      <Helmet>
        <title>Legal Center | Swipess Authority</title>
        <meta name="description" content="Secure legal terminal for Swipess protocols, terms of use, and professional legal dispatch." />
      </Helmet>

      <main className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 pt-8 pb-48 relative z-10 space-y-20">
        
        {/* 🛸 PREMIUM HEADER SECTION */}
        <AnimatePresence mode="sync">
          {currentDoc === 'packages' ? (
            <motion.div 
              key="packages"
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
                  Service Packages
                </h1>
                <p className={cn("text-lg font-bold opacity-50 max-w-2xl", isLight ? "text-black" : "text-white")}>
                  Browse our legal service packages. Select a package and submit a request — a verified lawyer will contact you.
                </p>
              </div>

              {packagesLoading ? (
                <div className="text-center py-12 text-white/50">Loading packages...</div>
              ) : Object.entries(
                servicePackages.reduce((acc, pkg: any) => {
                  if (!acc[pkg.category]) acc[pkg.category] = [];
                  acc[pkg.category].push(pkg);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([category, packages]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className={cn("text-sm font-black uppercase tracking-[0.3em] italic", isLight ? "text-black/80" : "text-white/80")}>
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    <div className={cn("h-[1px] flex-1", isLight ? "bg-black/10" : "bg-white/10")} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className={cn(
                        "rounded-[2.5rem] border overflow-hidden transition-all hover:shadow-xl group",
                        isLight ? "bg-slate-50 border-slate-200 hover:bg-white hover:shadow-2xl" : "bg-white/[0.04] border-white/5"
                      )}>
                        <div className="p-8 space-y-5">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className={cn("text-lg font-black uppercase italic tracking-tight leading-tight", isLight ? "text-black" : "text-white")}>
                              {pkg.name}
                            </h3>
                            <span className={cn("text-xl font-black shrink-0", isOwner ? "text-purple-500" : "text-rose-500")}>
                              ${pkg.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full",
                              isLight ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                            )}>
                              {pkg.duration} days
                            </Badge>
                          </div>
                          <ul className="space-y-2">
                            {pkg.features.map((f, i) => (
                              <li key={i} className={cn(
                                "flex items-start gap-2 text-[13px] font-medium",
                                isLight ? "text-black/60" : "text-white/60"
                              )}>
                                <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", isOwner ? "text-purple-500" : "text-rose-500")} />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <Button
                            onClick={() => {
                              haptics.select();
                              handleRequestPackage(pkg.id, pkg.name);
                            }}
                            className={cn(
                              "w-full h-14 rounded-2xl font-black uppercase italic tracking-wider text-[11px] active:scale-95 transition-all",
                              isOwner ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                            )}
                          >
                            Request Service
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-center pt-8">
                <Button
                  variant="outline"
                  className={cn(
                    "h-16 px-12 rounded-2xl font-black uppercase italic tracking-[0.3em] transition-all active:scale-[0.98] border-2 text-[11px] shadow-2xl",
                    isOwner ? "border-purple-500/30 text-purple-500 bg-purple-500/5" : "border-rose-500/30 text-rose-500 bg-rose-500/5"
                  )}
                  onClick={() => { haptics.tap(); setCurrentDoc('hub'); }}
                >
                  RETURN TO LEGAL HUB
                </Button>
              </div>
            </motion.div>
          ) : currentDoc !== 'hub' ? (
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

              <Card className={cn("p-12 sm:p-20 rounded-[4rem] border shadow-[0_50px_100px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-all duration-700", isLight ? "bg-white border-slate-200 shadow-xl" : "bg-white/[0.03] border-white/5")}>
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

                  {currentDoc === 'privacy' && (
                    <div className="lg:col-span-2 mt-8 pt-8 border-t border-current/10 space-y-6">
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>
                        Device Permissions We Request
                      </h2>
                      <p className={cn("text-sm leading-relaxed", isLight ? "text-black/70" : "text-white/70")}>
                        Swipess only requests permissions when you actively use a feature that needs them. You can revoke any permission at any time from your device settings.
                      </p>
                      <ul className={cn("space-y-3 text-sm leading-relaxed", isLight ? "text-black/80" : "text-white/80")}>
                        <li><strong>Camera:</strong> Used only when you choose to take a photo for your profile, a property listing, a vehicle listing, or to scan a QR code. We do not record video or access the camera in the background.</li>
                        <li><strong>Photos / Media Library:</strong> Used only when you select existing images to upload as profile or listing photos, or when you save a receipt or QR code we generated for you.</li>
                        <li><strong>Microphone:</strong> Used only when you press the voice-input button to dictate a message to the AI concierge or to record a voice note for a listing. Audio is sent to a speech-to-text provider for transcription and is not stored.</li>
                        <li><strong>Location (when in use):</strong> Used only when you ask to see nearby listings, parties, or services. We do not track your location in the background.</li>
                        <li><strong>Push Notifications:</strong> Used to deliver matches, messages, booking updates, and listing approvals. You can disable this in device settings without losing app functionality.</li>
                        <li><strong>Contacts:</strong> Optional. Only accessed if you explicitly tap "Share with contact" to share a listing with someone in your address book.</li>
                      </ul>
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter pt-4", isLight ? "text-black" : "text-white")}>
                        Third-Party Services
                      </h2>
                      <p className={cn("text-sm leading-relaxed", isLight ? "text-black/70" : "text-white/70")}>
                        We rely on the following providers to operate Swipess: <strong>Supabase</strong> (authentication, database, file storage), <strong>Apple App Store / Google Play Billing</strong> (in-app purchases), <strong>PayPal</strong> (web checkout), and AI providers (<strong>Google Gemini</strong>, <strong>Moonshot Kimi</strong>, <strong>MiniMax</strong>) for the concierge assistant. These services process only the minimum data needed to perform their function.
                      </p>
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter pt-4", isLight ? "text-black" : "text-white")}>
                        Account Deletion & Data Removal
                      </h2>
                      <p className={cn("text-sm leading-relaxed", isLight ? "text-black/70" : "text-white/70")}>
                        You can permanently delete your account and all associated data from <strong>Settings → Account → Delete Account</strong> inside the app, or by emailing <strong>admin@swipess.com</strong>. We honor deletion requests within 30 days.
                      </p>
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter pt-4", isLight ? "text-black" : "text-white")}>
                        Children
                      </h2>
                      <p className={cn("text-sm leading-relaxed", isLight ? "text-black/70" : "text-white/70")}>
                        Swipess is intended for users 18 years and older. We do not knowingly collect data from children under 13.
                      </p>
                      <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter pt-4", isLight ? "text-black" : "text-white")}>
                        Contact
                      </h2>
                      <p className={cn("text-sm leading-relaxed", isLight ? "text-black/70" : "text-white/70")}>
                        Privacy questions: <strong>admin@swipess.com</strong>. Last updated: 2026-05-09.
                      </p>
                    </div>
                  )}

                  {currentDoc === 'terms' && [
                    { id: '01', icon: Gavel, title: 'Ecosystem Acceptance', content: 'By accessing the Swipess terminal, you agree to be bound by these Operating Terms. Access is strictly restricted to compliant identities.' },
                    { id: '02', icon: UserCheck, title: 'Eligibility Node', content: 'You must be at least 18 years of age and possess full legal capacity to enter into binding digital real estate agreements.' },
                    { id: '03', icon: CheckCircle2, title: 'Cipher Security', content: 'You are exclusively responsible for your account credentials. You must report any unauthorized terminal access immediately.' },
                    { id: '04', icon: ScaleIcon, title: 'Conduct Protocol', content: 'Users shall not transmit fraudulent telemetry, harass peers, or attempt to bypass security layers. Violations result in permanent lockout.' },
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
              isLight ? "bg-white border-slate-200 shadow-xl" : "bg-black border-white/5"
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
                      "w-full h-16 rounded-2xl font-black uppercase italic tracking-[0.2em] text-[12px] shadow-2xl transition-all active:scale-95 border-0 text-white"
                    )}
                    style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)', boxShadow: '0 8px 24px rgba(255, 77, 0, 0.35)' }}
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
              isLight ? "bg-slate-50 border-slate-200 shadow-md" : "bg-white/[0.04] border-white/5 shadow-2xl"
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

                <div className="space-y-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={cn(
                          "group rounded-[2rem] border overflow-hidden transition-all duration-300",
                          expandedCategory === category.id
                            ? (isLight ? "bg-white border-slate-300 shadow-lg" : "bg-white/[0.06] border-white/15 shadow-xl")
                            : (isLight ? "bg-slate-50 border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md" : "bg-white/[0.02] border-white/8 hover:border-white/15")
                        )}
                      >
                        <button
                          onClick={() => { haptics.tap(); handleCategoryClick(category.id); }}
                          className="w-full p-6 flex items-center gap-5 transition-all text-left"
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-[1.1rem] flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110",
                            isOwner ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}>
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("text-[15px] font-black uppercase italic tracking-tight leading-tight", isLight ? "text-black" : "text-white")}>{category.title}</h4>
                            <p className={cn("text-[11px] font-bold uppercase tracking-widest opacity-40 truncate mt-0.5", isLight ? "text-black" : "text-white")}>{category.description}</p>
                          </div>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border transition-all shrink-0",
                            expandedCategory === category.id
                              ? "rotate-180 bg-primary/10 border-primary/30"
                              : (isLight ? "border-slate-200" : "border-white/10")
                          )}>
                            <ChevronDown className={cn("w-4 h-4", expandedCategory === category.id ? "text-primary opacity-100" : "opacity-40")} />
                          </div>
                        </button>

                        <AnimatePresence mode="sync">
                          {expandedCategory === category.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <div className={cn("px-4 pb-4 pt-1 space-y-2", isLight ? "bg-white" : "bg-black/10")}>
                                {category.subcategories.map((sub) => {
                                  const isSelected = selectedIssue?.subcategory === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => { haptics.tap(); handleSubcategorySelect(category.id, sub.id); }}
                                      className={cn(
                                        "w-full px-5 py-4 rounded-[1.4rem] flex items-center gap-4 transition-all text-left border",
                                        isSelected
                                          ? (isOwner ? "bg-purple-500/10 border-purple-500/40" : "bg-rose-500/10 border-rose-500/40")
                                          : (isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200" : "bg-white/[0.03] hover:bg-white/[0.07] border-white/8")
                                      )}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                        isSelected
                                          ? (isOwner ? "border-purple-500 bg-purple-500" : "border-rose-500 bg-rose-500")
                                          : (isLight ? "border-slate-300" : "border-white/20")
                                      )}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className={cn("text-[13px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{sub.title}</h5>
                                        <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mt-0.5", isLight ? "text-black" : "text-white")}>{sub.description}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                </div>
              </div>

              {/* 🛸 CASE AUDIT ENGINE */}
              <div className="xl:col-span-5 space-y-10">
                <AnimatePresence mode="sync">
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
                        isLight ? "bg-white border-slate-200 shadow-md" : "bg-white/[0.04] border-white/5"
                      )}>
                        <CardHeader className={cn("p-10 pb-6 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                          <CardTitle className={cn("text-2xl font-black uppercase italic tracking-tighter flex items-center gap-5", isLight ? "text-black" : "text-white")}>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl", isOwner ? "bg-purple-500/20 text-purple-400" : "bg-rose-500/20 text-rose-400")}>
                               <MessageSquare className="w-6 h-6" />
                            </div>
                            Audit Intelligence
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                          <div className="space-y-6">
                            <div className={cn("p-6 rounded-[2rem] flex items-center gap-6 border transition-all", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/10")}>
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
                                  "rounded-[2.5rem] border p-10 text-[16px] font-bold tracking-tight transition-all focus:ring-4 outline-none resize-none",
                                  isOwner ? "focus:ring-purple-500/20 border-purple-500/10 shadow-purple-500/5" : "focus:ring-rose-500/20 border-rose-500/10 shadow-rose-500/5",
                                  isLight ? "bg-white border-black/10 text-black placeholder:opacity-40" : "bg-black/60 border-white/5 text-white placeholder:opacity-20"
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
                                "h-20 w-full rounded-[2.5rem] text-white font-black uppercase italic tracking-[0.2em] text-[13px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all active:scale-95 border-0"
                              )}
                              style={{ background: isOwner ? 'linear-gradient(135deg, #8B5CF6, #4F46E5)' : 'linear-gradient(135deg, #FF4D00, #EB4898)', boxShadow: isOwner ? '0 8px 24px rgba(139, 92, 246, 0.35)' : '0 8px 24px rgba(255, 77, 0, 0.35)' }}
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

            {/* 🛸 TEMPLATE LIBRARY */}
            <div className="space-y-10">
              <div className="px-2 flex items-center gap-6">
                <span className={cn("text-[12px] font-black uppercase tracking-[0.4em] opacity-30 italic", isLight ? "text-black" : "text-white")}>Template Library</span>
                <div className={cn("h-[1px] flex-1", isLight ? "bg-black/10" : "bg-white/10")} />
                <button
                  onClick={() => { haptics.tap(); navigate(isOwner ? '/owner/contracts' : '/client/contracts'); }}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                >
                  Open Builder <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-8">
                {Object.entries(
                  (isOwner ? ownerTemplates : clientTemplates).reduce<Record<string, typeof ownerTemplates>>((acc, t) => {
                    if (!acc[t.category]) acc[t.category] = [];
                    acc[t.category].push(t);
                    return acc;
                  }, {})
                ).map(([category, templates]) => {
                  const meta = TEMPLATE_CATEGORY_META[category];
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0", meta?.color || 'bg-primary')}>
                          {meta?.icon || <FileText className="w-3.5 h-3.5" />}
                        </div>
                        <span className={cn("text-[11px] font-black uppercase tracking-[0.35em]", isLight ? "text-black/60" : "text-white/50")}>
                          {meta?.label || category}
                        </span>
                        <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-full", isLight ? "bg-black/5 text-black/40" : "bg-white/5 text-white/30")}>
                          {templates.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templates.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => { haptics.tap(); navigate(isOwner ? '/owner/contracts' : '/client/contracts'); }}
                            className={cn(
                              "text-left p-5 rounded-[1.75rem] border transition-all group hover:translate-y-[-2px] active:scale-[0.97]",
                              isLight
                                ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm"
                                : "bg-white/[0.03] border-white/[0.08] hover:border-white/15 hover:bg-white/[0.06]"
                            )}
                          >
                            <p className={cn("text-[13px] font-black uppercase italic tracking-tight leading-tight mb-1.5 group-hover:text-primary transition-colors", isLight ? "text-black" : "text-white")}>
                              {t.name}
                            </p>
                            <p className={cn("text-[10px] font-bold opacity-40 leading-relaxed line-clamp-2", isLight ? "text-black" : "text-white")}>
                              {t.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🛸 DIGITAL DOCUMENT GRID */}
            <div className="space-y-12">
              <div className="px-2 flex items-center gap-6">
                  <span className={cn("text-[12px] font-black uppercase tracking-[0.4em] opacity-30 italic", isLight ? "text-black" : "text-white")}>System Documents</span>
                  <div className={cn("h-[1px] flex-1", isLight ? "bg-black/10" : "bg-white/10")} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                 {[
                   { icon: FileText, label: 'Terms of Use', doc: 'terms', color: 'bg-blue-600 text-white shadow-blue-500/20' },
                   { icon: Shield, label: 'Privacy Protocol', doc: 'privacy', color: 'bg-rose-600 text-white shadow-rose-500/20' },
                   { icon: BookOpen, label: 'AUP Standards', doc: 'agl', color: 'bg-purple-600 text-white shadow-purple-500/20' },
                   { icon: Package, label: 'Service Packages', doc: 'packages', color: 'bg-amber-500 text-white shadow-amber-500/20' },
                   { icon: ScaleIcon, label: 'Lease Builder', path: isOwner ? '/owner/contracts' : '/client/contracts', color: 'bg-emerald-600 text-white shadow-emerald-500/20' },
                   // Removed duplicate Admin Review shortcut as admin-swipess handles admin functionality
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
                        isLight ? "bg-slate-50 border-slate-200 hover:bg-white hover:shadow-2xl" : "bg-white/[0.04] border-white/5"
                      )}
                   >
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", item.color)}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                         <h4 className={cn("text-lg font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{item.label}</h4>
                         <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-30", isLight ? "text-black" : "text-white")}>Authorized Protocol Node</p>
                      </div>
                      <div className={cn("mt-auto w-full flex items-center justify-between pt-4 border-t", isLight ? "border-slate-200" : "border-white/5")}>
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
    </AmbientPageBackground>
  );
};

export default LegalHub;
