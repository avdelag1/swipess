/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Scale, Clock, MessageSquare, ChevronRight, ChevronDown,
  ArrowLeft, Shield, AlertTriangle, FileText, Home, DollarSign,
  Users, Gavel, Lock, Send, CheckCircle2, Building2, UserX, Briefcase
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

const ownerLegalIssueCategories: LegalIssueCategory[] = [
  {
    id: 'tenant-issues',
    title: 'Tenant Issues',
    icon: <UserX className="w-5 h-5" />,
    description: 'Problems with tenants or renters',
    subcategories: [
      { id: 'non-payment', title: 'Non-Payment of Rent', description: 'Tenant not paying rent on time' },
      { id: 'property-damage', title: 'Property Damage', description: 'Tenant damaged the property' },
      { id: 'lease-violation', title: 'Lease Violations', description: 'Tenant breaking lease terms' },
      { id: 'unauthorized-occupants', title: 'Unauthorized Occupants', description: 'Extra people living in unit' },
      { id: 'eviction-process', title: 'Eviction Process', description: 'Need help with legal eviction' }
    ]
  },
  {
    id: 'contract-legal',
    title: 'Contracts & Agreements',
    icon: <FileText className="w-5 h-5" />,
    description: 'Legal help with contracts and leases',
    subcategories: [
      { id: 'lease-creation', title: 'Lease Agreement Creation', description: 'Create legally binding leases' },
      { id: 'contract-review', title: 'Contract Review', description: 'Review existing agreements' },
      { id: 'addendum-creation', title: 'Addendum Creation', description: 'Add terms to existing lease' },
      { id: 'rental-rules', title: 'Rental Rules Documentation', description: 'Create enforceable property rules' }
    ]
  },
  {
    id: 'property-legal',
    title: 'Property & Real Estate',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Legal matters related to property',
    subcategories: [
      { id: 'property-sale', title: 'Property Sale Assistance', description: 'Legal help selling property' },
      { id: 'zoning-permits', title: 'Zoning & Permits', description: 'Rental zoning questions' },
      { id: 'property-dispute', title: 'Property Disputes', description: 'Boundary or ownership disputes' },
      { id: 'liability-protection', title: 'Liability Protection', description: 'Protect yourself from lawsuits' }
    ]
  },
  {
    id: 'financial-legal',
    title: 'Financial & Tax',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Financial and tax-related legal matters',
    subcategories: [
      { id: 'security-deposit', title: 'Security Deposit Issues', description: 'Deposit return disputes' },
      { id: 'rent-collection', title: 'Rent Collection', description: 'Legal collection methods' },
      { id: 'tax-compliance', title: 'Tax Compliance', description: 'Rental income tax questions' },
      { id: 'insurance-claims', title: 'Insurance Claims', description: 'Help with property claims' }
    ]
  },
  {
    id: 'compliance',
    title: 'Compliance & Regulations',
    icon: <Shield className="w-5 h-5" />,
    description: 'Regulatory compliance questions',
    subcategories: [
      { id: 'fair-housing', title: 'Fair Housing Laws', description: 'Ensure compliance with laws' },
      { id: 'safety-codes', title: 'Safety Codes', description: 'Building and safety compliance' },
      { id: 'rental-licensing', title: 'Rental Licensing', description: 'Required permits and licenses' },
      { id: 'tenant-screening', title: 'Legal Tenant Screening', description: 'Proper screening procedures' }
    ]
  },
  {
    id: 'business-legal',
    title: 'Business & Operations',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Business operations legal support',
    subcategories: [
      { id: 'business-formation', title: 'Business Formation', description: 'LLC and entity setup' },
      { id: 'employee-issues', title: 'Employee/Contractor Issues', description: 'Staff-related legal matters' },
      { id: 'vendor-disputes', title: 'Vendor Disputes', description: 'Issues with service providers' },
      { id: 'general-business', title: 'General Business Law', description: 'Other business questions' }
    ]
  }
];

const OwnerLawyerServices = () => {
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
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Legal Services for Owners</h1>
            <p className="text-white/80 text-sm sm:text-base">Professional legal assistance for property owners and landlords</p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <Card className="mb-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Direct Lawyer Access - Coming Soon</h3>
                <p className="text-purple-200/80 text-sm">
                  We're building a direct connection to verified real estate lawyers. Submit your request now and we'll match you with the right legal expert.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Benefits */}
        <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <Building2 className="w-5 h-5 text-green-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Property Owner Legal Support</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Get specialized legal assistance designed for landlords and property owners. From tenant disputes to contract creation.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-500/20 text-green-300">Eviction Assistance</Badge>
                  <Badge className="bg-green-500/20 text-green-300">Lease Drafting</Badge>
                  <Badge className="bg-green-500/20 text-green-300">Tenant Disputes</Badge>
                  <Badge className="bg-green-500/20 text-green-300">Property Protection</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Info */}
        <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Premium Legal Packages</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Choose from flexible legal service packages tailored for property owners.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h4 className="text-white font-medium text-sm">Quick Consultation</h4>
                    <p className="text-gray-400 text-xs mt-1">30-min call with lawyer</p>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h4 className="text-white font-medium text-sm">Document Package</h4>
                    <p className="text-gray-400 text-xs mt-1">Lease review & creation</p>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h4 className="text-white font-medium text-sm">Full Support</h4>
                    <p className="text-gray-400 text-xs mt-1">Ongoing legal representation</p>
                  </div>
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
                  Your legal assistance request has been received. Our team will review your case and contact you with available options and pricing for legal services.
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
                  What Do You Need Help With?
                </CardTitle>
                <CardDescription>Select the category that best describes your situation</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y divide-gray-700/50">
                    {ownerLegalIssueCategories.map((category) => (
                      <div key={category.id}>
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-gray-700/30 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0 text-purple-400">
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
                                    selectedIssue?.subcategory === sub.id ? 'bg-purple-500/20' : ''
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    selectedIssue?.subcategory === sub.id
                                      ? 'border-purple-500 bg-purple-500'
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
                      Provide details about your issue so our legal team can prepare the best solution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="description" className="text-white">Your Message</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the situation, include relevant dates, names, and any documentation you have..."
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
                          className="bg-purple-600 hover:bg-purple-700 flex-1"
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
            <CardTitle className="text-white">How Our Legal Service Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 text-purple-400 font-semibold">1</div>
                <div>
                  <h4 className="font-medium text-white">Select Your Issue</h4>
                  <p className="text-sm text-gray-400">Choose the category that matches your legal need</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 text-purple-400 font-semibold">2</div>
                <div>
                  <h4 className="font-medium text-white">Describe Your Situation</h4>
                  <p className="text-sm text-gray-400">Provide details so we understand your case fully</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 text-purple-400 font-semibold">3</div>
                <div>
                  <h4 className="font-medium text-white">Review & Quote</h4>
                  <p className="text-sm text-gray-400">Our team reviews and sends you service options</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 text-green-400 font-semibold">4</div>
                <div>
                  <h4 className="font-medium text-white">Get Your Solution</h4>
                  <p className="text-sm text-gray-400">Purchase a package and receive professional legal assistance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerLawyerServices;
