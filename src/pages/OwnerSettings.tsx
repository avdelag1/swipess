/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { PageHeader } from "@/components/PageHeader";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, FileText, HelpCircle, Info, ChevronRight,
  Scale, Volume2, Building2, Globe, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AccountSecurity } from "@/components/AccountSecurity";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { SwipeSoundSettings } from "@/components/SwipeSoundSettings";
import { BackgroundThemeSettings } from "@/components/BackgroundThemeSettings";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PWAInstallButton } from "@/components/PWAInstallButton";
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

const OwnerSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, isLight } = useAppTheme();
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
          icon: Globe,
          label: t('settings.language'),
          description: t('settings.languageDesc'),
          bg: 'linear-gradient(135deg, #3730a3, #818cf8)',
          section: 'language',
        },
        {
          icon: Volume2,
          label: t('settings.preferences'),
          description: t('settings.preferencesDesc'),
          bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          section: 'preferences',
        },
      ],
    },
    {
      label: t('settings.contracts'),
      items: [
        {
          icon: Building2,
          label: 'Brand Assets',
          description: 'View, edit, and create your listings',
          bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          route: '/owner/properties',
        },
        {
          icon: FileText,
          label: t('settings.contracts'),
          description: t('settings.contractsDesc'),
          bg: 'linear-gradient(135deg, #7c2d12, #f97316)',
          route: '/owner/contracts',
        },
        {
          icon: Scale,
          label: t('settings.legal'),
          description: t('settings.legalDesc'),
          bg: 'linear-gradient(135deg, #312e81, #6366f1)',
          route: '/owner/legal-services',
        },
      ],
    },
    {
      label: t('settings.faq'),
      items: [
        {
          icon: Users,
          label: "Partner Sync",
          description: "Invite a partner to find shared matches",
          bg: 'linear-gradient(135deg, #db2777, #f472b6)',
          route: '/partner/sync',
        },
        {
          icon: HelpCircle,
          label: t('settings.faq'),
          description: t('settings.faqDesc'),
          bg: 'linear-gradient(135deg, #164e63, #06b6d4)',
          route: '/faq/owner',
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
      ],
    },
  ];

  if (activeSection === 'security') {
    return (
      <div className="w-full relative px-4 pt-4 pb-32 bg-background min-h-screen">
        <AtmosphericLayer variant="indigo" />
        <div className="max-w-3xl mx-auto relative z-10">
          <PageHeader title={t('settings.security')} subtitle={t('settings.securityDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6 pt-10">
            <div className="rounded-[2.5rem] overflow-hidden bg-card/40 backdrop-blur-2xl border border-border shadow-2xl">
              <CardContent className="p-8">
                <AccountSecurity userRole="owner" />
              </CardContent>
            </div>
            <div className="space-y-3 px-2">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-destructive">Destructive Actions</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Proceed with absolute caution</p>
              </div>
              <DeleteAccountSection />
            </div>
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
      <AtmosphericLayer variant="indigo" />

      <div className="max-w-3xl mx-auto space-y-12 pt-4 relative z-10">
        
        {/* 🛸 OWNER MEGA-HEADER */}
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
              {/* Section pill label */}
              <div className="px-1 flex items-center gap-4">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 italic">{group.label}</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
              </div>

              {/* Group card - Moscow style matte container */}
              <div className={cn(
                "rounded-[2.8rem] overflow-hidden backdrop-blur-3xl border shadow-3xl",
                isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5"
              )}>
                {group.items.map((item, idx) => (
                  <div key={item.label}>
                    <motion.button
                      whileHover={{ backgroundColor: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        if (item.section) setActiveSection(item.section);
                        else if (item.route) navigate(item.route);
                      }}
                      className="w-full flex items-center gap-6 py-6 px-8 transition-all text-left group"
                    >
                      {/* iOS-style colored icon badge with depth */}
                      <div
                        className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 shadow-2xl border border-white/10"
                        style={{ background: item.bg }}
                      >
                        <item.icon className="w-5 h-5 text-white shadow-sm" />
                      </div>

                      <div className="flex-1">
                        <div className="text-[15px] font-black uppercase italic tracking-tight">{item.label}</div>
                        <div className="text-[11px] font-bold uppercase tracking-widest opacity-30 mt-1 leading-relaxed">{item.description}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.section && (
                          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        )}
                        <ChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>

                    {idx < group.items.length - 1 && (
                      <div className={cn("mx-8 h-[1px]", isLight ? "bg-black/5" : "bg-white/5")} />
                    )}
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
                  <span className={cn("text-2xl font-black italic tracking-tighter uppercase", isLight ? "text-black" : "text-white")}>Swipess</span>
                  <div className="bg-purple-600/10 px-3 py-1 rounded-full border border-purple-600/20">
                     <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest font-mono">V3.3.1</span>
                  </div>
               </div>
               <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] italic opacity-30", isLight ? "text-black" : "text-white")}>Property Authority Network • Elite Discovery</p>
            </div>
          </motion.div>
        </div>
      </div>
      
      <p className="fixed bottom-6 right-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Config Terminal v3.0</p>
    </div>
  );
};

export default OwnerSettings;
