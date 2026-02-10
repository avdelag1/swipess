import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield, ChevronRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/PageHeader";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

export default function LegalPage() {
  const navigate = useNavigate();

  const legalItems = [
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
      color: 'text-green-500',
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader
          title="Legal"
          subtitle="Terms of service and privacy information"
          showBack={true}
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
    </div>
  );
}
