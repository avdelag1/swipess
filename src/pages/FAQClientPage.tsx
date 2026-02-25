import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <PageHeader
          title="FAQ & Help"
          subtitle="Common questions for renters"
          showBack={true}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastSpring}
          className="space-y-3"
        >
          {faqItems.map((item, index) => (
            <Card
              key={index}
              className="bg-card border-border overflow-hidden cursor-pointer"
              onClick={() => toggleExpand(index)}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <span className="font-medium text-foreground pr-4">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                      expandedIndex === index && "rotate-180"
                    )}
                  />
                </div>
                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 text-muted-foreground text-sm border-t border-border pt-3">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastSpring, delay: 0.1 }}
          className="mt-8"
        >
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support team for personalized assistance
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@swipess.com'}
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
