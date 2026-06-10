import { PageHeader } from "@/components/PageHeader";
import { CardContent } from "@/components/ui/card";
import {
  ChevronRight, FileText, Globe, HelpCircle, Info,
  MessageSquarePlus, Scale as ScaleIcon, Shield, ShieldCheck, Volume2, Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AccountSecurity } from "@/components/AccountSecurity";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { SwipeSoundSettings } from "@/components/SwipeSoundSettings";
import { BackgroundThemeSettings } from "@/components/BackgroundThemeSettings";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ClientVerificationFlow } from "@/components/ClientVerificationFlow";
import { FeedbackSection } from "@/components/FeedbackSection";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SwipessLogo } from "@/components/SwipessLogo";
import useAppTheme from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };
const stagger = { staggerChildren: 0.04 };
const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: fastSpring },
};

type SettingsItem = {
  icon: any;
  label: string;
  description: string;
  bg: string;
  section?: string;
  route?: string;
};

type SettingsGroup = {
  label: string;
  items: SettingsItem[];
};

const ClientSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const settingsGroups: SettingsGroup[] = [
    {
      label: t('settings.security'),
      items: [
        {
          icon: Shield,
          label: t('settings.security'),
          description: t('settings.securityDesc'),
          bg: 'linear-gradient(135deg, #064e3b, #10b981)',
          section: 'security',
        },
        {
          icon: ShieldCheck,
          label: t('settings.verification'),
          description: t('settings.verificationDesc'),
          bg: 'linear-gradient(135deg, #065f46, #34d399)',
          section: 'verification',
        },
        {
          icon: Volume2,
          label: t('settings.preferences'),
          description: t('settings.preferencesDesc'),
          bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          section: 'preferences',
        },
        {
          icon: Globe,
          label: t('settings.language'),
          description: t('settings.languageDesc'),
          bg: 'linear-gradient(135deg, #3730a3, #818cf8)',
          section: 'language',
        },
      ],
    },
    {
      label: t('settings.contracts'),
      items: [
        {
          icon: Wrench,
          label: t('settings.maintenance'),
          description: t('settings.maintenanceDesc'),
          bg: 'linear-gradient(135deg, #92400e, #fbbf24)',
          route: '/client/maintenance',
        },
        {
          icon: FileText,
          label: t('settings.contracts'),
          description: t('settings.contractsDesc'),
          bg: 'linear-gradient(135deg, #7c2d12, #f97316)',
          route: '/client/contracts',
        },
        {
          icon: ScaleIcon,
          label: t('settings.legal'),
          description: t('settings.legalDesc'),
          bg: 'linear-gradient(135deg, #312e81, #6366f1)',
          route: '/client/legal-services',
        },
      ],
    },
    {
      label: t('settings.faq'),
      items: [
        {
          icon: HelpCircle,
          label: t('settings.faq'),
          description: t('settings.faqDesc'),
          bg: 'linear-gradient(135deg, #164e63, #06b6d4)',
          route: '/faq/client',
        },
        {
          icon: Info,
          label: t('settings.about'),
          description: t('settings.aboutDesc'),
          bg: 'linear-gradient(135deg, #4c1d95, #a855f7)',
          route: '/about',
        },
        {
          icon: FileText,
          label: t('settings.legalPage'),
          description: t('settings.legalPageDesc'),
          bg: 'linear-gradient(135deg, #78350f, #d97706)',
          route: '/legal',
        },
        {
          icon: MessageSquarePlus,
          label: 'Feedback',
          description: 'Share ideas, bugs, or appreciation',
          bg: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
          section: 'feedback',
        },
      ],
    },
  ];

  if (activeSection === 'security') {
    return (
      <div className="w-full relative px-4 pt-4 pb-32 bg-background min-h-screen">
        <AtmosphericLayer variant="primary" />
        <div className="max-w-3xl mx-auto relative z-10">
          <PageHeader title={t('settings.security')} subtitle={t('settings.securityDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6 pt-10">
            <div className="rounded-[2.5rem] overflow-hidden bg-background border border-border shadow-2xl">
              <CardContent className="p-8">
                <AccountSecurity userRole="client" />
              </CardContent>
            </div>
            <div className="space-y-3 px-2">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-destructive">{t('settings.destructiveActions')}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">{t('settings.proceedWithCaution')}</p>
              </div>
              <DeleteAccountSection />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeSection === 'verification') {
    return (
      <div className="w-full relative px-4 pt-4 pb-32 bg-background min-h-screen">
        <AtmosphericLayer variant="rose" />
        <div className="max-w-3xl mx-auto relative z-10">
          <PageHeader title={t('settings.verification')} subtitle={t('settings.verificationDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6 pt-10">
            <ClientVerificationFlow onComplete={() => setActiveSection(null)} />
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeSection === 'language') {
    return (
      <div className="w-full relative px-4 pt-4 pb-32 bg-background min-h-screen">
        <AtmosphericLayer variant="indigo" />
        <div className="max-w-3xl mx-auto relative z-10">
          <PageHeader title={t('settings.language')} subtitle={t('settings.languageDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6 pt-10 flex justify-center">
            <LanguageToggle />
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeSection === 'feedback') {
    return (
      <div className="w-full relative px-4 pt-4 pb-32 bg-background min-h-screen">
        <AtmosphericLayer variant="primary" />
        <div className="max-w-3xl mx-auto relative z-10">
          <PageHeader title="Feedback" subtitle="Help us improve Swipess" showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="pt-10">
            <div className="rounded-[2.5rem] overflow-hidden bg-background border border-border shadow-2xl p-8">
              <FeedbackSection />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeSection === 'preferences') {
    return (
      <div className="w-full relative px-4 pt-4 pb-32 bg-background min-h-screen">
        <AtmosphericLayer variant="default" />
        <div className="max-w-3xl mx-auto relative z-10">
          <PageHeader title={t('settings.preferences')} subtitle={t('settings.preferencesDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-8 pt-10">
            <BackgroundThemeSettings />
            <SwipeSoundSettings />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative px-6 pb-40 bg-background min-h-screen">
      <AtmosphericLayer variant="primary" />
      
      <div className="max-w-3xl mx-auto space-y-12 pt-4 relative z-10">
        
        <div className="space-y-3">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">{t('settings.identityConfig')}</span>
           </div>
           <h1 className={cn("text-4xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>{t('settings.systemSettings')}</h1>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: stagger } }}
          className="space-y-10"
        >
          {settingsGroups.map((group) => (
            <motion.div key={group.label} variants={itemVariant} className="space-y-3">
              <div className="px-1 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{group.label}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-muted-foreground/20 to-transparent" />
              </div>

              <div className="space-y-3">
                {group.items.map((item, idx) => (
                  <div key={item.label}>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        if (item.section) setActiveSection(item.section);
                        else if (item.route) navigate(item.route);
                      }}
                      className={cn(
                        "group w-full flex items-center gap-5 p-5 transition-all text-left",
                        "bg-card/40 backdrop-blur-md border border-border/40 shadow-sm rounded-[2rem]",
                        "hover:shadow-2xl hover:bg-card/80 hover:border-foreground/20"
                      )}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10"
                        style={{ background: item.bg }}
                      >
                        <item.icon className="w-6 h-6 text-white drop-shadow-md" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-black uppercase italic tracking-tighter text-foreground">{item.label}</div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1 opacity-70 leading-relaxed truncate">{item.description}</div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {item.section && (
                          <div className="w-2 h-2 rounded-full bg-[#EB4898] animate-pulse shadow-[0_0_10px_rgba(235,72,152,0.8)]" />
                        )}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0">
                           <ChevronRight className="w-5 h-5 text-foreground/70 flex-shrink-0" />
                        </div>
                      </div>
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 🛸 Swipess FOOTER */}
        <div className="flex flex-col items-center gap-6 pt-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-6"
          >
            <div className={cn("w-16 h-16 rounded-[1.6rem] flex items-center justify-center shadow-2xl border transition-transform duration-500 hover:scale-110", isLight ? "bg-white border-black/5" : "bg-black border-white/10")}>
               <SwipessLogo size="sm" />
            </div>
            <div className="text-center space-y-2">
               <div className="flex items-center justify-center gap-3">
                  <span className={cn("text-2xl font-black italic tracking-tighter uppercase", isLight ? "text-black" : "text-white")}>SWIPESS PRO</span>
                  <div className="bg-[#EB4898]/10 px-3 py-1 rounded-full border border-[#EB4898]/20">
                     <span className="text-[9px] font-black text-[#EB4898] uppercase tracking-widest font-mono">V4.0.0</span>
                  </div>
               </div>
               <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] italic opacity-30", isLight ? "text-black" : "text-white")}>{t('settings.eliteDiscovery')}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
