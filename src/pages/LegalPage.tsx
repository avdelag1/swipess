import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield, ChevronRight, BookOpen, Scale } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/PageHeader";
import { LawyerContactModal } from "@/components/LawyerContactModal";
import { useState } from "react";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

export default function LegalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || 'settings';
  const [showLawyerModal, setShowLawyerModal] = useState(false);

  const handleBack = () => {
    if (from === 'dashboard') {
      navigate('/client/dashboard');
    } else {
      navigate('/client/settings');
    }
  };

  const legalItems = [
    {
      icon: Scale,
      label: 'Legal Hub & Contracts',
      description: 'Manage your rental agreements and digital protocols',
      color: 'text-emerald-500',
      action: () => navigate('/client/contracts')
    },
    {
      icon: BookOpen,
      label: 'Lawyer Services',
      description: 'Get professional legal assistance for rental issues',
      color: 'text-amber-500',
      action: () => setShowLawyerModal(true)
    },
    {
      icon: FileText,
      label: 'Terms of Service',
      description: 'Our terms and conditions for using Swipess',
      color: 'text-blue-500',
      action: () => navigate('/terms-of-service')
    },
    {
      icon: Shield,
      label: 'Privacy Policy',
      description: 'How we collect, use, and protect your data',
      color: 'text-rose-500',
      action: () => navigate('/privacy-policy')
    },
    {
      icon: BookOpen,
      label: 'Acceptable Use Guidelines (AGL)',
      description: 'Community standards and conduct guidelines',
      color: 'text-purple-500',
      action: () => navigate('/agl')
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-24">
        <PageHeader
          title="Legal"
          subtitle="Terms of service and privacy information"
          showBack={true}
          onBack={handleBack}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastSpring}
        >
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              {legalItems.map((item, index) => (
                <div key={item.label}>
                  <button
                    onClick={item.action}
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
                  {index < legalItems.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <LawyerContactModal 
        isOpen={showLawyerModal} 
        onClose={() => setShowLawyerModal(false)} 
      />
    </div>
  );
}


