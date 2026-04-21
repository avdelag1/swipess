import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, FileText, HelpCircle, Info, ChevronRight,
  Scale, Volume2, Building2, Globe, Users, Activity, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AccountSecurity } from "@/components/AccountSecurity";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { SwipeSoundSettings } from "@/components/SwipeSoundSettings";
import { BackgroundThemeSettings } from "@/components/BackgroundThemeSettings";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { NexusLogo } from "@/components/NexusLogo";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };
const stagger = { staggerChildren: 0.05 };
const itemVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: fastSpring },
};

const OwnerSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const settingsGroups = [
    {
      label: t('settings.security'),
      items: [
        { icon: Shield, label: t('settings.security'), description: t('settings.securityDesc'), bg: '#EB4898', section: 'security' },
        { icon: Globe, label: t('settings.language'), description: t('settings.languageDesc'), bg: '#6366f1', section: 'language' },
        { icon: Volume2, label: t('settings.preferences'), description: t('settings.preferencesDesc'), bg: '#orange-500', section: 'preferences' },
      ],
    },
    {
      label: t('settings.contracts'),
      items: [
        { icon: Building2, label: 'Asset Matrix', description: 'Manage your property deployments', bg: '#06b6d4', route: '/owner/properties' },
        { icon: FileText, label: t('settings.contracts'), description: t('settings.contractsDesc'), bg: '#f97316', route: '/owner/contracts' },
        { icon: Scale, label: t('settings.legal'), description: t('settings.legalDesc'), bg: '#8b5cf6', route: '/owner/legal-services' },
      ],
    },
    {
      label: 'Network & Support',
      items: [
        { icon: Users, label: "Partner Sync", description: "Collab with another owner entity", bg: '#db2777', route: '/partner/sync' },
        { icon: HelpCircle, label: t('settings.faq'), description: t('settings.faqDesc'), bg: '#3b82f6', route: '/faq/owner' },
        { icon: Info, label: t('settings.about'), description: t('settings.aboutDesc'), bg: '#4c1d95', route: '/about' },
      ],
    },
  ];

  if (activeSection) {
      return (
        <div className={cn("min-h-full w-full transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
            <div className="w-full max-w-lg mx-auto p-6 pt-24 pb-48 relative z-10">
                <PageHeader title={activeSection.toUpperCase()} showBack={true} onBack={() => { triggerHaptic('medium'); setActiveSection(null); }} />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 mt-10">
                    {activeSection === 'security' && (
                        <div className="space-y-12">
                            <div className={cn("p-8 rounded-[2.8rem] border backdrop-blur-3xl shadow-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/10")}>
                                <AccountSecurity userRole="owner" />
                            </div>
                            <DeleteAccountSection />
                        </div>
                    )}
                    {activeSection === 'language' && <LanguageToggle />}
                    {activeSection === 'preferences' && (
                        <div className="space-y-10">
                            <BackgroundThemeSettings />
                            <SwipeSoundSettings />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
      );
  }

  return (
    <div className={cn("min-h-full w-full transition-colors duration-500 overflow-y-auto no-scrollbar", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC AMBIENCE */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-purple-600/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-indigo-500/30 blur-[110px] rounded-full" />
      </div>

      <div className="w-full max-w-7xl mx-auto p-6 pt-24 pb-48 space-y-12 relative z-10">
        
        <div className="space-y-3">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 italic">Owner Config</span>
           </div>
           <h1 className={cn("text-4xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>System Settings</h1>
           <PWAInstallButton className="pt-2" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: stagger } }}
          className="space-y-12"
        >
          {settingsGroups.map((group) => (
            <motion.div key={group.label} variants={itemVariant} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                 <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] italic", isLight ? "text-black/40" : "text-white/40")}>{group.label}</span>
                 <div className={cn("h-[1px] flex-1", isLight ? "bg-black/5" : "bg-white/10")} />
              </div>

              <div className={cn(
                  "rounded-[3rem] overflow-hidden border shadow-3xl transition-all",
                  isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/[0.08] backdrop-blur-3xl"
              )}>
                {group.items.map((item, idx) => (
                  <div key={item.label}>
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        if (item.section) setActiveSection(item.section);
                        else if (item.route) navigate(item.route);
                      }}
                      className="w-full flex items-center gap-6 py-6 px-8 transition-all text-left active:bg-black/5"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl border border-white/10"
                        style={{ backgroundColor: item.bg }}
                      >
                        <item.icon className="w-7 h-7 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className={cn("text-[16px] font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{item.label}</div>
                        <div className={cn("text-[10px] font-black uppercase tracking-widest mt-1 opacity-40 leading-relaxed", isLight ? "text-black" : "text-white")}>{item.description}</div>
                      </div>

                      <ChevronRight className={cn("w-5 h-5 opacity-20", isLight ? "text-black" : "text-white")} />
                    </button>
                    {idx < group.items.length - 1 && <div className={cn("mx-8 h-[1px]", isLight ? "bg-black/5" : "bg-white/10")} />}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 🛸 NEXUS FOOTER */}
        <div className="flex flex-col items-center gap-6 pt-16">
            <div className="w-16 h-16 rounded-[1.6rem] bg-black flex items-center justify-center shadow-2xl border border-white/10">
               <NexusLogo size="sm" />
            </div>
            <div className="text-center space-y-2">
               <div className="flex items-center justify-center gap-3">
                  <span className={cn("text-2xl font-black italic tracking-tighter uppercase", isLight ? "text-black" : "text-white")}>NEXUS DISCOVERY</span>
                  <div className="bg-purple-600/10 px-3 py-1 rounded-full border border-purple-600/20">
                     <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest font-mono">V3.3.1</span>
                  </div>
               </div>
               <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] italic opacity-30", isLight ? "text-black" : "text-white")}>Property Authority Matrix • Elite Discovery</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerSettings;

