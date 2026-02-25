/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Scale, Clock, MessageSquare, ChevronRight, ChevronDown,
  ArrowLeft, Shield, AlertTriangle, FileText, Home, DollarSign,
  Users, Gavel, Lock, Send, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';

interface LegalIssueCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  subcategories: {
    id: string;
    title: string;
    description: string;
  }[];
}

const legalIssueCategories: LegalIssueCategory[] = [
  {
    id: 'landlord-issues',
    title: 'Landlord Issues',
    icon: <Home className="w-5 h-5" />,
    description: 'Problems with your landlord or property owner',
    subcategories: [
      { id: 'lease-violation', title: 'Lease Violations', description: 'Landlord not following the lease terms' },
      { id: 'security-deposit', title: 'Security Deposit Disputes', description: 'Issues recovering your deposit' },
      { id: 'maintenance', title: 'Maintenance Issues', description: 'Landlord not maintaining the property' },
      { id: 'illegal-entry', title: 'Illegal Entry', description: 'Landlord entering without notice' },
      { id: 'eviction', title: 'Wrongful Eviction', description: 'Being evicted unfairly or illegally' }
    ]
  },
  {
    id: 'rent-issues',
    title: 'Rent & Payment Issues',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Disputes about rent payments or charges',
    subcategories: [
      { id: 'rent-increase', title: 'Unlawful Rent Increase', description: 'Rent raised without proper notice' },
      { id: 'hidden-fees', title: 'Hidden Fees', description: 'Unexpected charges not in the lease' },
      { id: 'payment-disputes', title: 'Payment Disputes', description: 'Disagreements about amounts paid' },
      { id: 'late-fees', title: 'Excessive Late Fees', description: 'Unfair late payment penalties' }
    ]
  },
  {
    id: 'contract-issues',
    title: 'Contract & Agreement Issues',
    icon: <FileText className="w-5 h-5" />,
    description: 'Problems with rental agreements or contracts',
    subcategories: [
      { id: 'unfair-terms', title: 'Unfair Contract Terms', description: 'One-sided or illegal clauses' },
      { id: 'contract-review', title: 'Contract Review', description: 'Need help understanding terms' },
      { id: 'contract-breach', title: 'Contract Breach', description: 'Other party not honoring agreement' },
      { id: 'early-termination', title: 'Early Termination', description: 'Need to break lease early' }
    ]
  },
  {
    id: 'discrimination',
    title: 'Discrimination & Rights',
    icon: <Users className="w-5 h-5" />,
    description: 'Discrimination or rights violations',
    subcategories: [
      { id: 'housing-discrimination', title: 'Housing Discrimination', description: 'Denied housing unfairly' },
      { id: 'harassment', title: 'Harassment', description: 'Being harassed by landlord' },
      { id: 'privacy-violation', title: 'Privacy Violations', description: 'Your privacy being invaded' },
      { id: 'accessibility', title: 'Accessibility Issues', description: 'Disability accommodation problems' }
    ]
  },
  {
    id: 'other-legal',
    title: 'Other Legal Matters',
    icon: <Gavel className="w-5 h-5" />,
    description: 'Other legal questions or concerns',
    subcategories: [
      { id: 'general-advice', title: 'General Legal Advice', description: 'General questions about tenant rights' },
      { id: 'document-help', title: 'Document Assistance', description: 'Help with legal documents' },
      { id: 'mediation', title: 'Mediation Request', description: 'Need third-party mediation' },
      { id: 'other', title: 'Other Issue', description: 'Issue not listed above' }
    ]
  }
];

const ClientLawyerServices = () => {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<{ category: string; subcategory: string } | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setSelectedIssue(null);
  };

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    setSelectedIssue({ category: categoryId, subcategory: subcategoryId });
  };

  const handleSubmitRequest = async () => {
    if (!selectedIssue || !description.trim()) {
      toast.error('Please select an issue type and provide a description');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Legal help request submitted!');
  };

  const handleReset = () => {
    setSelectedIssue(null);
    setDescription('');
    setSubmitted(false);
    setExpandedCategory(null);
  };

  return (
    <div className="w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Legal Services</h1>
            <p className="text-white/80 text-sm sm:text-base">Get professional legal assistance for your rental issues</p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <Card className="mb-6 bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-amber-700/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Direct Lawyer Chat - Coming Soon</h3>
                <p className="text-amber-200/80 text-sm">
                  Soon you'll be able to chat directly with verified lawyers. For now, submit your request and we'll connect you with legal help.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Info */}
        <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Premium Legal Service</h3>
                <p className="text-gray-400 text-sm mb-3">
                  To receive a personalized legal solution, you'll need to purchase a legal consultation package.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-purple-500/20 text-purple-300">Basic Consultation</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300">Document Review</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300">Full Representation</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {submitted ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-green-900/30 border-green-700/50">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                <p className="text-gray-300 mb-6">
                  Your legal help request has been submitted. Our team will review your case and get back to you with available options and pricing.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={handleReset} className="border-gray-600">
                    Submit Another Request
                  </Button>
                  <Button onClick={() => navigate(-1)} className="bg-green-600 hover:bg-green-700">
                    Back to Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Issue Selection */}
            <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  What's Your Issue?
                </CardTitle>
                <CardDescription>Select the category that best describes your problem</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y divide-gray-700/50">
                    {legalIssueCategories.map((category) => (
                      <div key={category.id}>
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-gray-700/30 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0 text-blue-400">
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white">{category.title}</h4>
                            <p className="text-sm text-gray-400 truncate">{category.description}</p>
                          </div>
                          {expandedCategory === category.id ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        <AnimatePresence>
                          {expandedCategory === category.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-gray-900/30"
                            >
                              {category.subcategories.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => handleSubcategorySelect(category.id, sub.id)}
                                  className={`w-full pl-16 pr-4 py-3 flex items-center gap-3 hover:bg-gray-700/30 transition-colors text-left ${
                                    selectedIssue?.subcategory === sub.id ? 'bg-blue-500/20' : ''
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    selectedIssue?.subcategory === sub.id
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-500'
                                  }`}>
                                    {selectedIssue?.subcategory === sub.id && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-white">{sub.title}</h5>
                                    <p className="text-xs text-gray-400">{sub.description}</p>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Description Input */}
            {selectedIssue && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      Describe Your Situation
                    </CardTitle>
                    <CardDescription>
                      Provide details about your issue so our legal team can better assist you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="description" className="text-white">Your Message</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what happened, when it occurred, and any relevant details..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={6}
                          className="mt-2 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          className="border-gray-600"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitRequest}
                          disabled={isSubmitting || !description.trim()}
                          className="bg-blue-600 hover:bg-blue-700 flex-1"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Request
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}

        {/* How It Works */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 text-blue-400 font-semibold">1</div>
                <div>
                  <h4 className="font-medium text-white">Select Your Issue</h4>
                  <p className="text-sm text-gray-400">Choose the category that best matches your problem</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 text-blue-400 font-semibold">2</div>
                <div>
                  <h4 className="font-medium text-white">Describe Your Situation</h4>
                  <p className="text-sm text-gray-400">Provide details so we can understand your case</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 text-blue-400 font-semibold">3</div>
                <div>
                  <h4 className="font-medium text-white">Get a Response</h4>
                  <p className="text-sm text-gray-400">Our team reviews and provides solution options</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 text-purple-400 font-semibold">4</div>
                <div>
                  <h4 className="font-medium text-white">Purchase & Resolve</h4>
                  <p className="text-sm text-gray-400">Choose a legal package to get your personalized solution</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientLawyerServices;
