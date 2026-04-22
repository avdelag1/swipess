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
  ArrowLeft, Shield, AlertTriangle, FileText, DollarSign,
  Lock, Send, CheckCircle2, Building2, UserX, Briefcase, Gavel, Activity
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

const ownerLegalIssueCategories: LegalIssueCategory[] = [
  {
    id: 'tenant-issues',
    title: 'Tenant Issues',
    icon: <UserX className="w-5 h-5" />,
    description: 'Problems with tenants or renters',
    subcategories: [
      { id: 'non-payment', title: 'Non-Payment of Rent', description: 'Tenant not paying rent on time' },
      { id: 'property-damage', title: 'Property Damage', description: 'Tenant damaged the property' },
      { id: 'lease-violation', title: 'Lease Violations', description: 'Tenant breaking lease terms' },
      { id: 'unauthorized-occupants', title: 'Unauthorized Occupants', description: 'Extra people living in unit' },
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
      { id: 'addendum-creation', title: 'Addendum Creation', description: 'Add terms to existing lease' },
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
      { id: 'property-dispute', title: 'Property Disputes', description: 'Boundary or ownership disputes' },
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
      { id: 'tax-compliance', title: 'Tax Compliance', description: 'Rental income tax questions' },
      { id: 'insurance-claims', title: 'Insurance Claims', description: 'Help with property claims' }
    ]
  },
  {
    id: 'compliance',
    title: 'Compliance & Regulations',
    icon: <Shield className="w-5 h-5" />,
    description: 'Regulatory compliance questions',
    subcategories: [
      { id: 'fair-housing', title: 'Fair Housing Laws', description: 'Ensure compliance with laws' },
      { id: 'safety-codes', title: 'Safety Codes', description: 'Building and safety compliance' },
      { id: 'rental-licensing', title: 'Rental Licensing', description: 'Required permits and licenses' },
      { id: 'tenant-screening', title: 'Legal Tenant Screening', description: 'Proper screening procedures' }
    ]
  },
  {
    id: 'business-legal',
    title: 'Business & Operations',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Business operations legal support',
    subcategories: [
      { id: 'business-formation', title: 'Business Formation', description: 'LLC and entity setup' },
      { id: 'employee-issues', title: 'Employee/Contractor Issues', description: 'Staff-related legal matters' },
      { id: 'vendor-disputes', title: 'Vendor Disputes', description: 'Issues with service providers' },
      { id: 'general-business', title: 'General Business Law', description: 'Other business questions' }
    ]
  }
];

const OwnerLawyerServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, isLight } = useAppTheme();
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

  return (
    <div className="w-full overflow-x-hidden pb-24 relative selection:bg-purple-500/30">
      
      {/* 🛸 BACKGROUND GLOWS */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-purple-500/30 blur-[130px] rounded-full" />
         <div className="absolute top-[20%] right-[-5%] w-[40%] h-[30%] bg-indigo-500/20 blur-[100px] rounded-full" />
      </div>

      <div className="p-6 pt-24 max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* 🛸 OWNER MEGA-HEADER */}
        <div className="flex flex-col gap-3">
           <PageHeader title="OWNER LEGAL HUB" showBack={true} />
           <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed max-w-sm", isLight ? "text-black" : "text-white")}> Professional Real Estate Legal Support </p>
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
             <div className="bg-purple-600 px-4 py-2 rounded-full shadow-lg hidden sm:block">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Identity Verified</span>
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
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Real Estate Legal Experts</h3>
              <p className="text-white/60 text-[13px] font-bold leading-relaxed mb-8 max-w-lg italic">
                Connect with our specialized real estate legal team. We will review your case details for immediate priority legal review and contact you directly.
              </p>
              <Button 
                onClick={() => { setLawyerContactRequested(true); toast.success("Request Received"); triggerHaptic('success'); }}
                disabled={lawyerContactRequested}
                className="h-16 px-12 rounded-[2rem] bg-white hover:bg-white/90 text-purple-900 font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all active:scale-95"
              >
                {lawyerContactRequested ? "Contact Requested" : "CONTACT LAWYER"}
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
                  <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 max-w-xs mx-auto leading-relaxed">Your request has been successfully received by our legal department. A specialized lawyer will contact you shortly.</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                 <Button onClick={handleReset} className="h-16 px-12 rounded-[2rem] bg-purple-600 text-white font-black uppercase tracking-widest active:scale-95">New Request</Button>
                 <Button onClick={() => navigate('/owner/dashboard')} variant="ghost" className="h-16 px-12 rounded-[2rem] font-black uppercase tracking-widest">Back to Hub</Button>
               </div>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Issue Selection */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                   <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Issue Categorization</span>
                   <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
                </div>
                
                <div className={cn("rounded-[3rem] border backdrop-blur-3xl overflow-hidden", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                    <ScrollArea className="max-h-[500px]">
                      <div className="divide-y divide-white/5">
                        {ownerLegalIssueCategories.map((category) => (
                          <div key={category.id}>
                            <button
                              onClick={() => handleCategoryClick(category.id)}
                              className="w-full p-8 flex items-center gap-6 hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="w-14 h-14 bg-purple-500/20 rounded-[1.2rem] flex items-center justify-center shrink-0 text-purple-400">
                                {category.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-black uppercase italic tracking-tight">{category.title}</h4>
                                <p className="text-[11px] font-bold uppercase tracking-widest opacity-30 mt-1">{category.description}</p>
                              </div>
                              {expandedCategory === category.id ? (
                                <ChevronDown className="w-6 h-6 opacity-30" />
                              ) : (
                                <ChevronRight className="w-6 h-6 opacity-30" />
                              )}
                            </button>

                            <AnimatePresence>
                              {expandedCategory === category.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden bg-black/20"
                                >
                                  {category.subcategories.map((sub) => (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleSubcategorySelect(category.id, sub.id)}
                                      className={cn(
                                        "w-full pl-24 pr-8 py-5 flex items-center gap-6 transition-all text-left group",
                                        selectedIssue?.subcategory === sub.id ? 'bg-purple-500/20' : 'hover:bg-white/5'
                                      )}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedIssue?.subcategory === sub.id ? 'border-purple-500 bg-purple-500' : 'border-white/10 group-hover:border-white/30'
                                      )}>
                                        {selectedIssue?.subcategory === sub.id && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="text-[13px] font-black uppercase tracking-tight">{sub.title}</h5>
                                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-0.5">{sub.description}</p>
                                      </div>
                                    </button>
                                  ))}
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
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                       <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Case Intelligence</span>
                       <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
                    </div>
                    
                    <div className={cn("p-10 rounded-[3rem] border backdrop-blur-3xl shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
                       <div className="space-y-6">
                         <div className="flex items-center gap-4 mb-4">
                            <MessageSquare className="w-5 h-5 text-purple-500" />
                            <h3 className={cn("text-xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Case Details</h3>
                         </div>
                         
                         <Textarea
                           id="description"
                           placeholder="Describe the situation, include relevant dates, names, and any documentation you have..."
                           value={description}
                           onChange={(e) => setDescription(e.target.value)}
                           rows={6}
                           className={cn(
                             "w-full bg-transparent border-none focus:ring-0 text-lg font-bold placeholder:opacity-20 p-0 resize-none",
                             isLight ? "text-black" : "text-white"
                           )}
                         />
                         
                         <div className="flex flex-col sm:flex-row gap-4 pt-8">
                             <Button onClick={handleReset} variant="ghost" className="h-16 rounded-[2rem] px-10 text-[10px] uppercase font-black tracking-widest opacity-40 hover:opacity-100">Cancel</Button>
                             <Button
                                 onClick={handleSubmitRequest}
                                 disabled={isSubmitting || !description.trim()}
                                 className="h-16 flex-1 rounded-[2rem] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic tracking-widest shadow-2xl shadow-purple-500/30 transition-all active:scale-95"
                             >
                                 {isSubmitting ? "SENDING..." : "SEND REQUEST"}
                             </Button>
                         </div>
                       </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* How It Works */}
        <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
               <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40", isLight ? "text-black" : "text-white")}>Operation Protocol</span>
               <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
            </div>
            
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isLight ? "text-black" : "text-white")}>
                {[
                  { step: 1, title: "Select Issue", desc: "Categorize your legal need for priority routing." },
                  { step: 2, title: "Detail Case", desc: "Provide high-fidelity information for review." },
                  { step: 3, title: "Expert Match", desc: "Our system assigns a specialized legal partner." },
                  { step: 4, title: "Direct Contact", desc: "Lawyer initiates contact via secure terminal." }
                ].map((item) => (
                  <div key={item.step} className={cn("p-6 rounded-[2rem] border flex items-start gap-4", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.03] border-white/5")}>
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 text-white text-[10px] font-black">{item.step}</div>
                    <div>
                      <h4 className="text-[12px] font-black uppercase tracking-widest">{item.title}</h4>
                      <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
            </div>
        </div>
      </div>
      
      <p className="fixed bottom-6 left-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Lawyer Dispatch Terminal v2.0</p>
    </div>
  );
};

export default OwnerLawyerServices;


