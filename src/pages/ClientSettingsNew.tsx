/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, FileText, HelpCircle, Info, ChevronRight, Scale, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AccountSecurity } from "@/components/AccountSecurity";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { SwipeSoundSettings } from "@/components/SwipeSoundSettings";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

const ClientSettingsNew = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const settingsItems = [
    {
      icon: Shield,
      label: 'Security',
      description: 'Password, 2FA, and account security',
      color: 'text-green-500',
      section: 'security'
    },
    {
      icon: Volume2,
      label: 'Preferences',
      description: 'Customize sounds and app behavior',
      color: 'text-blue-500',
      section: 'preferences'
    },
    {
      icon: FileText,
      label: 'Contracts',
      description: 'View and manage your contracts',
      color: 'text-orange-500',
      action: () => navigate('/client/contracts')
    },
    {
      icon: Scale,
      label: 'Legal Services',
      description: 'Get legal help for rental issues',
      color: 'text-indigo-500',
      action: () => navigate('/client/legal-services')
    },
    {
      icon: HelpCircle,
      label: 'FAQ & Help',
      description: 'Common questions and support',
      color: 'text-cyan-500',
      action: () => navigate('/faq/client')
    },
    {
      icon: Info,
      label: 'About Swipess',
      description: 'Learn about our platform',
      color: 'text-purple-500',
      action: () => navigate('/about')
    },
    {
      icon: FileText,
      label: 'Legal',
      description: 'Terms of service and privacy policy',
      color: 'text-amber-500',
      action: () => navigate('/legal')
    },
  ];

  if (activeSection === 'security') {
    return (
      <div className="w-full min-h-full overflow-y-auto px-5 py-4 pb-32">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection(null)}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            Back
          </Button>

          <PageHeader
            title="Account Security"
            subtitle="Manage your password and security settings"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fastSpring}
            className="space-y-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <AccountSecurity userRole="client" />
              </CardContent>
            </Card>

            {/* Danger Zone - Delete Account */}
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">
                  Irreversible actions that affect your account
                </p>
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
      <div className="w-full min-h-full overflow-y-auto px-5 py-4 pb-32">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection(null)}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            Back
          </Button>

          <PageHeader
            title="Preferences"
            subtitle="Customize your app experience"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fastSpring}
            className="space-y-6"
          >
            <SwipeSoundSettings />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full overflow-y-auto px-5 py-4 pb-32">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          Back
        </Button>

        {/* Page Header */}
        <PageHeader
          title="Settings"
          subtitle="Manage your account and preferences"
        />

        {/* Settings Menu */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastSpring}
        >
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              {settingsItems.map((item, index) => (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (item.section) {
                        setActiveSection(item.section);
                      } else if (item.action) {
                        item.action();
                      }
                    }}
                    className="w-full flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`mt-1 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                  </button>
                  {index < settingsItems.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* App Version */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            <span className="swipess-text text-sm">Swipess</span> <span className="opacity-60">v1.0</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientSettingsNew;
