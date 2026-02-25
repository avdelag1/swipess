/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { PageHeader } from "@/components/PageHeader";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Shield, FileText, HelpCircle, Info, ChevronRight,
  Scale, Volume2, Radio, Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AccountSecurity } from "@/components/AccountSecurity";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { SwipeSoundSettings } from "@/components/SwipeSoundSettings";
import { useState } from "react";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };
const stagger = { staggerChildren: 0.05, delayChildren: 0.02 };
const itemVariant = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: fastSpring },
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

// iOS-style icon badge configs
const settingsGroups: SettingsGroup[] = [
  {
    label: 'Account',
    items: [
      {
        icon: Shield,
        label: 'Security',
        description: 'Password, 2FA, and account security',
        bg: 'linear-gradient(135deg, #064e3b, #10b981)',
        section: 'security',
      },
      {
        icon: Volume2,
        label: 'Preferences',
        description: 'Customize sounds and app behavior',
        bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        section: 'preferences',
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      {
        icon: Radio,
        label: 'Radio Player',
        description: 'Listen to live radio stations',
        bg: 'linear-gradient(135deg, #064e3b, #10b981)',
        route: '/radio',
      },
      {
        icon: FileText,
        label: 'My Contracts',
        description: 'View and manage your contracts',
        bg: 'linear-gradient(135deg, #7c2d12, #f97316)',
        route: '/client/contracts',
      },
      {
        icon: Scale,
        label: 'Legal Services',
        description: 'Get legal help for rental issues',
        bg: 'linear-gradient(135deg, #312e81, #6366f1)',
        route: '/client/legal-services',
      },
    ],
  },
  {
    label: 'Support',
    items: [
      {
        icon: HelpCircle,
        label: 'FAQ & Help',
        description: 'Common questions and support',
        bg: 'linear-gradient(135deg, #164e63, #06b6d4)',
        route: '/faq/client',
      },
      {
        icon: Info,
        label: 'About Swipess',
        description: 'Learn about our platform',
        bg: 'linear-gradient(135deg, #4c1d95, #a855f7)',
        route: '/about',
      },
      {
        icon: FileText,
        label: 'Legal',
        description: 'Terms of service and privacy policy',
        bg: 'linear-gradient(135deg, #78350f, #d97706)',
        route: '/legal',
      },
    ],
  },
];

const ClientSettingsNew = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (activeSection === 'security') {
    return (
      <div className="w-full min-h-full overflow-y-auto px-4 py-4 pb-32">
        <div className="max-w-3xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSection(null)}
            className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </motion.button>

          <PageHeader title="Account Security" subtitle="Manage your password and security settings" />

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={fastSpring} className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-card border border-border">
              <CardContent className="p-6">
                <AccountSecurity userRole="client" />
              </CardContent>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">Irreversible actions that affect your account</p>
              </div>
              <DeleteAccountSection />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeSection === 'preferences') {
    return (
      <div className="w-full min-h-full overflow-y-auto px-4 py-4 pb-32">
        <div className="max-w-3xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveSection(null)}
            className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </motion.button>

          <PageHeader title="Preferences" subtitle="Customize your app experience" />

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={fastSpring} className="space-y-6">
            <SwipeSoundSettings />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full overflow-y-auto px-6 py-6 pb-40 scrollbar-hide">
      <div className="max-w-3xl mx-auto space-y-10">
        <PageHeader
          title="Settings"
          subtitle="Application configuration & global preferences"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: stagger } }}
          className="space-y-10"
        >
          {settingsGroups.map((group) => (
            <motion.div key={group.label} variants={itemVariant} className="space-y-3">
              {/* Section pill label */}
              <div className="px-1 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80">{group.label}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-zinc-500/20 to-transparent" />
              </div>

              {/* Group card - Moscow style matte container */}
              <div className="rounded-[32px] overflow-hidden bg-zinc-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl">
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
                      {/* iOS-style colored icon badge with depth */}
                      <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10"
                        style={{ background: item.bg }}
                      >
                        <item.icon className="w-5 h-5 text-white shadow-sm" />
                      </div>

                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-foreground/95 tracking-tight">{item.label}</div>
                        <div className="text-[12px] text-muted-foreground/70 font-medium mt-0.5 leading-relaxed">{item.description}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.section && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      </div>
                    </motion.button>

                    {idx < group.items.length - 1 && (
                      <div className="mx-6 h-px bg-white/5" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* App Version - Elegant footer */}
        <div className="text-center pt-10 pb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex flex-col items-center gap-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="swipess-text text-lg tracking-tighter text-foreground/40">Swipess</span>
              <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase py-0 px-1.5 bg-white/5 border-white/10 text-zinc-500">v1.2.0</Badge>
            </div>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Moscow Experience Engine</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientSettingsNew;
