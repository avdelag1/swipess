/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
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
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ClientContracts = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data: contracts, isLoading: contractsLoading } = useContracts();
  const { data: activeDeals, isLoading: dealsLoading } = useActiveDeals();
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'signed_by_owner': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'signed_by_client': return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'completed': return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'disputed': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground border-border/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'completed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'disputed': return <AlertTriangle className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
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
      <div className="w-full p-4 pb-32 bg-background min-h-full">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const cardClass = cn(
    "rounded-2xl border shadow-sm",
    isLight ? "bg-card border-border/40" : "bg-white/[0.04] border-white/[0.06]"
  );

  return (
    <>
      <div className="w-full p-4 pt-4 pb-32 bg-background min-h-full">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Back nav */}
          <motion.button
            onClick={() => navigate('/client/settings')}
            whileTap={{ scale: 0.9, transition: { type: "spring", stiffness: 400, damping: 17 } }}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            Settings
          </motion.button>

          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent-2)] shadow-[0_0_8px_var(--color-brand-accent-2)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">My Contracts</span>
            <div className="h-px flex-1 bg-gradient-to-r from-muted-foreground/20 to-transparent" />
          </div>

          {/* Create Document Card */}
          <div className={cardClass}>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Create Documents</span>
              </div>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
              >
                <FileEdit className="w-5 h-5" />
                Use Template
              </button>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 border text-[10px] font-bold">Promise to Purchase</Badge>
                <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25 border text-[10px] font-bold">Rental Application</Badge>
                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25 border text-[10px] font-bold">Letter of Intent</Badge>
              </div>
            </div>
          </div>

          {/* Active Deals Section */}
          {activeDeals && activeDeals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pending Signatures</span>
                <div className="h-px flex-1 bg-gradient-to-r from-muted-foreground/20 to-transparent" />
              </div>
              <div className="space-y-3">
                {activeDeals.map((deal: any) => (
                  <div key={deal.id} className={cardClass}>
                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-brand-accent-2)]/10 border border-[var(--color-brand-accent-2)]/20 flex-shrink-0">
                            <FileText className="w-5 h-5 text-[var(--color-brand-accent-2)]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground text-sm truncate">{deal.contract?.title}</h3>
                            <p className="text-muted-foreground text-xs font-medium mt-0.5">
                              {deal.contract?.contract_type.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-0">
                          <Badge className={cn("text-[10px] font-bold border flex items-center gap-1", getStatusBadgeClass(deal.status))}>
                            {getStatusIcon(deal.status)}
                            {deal.status.replace('_', ' ')}
                          </Badge>
                          {deal.status === 'signed_by_owner' && (
                            <button
                              onClick={() => setSelectedContract(deal.contract_id)}
                              className="px-4 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
                              style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                            >
                              Sign Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Contracts Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">All Contracts</span>
              <div className="h-px flex-1 bg-gradient-to-r from-muted-foreground/20 to-transparent" />
            </div>

            {!contracts || contracts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex flex-col items-center justify-center py-16 text-center rounded-[2rem] border",
                  isLight ? "bg-muted/30 border-border/40" : "bg-white/[0.02] border-white/[0.05]"
                )}
              >
                <div className={cn(
                  "w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl border",
                  isLight ? "bg-muted border-border/30" : "bg-white/[0.05] border-white/[0.08]"
                )}>
                  <FileText className="w-10 h-10 text-[var(--color-brand-accent-2)]/60 animate-pulse" />
                </div>
                <h3 className="text-foreground font-black text-xl tracking-tight mb-3">No Contracts Yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-medium mb-8">
                  When property owners send you contracts, they'll appear here. You can also create your own using templates.
                </p>
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="px-8 py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Document
                  </span>
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div key={contract.id} className={cardClass}>
                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-brand-accent-2)]/10 border border-[var(--color-brand-accent-2)]/20 flex-shrink-0">
                            <FileText className="w-5 h-5 text-[var(--color-brand-accent-2)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-foreground text-sm truncate">{contract.title}</h3>
                            <p className="text-muted-foreground text-xs font-medium mt-0.5">
                              {contract.contract_type.replace('_', ' ').toUpperCase()} •{' '}
                              {formatDistanceToNow(new Date(contract.created_at))} ago
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn("text-[10px] font-bold border flex items-center gap-1", getStatusBadgeClass(contract.status))}>
                            {getStatusIcon(contract.status)}
                            {contract.status.replace('_', ' ')}
                          </Badge>
                          <button className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            isLight ? "border-border/40 text-foreground hover:bg-muted" : "border-white/[0.08] text-foreground hover:bg-white/[0.06]"
                          )}>
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          {contract.status === 'signed_by_owner' && (
                            <button
                              onClick={() => setSelectedContract(contract.id)}
                              className="px-4 py-1.5 rounded-xl text-xs font-black text-white transition-all active:scale-95"
                              style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                            >
                              Sign
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
