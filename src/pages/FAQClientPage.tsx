import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, HelpCircle, Mail, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { cn } from "@/lib/utils";
import useAppTheme from "@/hooks/useAppTheme";
import { haptics } from "@/utils/microPolish";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";
import { Helmet } from "react-helmet-async";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "How do I find properties to rent?",
    answer: "Simply browse through property listings by swiping. Swipe right to like a property you're interested in, or swipe left to pass. When you match with a property owner, you can start chatting to arrange viewings and discuss details."
  },
  {
    question: "What happens when I like a property?",
    answer: "When you like a property by swiping right, the property owner is notified. If they're interested in you as a potential tenant, they can like your profile back, creating a match. Once matched, you can message each other directly."
  },
  {
    question: "How do I message property owners?",
    answer: "You can message property owners once you have a match. Go to your matches or messages section to start a conversation. Note that messaging may require message credits depending on your subscription plan."
  },
  {
    question: "What are message credits?",
    answer: "Message credits are required to initiate conversations with property owners. You receive a certain number of credits based on your subscription plan. Premium plans offer more credits and better visibility."
  },
  {
    question: "How do I upgrade my subscription?",
    answer: "Go to Settings > Premium Packages to view available subscription plans. Premium plans give you more message credits, better visibility in search results, and additional features like super likes."
  },
  {
    question: "What is a Super Like?",
    answer: "A Super Like is a way to show extra interest in a property. Property owners see Super Likes highlighted, making you stand out from other potential tenants. Super Likes are available with premium subscriptions."
  },
  {
    question: "How do I view properties I've liked?",
    answer: "Go to your Liked Properties section from the main menu. There you can see all properties you've shown interest in and track your matches."
  },
  {
    question: "Can I filter property searches?",
    answer: "Yes! Use the filters to narrow down properties by location, price range, property type (apartment, house, room), number of bedrooms, pet policy, and other amenities you need."
  },
  {
    question: "How do contracts work?",
    answer: "Once you and a property owner agree on terms, you can create and sign contracts through the app. Go to Settings > Contracts to view and manage your rental agreements."
  },
  {
    question: "How do I report a problem or inappropriate content?",
    answer: "If you encounter any issues, you can report users or listings directly from their profile or listing page. You can also contact support through Settings > FAQ & Help for assistance."
  },
  {
    question: "How do I delete my account?",
    answer: "Go to Settings > Security, scroll to the bottom to find the Danger Zone section where you can delete your account. Note that this action is permanent and cannot be undone."
  },
  {
    question: "Is my information secure?",
    answer: "Yes, we take your privacy seriously. We use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for more details on how we handle your information."
  }
];

export default function FAQClientPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { theme, isLight } = useAppTheme();

  const toggleExpand = (index: number) => {
    haptics.tap();
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Helmet>
        <title>FAQ & Help | Swipess Client</title>
        <meta name="description" content="Common questions and support for Swipess renters." />
      </Helmet>

      <AtmosphericLayer />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-6 pb-32">
        <PageHeader
          title="Protocol Support"
          subtitle="Frequently Asked Questions for Renters"
          showBack={true}
          backTo="/client/settings"
          icon={<HelpCircle className="w-8 h-8 text-rose-500" />}
          accentColor="rose"
        />

        <div className="mt-12 space-y-4">
          <AnimatePresence mode="popLayout">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...fastSpring, delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden cursor-pointer transition-all duration-300 border",
                    expandedIndex === index 
                      ? (isLight ? "bg-white border-rose-500/20 shadow-xl" : "bg-white/10 border-rose-500/30 shadow-2xl shadow-rose-500/10")
                      : (isLight ? "bg-black/[0.02] border-black/5 hover:bg-black/[0.04]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]")
                  )}
                  onClick={() => toggleExpand(index)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6">
                      <span className={cn(
                        "font-black uppercase italic tracking-tight transition-colors",
                        expandedIndex === index ? "text-rose-500" : "text-foreground/80"
                      )}>
                        {item.question}
                      </span>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        expandedIndex === index ? "bg-rose-500 text-white rotate-180" : "bg-black/5 text-muted-foreground"
                      )}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        >
                          <div className={cn(
                            "px-6 pb-6 text-sm font-medium leading-relaxed italic border-t pt-4",
                            isLight ? "text-black/60 border-black/5" : "text-white/60 border-white/5"
                          )}>
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastSpring, delay: 0.4 }}
          className="mt-20"
        >
          <Card className={cn(
            "rounded-[3rem] overflow-hidden border relative group",
            isLight ? "bg-rose-50 border-rose-100 shadow-sm" : "bg-rose-500/5 border-rose-500/20 shadow-2xl"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-50" />
            <CardContent className="p-10 text-center space-y-8 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-2 border border-rose-500/20">
                <MessageSquare className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Still need help?</h3>
                <p className="text-[14px] font-bold opacity-60 italic leading-relaxed max-w-sm mx-auto">
                  Our elite support protocols are available 24/7 to resolve your navigation challenges.
                </p>
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => { haptics.success(); window.location.href = 'mailto:support@swipess.app'; }}
                  className="h-16 px-12 rounded-[2rem] bg-rose-600 hover:bg-rose-700 text-white font-black uppercase italic tracking-widest transition-all shadow-2xl shadow-rose-500/20 active:scale-95"
                >
                  DISPATCH SIGNAL
                  <Mail className="w-5 h-5 ml-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
