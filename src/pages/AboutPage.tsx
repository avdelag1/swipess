import { Card, CardContent } from "@/components/ui/card";
import { Home, Users, Shield, Zap, Heart, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

export default function AboutPage() {
  const navigate = useNavigate();

  const ownerBenefits = [
    {
      icon: Users,
      title: "Find Quality Tenants",
      description: "Connect with pre-screened tenants who match your property requirements and preferences."
    },
    {
      icon: Zap,
      title: "Fast & Efficient",
      description: "No more endless emails and calls. Match with interested tenants instantly and communicate directly."
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "All users go through verification, giving you confidence in who you're renting to."
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Chat directly with potential tenants, schedule viewings, and close deals faster."
    }
  ];

  const clientBenefits = [
    {
      icon: Home,
      title: "Discover Perfect Properties",
      description: "Browse through curated listings that match your preferences, budget, and location needs."
    },
    {
      icon: Heart,
      title: "Simple & Fun",
      description: "Swipe through properties like you're choosing your next favorite place. Finding a home should be enjoyable!"
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Property owners are verified, and all communications happen within our secure platform."
    },
    {
      icon: MessageCircle,
      title: "Connect Directly",
      description: "Once matched, chat directly with property owners to ask questions and arrange viewings."
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <PageHeader
          title="About Swipess"
          subtitle="Connecting property owners with the perfect tenants"
          showBack={true}
        />

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastSpring}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Swipess is revolutionizing how people find and rent properties. We believe finding
                your next home or the perfect tenant should be simple, safe, and even enjoyable.
                By combining the familiar swipe interface with powerful matching technology, we
                connect the right people with the right properties faster than ever before.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Owner Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastSpring, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Benefits for Property Owners
          </h2>
          <div className="grid gap-4">
            {ownerBenefits.map((benefit, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-4 flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Client Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastSpring, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Benefits for Renters
          </h2>
          <div className="grid gap-4">
            {clientBenefits.map((benefit, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-4 flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastSpring, delay: 0.3 }}
        >
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Create Your Profile</h3>
                    <p className="text-sm text-muted-foreground">Sign up and tell us what you're looking for (or what you're offering).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Swipe & Discover</h3>
                    <p className="text-sm text-muted-foreground">Browse through listings or profiles. Swipe right to show interest, left to pass.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Match & Connect</h3>
                    <p className="text-sm text-muted-foreground">When both parties show interest, it's a match! Start chatting directly.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Seal the Deal</h3>
                    <p className="text-sm text-muted-foreground">Arrange viewings, negotiate terms, and manage contracts all in one place.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Version */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            <span className="swipess-text text-sm">Swipess</span> <span className="opacity-60">v1.0</span>
          </p>
        </div>
      </div>
    </div>
  );
}
