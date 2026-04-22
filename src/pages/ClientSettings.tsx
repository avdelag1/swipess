/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { PageHeader } from "@/components/PageHeader";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, FileText, HelpCircle, Info, ChevronRight,
  Scale, Volume2, Wrench, ShieldCheck, Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AccountSecurity } from "@/components/AccountSecurity";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { SwipeSoundSettings } from "@/components/SwipeSoundSettings";
import { BackgroundThemeSettings } from "@/components/BackgroundThemeSettings";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ClientVerificationFlow } from "@/components/ClientVerificationFlow";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { SwipessLogo } from "@/components/SwipessLogo";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };
const stagger = { staggerChildren: 0.04 };
const itemVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: fastSpring },
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
  const { theme } = useTheme();
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
          icon: Scale,
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
      ],
    },
  ];

  if (activeSection === 'security') {
    return (
      <div className="w-full min-h-full overflow-y-auto px-4 pt-4 pb-32 bg-background">
        <div className="max-w-3xl mx-auto">
          <PageHeader title={t('settings.security')} subtitle={t('settings.securityDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-card border border-border">
              <CardContent className="p-6">
                <AccountSecurity userRole="client" />
              </CardContent>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-destructive">{t('settings.security')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.securityDesc')}</p>
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
      <div className="w-full min-h-full overflow-y-auto px-4 pt-4 pb-32 bg-background">
        <div className="max-w-3xl mx-auto">
          <PageHeader title={t('settings.verification')} subtitle={t('settings.verificationDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6">
            <ClientVerificationFlow onComplete={() => setActiveSection(null)} />
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeSection === 'language') {
    return (
      <div className="w-full min-h-full overflow-y-auto px-4 pt-4 pb-32 bg-background">
        <div className="max-w-3xl mx-auto">
          <PageHeader title={t('settings.language')} subtitle={t('settings.languageDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6">
            <LanguageToggle />
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeSection === 'preferences') {
    return (
      <div className="w-full min-h-full overflow-y-auto px-4 pt-4 pb-32 bg-background">
        <div className="max-w-3xl mx-auto">
          <PageHeader title={t('settings.preferences')} subtitle={t('settings.preferencesDesc')} showBack={true} onBack={() => setActiveSection(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fastSpring} className="space-y-6">
            <BackgroundThemeSettings />
            <SwipeSoundSettings />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full overflow-y-auto px-6 pt-4 pb-40 scrollbar-hide bg-background">
      <div className="max-w-3xl mx-auto space-y-10">
        
        <div className="space-y-3 pt-10">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">Identity Config</span>
           </div>
           <h1 className={cn("text-4xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>System Settings</h1>
           <PWAInstallButton className="pt-2" />
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

              <div className="rounded-[32px] overflow-hidden bg-card/40 backdrop-blur-2xl border border-border shadow-2xl">
                {group.items.map((item, idx) => (
                  <div key={item.label}>
                    <motion.button
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        if (item.section) setActiveSection(item.section);
                        else if (item.route) navigate(item.route);
                      }}
                      className="w-full flex items-center gap-5 py-5 px-6 transition-all text-left"
                    >
                      <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10"
                        style={{ background: item.bg }}
                      >
                        <item.icon className="w-5 h-5 text-white shadow-sm" />
                      </div>

                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-foreground/95 tracking-tight">{item.label}</div>
                        <div className="text-[12px] text-muted-foreground font-medium mt-0.5 leading-relaxed">{item.description}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.section && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </motion.button>

                    {idx < group.items.length - 1 && (
                      <div className="mx-6 h-px bg-border/50" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* App Version - Elegant footer */}
        <div className="text-center pt-10 pb-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-4"
          >
            <SwipessLogo size="md" className="transition-transform duration-500 hover:scale-110" />
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className="swipess-text text-xl font-black tracking-tighter text-foreground/80">Swipess</span>
                <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase py-0.5 px-2 bg-brand-primary/10 border-brand-primary/20 text-brand-primary font-mono">v3.3.0</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.25em] opacity-40">Elite Discovery Engine</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
