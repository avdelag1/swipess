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
    <div className="w-full min-h-full overflow-y-auto px-4 py-4 pb-32">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title="Settings" subtitle="App configuration & support" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: stagger } }}
          className="space-y-6"
        >
          {settingsGroups.map((group) => (
            <motion.div key={group.label} variants={itemVariant}>
              {/* Section pill label */}
              <div className="mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{group.label}</span>
              </div>

              {/* Group card */}
              <div className="rounded-3xl overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/5 shadow-xl">
                {group.items.map((item, idx) => (
                  <div key={item.label}>
                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        if (item.section) setActiveSection(item.section);
                        else if (item.route) navigate(item.route);
                      }}
                      className="w-full flex items-center gap-4 py-4 px-5 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                    >
                      {/* iOS-style colored icon badge */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: item.bg }}
                      >
                        <item.icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                      </div>

                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                      </div>

                      {item.section ? null : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </motion.button>

                    {idx < group.items.length - 1 && (
                      <div className="mx-5 h-px bg-border" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* App Version */}
        <div className="text-center pb-4">
          <p className="text-xs text-muted-foreground">
            <span className="swipess-text text-sm">Swipess</span> <span className="opacity-40">v1.0</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientSettingsNew;
