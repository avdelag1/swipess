import { Card, CardContent } from "@/components/ui/card";
import { Home, Users, Shield, Zap, ThumbsUp, MessageCircle, Sparkles, Target, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";
import useAppTheme from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { haptics } from "@/utils/microPolish";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

export default function AboutPage() {
  const { isLight } = useAppTheme();

  const ownerBenefits = [
    {
      icon: Users,
      title: "Quality Tenants",
      description: "Connect with pre-screened tenants who match your property requirements."
    },
    {
      icon: Zap,
      title: "Instant Protocol",
      description: "No more endless calls. Match instantly and communicate directly."
    },
    {
      icon: Shield,
      title: "Biometric Trust",
      description: "Verified profiles and secure digital contracts for total peace of mind."
    },
    {
      icon: MessageCircle,
      title: "Direct Terminal",
      description: "Chat directly, schedule viewings, and close deals in record time."
    }
  ];

  const clientBenefits = [
    {
      icon: Home,
      title: "Curated Discovery",
      description: "Browse through listings that match your unique lifestyle preferences."
    },
    {
      icon: ThumbsUp,
      title: "Fluid Interface",
      description: "Swipe through properties with a fun, gamified experience."
    },
    {
      icon: Shield,
      title: "Verified Authority",
      description: "Engage with trusted owners in a secure, audited environment."
    },
    {
      icon: MessageCircle,
      title: "Direct Signal",
      description: "Open direct lines of communication with owners instantly."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-32">
      <Helmet>
        <title>About Swipess | The Future of Real Estate</title>
        <meta name="description" content="Discover how Swipess is revolutionizing the rental market with a swipe-based interface." />
      </Helmet>

      <AtmosphericLayer />

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-6 pb-32">
        <PageHeader
          title="Our Mission"
          subtitle="The Architecture of Modern Real Estate"
          showBack={true}
          icon={<Rocket className="w-8 h-8 text-primary" />}
        />

        {/* Missions Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastSpring}
          className="mt-12"
        >
          <Card className={cn(
            "rounded-[3rem] overflow-hidden border relative group",
            isLight ? "bg-white border-black/5 shadow-xl" : "bg-white/[0.03] border-white/5 shadow-2xl"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
            <CardContent className="p-10 relative z-10">
              <div className="flex items-start gap-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Revolutionizing Connection</h2>
                  <p className={cn("text-[15px] font-medium leading-relaxed italic opacity-70", isLight ? "text-black" : "text-white")}>
                    Swipess is the architecture of the future rental market. We believe finding your next home or the perfect tenant should be a fluid, high-fidelity experience. By combining a revolutionary swipe interface with secure digital protocols, we connect humanity with their ideal spaces faster than ever before.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Owner Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...fastSpring, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="px-2 flex items-center gap-4">
              <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic")}>For Owners</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            </div>
            <div className="grid gap-4">
              {ownerBenefits.map((benefit, index) => (
                <Card key={index} className={cn(
                  "rounded-3xl border transition-all hover:scale-[1.02]",
                  isLight ? "bg-white border-black/5" : "bg-white/[0.02] border-white/5"
                )}>
                  <CardContent className="p-6 flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <benefit.icon className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black uppercase italic tracking-tight text-[13px]">{benefit.title}</h3>
                      <p className="text-[12px] font-medium opacity-50 leading-relaxed italic">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Client Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...fastSpring, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="px-2 flex items-center gap-4">
              <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40 italic")}>For Renters</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            </div>
            <div className="grid gap-4">
              {clientBenefits.map((benefit, index) => (
                <Card key={index} className={cn(
                  "rounded-3xl border transition-all hover:scale-[1.02]",
                  isLight ? "bg-white border-black/5" : "bg-white/[0.02] border-white/5"
                )}>
                  <CardContent className="p-6 flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                      <benefit.icon className="w-6 h-6 text-rose-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black uppercase italic tracking-tight text-[13px]">{benefit.title}</h3>
                      <p className="text-[12px] font-medium opacity-50 leading-relaxed italic">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastSpring, delay: 0.3 }}
          className="mt-16"
        >
          <Card className={cn(
            "rounded-[3rem] border overflow-hidden",
            isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.02] border-white/5"
          )}>
            <CardContent className="p-10">
              <div className="flex items-center gap-4 mb-10">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter">The Protocol Flow</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { step: 1, title: "Initialize Profile", desc: "Define your parameters and authenticate your identity." },
                  { step: 2, title: "Discover & Swipe", desc: "Browse curated data nodes. Swipe right to initialize interest." },
                  { step: 3, title: "Synchronize Match", desc: "When interest is mutual, a communication bridge is established." },
                  { step: 4, title: "Finalize Protocol", desc: "Negotiate terms and execute secure digital contracts." }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black italic text-sm shadow-xl shadow-primary/20">
                      {item.step}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black uppercase italic tracking-tight text-[13px]">{item.title}</h3>
                      <p className="text-[12px] font-medium opacity-50 italic leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Version */}
        <div className="text-center mt-16 pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/5">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">System Protocol v2.0.4 - Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}


