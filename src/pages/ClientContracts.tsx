/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContracts, useActiveDeals } from "@/hooks/useContracts";
import { FileText, Clock, CheckCircle, AlertTriangle, Eye, FileEdit, Plus, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { ContractSigningDialog } from "@/components/ContractSigningDialog";
import { ContractTemplateSelector } from "@/components/ContractTemplateSelector";
import { ContractDocumentDialog } from "@/components/ContractDocumentDialog";
import { ContractTemplate } from "@/data/contractTemplates";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ClientContracts = () => {
  const navigate = useNavigate();
  const { data: contracts, isLoading: contractsLoading } = useContracts();
  const { data: activeDeals, isLoading: dealsLoading } = useActiveDeals();
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'signed_by_owner': return 'bg-blue-100 text-blue-800';
      case 'signed_by_client': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleSelectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    setShowDocumentEditor(true);
  };

  const handleBackToTemplates = () => {
    setShowDocumentEditor(false);
    setSelectedTemplate(null);
    setShowTemplateSelector(true);
  };

  if (contractsLoading || dealsLoading) {
    return (
      <div className="w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
        <div className="max-w-6xl mx-auto">
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
            className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 mb-4 px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">My Contracts</h1>
            <p className="text-white/80 text-sm sm:text-base">Manage your rental agreements and contracts</p>
          </div>

          {/* Create Document Section */}
          <div className="mb-6 sm:mb-8">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-white font-semibold mb-4">Create Documents</h3>
                <Button
                  onClick={() => setShowTemplateSelector(true)}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-auto py-4"
                >
                  <div className="flex items-center gap-3">
                    <FileEdit className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Use Template</div>
                      <div className="text-xs opacity-80">Promise to purchase, rental application, letter of intent</div>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Template Categories Info */}
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-green-900/50 to-blue-900/50 backdrop-blur-sm border-green-700/50">
              <CardContent className="p-4">
                <p className="text-white/90 text-sm text-center mb-3">Available document templates:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge className="bg-amber-500/20 text-amber-300">Promise to Purchase</Badge>
                  <Badge className="bg-green-500/20 text-green-300">Rental Application</Badge>
                  <Badge className="bg-blue-500/20 text-blue-300">Letter of Intent</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Deals Section */}
          {activeDeals && activeDeals.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Pending Signatures</h2>
              <div className="grid gap-3 sm:gap-4">
                {activeDeals.map((deal) => (
                  <Card key={deal.id} className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 p-2 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white text-sm sm:text-base truncate">{deal.contract?.title}</h3>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              {deal.contract?.contract_type.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-12 sm:ml-0">
                          <Badge className={getStatusColor(deal.status)}>
                            {getStatusIcon(deal.status)}
                            <span className="ml-1 text-xs">{deal.status.replace('_', ' ')}</span>
                          </Badge>
                          {deal.status === 'signed_by_owner' && (
                            <Button
                              onClick={() => setSelectedContract(deal.contract_id)}
                              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                              size="sm"
                            >
                              Sign Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Contracts Section */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">All Contracts</h2>

            {!contracts || contracts.length === 0 ? (
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                <CardContent className="p-6 sm:p-8 text-center">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No Contracts Yet</h3>
                  <p className="text-gray-400 text-sm sm:text-base mb-4">
                    When property owners send you contracts, they will appear here.
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    You can also create your own documents using our templates.
                  </p>
                  <Button
                    onClick={() => setShowTemplateSelector(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {contracts.map((contract) => (
                  <Card key={contract.id} className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 p-2 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-sm sm:text-base truncate">{contract.title}</h3>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              {contract.contract_type.replace('_', ' ').toUpperCase()} •
                              Created {formatDistanceToNow(new Date(contract.created_at))} ago
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-12 sm:ml-0">
                          <Badge className={getStatusColor(contract.status)}>
                            {getStatusIcon(contract.status)}
                            <span className="ml-1 text-xs">{contract.status.replace('_', ' ')}</span>
                          </Badge>
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm border-gray-600 hover:bg-gray-700">
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                            View
                          </Button>
                          {contract.status === 'signed_by_owner' && (
                            <Button
                              onClick={() => setSelectedContract(contract.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                            >
                              Sign
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedContract && (
        <ContractSigningDialog
          contractId={selectedContract}
          open={!!selectedContract}
          onOpenChange={() => setSelectedContract(null)}
        />
      )}

      <ContractTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelectTemplate={handleSelectTemplate}
        userRole="client"
      />

      {selectedTemplate && (
        <ContractDocumentDialog
          open={showDocumentEditor}
          onOpenChange={setShowDocumentEditor}
          template={selectedTemplate}
          onBack={handleBackToTemplates}
        />
      )}
    </>
  );
};

export default ClientContracts;
