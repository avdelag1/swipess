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
    question: "How do I list my property?",
    answer: "Go to your Properties section and tap 'Add New Listing'. Fill in all the property details including photos, description, price, location, and amenities. Make sure to add quality photos to attract more potential tenants."
  },
  {
    question: "How do I find tenants?",
    answer: "Browse through potential tenant profiles by swiping. Swipe right on profiles that match your criteria, or swipe left to pass. When you match with a tenant, you can start chatting to discuss your property and arrange viewings."
  },
  {
    question: "What happens when someone likes my property?",
    answer: "You'll receive a notification when someone shows interest in your property. You can view their profile and decide if they're a good fit. If you like them back, you'll create a match and can start messaging."
  },
  {
    question: "How do I message potential tenants?",
    answer: "Once you have a match with a tenant, you can message them directly from your matches or messages section. Note that messaging may require message credits depending on your subscription plan."
  },
  {
    question: "What are message credits?",
    answer: "Message credits are required to initiate conversations with potential tenants. You receive a certain number of credits based on your subscription plan. Premium plans offer more credits and better property visibility."
  },
  {
    question: "How do I upgrade my subscription?",
    answer: "Go to Settings > Premium Packages to view available subscription plans. Premium plans allow you to list more properties, get more message credits, and increase your visibility in search results."
  },
  {
    question: "What is property visibility?",
    answer: "Property visibility determines how often your listings appear in search results. Higher visibility means more potential tenants will see your properties. Premium plans offer increased visibility percentages."
  },
  {
    question: "How many properties can I list?",
    answer: "The number of properties you can list depends on your subscription plan. Free accounts have limited listings, while premium plans allow for more or unlimited property listings."
  },
  {
    question: "How do contracts work?",
    answer: "Once you agree on terms with a tenant, you can create and manage contracts through the app. Go to Settings > Contracts to create new contracts, track signing status, and manage your rental agreements."
  },
  {
    question: "How do I verify my identity?",
    answer: "Go to your profile settings to complete identity verification. This helps build trust with potential tenants and may improve your visibility in search results."
  },
  {
    question: "Can I see who viewed my properties?",
    answer: "With premium subscriptions, you can see analytics about your property views and engagement. This helps you understand how attractive your listings are to potential tenants."
  },
  {
    question: "How do I report a problem or inappropriate users?",
    answer: "If you encounter any issues with users, you can report them directly from their profile page. You can also contact support through Settings > FAQ & Help for assistance."
  },
  {
    question: "How do I delete my account?",
    answer: "Go to Settings > Security, scroll to the bottom to find the Danger Zone section where you can delete your account. Note that this will also remove all your property listings."
  },
  {
    question: "Is my information secure?",
    answer: "Yes, we take your privacy seriously. We use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for more details on how we handle your information."
  }
];

export default function FAQOwnerPage() {
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
          subtitle="Common questions for property owners"
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
