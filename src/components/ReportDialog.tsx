import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, Shield, X } from 'lucide-react';
import {
  useCreateReport,
  ReportType,
  ReportCategory,
  REPORT_TYPE_LABELS,
  REPORT_TYPE_DESCRIPTIONS,
} from '@/hooks/useReporting';
import { motion, AnimatePresence } from 'framer-motion';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedListingId?: string;
  reportedUserName?: string;
  reportedListingTitle?: string;
  category: ReportCategory;
}

export function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedListingId,
  reportedUserName,
  reportedListingTitle,
  category,
}: ReportDialogProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const createReport = useCreateReport();
  const { isLight } = useAppTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReportType) {
      return;
    }

    await createReport.mutateAsync({
      reportedUserId,
      reportedListingId,
      reportType: selectedReportType as ReportType,
      reportCategory: category,
      description,
    });

    // Reset form and close dialog
    setSelectedReportType('');
    setDescription('');
    onOpenChange(false);
  };

  const getRelevantReportTypes = (): ReportType[] => {
    if (category === 'listing') {
      return [
        'fake_listing',
        'not_real_owner',
        'misleading_info',
        'inappropriate_content',
        'scam',
        'spam',
        'other',
      ];
    } else if (category === 'user_profile') {
      return [
        'fake_profile',
        'not_real_owner',
        'broker_posing_as_client',
        'broker_posing_as_owner',
        'inappropriate_content',
        'harassment',
        'scam',
        'spam',
        'other',
      ];
    }
    return ['inappropriate_content', 'harassment', 'spam', 'other'];
  };

  const relevantReportTypes = getRelevantReportTypes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className={cn(
          "m-4 rounded-[2.5rem] backdrop-blur-[40px] border overflow-hidden shadow-3xl transition-all duration-700 relative",
          isLight ? "bg-white/90 border-black/5" : "bg-black/80 border-white/5"
        )}>
          {/* NEXUS GRADIENT BORDER INFUSION */}
          <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] border-[1.5px] border-transparent [mask-image:linear-gradient(white,white)] before:absolute before:inset-[-1.5px] before:rounded-[2.5rem] before:border-[1.5px] before:border-transparent before:bg-gradient-to-br before:from-rose-500/40 before:via-violet-600/40 before:to-rose-400/40 before:[mask-image:linear-gradient(white,white)_padding-box,linear-gradient(white,white)] before:[mask-composite:exclude]" />

          <div className="p-8 pb-4 relative z-10">
            <DialogHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                      <Flag className="w-5 h-5 text-rose-500" />
                   </div>
                   <div className="flex-1">
                      <DialogTitle className={cn("text-2xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                        Report {category === 'listing' ? 'Listing' : category === 'user_profile' ? 'User' : 'Content'}
                      </DialogTitle>
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/60 mt-1">Nexus Security Protocol</div>
                   </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onOpenChange(false)}
                  className={cn("w-10 h-10 rounded-xl transition-all", isLight ? "bg-black/5 hover:bg-black/10" : "bg-white/5 hover:bg-white/10")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="text-sm font-medium opacity-70 leading-relaxed pt-2">
                Maintain the integrity of the Swipess collective. Your report will be analyzed by our neural moderation matrix.
                {(reportedUserName || reportedListingTitle) && (
                  <span className={cn(
                    "block mt-3 text-[11px] font-black uppercase tracking-widest p-3 rounded-xl border",
                    isLight ? "bg-black/5 border-black/5 text-black" : "bg-white/5 border-white/5 text-white"
                  )}>
                    Subject: {reportedUserName || reportedListingTitle}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 pb-8 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-8 mt-4">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-70 ml-1">Incident Category</Label>

                <RadioGroup value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType | '')}>
                  <div className="space-y-3">
                    {relevantReportTypes.map((type) => (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Label
                          htmlFor={type}
                          className={cn(
                            "flex items-start gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 cursor-pointer group",
                            selectedReportType === type
                              ? "bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(235,72,152,0.1)]"
                              : isLight ? "bg-black/[0.03] border-black/5 hover:bg-black/[0.06]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                          )}
                        >
                          <div className="mt-1">
                            <RadioGroupItem value={type} id={type} className={cn(selectedReportType === type ? "border-rose-500" : (isLight ? "border-black/20" : "border-white/20"))} />
                          </div>
                          <div className="flex-1">
                            <div className={cn("text-[14px] font-black uppercase italic tracking-tight transition-colors", selectedReportType === type ? "text-rose-400" : (isLight ? "text-black" : "text-white"))}>
                              {REPORT_TYPE_LABELS[type]}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1 leading-relaxed">
                              {REPORT_TYPE_DESCRIPTIONS[type]}
                            </div>
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <AnimatePresence>
                {selectedReportType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-70 ml-1">
                      Neural Details <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide additional context for our neural agents..."
                      className={cn(
                        "min-h-[140px] rounded-[1.5rem] p-5 font-medium placeholder:opacity-20 resize-none focus:border-rose-500/30 transition-all",
                        isLight ? "bg-black/[0.03] border-black/10 focus:bg-black/[0.05]" : "bg-white/[0.03] border-white/10 focus:bg-white/[0.05]"
                      )}
                      required
                    />
                    <div className="flex items-center gap-2 px-2 opacity-70">
                       <Shield className="w-3 h-3 text-rose-500" />
                       <p className="text-[9px] font-black uppercase tracking-widest">Confidential Submission • Real-time Sync</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className={cn("flex-1 h-14 rounded-[1.2rem] font-bold uppercase tracking-widest transition-all", isLight ? "border-black/10 hover:bg-black/5" : "border-white/10 hover:bg-white/5")}
                  disabled={createReport.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-14 rounded-[1.2rem] font-black uppercase italic tracking-widest shadow-2xl bg-gradient-to-r from-rose-500 to-violet-600 hover:brightness-110 text-white border-0 transition-all active:scale-[0.98]"
                  disabled={!selectedReportType || !description.trim() || createReport.isPending}
                >
                  {createReport.isPending ? 'Syncing...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
